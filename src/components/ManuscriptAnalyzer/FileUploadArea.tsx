import React from 'react';
import { Upload, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/utils';

interface FileUploadAreaProps {
  label: string;
  onUpload: (content: string) => void;
  hasContent: boolean;
  value: string;
  errors: string[];
  warnings: string[];
  placeholder?: string;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  label,
  onUpload,
  hasContent,
  value,
  errors,
  warnings,
  placeholder
}) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className={cn(
      "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
      hasErrors 
        ? "border-red-300 bg-red-50" 
        : hasContent 
          ? "border-green-300 bg-green-50" 
          : "border-gray-300 hover:border-gray-400"
    )}>
      <div className="flex flex-col items-center space-y-2">
        {/* Status Icon */}
        {hasErrors ? (
          <AlertCircle className="h-8 w-8 text-red-500" />
        ) : hasContent ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : (
          <Upload className="h-8 w-8 text-gray-400" />
        )}

        {/* Title */}
        <h3 className="text-lg font-medium">{label}</h3>

        {/* Status Message */}
        <p className="text-sm text-gray-500">
          {hasErrors 
            ? "Please fix errors below" 
            : hasContent 
              ? "Document loaded successfully" 
              : "Click to upload or paste text"
          }
        </p>

        {/* Text Area */}
        <textarea
          className={cn(
            "w-full h-32 p-3 border rounded-md resize-none transition-colors",
            hasErrors 
              ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          )}
          placeholder={placeholder || `Paste ${label.toLowerCase()} text here...`}
          value={value}
          onChange={(e) => onUpload(e.target.value)}
        />

        {/* Error Messages */}
        {hasErrors && (
          <div className="w-full mt-2">
            <div className="text-left">
              <h4 className="text-sm font-medium text-red-800 mb-1">Errors:</h4>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {hasWarnings && !hasErrors && (
          <div className="w-full mt-2">
            <div className="text-left">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Warnings:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Character Count */}
        {value && (
          <div className="w-full text-right">
            <span className="text-xs text-gray-400">
              {value.length.toLocaleString()} characters
            </span>
          </div>
        )}
      </div>
    </div>
  );
};