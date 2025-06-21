import React from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle: string;
}

const DeleteChatModal = ({ isOpen, onClose, onConfirm, chatTitle }: DeleteChatModalProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="delete-chat-title"
        aria-describedby="delete-chat-description"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 
              id="delete-chat-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Chat löschen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Dialog schließen"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p 
            id="delete-chat-description"
            className="text-gray-600 dark:text-gray-400 mb-6"
          >
            Sind Sie sicher, dass Sie den Chat <strong>"{chatTitle}"</strong> endgültig löschen möchten? 
            Diese Aktion kann nicht rückgängig gemacht werden.
          </p>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              autoFocus
            >
              Abbrechen
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Löschen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteChatModal;