import { ResetPasswordForm } from '@/features/auth/components';
import { GuestRoute } from '@/features/auth/hooks';
import { ResetPasswordProvider } from '@/features/auth/providers/reset-password-provider';

export default function ResetPasswordPage() {
  return (
    <GuestRoute>
      <div className="flex flex-1 items-center justify-center bg-muted/50">
        <ResetPasswordProvider>
          <ResetPasswordForm />
        </ResetPasswordProvider>
      </div>
    </GuestRoute>
  );
}
