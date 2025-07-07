'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  CheckCircle,
  Upload,
  Settings,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useMultiAgentAnalysis } from '@/hooks/useMultiAgentAnalysis';
import { useDiffComputation } from '@/hooks/useDiffComputation';
import { useManuscriptValidation } from '@/hooks/useManuscriptValidation';
import { FileUploadArea } from './FileUploadArea';
import { DiffViewer } from './DiffViewer';
import { AnalysisPanel } from './AnalysisPanel';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { AdvancedSettings } from './AdvancedSettings';
import { ErrorBoundary } from '../common/ErrorBoundary';
import type { AnalysisTab, DiffGranularity, AppConfig, AgentMode } from '@/types';
import { cn } from '@/utils';

const ManuscriptAnalyzer: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<AnalysisTab>('upload');
  const [diffGranularity, setDiffGranularity] = useState<DiffGranularity>('sentence');
  const [config, setConfig] = useState<AppConfig>({
    useClaudeAPI: process.env['NEXT_PUBLIC_USE_CLAUDE_API'] === 'true',
    agentMode: (process.env['NEXT_PUBLIC_AGENT_MODE'] as AgentMode) || 'heuristic',
    apiTimeout: parseInt(process.env['NEXT_PUBLIC_API_TIMEOUT'] || '30000', 10),
    maxRetries: parseInt(process.env['NEXT_PUBLIC_MAX_RETRIES'] || '3', 10),
    maxTextLength: 1000000,
    minDiffLength: 3,
 devin/1751845727-add-env-example

 devin/1751831368-production-fixes

 devin/1751849069-add-diff-engine-toggle
    useDiffMatchPatch: false


    useDiffMatchPatch: false

    useDiffMatchPatch: true
 main
 main
 main
 main
  });

  // Custom hooks
  const validation = useManuscriptValidation();
  const diffComputation = useDiffComputation(config);
  const multiAgentAnalysis = useMultiAgentAnalysis();

  /**
   * Handle file upload for original or revised manuscript
   */
  const handleFileUpload = useCallback(
    (type: 'original' | 'revised', content: string): void => {
      if (type === 'original') {
        validation.setOriginalText(content);
      } else {
        validation.setRevisedText(content);
      }
    },
    [validation]
  );

  /**
   * Handle reviewer requests input
   */
  const handleReviewerRequests = useCallback(
    (content: string): void => {
      validation.setReviewerRequests(content);
    },
    [validation]
  );

  /**
   * Run complete analysis workflow
   */
  const runAnalysis = useCallback(async (): Promise<void> => {
    try {
      // Validate inputs
      const validationResult = validation.validateAll();
      if (!validationResult.isValid) {
        console.error('Validation failed:', validationResult.errors);
        return;
      }

      // Compute diffs
      const diffs = await diffComputation.computeDiffs(
        validation.originalFile.content,
        validation.revisedFile.content,
        diffGranularity
      );

      if (diffs.length === 0) {
        console.warn('No differences found between documents');
        return;
      }

      // Run multi-agent analysis
      await multiAgentAnalysis.runAnalysis(diffs, validation.reviewerRequests.content || undefined);

      // Switch to analysis tab
      setActiveTab('analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  }, [validation, diffComputation, multiAgentAnalysis, diffGranularity]);

  /**
   * Handle run analysis button click
   */
  const handleRunAnalysisClick = (): void => {
    void runAnalysis();
  };

  /**
   * Reset all analysis state
   */
  const resetAnalysis = useCallback((): void => {
    validation.resetValidation();
    diffComputation.resetDiffs();
    multiAgentAnalysis.resetAnalysis();
    setActiveTab('upload');
  }, [validation, diffComputation, multiAgentAnalysis]);

  /**
   * Handle configuration changes
   */
  const updateConfig = useCallback((updates: Partial<AppConfig>): void => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Auto-scroll to analysis results when completed
  useEffect(() => {
    if (activeTab === 'analysis' && multiAgentAnalysis.overallAnalysis) {
      // Smooth scroll to top of analysis section
      const analysisElement = document.getElementById('analysis-section');
      if (analysisElement) {
        analysisElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeTab, multiAgentAnalysis.overallAnalysis]);

  const isAnalysisReady =
    validation.overallValidation.isValid &&
    validation.originalFile.content &&
    validation.revisedFile.content;

  const isAnalyzing = diffComputation.isComputing || multiAgentAnalysis.isAnalyzing;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Manuscript Diff Analyzer</h1>
                  <p className="text-sm text-gray-500">
                    Multi-agent AI-powered academic manuscript analysis
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Configuration Controls */}
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.useClaudeAPI}
                      onChange={(e) => updateConfig({ useClaudeAPI: e.target.checked })}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm text-gray-600">Claude AI Analysis</span>
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Granularity:</span>
                  <select
                    value={diffGranularity}
                    onChange={(e) => setDiffGranularity(e.target.value as DiffGranularity)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="word">Word-level</option>
                    <option value="sentence">Sentence-level</option>
                  </select>
                </div>

                <AdvancedSettings config={config} updateConfig={updateConfig} />

                {/* Analysis Metrics */}
                {multiAgentAnalysis.analysisMetrics.diffCount > 0 && (
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {multiAgentAnalysis.analysisMetrics.diffCount} changes detected
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Error and Warning Display */}
        {(validation.overallValidation.errors.length > 0 ||
          validation.overallValidation.warnings.length > 0 ||
          diffComputation.error ||
          multiAgentAnalysis.error) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
            {/* Errors */}
            {(validation.overallValidation.errors.length > 0 ||
              diffComputation.error ||
              multiAgentAnalysis.error) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Errors</h3>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validation.overallValidation.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                      {diffComputation.error && <li>{diffComputation.error}</li>}
                      {multiAgentAnalysis.error && <li>{multiAgentAnalysis.error}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validation.overallValidation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      {validation.overallValidation.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'upload', label: 'Upload Documents', icon: Upload },
                { id: 'analysis', label: 'Multi-Agent Analysis', icon: BarChart3 },
                { id: 'review', label: 'Review Results', icon: CheckCircle },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as AnalysisTab)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2',
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileUploadArea
                  label="Original Manuscript"
                  onUpload={(content) => handleFileUpload('original', content)}
                  hasContent={!!validation.originalFile.content}
                  value={validation.originalFile.content}
                  errors={validation.originalFile.errors}
                  warnings={validation.originalFile.warnings}
                />
                <FileUploadArea
                  label="Revised Manuscript"
                  onUpload={(content) => handleFileUpload('revised', content)}
                  hasContent={!!validation.revisedFile.content}
                  value={validation.revisedFile.content}
                  errors={validation.revisedFile.errors}
                  warnings={validation.revisedFile.warnings}
                />
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Reviewer Revision Requests (Optional)</h3>
                <p className="text-sm text-gray-500 mb-3">
                  Enter the specific changes/revisions that reviewers have requested for the
                  manuscript.
                </p>
                <textarea
                  className="w-full h-32 p-3 border rounded-md resize-none"
                  placeholder="Paste reviewer revision requests here... (e.g., 'Add more details to methodology section', 'Clarify statistical analysis', 'Expand discussion of limitations', etc.)"
                  value={validation.reviewerRequests.content}
                  onChange={(e) => handleReviewerRequests(e.target.value)}
                />
                {validation.reviewerRequests.warnings.length > 0 && (
                  <div className="mt-2">
                    {validation.reviewerRequests.warnings.map((warning, idx) => (
                      <p key={idx} className="text-sm text-yellow-600">
                        {warning}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6 border-t-4 border-indigo-500">
                <AdvancedSettings config={config} onConfigChange={updateConfig} />
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleRunAnalysisClick}
                  disabled={!isAnalysisReady || isAnalyzing}
                  className={cn(
                    'px-8 py-3 rounded-lg font-medium flex items-center space-x-2',
                    isAnalysisReady && !isAnalyzing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      <span>Run Multi-Agent Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <div id="analysis-section" className="space-y-6">
              <AgentStatusIndicator
                statuses={multiAgentAnalysis.agentStatuses}
                isAnalyzing={multiAgentAnalysis.isAnalyzing}
                metrics={multiAgentAnalysis.analysisMetrics}
              />

              <AnalysisPanel
                segmentationResult={multiAgentAnalysis.segmentationResult}
                alignmentResult={multiAgentAnalysis.alignmentResult}
                overallAnalysis={multiAgentAnalysis.overallAnalysis}
                diffs={diffComputation.diffs}
                onRetryAnalysis={runAnalysis}
                onResetAnalysis={resetAnalysis}
              />
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-6">
              <DiffViewer
                diffs={diffComputation.diffs}
                analyses={multiAgentAnalysis.segmentationResult?.data.analyses || []}
                granularity={diffGranularity}
              />
            </div>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default ManuscriptAnalyzer;
