// src/components/providers/SessionProviderWrapper.tsx
'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

type SessionProviderWrapperProps = {
  children: React.ReactNode;
};

export default function SessionProviderWrapper({ children }: SessionProviderWrapperProps) {
  return <SessionProvider>{children}</SessionProvider>;
}