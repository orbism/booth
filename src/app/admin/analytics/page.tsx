// src/app/admin/analytics/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { getAnalyticsSummary } from '@/lib/analytics';

export const metadata = {
  title: 'Analytics - BoothBoss Admin',
  description: 'Analytics dashboard for your photo booth',
};

// Define an interface for the summary results.
interface AnalyticsSummary {
  totalSessions: number;
  completedSessions: number;
  completionRate: string;
  averageCompletionTimeMs: number;
  topEmailDomains?: { domain: string; count: number }[];
}

// Cast getAnalyticsSummary so that it accepts a number argument.
const getAnalyticsSummaryWithParam = getAnalyticsSummary as (days: number) => Promise<AnalyticsSummary>;

// Get analytics data for different time periods.
async function getAnalyticsData() {
  const [daily, weekly, monthly] = await Promise.all([
    getAnalyticsSummaryWithParam(1),
    getAnalyticsSummaryWithParam(7),
    getAnalyticsSummaryWithParam(30),
  ]);
  
  return { daily, weekly, monthly };
}

// Get recent events for tracking.
async function getRecentEvents() {
  const events = await prisma.boothEventLog.findMany({
    take: 20,
    orderBy: {
      timestamp: 'desc',
    },
    include: {
      analytics: true,
    },
  });
  
  return events;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  const { daily, weekly, monthly } = await getAnalyticsData();
  const recentEvents = await getRecentEvents();
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Time Period Cards */}
        <StatCard 
          title="Today" 
          sessions={daily?.totalSessions || 0}
          completed={daily?.completedSessions || 0}
          completionRate={daily?.completionRate.toString() || '0'}
          avgTime={(daily?.averageCompletionTimeMs || 0) / 1000}
        />
        <StatCard 
          title="This Week" 
          sessions={weekly?.totalSessions || 0}
          completed={weekly?.completedSessions || 0}
          completionRate={weekly?.completionRate.toString() || '0'}
          avgTime={(weekly?.averageCompletionTimeMs || 0) / 1000}
        />
        <StatCard 
          title="This Month" 
          sessions={monthly?.totalSessions || 0}
          completed={monthly?.completedSessions || 0}
          completionRate={monthly?.completionRate.toString() || '0'}
          avgTime={(monthly?.averageCompletionTimeMs || 0) / 1000}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Email Domains */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Top Email Domains</h2>
          {monthly?.topEmailDomains?.length ? (
            <ul className="space-y-2">
              {monthly.topEmailDomains.map((item: { domain: string; count: number }, index: number) => (
                <li key={index} className="flex justify-between">
                  <span className="text-gray-700">{item.domain}</span>
                  <span className="font-medium">{item.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No email domain data available</p>
          )}
        </div>
        
        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium mb-4">Recent Events</h2>
          {recentEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-2 py-1">Time</th>
                    <th className="px-2 py-1">Event</th>
                    <th className="px-2 py-1">Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEvents.map((event: { 
                      id: string; 
                      timestamp: Date; 
                      eventType: string; 
                      analytics: { 
                        sessionId: string 
                      } 
                  }) => (
                    <tr key={event.id}>
                      <td className="px-2 py-1 text-xs whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-2 py-1 text-xs">
                        {formatEventType(event.eventType)}
                      </td>
                      <td className="px-2 py-1 text-xs text-gray-500">
                        {event.analytics.sessionId.substring(0, 8)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent events</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for stat cards
function StatCard({ 
  title, 
  sessions, 
  completed, 
  completionRate, 
  avgTime 
}: { 
  title: string;
  sessions: number;
  completed: number;
  completionRate: string;
  avgTime: number;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Sessions</span>
          <span className="font-semibold">{sessions}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Completed</span>
          <span className="font-semibold">{completed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Completion Rate</span>
          <span className="font-semibold">{completionRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Avg. Time</span>
          <span className="font-semibold">{avgTime.toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
