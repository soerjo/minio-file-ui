import { LoginForm } from '@/features/auth/components';
import { GuestRoute } from '@/features/auth/hooks';
import { LoginProvider } from '@/features/auth/providers/login-provider';

export default function LoginPage() {
  return (
    <GuestRoute>
      <div className="flex flex-1 items-center justify-center bg-muted/50">
        <LoginProvider>
          <LoginForm />
        </LoginProvider>
      </div>
    </GuestRoute>
  );
}
