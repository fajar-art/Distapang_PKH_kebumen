'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PuskeswanlingRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/keswan/puskeswan?tab=puskeswanling');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-xs text-slate-500">Mengarahkan ke menu Pusat Kesehatan Hewan (Tab Puskeswanling)...</p>
      </div>
    </div>
  );
}
