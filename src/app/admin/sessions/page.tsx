// src/app/admin/sessions/page.tsx
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import SessionsListComponent from './SessionsList';

export const metadata = {
  title: 'All Sessions - BoothBoss Admin',
  description: 'View all photo booth sessions',
};

export default async function SessionsPage({
  searchParams,
}: {
  // Use a more generic type that doesn't conflict with Next.js's internal types
  searchParams?: { [key: string]: string | undefined }
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  const currentPage = Number(searchParams?.page || '1');
  const limit = Number(searchParams?.limit || '20');
  const skip = (currentPage - 1) * limit;
  
  const sessions = await prisma.boothSession.findMany({
    orderBy: { createdAt: 'desc' },
    skip,
    take: limit,
  });
  
  const totalCount = await prisma.boothSession.count();
  
  return (
    <SessionsListComponent 
      sessions={sessions} 
      totalCount={totalCount} 
      currentPage={currentPage} 
      limit={limit} 
    />
  );
}