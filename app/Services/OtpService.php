<?php

namespace App\Services;

use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class OtpService
{
    const OTP_EXPIRY_MINUTES = 15;
    const MAX_ATTEMPTS = 5;
    const MAX_VERIFY_ATTEMPTS = 3;
    const RATE_LIMIT_HOURS = 1;

    /**
     * Generate and send OTP to email
     *
     * @throws ValidationException
     */
    public function generateAndSendOtp(string $email, bool $isTenant = true): array
    {
        // Check rate limiting
        if (!$this->canRequestOtp($email)) {
            throw ValidationException::withMessages([
                'email' => ['Too many OTP requests. Please try again later.'],
            ]);
        }

        // Generate OTP
        $otp = PasswordResetOtp::generateOtp();
        $expiresAt = now()->addMinutes(self::OTP_EXPIRY_MINUTES);

        // Store OTP in database
        $record = PasswordResetOtp::updateOrCreate(
            ['email' => $email],
            [
                'otp' => $otp,
                'attempts' => 0,
                'last_sent_at' => now(),
                'verified_at' => null,
                'expires_at' => $expiresAt,
            ]
        );

        // Send email
        try {
            Mail::to($email)->queue(new PasswordResetOtpMail($otp, self::OTP_EXPIRY_MINUTES));
        } catch (\Exception $e) {
            // Log error but don't throw - OTP is still stored
            \Log::error('Failed to send OTP email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            // If email fails completely, delete the OTP record
            $record->delete();

            throw ValidationException::withMessages([
                'email' => ['Failed to send OTP. Please try again.'],
            ]);
        }

        return [
            'message' => 'OTP sent successfully to ' . $email,
            'expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
        ];
    }

    /**
     * Verify OTP
     *
     * @throws ValidationException
     */
    public function verifyOtp(string $email, string $otp): bool
    {
        $record = PasswordResetOtp::where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            throw ValidationException::withMessages([
                'otp' => ['OTP has expired. Request a new one.'],
            ]);
        }

        // Check if already verified
        if ($record->isVerified()) {
            throw ValidationException::withMessages([
                'otp' => ['OTP already used. Request a new one.'],
            ]);
        }

        // Check attempts
        if ($record->attempts >= self::MAX_VERIFY_ATTEMPTS) {
            $record->delete(); // Clear after max attempts
            throw ValidationException::withMessages([
                'otp' => ['Too many incorrect attempts. Request a new OTP.'],
            ]);
        }

        // Verify OTP
        if ($record->otp !== $otp) {
            $record->increment('attempts');
            throw ValidationException::withMessages([
                'otp' => ["Invalid OTP. {" . (self::MAX_VERIFY_ATTEMPTS - $record->attempts) . "} attempts remaining."],
            ]);
        }

        // Mark as verified
        $record->markAsVerified();

        return true;
    }

    /**
     * Reset password after OTP verification
     *
     * Handles multi-tenancy: searches central DB first, then all tenant DBs
     *
     * @throws ValidationException
     */
    public function resetPassword(string $email, string $newPassword): array
    {
        // Check if OTP was verified
        $record = PasswordResetOtp::where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record || !$record->isVerified()) {
            throw ValidationException::withMessages([
                'email' => ['OTP verification failed. Request a new OTP.'],
            ]);
        }

        // Search for user in central database first
        $user = \App\Models\User::where('email', $email)->first();
        $foundInTenant = null;

        // If not found in central, search all tenant databases
        if (!$user) {
            $tenants = \App\Models\Tenant::all();
            foreach ($tenants as $tenant) {
                tenancy()->initialize($tenant);
                $user = \App\Models\User::where('email', $email)->first();
                if ($user) {
                    $foundInTenant = $tenant->id;
                    break;
                }
                tenancy()->end();
            }
        }

        if (!$user) {
            // End any active tenancy context
            if ($foundInTenant) {
                tenancy()->end();
            }
            throw ValidationException::withMessages([
                'email' => ['User not found.'],
            ]);
        }

        try {
            // Update password in the correct database
            $user->update(['password' => $newPassword]);

            // Delete OTP record
            $record->delete();

            // Clean up expired OTPs
            PasswordResetOtp::cleanupExpired();

            // End tenancy context if we initialized it
            if ($foundInTenant) {
                tenancy()->end();
            }

            return [
                'message' => 'Password reset successfully. You can now login with your new password.',
                'user_id' => $user->id,
            ];
        } catch (\Exception $e) {
            // End tenancy context on error
            if ($foundInTenant) {
                tenancy()->end();
            }

            \Log::error('Password reset error', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'password' => ['Failed to reset password. Please try again.'],
            ]);
        }
    }

    /**
     * Check if OTP can be requested (rate limiting)
     */
    private function canRequestOtp(string $email): bool
    {
        return PasswordResetOtp::canRequestOtp($email);
    }

    /**
     * Resend OTP to same email
     */
    public function resendOtp(string $email): array
    {
        // Get existing record
        $record = PasswordResetOtp::where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if ($record && !$record->isVerified()) {
            // Resend the same OTP
            try {
                Mail::to($email)->queue(new PasswordResetOtpMail($record->otp, self::OTP_EXPIRY_MINUTES));

                return [
                    'message' => 'OTP resent to ' . $email,
                    'expires_in_minutes' => self::OTP_EXPIRY_MINUTES,
                ];
            } catch (\Exception $e) {
                \Log::error('Failed to resend OTP', ['email' => $email, 'error' => $e->getMessage()]);
                throw ValidationException::withMessages([
                    'email' => ['Failed to resend OTP. Please try again.'],
                ]);
            }
        }

        // No active OTP, generate a new one
        return $this->generateAndSendOtp($email);
    }

    /**
     * Check OTP status
     */
    public function checkOtpStatus(string $email): array
    {
        $record = PasswordResetOtp::where('email', $email)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return ['exists' => false];
        }

        return [
            'exists' => true,
            'verified' => $record->isVerified(),
            'attempts_remaining' => self::MAX_VERIFY_ATTEMPTS - $record->attempts,
            'expires_at' => $record->expires_at,
            'expires_in_minutes' => $record->expires_at->diffInMinutes(now()),
        ];
    }
}
