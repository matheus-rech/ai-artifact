import React, { useState } from 'react';
import { BarChart3, RefreshCw, Download, FileText, Users, Target, TrendingUp } from 'lucide-react';
import type { 
  AgentResult,
  DiffItem,
  OverallAnalysis 
} from '@/types';
import type { 
  DiffSegmentationOutput,
  ReviewerAlignmentOutput 
} from '@/agents/base/AgentTypes';
import { cn, formatConfidence } from '@/utils';

interface AnalysisPanelProps {
  segmentationResult: AgentResult<DiffSegmentationOutput> | null;
  alignmentResult: AgentResult<ReviewerAlignmentOutput> | null;
  overallAnalysis: OverallAnalysis | null;
  diffs: DiffItem[];
  onRetryAnalysis: () => Promise<void>;
  onResetAnalysis: () => void;
}

type AnalysisView = 'overview' | 'segmentation' | 'alignment' | 'export';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  segmentationResult,
  alignmentResult,
  overallAnalysis,
  // diffs, // Available but not used in current implementation
  onRetryAnalysis,
  onResetAnalysis
}) => {
  const [activeView, setActiveView] = useState<AnalysisView>('overview');
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryAnalysis = async (): Promise<void> => {
    setIsRetrying(true);
    try {
      await onRetryAnalysis();
    } finally {
      setIsRetrying(false);
    }
  };

  const getAssessmentColor = (assessment: string): string => {
    switch (assessment) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const getChangeTypeIcon = (type: string): string => {
    switch (type) {
      case 'addition': return '+ ';
      case 'deletion': return '- ';
      case 'modification': return '≈ ';
      default: return '';
    }
  };

  if (!segmentationResult && !alignmentResult) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Results</h3>
        <p className="text-gray-500 mb-4">
          Run the multi-agent analysis to see detailed insights about your manuscript changes.
        </p>
        <button
          onClick={handleRetryAnalysis}
          disabled={isRetrying}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isRetrying ? 'Analyzing...' : 'Start Analysis'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'segmentation', label: 'Section Analysis', icon: FileText },
              { id: 'alignment', label: 'Reviewer Alignment', icon: Users },
              { id: 'export', label: 'Export Results', icon: Download }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as AnalysisView)}
                className={cn(
                  "py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2",
                  activeView === id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeView === 'overview' && overallAnalysis && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h3 className="text-lg font-medium mb-3">Analysis Summary</h3>
                <p className="text-gray-600 leading-relaxed">{overallAnalysis.summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Changes</p>
                      <p className="text-2xl font-bold text-blue-900">{overallAnalysis.totalChanges}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-600">Avg. Confidence</p>
                      <p className="text-2xl font-bold text-green-900">
                        {formatConfidence(overallAnalysis.averageConfidence)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-purple-600">Top Section</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {Object.entries(overallAnalysis.sectionBreakdown)
                          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-orange-600">Alignment</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {alignmentResult?.success 
                          ? `${alignmentResult.data.summary.alignmentPercentage}%`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {overallAnalysis.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {overallAnalysis.recommendations.map((recommendation, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeView === 'segmentation' && segmentationResult?.success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Section-based Analysis</h3>
                <span className="text-sm text-gray-500">
                  {segmentationResult.data.analyses.length} changes analyzed
                </span>
              </div>

              <div className="divide-y divide-gray-200">
                {segmentationResult.data.analyses.map((analysis) => (
                  <div key={analysis.analysisId} className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-mono text-gray-500">
                            {getChangeTypeIcon(analysis.changeType)}
                          </span>
                          <span className="font-medium text-gray-900">{analysis.section}</span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getPriorityColor(analysis.priority)
                          )}>
                            {analysis.priority}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium border",
                            getAssessmentColor(analysis.assessment)
                          )}>
                            {analysis.assessment}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                            {formatConfidence(analysis.confidence)} confidence
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">{analysis.comment}</p>
                        <p className="text-sm text-gray-500 italic mb-2">
                          "{analysis.relatedText}..."
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                            💡 {analysis.reviewerPoint}
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(analysis.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'alignment' && alignmentResult?.success && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Reviewer Request Alignment</h3>
                <span className="text-sm text-gray-500">
                  {alignmentResult.data.summary.alignmentPercentage}% alignment rate
                </span>
              </div>

              {alignmentResult.data.alignedAnalyses.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {alignmentResult.data.alignedAnalyses.map((analysis) => (
                    <div key={analysis.analysisId} className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="text-green-500">✓</span>
                            <span className="font-medium text-gray-900">{analysis.section}</span>
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getPriorityColor(analysis.priority)
                            )}>
                              {analysis.priority} priority
                            </span>
                          </div>
                          <p className="text-gray-600 mb-2">{analysis.comment}</p>
                          <p className="text-sm text-blue-600 mb-2">📝 {analysis.reviewerPoint}</p>
                          <p className="text-sm text-gray-500 italic">
                            "{analysis.relatedText}..."
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Alignments Found</h3>
                  <p className="text-gray-500">
                    No changes appear to directly address the provided reviewer requests.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeView === 'export' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Export Analysis Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 flex flex-col items-center space-y-2">
                  <Download className="h-6 w-6" />
                  <span className="font-medium">Export PDF Report</span>
                  <span className="text-sm opacity-90">Comprehensive analysis report</span>
                </button>
                
                <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 flex flex-col items-center space-y-2">
                  <Download className="h-6 w-6" />
                  <span className="font-medium">Export JSON Data</span>
                  <span className="text-sm opacity-90">Raw analysis data</span>
                </button>
                
                <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 flex flex-col items-center space-y-2">
                  <Download className="h-6 w-6" />
                  <span className="font-medium">Export Summary</span>
                  <span className="text-sm opacity-90">Key insights and metrics</span>
                </button>
              </div>

              {/* Export Summary */}
              {overallAnalysis && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Export Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="block text-gray-600">Total Changes</span>
                      <span className="font-medium">{overallAnalysis.totalChanges}</span>
                    </div>
                    <div>
                      <span className="block text-gray-600">Sections Analyzed</span>
                      <span className="font-medium">{Object.keys(overallAnalysis.sectionBreakdown).length}</span>
                    </div>
                    <div>
                      <span className="block text-gray-600">Avg. Confidence</span>
                      <span className="font-medium">{formatConfidence(overallAnalysis.averageConfidence)}</span>
                    </div>
                    <div>
                      <span className="block text-gray-600">Recommendations</span>
                      <span className="font-medium">{overallAnalysis.recommendations.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-between">
          <button
            onClick={onResetAnalysis}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            Reset Analysis
          </button>
          
          <button
            onClick={handleRetryAnalysis}
            disabled={isRetrying}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Re-analyzing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Re-analyze</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};