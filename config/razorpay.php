<?php

return [
    /*
     * Razorpay API Credentials
     * Configure via environment variables
     */
    'key_id' => env('RAZORPAY_KEY_ID'),
    'key_secret' => env('RAZORPAY_KEY_SECRET'),
    'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),

    /*
     * Default currency for payments
     * Razorpay supports: INR, USD, GBP, EUR, etc.
     */
    'currency' => env('RAZORPAY_CURRENCY', 'INR'),

    /*
     * Timeout for API requests (in seconds)
     */
    'timeout' => env('RAZORPAY_TIMEOUT', 30),

    /*
     * Enable/Disable test mode
     */
    'test_mode' => env('RAZORPAY_TEST_MODE', true),

    /*
     * Webhook configuration
     */
    'webhook' => [
        'enabled' => env('RAZORPAY_WEBHOOK_ENABLED', true),
        'url' => env('RAZORPAY_WEBHOOK_URL', '/webhooks/razorpay'),
        'events' => [
            'payment.authorized',
            'payment.captured',
            'payment.failed',
            'refund.created',
        ],
    ],

    /*
     * Payment settings
     */
    'payment' => [
        'timeout' => 900, // Payment timeout in seconds (15 minutes)
        'max_attempts' => 3, // Maximum payment attempts
        'auto_capture' => true, // Automatically capture authorized payments
    ],

    /*
     * Refund settings
     */
    'refund' => [
        'enabled' => true,
        'max_amount_percentage' => 100, // Max percentage of original amount that can be refunded
    ],
];
