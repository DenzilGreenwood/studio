/**
 * Admin Feedback Dashboard
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * Admin-only component for viewing feedback analytics and reports.
 * Implements the reporting strategy from the Feedback Data Architecture.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth-context-v2';
import { getFeedbackAnalytics } from '@/services/feedbackService';
import { FeedbackAnalytics, FEEDBACK_CONTEXTS } from '@/types/feedback';

interface AdminFeedbackDashboardProps {
  className?: string;
}

export function AdminFeedbackDashboard({ className = '' }: AdminFeedbackDashboardProps) {
  const { user: _user } = useAuth(); // Underscore prefix to indicate intentionally unused
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [selectedContext, setSelectedContext] = useState<string>('all');

  // Check if user is admin (this would need to be implemented in your auth system)
  const isAdmin = true; // TODO: Implement proper admin check based on custom claims

  const loadAnalytics = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case 'quarter':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const result = await getFeedbackAnalytics(
        startDate, 
        endDate,
        selectedContext === 'all' ? undefined : selectedContext
      );

      if (result.success && result.analytics) {
        setAnalytics(result.analytics);
      } else {
        setError(result.error || 'Failed to load analytics');
      }
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, timeRange, selectedContext]);

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin, loadAnalytics]);

  if (!isAdmin) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">
          You need admin privileges to view feedback analytics.
        </p>
      </div>
    );
  }

  const renderRatingDistribution = () => {
    if (!analytics?.ratingDistribution) return null;

    const maxCount = Math.max(...Object.values(analytics.ratingDistribution));
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = analytics.ratingDistribution[rating] || 0;
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center">
                <div className="flex items-center w-12">
                  <span className="text-sm font-medium">{rating}</span>
                  <span className="text-yellow-400 ml-1">★</span>
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContextBreakdown = () => {
    if (!analytics?.contextBreakdown) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback by Context</h3>
        <div className="space-y-3">
          {Object.entries(analytics.contextBreakdown).map(([context, data]) => (
            <div key={context} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium capitalize">{context}</span>
                <span className="text-sm text-gray-600 ml-2">({data.count} feedback)</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium">{data.averageRating.toFixed(1)}</span>
                <span className="text-yellow-400 ml-1">★</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCommonThemes = () => {
    if (!analytics?.commonThemes || analytics.commonThemes.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Themes</h3>
        <div className="flex flex-wrap gap-2">
          {analytics.commonThemes.map((theme, index) => (
            <span 
              key={theme}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                index < 2 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {theme}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback Analytics</h1>
            <p className="text-gray-600">Monitor user satisfaction and product feedback</p>
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Controls */}
        <div className="flex space-x-4">
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'quarter')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="quarter">Last 90 days</option>
            </select>
          </div>

          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
              Context Filter
            </label>
            <select
              id="context"
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Contexts</option>
              {Object.entries(FEEDBACK_CONTEXTS).map(([key, value]) => (
                <option key={key} value={value}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-600 mr-2">⚠</div>
            <div>
              <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">Loading feedback analytics...</p>
        </div>
      )}

      {/* Analytics Content */}
      {analytics && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.averageRating.toFixed(1)}
                </div>
                <div className="text-yellow-400 text-2xl ml-2">★</div>
              </div>
              <p className="text-gray-600 text-sm">Average Rating</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-3xl font-bold text-green-600">
                {analytics.totalCount}
              </div>
              <p className="text-gray-600 text-sm">Total Feedback</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.commonThemes.length}
              </div>
              <p className="text-gray-600 text-sm">Common Themes</p>
            </div>
          </div>

          {/* Detailed Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderRatingDistribution()}
            {renderContextBreakdown()}
          </div>

          {/* Common Themes */}
          {renderCommonThemes()}

          {/* Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Data from {analytics.timeRange.start.toLocaleDateString()} to{' '}
              {analytics.timeRange.end.toLocaleDateString()}
              {selectedContext !== 'all' && ` • Filtered by: ${selectedContext}`}
            </p>
          </div>
        </>
      )}

      {/* No Data State */}
      {analytics && analytics.totalCount === 0 && !loading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-gray-800 font-medium mb-2">No Feedback Data</h3>
          <p className="text-gray-600">
            No feedback has been submitted in the selected time range and context.
          </p>
        </div>
      )}
    </div>
  );
}
