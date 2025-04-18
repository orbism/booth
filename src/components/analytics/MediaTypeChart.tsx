// src/components/analytics/MediaTypeChart.tsx
"use client";
import React from 'react';
import { Doughnut } from 'react-chartjs-2';

interface MediaTypeChartProps {
  photoCount: number;
  videoCount: number;
}

const MediaTypeChart: React.FC<MediaTypeChartProps> = ({
  photoCount,
  videoCount
}) => {
  const totalCount = photoCount + videoCount;
  const photoPercentage = totalCount > 0 ? Math.round((photoCount / totalCount) * 100) : 0;
  const videoPercentage = totalCount > 0 ? Math.round((videoCount / totalCount) * 100) : 0;
  
  const chartData = {
    labels: [`Photos (${photoPercentage}%)`, `Videos (${videoPercentage}%)`],
    datasets: [
      {
        data: [photoCount, videoCount],
        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(255, 159, 64, 0.6)'],
        borderColor: ['rgb(54, 162, 235)', 'rgb(255, 159, 64)'],
        borderWidth: 1,
      },
    ],
  };
  
  return (
    <div className="h-64">
      <Doughnut 
        data={chartData} 
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw as number;
                  const label = context.label as string;
                  return `${label}: ${value} sessions`;
                }
              }
            }
          }
        }} 
      />
    </div>
  );
};

export default MediaTypeChart;