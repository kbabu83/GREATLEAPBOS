<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #8CC63E;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #1A526D;
        }
        .content {
            padding: 30px 0;
        }
        .otp-box {
            background-color: #f5f5f5;
            border: 2px solid #8CC63E;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 4px;
            color: #1A526D;
            font-family: 'Courier New', monospace;
        }
        .expiry-warning {
            color: #e74c3c;
            font-weight: bold;
            margin-top: 10px;
        }
        .footer {
            border-top: 1px solid #ddd;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .warning-box {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 Great Leap App</div>
        </div>

        <div class="content">
            <h2>Password Reset Request</h2>

            <p>Hello,</p>

            <p>We received a request to reset your password. Use the code below to complete the reset:</p>

            <div class="otp-box">
                <div class="otp-code">{{ $otp }}</div>
                <div class="expiry-warning">⏱️ Valid for {{ $expiryMinutes }} minutes</div>
            </div>

            <div class="warning-box">
                <strong>⚠️ Important:</strong> Never share this code with anyone. Great Leap App will never ask you for this code via email, phone, or any other channel.
            </div>

            <p>If you didn't request a password reset, please ignore this email. Your account remains secure.</p>

            <p>
                Best regards,<br>
                <strong>Great Leap App Team</strong>
            </p>
        </div>

        <div class="footer">
            <p>&copy; {{ date('Y') }} Great Leap App. All rights reserved.</p>
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>
