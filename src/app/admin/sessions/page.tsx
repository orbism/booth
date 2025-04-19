// src/app/admin/sessions/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import SessionsListComponent from './SessionsList';

export default function SessionsPage() {
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
  const [isLoading, setIsLoading] = useState(true);
  
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

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Fetch data with filters
  useEffect(() => {
    const fetchData = async () => {
      if (status !== 'authenticated') return;
      
      setIsLoading(true);
      let url = `/api/admin/sessions?page=${currentPage}&limit=${limit}`;
      
      if (filters.mediaType) {
        url += `&mediaType=${filters.mediaType}`;
      }
      
      if (filters.dateRange) {
        url += `&startDate=${filters.dateRange[0].toISOString()}&endDate=${filters.dateRange[1].toISOString()}`;
      }
      
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sessions');
        }
        
        const data = await response.json();
        setSessions(data.sessions);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [currentPage, limit, filters, status]);  
  
  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    );
  }
  
  return (
    <SessionsListComponent 
      sessions={sessions} 
      totalCount={totalCount} 
      currentPage={currentPage} 
      limit={limit}
      onPageChange={handlePageChange}
      onFilterChange={handleFilterChange}
    />
  );
}