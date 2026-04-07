<?php

namespace App\Services;

use App\Models\Central\Setting;
use Illuminate\Support\Facades\Cache;

class SettingsService
{
    private const CACHE_TTL = 3600; // 1 hour
    private const CACHE_KEY = 'app_settings';

    /**
     * Get setting value by key
     */
    public static function get(string $key, $default = null)
    {
        $setting = self::getSetting($key);
        return $setting ? $setting->getValue() : $default;
    }

    /**
     * Get setting model by key
     */
    public static function getSetting(string $key)
    {
        return Setting::where('key', $key)->first();
    }

    /**
     * Get all settings by section
     */
    public static function getBySection(string $section)
    {
        return Setting::where('section', $section)
            ->orderBy('order')
            ->get();
    }

    /**
     * Set setting value
     */
    public static function set(string $key, $value, bool $isEncrypted = false)
    {
        $setting = Setting::firstOrCreate(
            ['key' => $key],
            [
                'section' => self::getSectionFromKey($key),
                'type' => 'text',
                'label' => ucfirst(str_replace('_', ' ', $key)),
                'is_encrypted' => $isEncrypted,
            ]
        );

        $setting->is_encrypted = $isEncrypted;

        if ($isEncrypted) {
            $setting->value = encrypt($value);
        } else {
            $setting->value = $value;
        }

        $setting->save();

        self::clearCache();

        return $setting;
    }

    /**
     * Update multiple settings
     */
    public static function setMultiple(array $settings)
    {
        foreach ($settings as $key => $value) {
            self::set($key, $value);
        }
        self::clearCache();
    }

    /**
     * Get all settings grouped by section
     */
    public static function all()
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $settings = Setting::orderBy('section')->orderBy('order')->get();

            return $settings->groupBy('section')->map(function ($group) {
                return $group->keyBy('key');
            });
        });
    }

    /**
     * Get Razorpay settings
     */
    public static function getRazorpaySettings(): array
    {
        return [
            'key_id' => self::get('razorpay.key_id'),
            'key_secret' => self::get('razorpay.key_secret'),
            'webhook_secret' => self::get('razorpay.webhook_secret'),
            'currency' => self::get('razorpay.currency', 'INR'),
            'test_mode' => self::get('razorpay.test_mode', true),
        ];
    }

    /**
     * Get Email (AWS SES) settings
     */
    public static function getEmailSettings(): array
    {
        return [
            'mailer' => self::get('email.mailer', 'log'),
            'from_address' => self::get('email.from_address', 'noreply@example.com'),
            'from_name' => self::get('email.from_name', 'Great Leap App'),
            'aws_key' => self::get('email.aws_key'),
            'aws_secret' => self::get('email.aws_secret'),
            'aws_region' => self::get('email.aws_region', 'ap-south-1'),
        ];
    }

    /**
     * Clear cache
     */
    public static function clearCache()
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Get section from key (first part before dot)
     */
    private static function getSectionFromKey(string $key): string
    {
        return explode('.', $key)[0] ?? 'general';
    }
}
