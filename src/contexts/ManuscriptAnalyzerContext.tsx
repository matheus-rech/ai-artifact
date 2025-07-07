import React, { createContext, useState, useCallback, ReactNode } from 'react';
import type { AppConfig, AgentMode } from '../types';

interface ManuscriptAnalyzerContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

const defaultConfig: AppConfig = {
  useClaudeAPI: process.env['NEXT_PUBLIC_USE_CLAUDE_API'] === 'true',
  agentMode: (process.env['NEXT_PUBLIC_AGENT_MODE'] as AgentMode) || 'heuristic',
  apiTimeout: parseInt(process.env['NEXT_PUBLIC_API_TIMEOUT'] || '30000', 10),
  maxRetries: parseInt(process.env['NEXT_PUBLIC_MAX_RETRIES'] || '3', 10),
  maxTextLength: 1000000,
  minDiffLength: 3,
  useDiffMatchPatch: true, // Default to the more efficient algorithm
};

export const ManuscriptAnalyzerContext = createContext<ManuscriptAnalyzerContextType>({
  config: defaultConfig,
  updateConfig: () => {},
});

interface ManuscriptAnalyzerProviderProps {
  children: ReactNode;
}

export const ManuscriptAnalyzerProvider: React.FC<ManuscriptAnalyzerProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  const updateConfig = useCallback((updates: Partial<AppConfig>): void => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <ManuscriptAnalyzerContext.Provider value={{ config, updateConfig }}>
      {children}
    </ManuscriptAnalyzerContext.Provider>
  );
};
