import React from 'react';
import type { AppConfig } from '../../types';

interface AdvancedSettingsProps {
  config: AppConfig;
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
    </div>
  );
};
