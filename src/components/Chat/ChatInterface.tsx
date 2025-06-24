import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Bot, User, Trash2, X, FileText, Loader2 } from 'lucide-react';
import { useChats } from '../../hooks/useChats';
import { ExportFormat } from '../../types';
import Header from '../Layout/Header';
import DeleteChatModal from './DeleteChatModal';
import ChatSettings from './ChatSettings';

const ChatInterface: React.FC = () => {
  const {
    currentChat,
    messages,
    isLoading,
    sendMessage,
    deleteChat,
    updateChatTitle,
    updateChatSystemPrompt,
    addFilesToCurrentChat,
    removeFileFromCurrentChat,
  } = useChats();

  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentChat) {
      setNewChatTitle(currentChat.title);
    }
  }, [currentChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if ((!inputText.trim() && uploadedFiles.length === 0) || !currentChat || isLoading) return;
    
    const messageContent = inputText;
    setInputText('');

    if (uploadedFiles.length > 0) {
      await addFilesToCurrentChat(uploadedFiles);
      setUploadedFiles([]);
    }
    
    if (messageContent.trim()) {
      await sendMessage(messageContent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
        setUploadedFiles(prev => [...prev, ...files]);
    }
    if(e.target) e.target.value = ''; // Erlaubt erneutes Hochladen derselben Datei
  };

  const handleTitleSave = () => {
    if (currentChat && newChatTitle.trim() && newChatTitle.trim() !== currentChat.title) {
      updateChatTitle(currentChat.id, newChatTitle.trim());
    }
    setIsEditingTitle(false);
  };

  if (!currentChat) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <Bot className="mb-4 h-16 w-16 text-gray-400" />
        <h3 className="text-lg font-medium">Kein Chat ausgewählt</h3>
        <p className="text-gray-500">Wählen Sie einen Chat aus oder erstellen Sie einen neuen.</p>
      </div>
    );
  }

  // Ab hier deine originale, schöne Render-Logik
  return (
    <div className="flex flex-col h-full">
      <Header
        isEditingTitle={isEditingTitle}
        newChatTitle={newChatTitle}
        onSetNewChatTitle={setNewChatTitle}
        onSetIsEditingTitle={setIsEditingTitle}
        onTitleSave={handleTitleSave}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDeleteModal={() => setShowDeleteModal(true)}
        chatTitle={currentChat.title}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
            <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender !== 'user' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600"><Bot className="h-4 w-4 text-white" /></div>}
                <div className={`max-w-xl rounded-2xl p-3 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'}`}>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                </div>
                {message.sender === 'user' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><User className="h-4 w-4 text-white" /></div>}
            </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600"><Bot className="h-4 w-4 text-white" /></div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-700">
                    <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 p-6 dark:border-gray-700">
        {/* Anzeige für bereits hochgeladene Dateien */}
        {currentChat.files && currentChat.files.length > 0 && (
            <div className="mb-4 space-y-2">
                {currentChat.files.map(file => (
                    <div key={file.id} className="flex items-center justify-between rounded-lg bg-gray-100 p-2 text-sm dark:bg-gray-700">
                        <div className="flex items-center gap-2">
                           <FileText className="h-4 w-4 text-gray-500" />
                           <span>{file.name}</span>
                        </div>
                        <button onClick={() => removeFileFromCurrentChat(file.id)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                    </div>
                ))}
            </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end space-x-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl p-3 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300">
                <Paperclip className="h-5 w-5" />
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            <div className="relative flex-1">
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nachricht eingeben..."
                className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                rows={1} disabled={isLoading} />
            </div>
            <button type="submit" disabled={!inputText.trim() && uploadedFiles.length === 0 || isLoading} className="rounded-xl bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 dark:disabled:bg-gray-600">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
        </form>
      </div>
      
      <DeleteChatModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={() => { if(currentChat) deleteChat(currentChat.id); setShowDeleteModal(false); }} chatTitle={currentChat.title} />
      <ChatSettings isOpen={showSettings} onClose={() => setShowSettings(false)} currentSystemPrompt={currentChat.systemPrompt} onSaveSystemPrompt={(p) => { if(currentChat) updateChatSystemPrompt(currentChat.id, p); }} />
    </div>
  );
};

export default ChatInterface;

