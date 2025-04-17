// src/components/analytics/ImprovementSuggestions.tsx
"use client";
import React from 'react';

interface AnalyticsSummary {
  totalSessions: number;
  completedSessions: number;
  completionRate: string;
  averageCompletionTimeMs: number;
}

interface ImprovementSuggestionsProps {
  data: AnalyticsSummary;
}

const ImprovementSuggestions: React.FC<ImprovementSuggestionsProps> = ({ data }) => {
  const completionRate = parseInt(data.completionRate);
  const averageTimeSeconds = data.averageCompletionTimeMs / 1000;
  
  // Generate suggestions based on analytics
  const getSuggestions = () => {
    const suggestions = [];
    
    // Completion rate suggestions
    if (completionRate < 50) {
      suggestions.push({
        title: 'Low Completion Rate',
        description: 'Your completion rate is below 50%. Consider simplifying the user journey or adding clearer instructions.',
        priority: 'high'
      });
    } else if (completionRate < 70) {
      suggestions.push({
        title: 'Moderate Completion Rate',
        description: 'Your completion rate could be improved. Review the user journey funnel to identify dropout points.',
        priority: 'medium'
      });
    }
    
    // Session time suggestions
    if (averageTimeSeconds > 120) {
      suggestions.push({
        title: 'Long Session Duration',
        description: 'Sessions are taking over 2 minutes to complete. Consider streamlining the process for better user experience.',
        priority: 'medium'
      });
    }
    
    // Volume suggestions
    if (data.totalSessions < 10) {
      suggestions.push({
        title: 'Low Traffic Volume',
        description: 'You have few total sessions. Consider promoting your photo booth more effectively.',
        priority: 'low'
      });
    }
    
    return suggestions;
  };
  
  const suggestions = getSuggestions();
  
  if (suggestions.length === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-700">
              Your booth is performing well! No improvement suggestions at this time.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Improvement Suggestions</h3>
      
      {suggestions.map((suggestion, index) => (
        <div 
          key={index} 
          className={`border-l-4 p-4 rounded ${
            suggestion.priority === 'high' 
              ? 'border-red-400 bg-red-50' 
              : suggestion.priority === 'medium'
                ? 'border-yellow-400 bg-yellow-50'
                : 'border-blue-400 bg-blue-50'
          }`}
        >
          <div className="flex">
            <div className="ml-3">
              <h4 className={`text-sm font-medium ${
                suggestion.priority === 'high' 
                  ? 'text-red-800' 
                  : suggestion.priority === 'medium'
                    ? 'text-yellow-800'
                    : 'text-blue-800'
              }`}>
                {suggestion.title}
              </h4>
              <p className={`mt-1 text-sm ${
                suggestion.priority === 'high' 
                  ? 'text-red-700' 
                  : suggestion.priority === 'medium'
                    ? 'text-yellow-700'
                    : 'text-blue-700'
              }`}>
                {suggestion.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImprovementSuggestions;