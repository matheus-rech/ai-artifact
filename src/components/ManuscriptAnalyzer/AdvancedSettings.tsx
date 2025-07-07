import React from 'react';
import type { AppConfig } from '../../types';

interface AdvancedSettingsProps {
  config: AppConfig;
 devin/1751849069-add-diff-engine-toggle
  onConfigChange: (updates: Partial<AppConfig>) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  onConfigChange,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Advanced Settings</h3>
      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={config.useDiffMatchPatch}
            onChange={(e) => onConfigChange({ useDiffMatchPatch: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              Use diff-match-patch Engine
            </span>
            <span className="text-xs text-gray-500">
              Enhanced diff algorithm with better performance and semantic cleanup
            </span>
          </div>
        </label>
      </div>

  updateConfig: (updates: Partial<AppConfig>) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ config, updateConfig }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Diff Engine:</span>
      <label className="flex items-center">
        <input
          type="checkbox"
          checked={config.useDiffMatchPatch}
          onChange={(e) => updateConfig({ useDiffMatchPatch: e.target.checked })}
          className="rounded"
        />
        <span className="ml-2 text-sm text-gray-600">
          {config.useDiffMatchPatch ? 'Google Diff-Match-Patch' : 'Custom LCS Algorithm'}
        </span>
      </label>
 main
    </div>
  );
};
