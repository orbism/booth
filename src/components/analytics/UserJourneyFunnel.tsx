// src/components/analytics/UserJourneyFunnel.tsx
"use client";
import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StepData {
  name: string;
  count: number;
  color: string;
}

interface UserJourneyFunnelProps {
  data: StepData[];
  title?: string;
}

const UserJourneyFunnel: React.FC<UserJourneyFunnelProps> = ({ 
  data,
  title = 'User Journey Funnel'
}) => {
  // Sort data in descending order for better visualization
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  const chartData = {
    labels: sortedData.map(item => item.name),
    datasets: [
      {
        label: 'Users',
        data: sortedData.map(item => item.count),
        backgroundColor: sortedData.map(item => item.color),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };
  
  const options = {
    indexAxis: 'y' as const,
    elements: {
      bar: {
        borderWidth: 2,
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: !!title,
        text: title,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Helper to get appropriate colors for each step, including video steps
  const getStepColor = (step: string): string => {
    const colorMap: Record<string, string> = {
      'view_start': '#3B82F6',       // Blue
      'splash_complete': '#60A5FA',  // Light blue
      'info_submitted': '#93C5FD',   // Lighter blue
      'journey_complete': '#BFDBFE', // Lightest blue
      'photo_captured': '#10B981',   // Green
      'photo_approved': '#34D399',   // Light green
      'video_captured': '#F59E0B',   // Amber/orange
      'video_approved': '#FBBF24',   // Yellow
      'email_sent': '#6EE7B7'        // Teal/mint
    };
    
    return colorMap[step] || '#CBD5E1'; // Default gray if no match
  };

  const formatStepName = (step: string): string => {
    const map: Record<string, string> = {
      'view_start': 'Page Visit',
      'splash_complete': 'Splash Screen',
      'info_submitted': 'Info Submitted',
      'journey_complete': 'Journey Completed',
      'photo_captured': 'Photo Taken',
      'video_captured': 'Video Recorded',
      'photo_approved': 'Photo Approved',
      'video_approved': 'Video Approved',
      'email_sent': 'Email Sent',
      'retake_photo': 'Photo Retaken',
      'retake_video': 'Video Retaken'
    };
    
    return map[step] || step.replace(/_/g, ' ');
  };
  
  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default UserJourneyFunnel;