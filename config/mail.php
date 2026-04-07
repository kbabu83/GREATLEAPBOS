<?php

return [
    /*
     * Mail Driver
     * Supported: "smtp", "sendmail", "mailgun", "ses", "log", "array"
     */
    'driver' => env('MAIL_MAILER', 'log'),

    /*
     * SMTP Configuration
     */
    'host' => env('MAIL_HOST', 'smtp.mailtrap.io'),
    'port' => env('MAIL_PORT', 2525),
    'encryption' => env('MAIL_ENCRYPTION', 'tls'),
    'username' => env('MAIL_USERNAME'),
    'password' => env('MAIL_PASSWORD'),

    /*
     * Global "From" Address
     */
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'hello@example.com'),
        'name' => env('MAIL_FROM_NAME', 'Example'),
    ],

    /*
     * Mailgun Driver
     */
    'mailgun' => [
        'secret' => env('MAILGUN_SECRET'),
        'domain' => env('MAILGUN_DOMAIN'),
    ],

    /*
     * Postmark Driver
     */
    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    /*
     * AWS SES Driver
     */
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    /*
     * SendGrid Driver
     */
    'sendgrid' => [
        'key' => env('SENDGRID_API_KEY'),
    ],

    /*
     * Resend Driver
     */
    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    /*
     * Log Channel (for testing)
     */
    'log_channel' => env('MAIL_LOG_CHANNEL'),
];
