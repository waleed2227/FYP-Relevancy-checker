import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { CheckCircle, AlertTriangle, ArrowLeft, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { api, ApiError, parseApiErrorDetail } from '../services/api';
import RelevancyExplanationPanel, { type RelevancyExplanationData } from './RelevancyExplanationPanel';
import MostSimilarProjectsPanel, { type MatchedProjectCard } from './MostSimilarProjectsPanel';

interface RelevancyResultsProps {
  idea: any;
  onBackToDashboard: () => void;
  onLogout: () => void;
}

export default function RelevancyResults({ idea, onBackToDashboard, onLogout }: RelevancyResultsProps) {
  const [relevancyScore, setRelevancyScore] = useState<number | null>(
    idea.relevancyScore != null ? Math.round(idea.relevancyScore) : null
  );
  const [matchedProjects, setMatchedProjects] = useState<MatchedProjectCard[]>([]);
  const [insights, setInsights] = useState<
    { label: string; value: string; description: string }[]
  >([
    { label: 'Novelty Score', value: '—', description: 'Loading analysis...' },
    { label: 'Feasibility', value: '—', description: 'Loading analysis...' },
    { label: 'Market Relevance', value: '—', description: 'Loading analysis...' },
  ]);
  const [explanation, setExplanation] = useState<RelevancyExplanationData | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idea.id) {
      setLoading(false);
      setError('Project ID missing. Return to dashboard and submit again.');
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{
          overall_score: number;
          insights: { label: string; value: string; description: string }[];
          explanation?: RelevancyExplanationData | null;
          matched_projects: MatchedProjectCard[];
        }>(`/projects/${idea.id}/relevancy`);
        setRelevancyScore(Math.round(data.overall_score));
        setInsights(data.insights);
        setExplanation(data.explanation ?? null);
        setSimilarityScore(data.explanation?.similarity_score ?? null);
        setMatchedProjects(data.matched_projects ?? []);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? parseApiErrorDetail(err.detail ?? err.message)
            : 'Failed to load relevancy analysis.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [idea.id]);

  const displayScore = relevancyScore ?? 0;
  const isHighRelevancy = relevancyScore != null && relevancyScore >= 70;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role="student" onLogout={onLogout} onNavigate={() => {}} currentScreen="relevancy-results" />

      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <button
              onClick={onBackToDashboard}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-gray-900 mb-2">AI Relevancy Analysis Results</h1>
            <p className="text-gray-600">Analysis for: {idea.title}</p>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-600">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading AI relevancy analysis...</span>
            </div>
          )}

          {error && !loading && (
            <div className="mb-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Could not load relevancy results</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && relevancyScore != null && (
          <>
          <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-start gap-6">
                <div
                  className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                    isHighRelevancy ? 'bg-green-100' : 'bg-yellow-100'
                  }`}
                >
                  {isHighRelevancy ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div>
                      <h2 className="text-gray-900 mb-1">Overall Relevancy Score</h2>
                      <p className="text-gray-600">
                        {isHighRelevancy
                          ? 'Your project shows strong relevance and potential'
                          : 'Your project needs some refinement'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <div className="text-gray-900">{displayScore}%</div>
                    <span
                      className={`text-sm mb-1 ${
                        isHighRelevancy ? 'text-green-600' : 'text-yellow-600'
                      }`}
                    >
                      {isHighRelevancy ? 'Good Match' : 'Moderate Match'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${
                        isHighRelevancy ? 'bg-green-600' : 'bg-yellow-600'
                      }`}
                      style={{ width: `${displayScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <MostSimilarProjectsPanel projects={matchedProjects} className="mb-8" />

          <RelevancyExplanationPanel
            explanation={explanation}
            similarityScore={similarityScore}
            className="mb-8"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {insights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-gray-900">{insight.value}</div>
                </div>
                <div className="text-gray-900 mb-1">{insight.label}</div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-gray-900 mb-4">Submitted Project Details</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Project Title</div>
                  <div className="text-gray-900">{idea.title}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Technologies</div>
                  <div className="text-gray-900">{idea.technologies}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Description</div>
                  <div className="text-gray-700">{idea.description}</div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-blue-900 mb-4">Next Steps</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p className="text-sm text-blue-900">
                    Your submission has been recorded and sent for professor review
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p className="text-sm text-blue-900">
                    A professor will review your idea within 3-5 business days
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p className="text-sm text-blue-900">
                    You will receive updates via notifications in this system
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onBackToDashboard}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
