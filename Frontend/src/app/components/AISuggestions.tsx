/**
 * @deprecated Removed from FYP navigation (2026-06). Not imported by App.tsx.
 * Kept on disk for reference only.
 */
import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Sparkles, Lightbulb, TrendingUp, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Target, Inbox } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

interface AISuggestionsProps {
  onLogout: () => void;
  onNavigate: (screen: string) => void;
}

export default function AISuggestions({ onLogout, onNavigate }: AISuggestionsProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const {
    aiSuggestions,
    markAISuggestionAsRead,
    dismissAISuggestion,
    applyAISuggestion,
  } = useNotifications();

  // Mark all AI suggestions as read when the page is opened
  useEffect(() => {
    aiSuggestions.forEach(suggestion => {
      if (!suggestion.isRead) {
        markAISuggestionAsRead(suggestion.id);
      }
    });
  }, []);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'scope-enhancement':
        return Lightbulb;
      case 'technology-recommendation':
        return TrendingUp;
      case 'similarity-alert':
        return AlertCircle;
      case 'methodology-validation':
        return CheckCircle;
      case 'research-gap':
        return Target;
      default:
        return Sparkles;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'yellow':
        return {
          bg: 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
          border: 'border-yellow-200 dark:border-yellow-700',
          icon: 'text-yellow-600 dark:text-yellow-400',
          badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
          glow: 'shadow-yellow-200/50 dark:shadow-yellow-900/30',
        };
      case 'blue':
        return {
          bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
          border: 'border-blue-200 dark:border-blue-700',
          icon: 'text-blue-600 dark:text-blue-400',
          badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
          glow: 'shadow-blue-200/50 dark:shadow-blue-900/30',
        };
      case 'red':
        return {
          bg: 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
          border: 'border-red-200 dark:border-red-700',
          icon: 'text-red-600 dark:text-red-400',
          badge: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
          glow: 'shadow-red-200/50 dark:shadow-red-900/30',
        };
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          border: 'border-green-200 dark:border-green-700',
          icon: 'text-green-600 dark:text-green-400',
          badge: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
          glow: 'shadow-green-200/50 dark:shadow-green-900/30',
        };
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
          border: 'border-purple-200 dark:border-purple-700',
          icon: 'text-purple-600 dark:text-purple-400',
          badge: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
          glow: 'shadow-purple-200/50 dark:shadow-purple-900/30',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          border: 'border-gray-200 dark:border-gray-700',
          icon: 'text-gray-600 dark:text-gray-400',
          badge: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
          glow: '',
        };
    }
  };

  const handleApplySuggestion = (id: number) => {
    alert(`Applying suggestion #${id}...`);
    applyAISuggestion(id);
  };

  const handleDismissSuggestion = (id: number) => {
    dismissAISuggestion(id);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar role="student" onLogout={onLogout} onNavigate={onNavigate} currentScreen="ai-suggestions" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-gray-900 dark:text-white">AI-Powered Academic Assistant</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {aiSuggestions.length} intelligent recommendations available
                </p>
              </div>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {aiSuggestions.map((suggestion) => {
              const Icon = getIconForType(suggestion.type);
              const colors = getColorClasses(suggestion.color);
              const isExpanded = expandedId === suggestion.id;
              return (
                <div
                  key={suggestion.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-2xl overflow-hidden transition-all duration-300 ${
                    isExpanded ? `shadow-xl ${colors.glow}` : 'hover:shadow-lg'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md ring-2 ring-white dark:ring-gray-700">
                        <Icon className={`w-7 h-7 ${colors.icon}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                              {suggestion.title}
                            </h3>
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.badge}`}>
                                {suggestion.priority.toUpperCase()} PRIORITY
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${colors.icon.replace('text-', 'bg-')} transition-all`}
                                    style={{ width: `${suggestion.confidenceScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                  {suggestion.confidenceScore}% AI Confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {suggestion.description}
                        </p>

                        {/* Suggested Action */}
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            💡 Suggested Action:
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.suggestedAction}
                          </p>
                        </div>

                        {/* Expand/Collapse Detailed Reasoning */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : suggestion.id)}
                          className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide AI Reasoning
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show Detailed AI Reasoning
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border-2 border-blue-200 dark:border-blue-800 animate-fade-in">
                            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              🤖 AI Analysis:
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {suggestion.detailedReasoning}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApplySuggestion(suggestion.id)}
                            className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg font-medium"
                          >
                            ✓ Apply Suggestion
                          </button>
                          <button
                            onClick={() => handleDismissSuggestion(suggestion.id)}
                            className="px-5 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors font-medium"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {aiSuggestions.length === 0 && (
              <div className="text-center py-16">
                <div className="inline-flex p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full mb-4">
                  <Inbox className="w-20 h-20 text-purple-400 dark:text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  You're All Caught Up!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  No AI suggestions available at the moment. Keep working on your projects!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
