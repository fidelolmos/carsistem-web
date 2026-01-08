'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '@/src/lib/auth';
import LogoutButton from './components/LogoutButton';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken()) router.replace('/login');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <LogoutButton />
    </div>
  );
}
