import React from 'react';
import { Settings } from 'lucide-react';
import type { AppConfig } from '../../types';

interface AdvancedSettingsProps {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ config, updateConfig }) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Settings className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 font-medium">Advanced Settings</span>
      </div>

      <div className="flex items-center space-x-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.useDiffMatchPatch}
            onChange={(e) => updateConfig({ useDiffMatchPatch: e.target.checked })}
            className="rounded"
          />
          <span className="ml-2 text-sm text-gray-600">Use Google Diff-Match-Patch Engine</span>
        </label>
      </div>
    </div>
  );
};
