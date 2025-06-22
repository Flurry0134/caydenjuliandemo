import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Chat, Message, ChatFile } from '../types';

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => Promise<string>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToCurrentChat: (message: Message) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<string>;
  isLoading: boolean;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

// Configuration - Update this URL to your backend API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const ChatsProvider = ({ children }: { children: ReactNode } ) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current user from localStorage
  const getCurrentUser = () => {
    const savedUser = localStorage.getItem('chatbot-user');
    return savedUser ? JSON.parse(savedUser) : null;
  };

  // Load chats from API
  const loadChats = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats?user_id=${user.id}`);
      if (response.ok) {
        const chatsData = await response.json();
        const formattedChats = chatsData.map((chat: any) => ({
          id: chat.id.toString(),
          title: chat.title,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.created_at), // API doesn't return updatedAt yet
          systemPrompt: chat.system_prompt,
          messages: [],
          files: []
        }));
        setChats(formattedChats);
        
        // Set current chat if none selected
        if (!currentChatId && formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        const formattedMessages = messagesData.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timeStamp: new Date(msg.created_at)
        }));
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, messages: formattedMessages }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Load documents for a specific chat
  const loadDocuments = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/documents`);
      if (response.ok) {
        const documentsData = await response.json();
        const formattedFiles = documentsData.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.filename,
          size: doc.filesize,
          type: doc.filename.split('.').pop() || 'unknown'
        }));
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, files: formattedFiles }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages and documents when current chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
      loadDocuments(currentChatId);
    }
  }, [currentChatId]);

  const createNewChat = async (): Promise<string> => {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Neuer Chat',
          user_id: parseInt(user.id)
        }),
      });

      if (response.ok) {
        const newChat = await response.json();
        const formattedChat = {
          id: newChat.id.toString(),
          title: newChat.title,
          createdAt: new Date(newChat.created_at),
          updatedAt: new Date(newChat.created_at),
          systemPrompt: newChat.system_prompt,
          messages: [],
          files: []
        };
        
        setChats(prevChats => [formattedChat, ...prevChats]);
        setCurrentChatId(formattedChat.id);
        return formattedChat.id;
      }
      throw new Error('Failed to create chat');
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          setCurrentChatId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  };

  const addMessageToCurrentChat = async (message: Message) => {
    if (!currentChatId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: message.role,
          content: message.content,
        }),
      });

      if (response.ok) {
        // Reload messages to get the updated list
        await loadMessages(currentChatId);
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.ok) {
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, title, updatedAt: new Date() }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  };

  const updateChatSystemPrompt = async (chatId: string, systemPrompt: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ system_prompt: systemPrompt }),
      });

      if (response.ok) {
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, systemPrompt, updatedAt: new Date() }
              : chat
          )
        );
      }
    } catch (error) {
      console.error('Error updating system prompt:', error);
      throw error;
    }
  };

  const addFilesToCurrentChat = async (files: File[]) => {
    if (!currentChatId) return;

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || 'Failed to upload file');
        }
      }
      
      // Reload documents after upload
      await loadDocuments(currentChatId);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const removeFileFromCurrentChat = async (fileId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok && currentChatId) {
        await loadDocuments(currentChatId);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  };

  const sendMessage = async (message: string): Promise<string> => {
    if (!currentChatId) throw new Error('No chat selected');

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          chat_id: parseInt(currentChatId),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Reload messages to get the updated conversation
        await loadMessages(currentChatId);
        return data.response;
      }
      throw new Error('Failed to send message');
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  return (
    <ChatsContext.Provider
      value={{
        chats,
        currentChatId,
        currentChat,
        createNewChat,
        selectChat,
        deleteChat,
        addMessageToCurrentChat,
        updateChatTitle,
        updateChatSystemPrompt,
        addFilesToCurrentChat,
        removeFileFromCurrentChat,
        sendMessage,
        isLoading
      }}
    >
      {children}
    </ChatsContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error("useChats must be used within a ChatsProvider");
  }
  return context;
};
