import React, { useState } from 'react';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { useContext } from 'react';
import { ManuscriptAnalyzerContext } from '@/contexts/ManuscriptAnalyzerContext';

export const AdvancedSettings: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config, updateConfig } = useContext(ManuscriptAnalyzerContext);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-3 mb-4">
      <button
        onClick={toggleOpen}
        className="flex items-center justify-between w-full text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <Settings className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Advanced Settings</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="diff-engine-toggle" className="text-sm text-gray-600">
                Diff Engine
              </label>
              <p className="text-xs text-gray-500">
                Choose between Google's diff-match-patch (faster) or custom LCS algorithm (more accurate)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">LCS</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="diff-engine-toggle"
                  type="checkbox"
                  checked={config.useDiffMatchPatch}
                  onChange={(e) => updateConfig({ useDiffMatchPatch: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-xs text-gray-500">DMP</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
