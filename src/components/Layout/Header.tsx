import React, { useState } from 'react';
import { ExportFormat } from '../../types';
import { Download, ChevronDown, Settings } from 'lucide-react';

interface HeaderProps {
  onExport: (format: ExportFormat) => void;
  onOpenSettings: () => void;
}

const Header = ({ 
  onExport,
  onOpenSettings
}: HeaderProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportFormats: { format: ExportFormat; label: string }[] = [
    { format: 'pdf', label: 'Als PDF herunterladen' },
    { format: 'txt', label: 'Als TXT herunterladen' },
    { format: 'json', label: 'Als JSON herunterladen' }
  ];

  return (
    <div className="flex items-center space-x-4">
      {/* Chat Settings */}
      <button
        onClick={onOpenSettings}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="Chat-Einstellungen"
      >
        <Settings className="w-4 h-4" />
        <span>Einstellungen</span>
      </button>

      {/* Export Menu */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Chat exportieren</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showExportMenu && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            {exportFormats.map((format) => (
              <button
                key={format.format}
                onClick={() => {
                  onExport(format.format);
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg transition-colors"
              >
                {format.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;