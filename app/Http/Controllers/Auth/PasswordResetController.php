<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    public function __construct(
        private OtpService $otpService,
    ) {}

    /**
     * Request OTP for password reset
     */
    public function requestOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $result = $this->otpService->generateAndSendOtp(
                $validated['email'],
                $request->has('is_tenant')
            );

            return response()->json($result, 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('OTP generation failed', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['Failed to send OTP. Please try again.'],
            ]);
        }
    }

    /**
     * Verify OTP
     */
    public function verifyOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
        ]);

        try {
            $this->otpService->verifyOtp($validated['email'], $validated['otp']);

            return response()->json([
                'message' => 'OTP verified successfully',
                'email' => $validated['email'],
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('OTP verification failed', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'otp' => ['Failed to verify OTP. Please try again.'],
            ]);
        }
    }

    /**
     * Reset password with verified OTP
     */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string', 'size:6'],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
                'confirmed',
            ],
        ]);

        try {
            // Verify OTP if not already verified
            $this->otpService->verifyOtp($validated['email'], $validated['otp']);

            // Reset password
            $result = $this->otpService->resetPassword(
                $validated['email'],
                $validated['password']
            );

            return response()->json($result, 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('Password reset failed', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'password' => ['Failed to reset password. Please try again.'],
            ]);
        }
    }

    /**
     * Resend OTP
     */
    public function resendOtp(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        try {
            $result = $this->otpService->resendOtp($validated['email']);

            return response()->json($result, 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            \Log::error('OTP resend failed', [
                'email' => $validated['email'],
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'email' => ['Failed to resend OTP. Please try again.'],
            ]);
        }
    }

    /**
     * Check OTP status
     */
    public function checkOtpStatus(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = $this->otpService->checkOtpStatus($validated['email']);

        return response()->json($status, 200);
    }
}
