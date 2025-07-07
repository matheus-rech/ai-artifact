import React from 'react';
import { FileText, Plus, Minus, Edit3 } from 'lucide-react';
import type { DiffItem, AnalysisItem, DiffGranularity } from '@/types';
import { cn } from '@/utils';

interface DiffViewerProps {
  diffs: DiffItem[];
  analyses: AnalysisItem[];
  granularity: DiffGranularity;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffs, analyses, granularity }) => {
  const getChangeIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'addition':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'deletion':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'modification':
        return <Edit3 className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (type: string): string => {
    switch (type) {
      case 'addition':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'deletion':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'modification':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  const findAnalysisForDiff = (diffId: string): AnalysisItem | undefined => {
    return analyses.find((analysis) => analysis.diffId === diffId);
  };

  if (diffs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Changes Detected</h3>
        <p className="text-gray-500">
          No differences were found between the original and revised manuscripts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Manuscript Changes</h3>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                {diffs.length} changes ({granularity}-level)
              </span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <Plus className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">
                    {diffs.filter((d) => d.type === 'addition').length} additions
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Minus className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">
                    {diffs.filter((d) => d.type === 'deletion').length} deletions
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Edit3 className="h-3 w-3 text-blue-600" />
                  <span className="text-blue-600">
                    {diffs.filter((d) => d.type === 'modification').length} modifications
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {diffs.map((diff) => {
            const analysis = findAnalysisForDiff(diff.id);

            return (
              <div key={diff.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">{getChangeIcon(diff.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                          getChangeColor(diff.type)
                        )}
                      >
                        {diff.type}
                      </span>

                      {analysis && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {analysis.section}
                        </span>
                      )}

                      {diff.confidence && (
                        <span className="text-xs text-gray-500">
                          {(diff.confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded border-l-4 border-gray-300 mb-2">
                      {diff.text}
                    </div>

                    {diff.context && (
                      <div className="text-xs text-gray-500 mb-2">
                        <span className="font-medium">Context:</span> {diff.context}
                      </div>
                    )}

                    {analysis && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                        <p className="text-sm text-blue-900 mb-1">{analysis.comment}</p>
                        <p className="text-xs text-blue-700">💡 {analysis.reviewerPoint}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>
                        Position: {diff.originalPos} → {diff.revisedPos}
                      </span>
                      <span>ID: {diff.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
