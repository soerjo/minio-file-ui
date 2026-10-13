import { ForgotPasswordForm } from '@/features/auth/components';
import { GuestRoute } from '@/features/auth/hooks';
import { ForgotPasswordProvider } from '@/features/auth/providers/forgot-password-provider';

export default function ForgotPasswordPage() {
  return (
    <GuestRoute>
      <div className="flex flex-1 items-center justify-center bg-muted/50">
        <ForgotPasswordProvider>
          <ForgotPasswordForm />
        </ForgotPasswordProvider>
      </div>
    </GuestRoute>
  );
}
