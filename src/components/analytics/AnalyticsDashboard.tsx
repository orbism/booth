// src/components/analytics/AnalyticsDashboard.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import DateRangePicker from '../ui/DateRangePicker'; 
import UserJourneyFunnel from './UserJourneyFunnel';
import ConversionTrendChart from './ConversionTrendChart';
import Tooltip from '../ui/Tooltip';
import ImprovementSuggestions from './ImprovementSuggestions';
import MediaTypeChart from './MediaTypeChart';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Legend
);

// Types
interface AnalyticsSummary {
  totalSessions: number;
  completedSessions: number;
  completionRate: string;
  averageCompletionTimeMs: number;
  topEmailDomains?: { domain: string; count: number }[];
}

interface AnalyticsEvent {
  id: string;
  eventType: string;
  timestamp: string;
  analyticsId: string;
  metadata: string | null;
  analytics?: {
    sessionId: string;
  } | null;
}

interface AnalyticsDashboardProps {
  initialDaily?: AnalyticsSummary;
  initialWeekly?: AnalyticsSummary;
  initialMonthly?: AnalyticsSummary;
  initialEvents?: AnalyticsEvent[];
  initialEventTypes?: string[];
}

interface JourneyStep {
    step: string;
    count: number;
}

interface DailyMetric {
    date: string;
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
  }

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
    initialDaily,
    initialWeekly,
    initialMonthly,
    initialEvents = [],
    initialEventTypes = []
}) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [daily, setDaily] = useState<AnalyticsSummary | undefined>(initialDaily);
    const [weekly, setWeekly] = useState<AnalyticsSummary | undefined>(initialWeekly);
    const [monthly, setMonthly] = useState<AnalyticsSummary | undefined>(initialMonthly);
    const [events, setEvents] = useState<AnalyticsEvent[]>(initialEvents);
    const [filteredEvents, setFilteredEvents] = useState<AnalyticsEvent[]>(initialEvents);
    const [autoRefresh, setAutoRefresh] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(30); // seconds
    const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [eventTypes, setEventTypes] = useState<string[]>(initialEventTypes);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [customPeriodActive, setCustomPeriodActive] = useState(false);
    const [customData, setCustomData] = useState<AnalyticsSummary | null>(null);
    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [journeyFunnelData, setJourneyFunnelData] = useState<{step: string; count: number}[]>([]);
    const [conversionTrendData, setConversionTrendData] = useState<DailyMetric[]>([]);
    const [customJourneyFunnelData, setCustomJourneyFunnelData] = useState<JourneyStep[]>([]);
    const [customConversionTrendData, setCustomConversionTrendData] = useState<DailyMetric[]>([]);

    // Date range change handler
    const handleDateRangeChange = async (start: Date, end: Date) => {
        setStartDate(start);
        setEndDate(end);
        setCustomPeriodActive(true);
        
        // Fetch data for custom date range
        try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/analytics/dashboard?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch analytics for custom date range');
        }
        
        const data = await response.json();
        setCustomData(data);
        } catch (error) {
        console.error('Error fetching custom date range data:', error);
        } finally {
        setIsLoading(false);
        }
    };

    // Data for charts
    const completionChartData = {
        labels: ['Completed', 'Incomplete'],
        datasets: [
        {
            label: 'Session Completion',
            data: [
            timeframe === 'daily' ? daily?.completedSessions || 0 : 
            timeframe === 'weekly' ? weekly?.completedSessions || 0 : 
            monthly?.completedSessions || 0,
            
            timeframe === 'daily' ? (daily?.totalSessions || 0) - (daily?.completedSessions || 0) : 
            timeframe === 'weekly' ? (weekly?.totalSessions || 0) - (weekly?.completedSessions || 0) : 
            (monthly?.totalSessions || 0) - (monthly?.completedSessions || 0)
            ],
            backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
            borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
            borderWidth: 1,
        },
        ],
    };
    
    const emailDomainsChartData = {
        labels: monthly?.topEmailDomains?.map(item => item.domain) || [],
        datasets: [
        {
            label: 'Email Domains',
            data: monthly?.topEmailDomains?.map(item => item.count) || [],
            backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
        },
        ],
    };

    // Event type counts for bar chart
    const eventTypeCounts = events.reduce((acc: Record<string, number>, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
    }, {});

    const eventTypeChartData = {
        labels: Object.keys(eventTypeCounts),
        datasets: [
        {
            label: 'Event Types',
            data: Object.values(eventTypeCounts),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
        },
        ],
    };

    // Filter events based on search and filter
    useEffect(() => {
        let result = [...events];
        
        if (eventTypeFilter) {
        result = result.filter(event => event.eventType === eventTypeFilter);
        }
        
        if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(event => 
            event.eventType.toLowerCase().includes(term) ||
            event.id.toLowerCase().includes(term) ||
            (event.analytics?.sessionId || '').toLowerCase().includes(term) ||
            (event.metadata ? event.metadata.toLowerCase().includes(term) : false)
        );
        }
        
        setFilteredEvents(result);
    }, [events, eventTypeFilter, searchTerm]);

    // Auto-refresh functionality
    useEffect(() => {
        let timer: NodeJS.Timeout;
        
        if (autoRefresh) {
        timer = setInterval(() => {
            refreshData();
        }, refreshInterval * 1000);
        }
        
        return () => {
        if (timer) clearInterval(timer);
        };
    }, [autoRefresh, refreshInterval]);

    // Refresh dashboard data
    const refreshData = async () => {
        try {
        setIsRefreshing(true);
        
        const response = await fetch('/api/admin/analytics/dashboard?format=json');
        
        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }
        
        const data = await response.json();
        console.log('Dashboard data received:', data);
        
        setDaily(data.daily);
        setWeekly(data.weekly);
        setMonthly(data.monthly);
        setEvents(data.events || []);
        setEventTypes(data.eventTypes || []);
        setJourneyFunnelData(data.journeyFunnel || []);
        setConversionTrendData(data.conversionTrend || []);
        
        if (customPeriodActive) {
          if (data.customJourneyFunnel) {
            console.log('Setting journey funnel data:', data.journeyFunnel);
            setCustomJourneyFunnelData(data.customJourneyFunnel);
          }
          
          if (data.customConversionTrend) {
            console.log('Setting conversion trend data:', data.conversionTrend);
            setCustomConversionTrendData(data.customConversionTrend);
          }
        }
        
        // Update the router to refresh SSR data as well (optional)
        router.refresh();
        } catch (error) {
        console.error('Error refreshing analytics data:', error);
        } finally {
        setIsRefreshing(false);
        }
    };

    // Format step name for display
    const formatStepName = (step: string): string => {
        const map: Record<string, string> = {
        'view_start': 'Page Visit',
        'splash_complete': 'Splash Screen',
        'info_submitted': 'Info Submitted',
        'journey_complete': 'Journey Completed',
        'photo_captured': 'Photo Taken',
        'photo_approved': 'Photo Approved',
        'email_sent': 'Email Sent'
        };
        
        return map[step] || step.replace(/_/g, ' ');
    };

    // Export data to CSV
    const exportToCsv = () => {
        // Create CSV content
        const headers = ['ID', 'Event Type', 'Timestamp', 'Session ID', 'Metadata'];
        const csvRows = [
        headers.join(','),
        ...events.map(event => [
            event.id,
            event.eventType,
            new Date(event.timestamp).toLocaleString(),
            event.analytics?.sessionId || '',
            event.metadata || ''
        ].map(value => `"${value}"`).join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Set up and trigger download
        link.setAttribute('href', url);
        link.setAttribute('download', `boothboss-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Format event type for display
    const formatEventType = (type: string): string => {
        const formattedTypes: Record<string, string> = {
            'photo_captured': 'Photo Captured',
            'photo_approved': 'Photo Approved',
            'video_captured': 'Video Captured',
            'video_approved': 'Video Approved',
            'retake_photo': 'Photo Retaken',
            'retake_video': 'Video Retaken',
          };
        return type
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Data refreshers*/}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                
                <div className="flex flex-wrap gap-2">
                <button
                    onClick={refreshData}
                    disabled={isRefreshing}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                    {isRefreshing ? (
                    <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Refreshing...</span>
                    </>
                    ) : (
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Refresh Data</span>
                    </>
                    )}
                </button>
                
                <div className="flex items-center">
                    <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="autoRefresh" className="ml-2 text-sm text-gray-700">
                    Auto-refresh
                    </label>
                    {autoRefresh && (
                    <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="ml-2 text-sm border-gray-300 rounded"
                    >
                        <option value="10">10s</option>
                        <option value="30">30s</option>
                        <option value="60">1m</option>
                        <option value="300">5m</option>
                    </select>
                    )}
                </div>
                
                <button
                    onClick={exportToCsv}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Export CSV</span>
                </button>
                </div>
            </div>
            
            {/* Timeframe selector for charts */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-center gap-4 mb-4">
                    <button
                        onClick={() => setTimeframe('daily')}
                        className={`px-4 py-2 rounded-md ${
                        timeframe === 'daily' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setTimeframe('weekly')}
                        className={`px-4 py-2 rounded-md ${
                        timeframe === 'weekly' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        This Week
                    </button>
                    <button
                        onClick={() => setTimeframe('monthly')}
                        className={`px-4 py-2 rounded-md ${
                        timeframe === 'monthly' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        This Month
                    </button>
                    <button
                        onClick={() => {
                        setShowDateRangePicker(!showDateRangePicker);
                        if (customData) {
                            setTimeframe('custom');
                        }
                        }}
                        className={`px-4 py-2 rounded-md ${
                        timeframe === 'custom' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                    >
                        Custom Range
                    </button>
                </div>

                {showDateRangePicker && (
                <div className="mb-6">
                    <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={handleDateRangeChange}
                    />
                </div>
                )}

                
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                        <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">Total Sessions</p>
                        <Tooltip 
                            content="The total number of photo booth sessions started, regardless of completion."
                            position="top"
                        >
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold">
                        {timeframe === 'daily' ? daily?.totalSessions || 0 :
                        timeframe === 'weekly' ? weekly?.totalSessions || 0 :
                        timeframe === 'custom' ? customData?.totalSessions || 0 :
                        monthly?.totalSessions || 0}
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                        <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">Completed</p>
                        <Tooltip 
                            content="Sessions where users completed the entire flow and received their photo."
                            position="top"
                        >
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold">
                        {timeframe === 'daily' ? daily?.completedSessions || 0 :
                        timeframe === 'weekly' ? weekly?.completedSessions || 0 :
                        timeframe === 'custom' ? customData?.completedSessions || 0 :
                        monthly?.completedSessions || 0}
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
                        <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">Completion Rate</p>
                        <Tooltip 
                            content="Percentage of started sessions that resulted in a completed flow. A healthy rate is above 70%."
                            position="top"
                        >
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold">
                        {timeframe === 'daily' ? daily?.completionRate || '0' :
                        timeframe === 'weekly' ? weekly?.completionRate || '0' :
                        timeframe === 'custom' ? customData?.completionRate || '0' :
                        monthly?.completionRate || '0'}%
                        </p>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                        <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-sm">Avg. Time</p>
                        <Tooltip 
                            content="Average time users spend from starting a session to completion. Shorter times typically indicate a better user experience."
                            position="top"
                        >
                            <svg className="w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </Tooltip>
                        </div>
                        <p className="text-2xl font-semibold">
                        {((timeframe === 'daily' ? daily?.averageCompletionTimeMs || 0 :
                            timeframe === 'weekly' ? weekly?.averageCompletionTimeMs || 0 :
                            timeframe === 'custom' ? customData?.averageCompletionTimeMs || 0 :
                            monthly?.averageCompletionTimeMs || 0) / 1000).toFixed(1)}s
                        </p>
                    </div>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-medium mb-4">Session Completion</h3>
                    <div className="h-64">
                    <Doughnut data={completionChartData} options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                        legend: {
                            position: 'bottom'
                        }
                        }
                    }} />
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-medium mb-4">Event Types</h3>
                    <div className="h-64">
                    <Bar data={eventTypeChartData} options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                        legend: {
                            display: false
                        }
                        },
                        scales: {
                        y: {
                            beginAtZero: true
                        }
                        }
                    }} />
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-medium mb-4">Email Domains</h3>
                    <div className="h-64">
                    {monthly?.topEmailDomains && monthly.topEmailDomains.length > 0 ? (
                        <Doughnut data={emailDomainsChartData} options={{ 
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                            position: 'bottom'
                            }
                        }
                        }} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                        No email domain data available
                        </div>
                    )}
                    </div>
                </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <ImprovementSuggestions 
                        data={
                        timeframe === 'daily' ? daily || { totalSessions: 0, completedSessions: 0, completionRate: '0', averageCompletionTimeMs: 0 } :
                        timeframe === 'weekly' ? weekly || { totalSessions: 0, completedSessions: 0, completionRate: '0', averageCompletionTimeMs: 0 } :
                        timeframe === 'custom' ? customData || { totalSessions: 0, completedSessions: 0, completionRate: '0', averageCompletionTimeMs: 0 } :
                        monthly || { totalSessions: 0, completedSessions: 0, completionRate: '0', averageCompletionTimeMs: 0 }
                        }
                    />
                </div>
            </div>

            {/* Funnel viz */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">User Journey Funnel</h3>
                <Tooltip 
                content="Shows how many users progress through each stage of the photo booth experience. Significant drops between stages may indicate usability issues."
                position="left"
                width="300px"
                >
                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                </Tooltip>
            </div>
                
                {journeyFunnelData.length > 0 ? (
                    <UserJourneyFunnel 
                    data={journeyFunnelData.map(item => ({
                        name: formatStepName(item.step),
                        count: item.count,
                        color: item.step === 'view_start' ? '#3B82F6' :
                            item.step === 'splash_complete' ? '#60A5FA' :
                            item.step === 'info_submitted' ? '#93C5FD' :
                            item.step === 'journey_complete' ? '#BFDBFE' :
                            item.step === 'photo_captured' ? '#10B981' :
                            item.step === 'photo_approved' ? '#34D399' :
                            '#6EE7B7'
                    }))}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                    No journey data available
                    </div>
                )}
                
                <p className="mt-4 text-sm text-gray-500">
                    This chart shows the number of users that reach each stage of the photo booth experience.
                    A significant drop between stages may indicate usability issues.
                </p>
            </div>

            {/* Conversion trend chart */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Conversion Trend</h3>
                <Tooltip 
                content="Displays completion rates and session counts over time. Look for patterns to identify when users are most/least engaged with the booth experience."
                position="left"
                width="300px"
                >
                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                </Tooltip>
            </div>
                
                {conversionTrendData.length > 0 ? (
                    <ConversionTrendChart 
                    data={conversionTrendData}
                    />
                ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                    No trend data available
                    </div>
                )}
                
                <p className="mt-4 text-sm text-gray-500">
                    This chart shows session counts and completion rates over time.
                    Monitor this to identify trends or issues affecting user engagement.
                </p>
            </div>
            
            {/* Media Types Chart */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">Media Type Distribution</h3>
                <MediaTypeChart 
                    photoCount={mediaTypeStats?.photoEvents || 0}
                    videoCount={mediaTypeStats?.videoEvents || 0}
                />
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded border border-blue-100">
                    <p className="text-sm font-medium text-blue-800">Photo Approval Rate</p>
                    <p className="text-2xl">{(mediaTypeStats?.photoApprovalRate || 0).toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded border border-orange-100">
                    <p className="text-sm font-medium text-orange-800">Video Approval Rate</p>
                    <p className="text-2xl">{(mediaTypeStats?.videoApprovalRate || 0).toFixed(1)}%</p>
                    </div>
                </div>
            </div>
            
            {/* Event log */}
            <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Event Log</h3>
                <Tooltip 
                content="Detailed log of all booth interactions. Use this to debug specific issues or understand user behavior patterns."
                position="left"
                width="300px"
                >
                <svg className="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                </Tooltip>
            </div>
                
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex-1 min-w-[200px]">
                    <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Events
                    </label>
                    <input
                    type="text"
                    id="searchTerm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by ID, type, or content..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="eventTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Event Type
                    <Tooltip 
                        content="Filter events by specific interaction types to analyze particular parts of the user journey."
                        position="right"
                        >
                        <svg className="w-4 h-4 ml-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                    </Tooltip>
                    </label>
                    <select
                    id="eventTypeFilter"
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                    <option value="">All Events</option>
                    {eventTypes.map((type) => (
                        <option key={type} value={type}>
                        {formatEventType(type)}
                        </option>
                    ))}
                    </select>
                </div>
                </div>
                
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Session ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metadata
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.length > 0 ? (
                        filteredEvents.map((event) => (
                        <tr key={event.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${event.eventType.includes('complete') ? 'bg-green-100 text-green-800' : 
                                event.eventType.includes('error') ? 'bg-red-100 text-red-800' : 
                                'bg-blue-100 text-blue-800'}`}>
                                {formatEventType(event.eventType)}
                            </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {event.analytics?.sessionId 
                                    ? event.analytics.sessionId.substring(0, 8) + '...' 
                                    : '-'}                            
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {event.metadata ? event.metadata : '-'}
                            </td>
                        </tr>
                        ))
                    ) : (
                        <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                            No events found
                        </td>
                        </tr>
                    )}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;