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

// Define correct types for your search parameters.
type SearchParams = { [key: string]: string | string[] | undefined };

// In Next 15.3.0, searchParams is delivered as a Promise. Thus, we type it accordingly.
export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Await the promised searchParams
  const resolvedSearchParams = await searchParams;
  
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  const currentPage = Number(resolvedSearchParams.page || '1');
  const limit = Number(resolvedSearchParams.limit || '20');
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
