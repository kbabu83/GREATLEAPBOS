<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Central\Setting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    /**
     * Get all settings grouped by section
     */
    public function index(): JsonResponse
    {
        $sections = [
            'razorpay' => 'Razorpay Payment Gateway',
            'email' => 'Email Configuration (AWS SES)',
            'general' => 'General Settings',
        ];

        $allSettings = SettingsService::all();

        // Transform settings from object to array format
        $formattedSettings = [];
        foreach ($allSettings as $section => $settings) {
            $formattedSettings[$section] = [];
            foreach ($settings as $setting) {
                $formattedSettings[$section][] = [
                    'id' => $setting->id,
                    'key' => $setting->key,
                    'label' => $setting->label,
                    'description' => $setting->description,
                    'type' => $setting->type,
                    'value' => $setting->display_value,
                    'is_encrypted' => $setting->is_encrypted,
                ];
            }
        }

        return response()->json([
            'sections' => $sections,
            'settings' => $formattedSettings,
        ]);
    }

    /**
     * Get settings by section
     */
    public function getSection(string $section): JsonResponse
    {
        $settings = SettingsService::getBySection($section);

        return response()->json([
            'section' => $section,
            'settings' => $settings->map(fn ($s) => [
                'id' => $s->id,
                'key' => $s->key,
                'label' => $s->label,
                'description' => $s->description,
                'type' => $s->type,
                'value' => $s->display_value,
                'is_encrypted' => $s->is_encrypted,
            ]),
        ]);
    }

    /**
     * Update settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $setting) {
            $existing = Setting::where('key', $setting['key'])->first();

            if ($existing) {
                if ($existing->is_encrypted && $setting['value']) {
                    $existing->value = encrypt($setting['value']);
                } else {
                    $existing->value = $setting['value'];
                }
                $existing->save();
            }
        }

        SettingsService::clearCache();

        return response()->json([
            'message' => 'Settings updated successfully.',
        ]);
    }

    /**
     * Update single setting
     */
    public function updateSingle(Request $request, string $key): JsonResponse
    {
        $validated = $request->validate([
            'value' => 'required|string',
        ]);

        $setting = Setting::where('key', $key)->firstOrFail();

        if ($setting->is_encrypted) {
            $setting->value = encrypt($validated['value']);
        } else {
            $setting->value = $validated['value'];
        }

        $setting->save();
        SettingsService::clearCache();

        return response()->json([
            'message' => 'Setting updated successfully.',
            'setting' => $setting,
        ]);
    }

    /**
     * Seed default settings
     */
    public function seed(): JsonResponse
    {
        $defaults = [
            // Razorpay
            [
                'key' => 'razorpay.key_id',
                'section' => 'razorpay',
                'label' => 'Razorpay Key ID',
                'description' => 'Your Razorpay Key ID from dashboard.razorpay.com',
                'type' => 'password',
                'is_encrypted' => true,
                'order' => 1,
            ],
            [
                'key' => 'razorpay.key_secret',
                'section' => 'razorpay',
                'label' => 'Razorpay Key Secret',
                'description' => 'Your Razorpay Key Secret (keep this confidential)',
                'type' => 'password',
                'is_encrypted' => true,
                'order' => 2,
            ],
            [
                'key' => 'razorpay.webhook_secret',
                'section' => 'razorpay',
                'label' => 'Razorpay Webhook Secret',
                'description' => 'Webhook signing secret for payment verification',
                'type' => 'password',
                'is_encrypted' => true,
                'order' => 3,
            ],
            [
                'key' => 'razorpay.currency',
                'section' => 'razorpay',
                'label' => 'Currency',
                'description' => 'Default currency (INR, USD, GBP, etc.)',
                'type' => 'text',
                'value' => 'INR',
                'order' => 4,
            ],
            [
                'key' => 'razorpay.test_mode',
                'section' => 'razorpay',
                'label' => 'Test Mode',
                'description' => 'Enable test mode for development',
                'type' => 'boolean',
                'value' => 'true',
                'order' => 5,
            ],

            // Email
            [
                'key' => 'email.mailer',
                'section' => 'email',
                'label' => 'Mail Provider',
                'description' => 'ses or log (for testing)',
                'type' => 'text',
                'value' => 'ses',
                'order' => 1,
            ],
            [
                'key' => 'email.from_address',
                'section' => 'email',
                'label' => 'From Email Address',
                'description' => 'Sender email address (must be verified in AWS SES)',
                'type' => 'text',
                'value' => 'noreply@example.com',
                'order' => 2,
            ],
            [
                'key' => 'email.from_name',
                'section' => 'email',
                'label' => 'From Name',
                'description' => 'Display name for emails',
                'type' => 'text',
                'value' => 'Great Leap App',
                'order' => 3,
            ],
            [
                'key' => 'email.aws_key',
                'section' => 'email',
                'label' => 'AWS Access Key ID',
                'description' => 'Your AWS IAM access key (SES permission required)',
                'type' => 'password',
                'is_encrypted' => true,
                'order' => 4,
            ],
            [
                'key' => 'email.aws_secret',
                'section' => 'email',
                'label' => 'AWS Secret Access Key',
                'description' => 'Your AWS IAM secret key (keep this confidential)',
                'type' => 'password',
                'is_encrypted' => true,
                'order' => 5,
            ],
            [
                'key' => 'email.aws_region',
                'section' => 'email',
                'label' => 'AWS Region',
                'description' => 'e.g., ap-south-1, us-east-1, eu-west-1',
                'type' => 'text',
                'value' => 'ap-south-1',
                'order' => 6,
            ],
        ];

        foreach ($defaults as $default) {
            Setting::firstOrCreate(
                ['key' => $default['key']],
                $default
            );
        }

        SettingsService::clearCache();

        return response()->json([
            'message' => 'Default settings seeded successfully.',
            'count' => count($defaults),
        ]);
    }
}
