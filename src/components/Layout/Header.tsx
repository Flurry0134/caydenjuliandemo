import React, { useState } from 'react';
import { Language, ExportFormat } from '../../types';
import { Languages, Download, ChevronDown, Settings } from 'lucide-react';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onExport: (format: ExportFormat) => void;
  onOpenSettings: () => void;
}

const Header = ({ 
  language, 
  setLanguage, 
  onExport,
  onOpenSettings
}: HeaderProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const languages = [
    { code: 'de' as Language, label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en' as Language, label: 'English', flag: '🇺🇸' }
  ];

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

      {/* Language Switcher */}
      <div className="relative">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
        <Languages className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>

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