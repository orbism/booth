// src/app/admin/sessions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { getServerSession } from 'next-auth';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
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
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [sessions, setSessions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [filters, setFilters] = useState<{
    mediaType?: string;
    dateRange?: [Date, Date];
  }>({});
  const [page, setPage] = useState(currentPage);
  const skip = (currentPage - 1) * limit;
  
  // const sessions = await prisma.boothSession.findMany({
  //   orderBy: { createdAt: 'desc' },
  //   skip,
  //   take: limit,
  // });

  // if (!session) {
  //   redirect('/login');
  // }
  
  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Filter change handler
  const handleFilterChange = (newFilters: { mediaType?: string; dateRange?: [Date, Date] }) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Fetch data with filters
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      
      let url = `/api/admin/sessions?page=${currentPage}&limit=${limit}`;
      
      if (filters.mediaType) {
        url += `&mediaType=${filters.mediaType}`;
      }
      
      if (filters.dateRange) {
        url += `&startDate=${filters.dateRange[0].toISOString()}&endDate=${filters.dateRange[1].toISOString()}`;
      }
      
      try {
        // Fetch data with the constructed URL
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        
        const data = await response.json();
        setSessions(data.sessions);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };
    
    fetchData();
  }, [currentPage, limit, filters, status]);  
  
  if (status === 'loading') {
    return <div className="p-6 text-center">Loading sessions...</div>;
  }
  
  return (
    <SessionsListComponent 
      sessions={sessions} 
      totalCount={totalCount} 
      currentPage={page} 
      limit={limit}
      onPageChange={setPage}
      onFilterChange={handleFilterChange}
    />
  );
}
