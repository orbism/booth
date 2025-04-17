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
  
  return (
    <div className="h-64">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default UserJourneyFunnel;