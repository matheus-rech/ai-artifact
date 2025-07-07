import React from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw, Settings } from 'lucide-react';
import type { AgentStatus, AnalysisMetrics } from '@/types';
import type { AgentType } from '@/agents/base/AgentTypes';
import { cn } from '@/utils';

interface AgentStatusIndicatorProps {
  statuses: Record<AgentType, AgentStatus>;
  isAnalyzing: boolean;
  metrics: AnalysisMetrics;
}

export const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({
  statuses,
  isAnalyzing,
  metrics,
}) => {
  const getStatusIcon = (status: AgentStatus['status']): React.ReactNode => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'idle':
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: AgentStatus['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'error':
        return 'text-red-700 bg-red-100';
      case 'running':
        return 'text-blue-700 bg-blue-100';
      case 'idle':
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getAgentDisplayName = (agentType: AgentType): string => {
    switch (agentType) {
      case 'diff-segmentation':
        return 'Diff Segmentation';
      case 'reviewer-alignment':
        return 'Reviewer Alignment';
      case 'section-inference':
        return 'Section Inference';
      case 'priority-assessment':
        return 'Priority Assessment';
      default:
        return agentType;
    }
  };

  const agentEntries = Object.entries(statuses) as [AgentType, AgentStatus][];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Settings className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Multi-Agent Analysis Status</h3>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {agentEntries.map(([agentType, status]) => (
          <div key={agentType} className="border rounded-lg p-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900">
                {getAgentDisplayName(agentType)}
              </span>
              {getStatusIcon(status.status)}
            </div>

            <div className="space-y-2">
              <div
                className={cn(
                  'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  getStatusColor(status.status)
                )}
              >
                {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
              </div>

              {status.progress !== undefined && status.status === 'running' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${status.progress}%` }}
                  />
                </div>
              )}

              {status.message && <p className="text-xs text-gray-600 mt-1">{status.message}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      {metrics.totalTime > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-600">Processing Time</span>
              <span className="font-medium">
                {metrics.totalTime > 1000
                  ? `${(metrics.totalTime / 1000).toFixed(1)}s`
                  : `${metrics.totalTime.toFixed(0)}ms`}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-600">Analysis Method</span>
              <span className="font-medium">
                {metrics.fallbackUsed ? 'Heuristic' : 'AI-Powered'}
              </span>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-600">Changes Analyzed</span>
              <span className="font-medium">{metrics.diffCount}</span>
            </div>

            <div className="bg-gray-50 p-3 rounded">
              <span className="block text-gray-600">API Calls</span>
              <span className="font-medium">{metrics.apiCalls}</span>
            </div>
          </div>
        </div>
      )}

      {/* Agent Coordination Status */}
      {agentEntries.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Agent Coordination:{' '}
              {agentEntries.filter(([, status]) => status.status === 'completed').length} /{' '}
              {agentEntries.length} completed
            </span>

            {metrics.fallbackUsed && (
              <span className="text-orange-600 bg-orange-100 px-2 py-1 rounded text-xs">
                Fallback Mode Active
              </span>
            )}
          </div>

          {/* Overall Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(agentEntries.filter(([, status]) => status.status === 'completed').length / agentEntries.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
