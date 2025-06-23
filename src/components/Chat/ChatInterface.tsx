import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useChats } from '../../hooks/useChats';
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
    updateChatSystemPrompt
  } = useChats();

  const [inputText, setInputText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  
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
    if (!inputText.trim() || isLoading) return;
    const messageContent = inputText;
    setInputText('');
    await sendMessage(messageContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
        <p className="text-gray-500">Wählen Sie einen Chat aus der Seitenleiste oder erstellen Sie einen neuen.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-gray-800">
      <Header
        isEditingTitle={isEditingTitle}
        newChatTitle={newChatTitle}
        onSetNewChatTitle={setNewChatTitle}
        onSetIsEditingTitle={setIsEditingTitle}
        onTitleSave={handleTitleSave}
        onOpenSettings={() => setShowSettings(true)}
        onOpenDeleteModal={() => setShowDeleteModal(true)}
      />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'assistant' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"><Bot size={20}/></div>}
            <div className={`max-w-xl rounded-2xl p-3 ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
            {message.sender === 'user' && <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"><User size={20}/></div>}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"><Bot size={20}/></div>
            <div className="rounded-2xl bg-gray-100 p-3 dark:bg-gray-700">
              <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nachricht eingeben..."
            className="w-full resize-none rounded-lg bg-gray-100 p-3 pr-12 dark:bg-gray-700 focus:outline-none"
            rows={1}
            disabled={isLoading}
          />
          <button type="submit" className="absolute right-3" disabled={isLoading || !inputText.trim()}>
            <Send size={20} className={isLoading || !inputText.trim() ? 'text-gray-400' : 'text-blue-600'} />
          </button>
        </form>
      </div>
      <DeleteChatModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { if (currentChat) deleteChat(currentChat.id); setShowDeleteModal(false); }}
        chatTitle={currentChat.title}
      />
      <ChatSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSystemPrompt={currentChat.systemPrompt || ''}
        onSaveSystemPrompt={(newPrompt) => { if (currentChat) updateChatSystemPrompt(currentChat.id, newPrompt); }}
      />
    </div>
  );
};
export default ChatInterface;
