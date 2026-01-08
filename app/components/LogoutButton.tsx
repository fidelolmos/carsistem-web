'use client';

import { useRouter } from 'next/navigation';
import { logoutSession } from '@/src/lib/authApi';

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      className="rounded-lg border px-3 py-2"
      onClick={async () => {
        await logoutSession();
        router.replace('/login');
        router.refresh();
      }}
    >
      Cerrar sesión
    </button>
  );
}
