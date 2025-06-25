import React from 'react';
import ClientWrapperInit from './ClientWrapperInit';

export default function EventUrlLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ClientWrapperInit />
    </>
  );
} 