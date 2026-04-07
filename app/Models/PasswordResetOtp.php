<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PasswordResetOtp extends Model
{
    use HasFactory;

    protected $table = 'password_reset_otps';

    protected $fillable = [
        'email',
        'otp',
        'attempts',
        'last_sent_at',
        'verified_at',
        'expires_at',
    ];

    protected $casts = [
        'last_sent_at' => 'datetime',
        'verified_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Generate a 6-digit OTP
     */
    public static function generateOtp(): string
    {
        return str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if OTP has expired
     */
    public function isExpired(): bool
    {
        return now()->isAfter($this->expires_at);
    }

    /**
     * Check if OTP has been verified
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * Mark OTP as verified
     */
    public function markAsVerified(): void
    {
        $this->update(['verified_at' => now()]);
    }

    /**
     * Increment failed attempts
     */
    public function incrementAttempts(): int
    {
        $this->increment('attempts');
        return $this->attempts;
    }

    /**
     * Check if OTP can be requested again (rate limiting)
     * Max 5 requests per hour per email
     */
    public static function canRequestOtp(string $email): bool
    {
        $count = self::where('email', $email)
            ->where('last_sent_at', '>=', now()->subHour())
            ->count();

        return $count < 5;
    }

    /**
     * Get the latest OTP for an email
     */
    public static function getLatestForEmail(string $email): ?self
    {
        return self::where('email', $email)
            ->where('expires_at', '>', now())
            ->latest('created_at')
            ->first();
    }

    /**
     * Clean expired OTPs
     */
    public static function cleanupExpired(): int
    {
        return self::where('expires_at', '<=', now())->delete();
    }
}
