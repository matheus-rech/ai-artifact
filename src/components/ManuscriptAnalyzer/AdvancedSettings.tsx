import React from 'react';
import type { AppConfig } from '../../types';

interface AdvancedSettingsProps {
  config: AppConfig;
  onConfigChange?: (updates: Partial<AppConfig>) => void;
  updateConfig?: (updates: Partial<AppConfig>) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  config,
  onConfigChange,
  updateConfig,
}) => {
  const handleConfigChange = onConfigChange || updateConfig;
  
  if (!handleConfigChange) {
    throw new Error('AdvancedSettings requires either onConfigChange or updateConfig prop');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Advanced Settings</h3>
      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={config.useDiffMatchPatch}
            onChange={(e) => handleConfigChange({ useDiffMatchPatch: e.target.checked })}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              Use Google Diff-Match-Patch Engine
            </span>
            <span className="text-xs text-gray-500">
              {config.useDiffMatchPatch 
                ? 'Enhanced diff algorithm with better performance and semantic cleanup' 
                : 'Custom LCS algorithm optimized for academic manuscripts'}
            </span>
          </div>
        </label>
      </div>
    </div>
  );
};
