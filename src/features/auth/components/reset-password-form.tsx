"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/types";
import { useResetPassword } from "@/features/auth/hooks";
import { AppLink, PasswordInput } from "@/components/ui";
import { useIsMounted } from "@/hooks";
import { ROUTES } from "@/constants";

export function ResetPasswordForm() {
  const { resetPassword, isLoading } = useResetPassword();
  const mounted = useIsMounted();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isApiError, setIsApiError] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: ResetPasswordFormValues, event?: React.BaseSyntheticEvent) {
    event?.preventDefault();
    try {
      await resetPassword({ ...data, token });
      setIsSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setIsApiError(true);
    }
  }

  if (!token || isApiError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-center text-sm text-muted-foreground">
            The password reset link is invalid or has expired.
          </p>
        </CardHeader>

        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            <AppLink href={ROUTES.forgotPassword} className="font-medium text-primary">
              Request a new reset link
            </AppLink>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h1 className="text-2xl font-bold">Password Reset</h1>
          <p className="text-center text-sm text-muted-foreground">
            Your password has been successfully reset.
          </p>
        </CardHeader>

        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            <AppLink href={ROUTES.login} className="font-medium text-primary">
              Go to login
            </AppLink>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="flex flex-col items-center gap-2 pb-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-center text-sm text-muted-foreground">
          Enter your new password
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <PasswordInput
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              register={register}
              error={errors.newPassword?.message}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <PasswordInput
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm new password"
              register={register}
              error={errors.confirmPassword?.message}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mounted ? Boolean(isLoading) : false}
          >
            {mounted && isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <AppLink href={ROUTES.login} className="font-medium text-primary">
              Back to login
            </AppLink>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}