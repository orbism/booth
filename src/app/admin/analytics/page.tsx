// src/app/admin/analytics/page.tsx
import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/auth.config';
import { getAnalyticsSummary, getRecentEvents } from '@/lib/analytics-server';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Analytics - BoothBoss Admin',
  description: 'Analytics dashboard for your photo booth',
};

// Update the export name to match the file
export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }
  
  // Get analytics data
  const [daily, weekly, monthly] = await Promise.all([
    getAnalyticsSummary(1),
    getAnalyticsSummary(7),
    getAnalyticsSummary(30),
  ]);
  
  // Get recent events
  const events = await getRecentEvents(50);
  
  // Get unique event types
  const eventTypesResult = await prisma.boothEventLog.groupBy({
    by: ['eventType'],
    orderBy: {
      eventType: 'asc'
    }
  });
  
  const eventTypes = eventTypesResult.map((item: { eventType: string }) => item.eventType);
  
  return (
    <div className="space-y-6">
      <AnalyticsDashboard
        initialDaily={daily}
        initialWeekly={weekly}
        initialMonthly={monthly}
        initialEvents={events}
        initialEventTypes={eventTypes}
      />
    </div>
  );
}