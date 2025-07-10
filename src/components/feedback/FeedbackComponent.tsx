/**
 * Feedback Collection Component
 * Version: 1.0.0
 * Date: July 9, 2025
 * 
 * React component for collecting user feedback across the application.
 * Supports rating, optional message, and contextual information.
 */

'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { submitFeedback } from '@/services/feedbackService';
import { CreateFeedbackRequest, FeedbackContext, FEEDBACK_CONTEXTS } from '@/types/feedback';

interface FeedbackComponentProps {
  pageContext?: FeedbackContext;
  onSubmitted?: (success: boolean) => void;
  className?: string;
  showContext?: boolean;
  compact?: boolean;
}

export function FeedbackComponent({
  pageContext = FEEDBACK_CONTEXTS.GENERAL,
  onSubmitted,
  className = '',
  showContext = false,
  compact = false
}: FeedbackComponentProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [selectedContext, setSelectedContext] = useState<FeedbackContext>(pageContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please log in to submit feedback');
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const feedbackRequest: CreateFeedbackRequest = {
      rating,
      message: message.trim() || undefined,
      pageContext: selectedContext,
      version: process.env.NEXT_PUBLIC_APP_VERSION
    };

    const result = await submitFeedback(user.uid, feedbackRequest);

    if (result.success) {
      setSubmitted(true);
      setRating(0);
      setMessage('');
      onSubmitted?.(true);
    } else {
      setError(result.error || 'Failed to submit feedback');
      onSubmitted?.(false);
    }

    setIsSubmitting(false);
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingClick(star)}
            className={`text-2xl transition-colors ${
              star <= rating 
                ? 'text-yellow-400 hover:text-yellow-500' 
                : 'text-gray-300 hover:text-gray-400'
            }`}
            disabled={isSubmitting}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const renderEmojiRating = () => {
    const emojis = ['😟', '😕', '😐', '😊', '😍'];
    const labels = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];

    return (
      <div className="flex gap-2">
        {emojis.map((emoji, index) => {
          const ratingValue = index + 1;
          return (
            <button
              key={ratingValue}
              type="button"
              onClick={() => handleRatingClick(ratingValue)}
              className={`text-3xl p-2 rounded-lg transition-all ${
                ratingValue === rating
                  ? 'bg-blue-100 scale-110'
                  : 'hover:bg-gray-100 hover:scale-105'
              }`}
              title={labels[index]}
              disabled={isSubmitting}
            >
              {emoji}
            </button>
          );
        })}
      </div>
    );
  };

  if (submitted) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-green-600 mr-2">✓</div>
          <div>
            <h4 className="text-green-800 font-medium">Thank you for your feedback!</h4>
            <p className="text-green-600 text-sm">Your input helps us improve our app.</p>
          </div>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm text-green-600 hover:text-green-700 underline"
        >
          Submit more feedback
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            How would you rate your experience?
          </h3>
          
          {compact ? renderStars() : renderEmojiRating()}
          
          {rating > 0 && (
            <p className="text-sm text-gray-600 mt-2">
              Rating: {rating}/5 {rating >= 4 ? '(Great!)' : rating >= 3 ? '(Good)' : '(Needs improvement)'}
            </p>
          )}
        </div>

        {showContext && (
          <div>
            <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-1">
              What were you doing?
            </label>
            <select
              id="context"
              value={selectedContext}
              onChange={(e) => setSelectedContext(e.target.value as FeedbackContext)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value={FEEDBACK_CONTEXTS.GENERAL}>General</option>
              <option value={FEEDBACK_CONTEXTS.ONBOARDING}>Getting started</option>
              <option value={FEEDBACK_CONTEXTS.CHAT}>Chatting</option>
              <option value={FEEDBACK_CONTEXTS.JOURNAL}>Journaling</option>
              <option value={FEEDBACK_CONTEXTS.SESSION}>Session/Protocol</option>
              <option value={FEEDBACK_CONTEXTS.REPORT}>Reports</option>
              <option value={FEEDBACK_CONTEXTS.SETTINGS}>Settings</option>
            </select>
          </div>
        )}

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Tell us more (optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What did you like? What could be improved?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={compact ? 2 : 3}
            maxLength={1000}
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/1000 characters
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setRating(0);
              setMessage('');
              setError(null);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            disabled={isSubmitting}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Your feedback helps us improve our app. We don&apos;t store any personal information 
          with your feedback, only your rating and optional message.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact feedback widget for embedding in pages
 */
export function QuickFeedback({ 
  pageContext, 
  onSubmitted 
}: { 
  pageContext?: FeedbackContext;
  onSubmitted?: (success: boolean) => void;
}) {
  return (
    <FeedbackComponent
      pageContext={pageContext}
      onSubmitted={onSubmitted}
      className="max-w-md"
      compact={true}
    />
  );
}

/**
 * Full feedback form for dedicated feedback pages
 */
export function FullFeedbackForm({ 
  onSubmitted 
}: { 
  onSubmitted?: (success: boolean) => void;
}) {
  return (
    <FeedbackComponent
      onSubmitted={onSubmitted}
      className="max-w-2xl mx-auto"
      showContext={true}
      compact={false}
    />
  );
}
