import React, { useState } from 'react';
import { UploadedFile } from '../../types';
import { FileText, Image, Video, Music, Archive, Download, Trash2, Upload } from 'lucide-react';
import FileUploadOverlay from './FileUploadOverlay';

const FileManager = () => {
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: '1',
      name: 'Projektdokumentation.pdf',
      size: 2485760,
      type: 'application/pdf',
      uploadDate: new Date('2024-01-15'),
      url: '#'
    },
    {
      id: '2',
      name: 'Präsentation.pptx',
      size: 5242880,
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      uploadDate: new Date('2024-01-14'),
      url: '#'
    },
    {
      id: '3',
      name: 'screenshot.png',
      size: 1048576,
      type: 'image/png',
      uploadDate: new Date('2024-01-13'),
      url: '#'
    }
  ]);
  const [showUploadOverlay, setShowUploadOverlay] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
    return FileText;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const groupFilesByDate = (files: UploadedFile[]) => {
    const groups: { [key: string]: UploadedFile[] } = {};
    
    files.forEach(file => {
      const date = file.uploadDate.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(file);
    });
    
    return Object.entries(groups).sort(([a], [b]) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  };

  const handleUpload = (newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      url: URL.createObjectURL(file)
    }));
    
    setFiles(prev => [...uploadedFiles, ...prev]);
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Gestern';
    } else {
      return date.toLocaleDateString('de-DE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const groupedFiles = groupFilesByDate(files);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dateien
          </h2>
          <button
            onClick={() => setShowUploadOverlay(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Hochladen</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Dateien vorhanden
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Laden Sie Ihre erste Datei hoch, um zu beginnen.
            </p>
            <button
              onClick={() => setShowUploadOverlay(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Erste Datei hochladen
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedFiles.map(([dateString, dateFiles]) => (
              <div key={dateString}>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2">
                  {formatDate(new Date(dateString))}
                </h3>
                <div className="grid gap-4">
                  {dateFiles.map((file) => {
                    const IconComponent = getFileIcon(file.type);
                    return (
                      <div
                        key={file.id}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {file.name}
                            </h4>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatFileSize(file.size)}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {file.uploadDate.toLocaleTimeString('de-DE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Herunterladen"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Löschen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadOverlay && (
        <FileUploadOverlay
          onClose={() => setShowUploadOverlay(false)}
          onUpload={handleUpload}
        />
      )}
    </div>
  );
};

export default FileManager;