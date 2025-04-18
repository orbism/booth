// src/components/analytics/ConversionTrendChart.tsx
"use client";
import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';

// Register required components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DailyMetric {
  date: string;
  totalSessions: number;
  completedSessions: number;
  completionRate: number;
}

interface ConversionTrendChartProps {
  data: DailyMetric[];
  title?: string;
}

const ConversionTrendChart: React.FC<ConversionTrendChartProps> = ({
  data,
  title = 'Conversion Trend'
}) => {
  // Sort data by date
  const sortedData = [...data].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: sortedData.map(item => item.completionRate),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.3,
        fill: false,
        yAxisID: 'y1',
      },
      {
        label: 'Total Sessions',
        data: sortedData.map(item => item.totalSessions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Completed Photo Sessions',
        data: sortedData.map(item => item.completedPhotoSessions || 0),
        borderColor: 'rgb(50, 205, 50)',
        backgroundColor: 'rgba(50, 205, 50, 0.2)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Completed Video Sessions',
        data: sortedData.map(item => item.completedVideoSessions || 0),
        borderColor: 'rgb(255, 165, 0)',
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        tension: 0.3,
        fill: true,
        yAxisID: 'y',
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius: 3,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: !!title,
        text: title,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Sessions',
        },
        min: 0,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Completion Rate (%)',
        },
        min: 0,
        max: 100,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };
  
  return (
    <div className="h-80">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default ConversionTrendChart;