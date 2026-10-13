import { RegisterForm } from '@/features/auth/components';
import { GuestRoute } from '@/features/auth/hooks';
import { RegisterProvider } from '@/features/auth/providers/register-provider';

export default function RegisterPage() {
  return (
    <GuestRoute>
      <div className="flex flex-1 items-center justify-center bg-muted/50">
        <RegisterProvider>
          <RegisterForm />
        </RegisterProvider>
      </div>
    </GuestRoute>
  );
}
