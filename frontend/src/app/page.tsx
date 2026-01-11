'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts';
import { ChatWindow } from '@/components/chat';
import { useAuthStore } from '@/lib/stores/authStore';

export default function HomePage() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <MainLayout>
      <ChatWindow />
    </MainLayout>
  );
}
