import { Suspense } from 'react';
import UserDetailClient from './UserDetailClient';

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // For server components in Next.js 15, params is a Promise that must be awaited
  const resolvedParams = await params;
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserDetailClient params={resolvedParams} />
    </Suspense>
  );
} 