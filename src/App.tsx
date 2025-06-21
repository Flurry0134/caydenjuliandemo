import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DarkModeProvider } from './hooks/useDarkMode';
import { ChatsProvider } from './hooks/useChats';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import ChatInterface from './components/Chat/ChatInterface';
import FileManager from './components/Files/FileManager';
import AdminSettings from './components/Settings/AdminSettings';

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('chat');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Laden...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatInterface />;
      case 'files':
        return <FileManager />;
      case 'settings':
        return user.role === 'admin' ? <AdminSettings /> : <ChatInterface />;
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col min-h-screen">
        {renderContent()}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <ChatsProvider>
          <AppContent />
        </ChatsProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
};

export default App;