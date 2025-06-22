import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Bot, User, Trash2, X, FileText, Loader2 } from 'lucide-react';
import { useChats } from '../../hooks/useChats'; // Assuming this path is correct
import { Message, ExportFormat, ChatFile } from '../../types'; // Assuming these types are defined here
import Header from '../Layout/Header'; // Assuming this component exists
import FileUploadOverlay from '../Files/FileUploadOverlay'; // Assuming this component exists, though direct file upload is now preferred
import DeleteChatModal from './DeleteChatModal'; // Assuming this component exists
import ChatSettings from './ChatSettings'; // Assuming this component exists

const ChatInterface: React.FC = () => {
  const {
    currentChat,
    addMessageToCurrentChat, // Used for local message display before AI response
    updateChatTitle,
    updateChatSystemPrompt,
    addFilesToCurrentChat,
    removeFileFromCurrentChat,
    sendMessage, // This is the core function for sending message to AI
    isLoading
  } = useChats();

  const [inputText, setInputText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]); // Files to be sent with the next message
  const [showUploadOverlay, setShowUploadOverlay] = useState(false); // Kept for potential future use, but direct upload is primary
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // States for title editing (from old code)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState(currentChat?.title || '');

  // State for system prompt (from new code, managed here for passing to ChatSettings)
  const [systemPrompt, setSystemPrompt] = useState(currentChat?.systemPrompt || '');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = currentChat?.messages || [];

  // --- useEffects ---

  // Synchronize newChatTitle with currentChat.title
  useEffect(() => {
    if (currentChat) {
      setNewChatTitle(currentChat.title);
      setSystemPrompt(currentChat.systemPrompt || ''); // Sync system prompt
    }
  }, [currentChat]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]); // Trigger scroll on messages or loading state change

  // Adjust textarea height
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.overflowY = 'hidden';
    const style = window.getComputedStyle(textarea);
    const paddingTop = parseFloat(style.paddingTop);
    const paddingBottom = parseFloat(style.paddingBottom);
    const lineHeight = parseFloat(style.lineHeight);
    const maxHeightFor8Lines = (8 * lineHeight) + paddingTop + paddingBottom;
    const currentScrollHeight = textarea.scrollHeight;

    if (currentScrollHeight > maxHeightFor8Lines) {
      textarea.style.height = `${maxHeightFor8Lines}px`;
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.height = `${currentScrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText, adjustTextareaHeight]);

  // --- Handlers ---

  const handleSend = async () => {
    if (!inputText.trim() || !currentChat || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user', // Using 'role' as per new code's Message type
      content: inputText,
      timeStamp: new Date() // Using 'timeStamp' as per new code's Message type
    };

    // Add user message to local state immediately for quick UI update
    addMessageToCurrentChat(userMessage);
    setInputText('');
    adjustTextareaHeight(); // Reset textarea height after clearing text

    try {
      // Upload files if any, before sending the message
      if (uploadedFiles.length > 0) {
        await addFilesToCurrentChat(uploadedFiles);
        setUploadedFiles([]); // Clear files after they are added to the chat context
      }

      // Send message to the AI and get response
      const aiResponse = await sendMessage(inputText);

      // Update chat title if this is the first message (from new code logic)
      if (currentChat.messages.length === 0 && aiResponse) { // Check aiResponse to ensure a valid response was received
        const newTitle = inputText.length > 40
          ? inputText.substring(0, 40) + '...'
          : inputText;
        await updateChatTitle(currentChat.id, newTitle);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Implement user-facing error message
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
    }
    e.target.value = ''; // Clear input to allow re-uploading same file
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleTitleSave = () => {
    if (currentChat && newChatTitle.trim() !== '' && newChatTitle.trim() !== currentChat.title) {
      updateChatTitle(currentChat.id, newChatTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleDeleteChat = () => {
    if (currentChat) {
      deleteChat(currentChat.id); // Assuming deleteChat is available from useChats
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!currentChat) return;
    const data = messages.map(msg => ({ role: msg.role, content: msg.content, timeStamp: msg.timeStamp.toISOString() }));
    let content = '';
    let mimeType = '';
    let filename = '';

    switch (format) {
      case 'json': content = JSON.stringify(data, null, 2); mimeType = 'application/json'; filename = 'chat-export.json'; break;
      case 'txt': content = data.map(msg => `[${msg.timeStamp}] ${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}`).join('\n\n'); mimeType = 'text/plain'; filename = 'chat-export.txt'; break;
      case 'pdf': alert('PDF export would be implemented here.'); return; // Placeholder
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Render Logic ---

  if (!currentChat) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Kein Chat ausgewählt
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Wählen Sie einen Chat aus der Seitenleiste oder erstellen Sie einen neuen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleTitleSave();
                  }
                }}
                className="text-xl font-semibold bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-700 text-gray-900 dark:text-white"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 dark:text-white cursor-pointer"
                onClick={() => setIsEditingTitle(true)}
              >
                {currentChat.title}
              </h2>
            )}
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Chat löschen"
              title="Chat löschen"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <Header
            onExport={handleExport}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>
      </div>

      {/* Chat Info Bar */}
      {(currentChat.systemPrompt || currentChat.files.length > 0) && (
        <div className="px-6 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center text-sm text-blue-700 dark:text-blue-300">
            {currentChat.systemPrompt && (<span>System-Prompt aktiv</span>)}
            {currentChat.systemPrompt && currentChat.files.length > 0 && (<span className="mx-2">•</span>)}
            {currentChat.files.length > 0 && (<span>{currentChat.files.length} Datei{currentChat.files.length !== 1 ? 'en' : ''} hochgeladen</span>)}
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-r from-purple-600 to-blue-600'}`}>
                {message.role === 'user' ? (<User className="w-4 h-4 text-white" />) : (<Bot className="w-4 h-4 text-white" />)}
              </div>
              <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl max-w-full ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && ( // Use isLoading from new hook
          <div className="flex justify-start">
            <div className="flex space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-6">
        {uploadedFiles.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-600">
                  <Paperclip className="w-3 h-3" />
                  <span className="max-w-32 truncate">{file.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({formatFileSize(file.size)})</span>
                  <button onClick={() => removeUploadedFile(index)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="Datei entfernen">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-end space-x-4"> {/* Changed to items-end for better textarea alignment */}
          <div className="relative">
            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors" title="Datei anhängen">
              <Paperclip className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileUpload} className="hidden" accept="*/*" />
          </div>
          <div className="flex-1 relative">
           <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nachricht eingeben..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none min-h-[48px] transition-all duration-200 custom-scrollbar"
              rows={1}
              disabled={isLoading} // Disable input when loading
            />
          </div>
          <button onClick={handleSend} disabled={!inputText.trim() || isLoading} className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-xl transition-colors disabled:cursor-not-allowed">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Drücken Sie Enter zum Senden, Shift + Enter für eine neue Zeile</p>
      </div>

      {/* Documents Section (from new code, displaying already uploaded files) */}
      {currentChat.files && currentChat.files.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hochgeladene Dokumente:
          </h3>
          <div className="space-y-2">
            {currentChat.files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-md"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => removeFileFromCurrentChat(file.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUploadOverlay && (<FileUploadOverlay onClose={() => setShowUploadOverlay(false)} onUpload={(files) => { console.log('Files uploaded:', files); setShowUploadOverlay(false); }} />)}
      <DeleteChatModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteChat} chatTitle={currentChat.title} />
      {/* Pass system prompt related props to ChatSettings */}
      <ChatSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSystemPrompt={systemPrompt}
        onSaveSystemPrompt={async (newPrompt) => {
          if (currentChat) {
            await updateChatSystemPrompt(currentChat.id, newPrompt);
            setSystemPrompt(newPrompt); // Update local state after successful save
          }
        }}
      />
    </div>
  );
};

export default ChatInterface;
