'use client';

import { StoreProvider } from '@/store/StoreContext';
import AppLayout from '@/components/AppLayout';

export default function Home() {
  return (
    <StoreProvider>
      <AppLayout />
    </StoreProvider>
  );
}
