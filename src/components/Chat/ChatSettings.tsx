import React, { useState, useEffect } from 'react';
import { X, FileText, Upload, Trash2, Settings } from 'lucide-react';
import { useChats } from '../../hooks/useChats';
import { ChatFile } from '../../types';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatSettings = ({ isOpen, onClose }: ChatSettingsProps) => {
  const { currentChat, updateChatSystemPrompt, addFilesToCurrentChat, removeFileFromCurrentChat } = useChats();
  const [systemPrompt, setSystemPrompt] = useState('');
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (currentChat) {
      setSystemPrompt(currentChat.systemPrompt || '');
    }
  }, [currentChat]);

  if (!isOpen || !currentChat) return null;

  const handleSaveSystemPrompt = () => {
    updateChatSystemPrompt(currentChat.id, systemPrompt);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleFileUpload = (files: File[]) => {
    const chatFiles: ChatFile[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      url: URL.createObjectURL(file)
    }));
    
    addFilesToCurrentChat(chatFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    return FileText; // Simplified - using one icon for all files
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Chat-Einstellungen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            {/* System Prompt Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                System-Prompt
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Definieren Sie das Verhalten und die Persönlichkeit der KI für diesen Chat.
              </p>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                onBlur={handleSaveSystemPrompt}
                placeholder="Sie sind ein hilfsreicher Assistent, der..."
                className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Änderungen werden automatisch gespeichert
              </p>
            </div>

            {/* Files Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Chat-Dateien
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Laden Sie Dateien hoch, die für diesen Chat verfügbar sein sollen.
              </p>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors mb-4 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Dateien hier ablegen oder klicken zum Auswählen
                </p>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                >
                  Dateien auswählen
                </label>
              </div>

              {/* File List */}
              {currentChat.files.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hochgeladene Dateien ({currentChat.files.length})
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {currentChat.files.map((file) => {
                      const IconComponent = getFileIcon(file.type);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFileFromCurrentChat(file.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Datei entfernen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-colors"
          >
            Fertig
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;