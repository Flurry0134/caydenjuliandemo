import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Chat, Message, ChatFile } from '../types'; // Stelle sicher, dass diese Typen korrekt definiert sind

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => Promise<string>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToCurrentChat: (message: Message) => void; // For immediate UI update of user message
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  addFilesToCurrentChat: (files: File[]) => Promise<void>; // Accepts File[] for upload
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<string>; // Sends message to LLM, gets response
  isLoading: boolean;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

// Configuration - WICHTIG: Ersetze dies mit deiner aktuellen ngrok-URL oder der finalen Backend-URL
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app';

export const ChatsProvider = ({ children }: { children: ReactNode } ) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For LLM response loading

  // Helper to get current user from localStorage (used for API calls)
  const getCurrentUser = useCallback(() => {
    const savedUser = localStorage.getItem('chatbot-user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

  // --- API Loading Functions ---

  // Loads chat list from API
  const loadChats = useCallback(async () => {
    const user = getCurrentUser();
    if (!user) {
      setChats([]); // Clear chats if no user
      setCurrentChatId(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats?user_id=${user.id}`);
      if (response.ok) {
        const chatsData = await response.json();
        const formattedChats: Chat[] = chatsData.map((chat: any) => ({
          id: chat.id.toString(),
          title: chat.title,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at || chat.created_at), // Use updated_at if available
          systemPrompt: chat.system_prompt || '',
          messages: [], // Messages will be loaded separately
          files: [],    // Files will be loaded separately
          preview: chat.preview || '', // Assuming backend might provide a preview
        }));
        setChats(formattedChats);

        // Try to restore current chat from localStorage, or select first if available
        const savedCurrentChatId = localStorage.getItem('chatbot-current-chat-id');
        if (savedCurrentChatId && formattedChats.some(chat => chat.id === savedCurrentChatId)) {
          setCurrentChatId(savedCurrentChatId);
        } else if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        } else {
          // If no chats, create a new one
          const newChatId = await createNewChat();
          setCurrentChatId(newChatId);
        }
      } else {
        console.error('Failed to load chats:', response.statusText);
        setChats([]);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
      setCurrentChatId(null);
    }
  }, [getCurrentUser]); // Added getCurrentUser to dependencies

  // Loads messages for a specific chat from API
  const loadMessages = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`);
      if (response.ok) {
        const messagesData = await response.json();
        const formattedMessages: Message[] = messagesData.map((msg: any) => ({
          id: msg.id.toString(),
          role: msg.role, // 'user' or 'assistant' (or 'bot' from old code)
          content: msg.content,
          timeStamp: new Date(msg.created_at) // Standardize on timeStamp
        }));

        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, messages: formattedMessages }
              : chat
          )
        );
      } else {
        console.error(`Failed to load messages for chat ${chatId}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error loading messages for chat ${chatId}:`, error);
    }
  }, []);

  // Loads documents (files) for a specific chat from API
  const loadDocuments = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/documents`);
      if (response.ok) {
        const documentsData = await response.json();
        const formattedFiles: ChatFile[] = documentsData.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.filename,
          size: doc.filesize,
          type: doc.filename.split('.').pop() || 'unknown' // Extract type from filename
        }));

        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, files: formattedFiles }
              : chat
          )
        );
      } else {
        console.error(`Failed to load documents for chat ${chatId}:`, response.statusText);
      }
    } catch (error) {
      console.error(`Error loading documents for chat ${chatId}:`, error);
    }
  }, []);

  // --- useEffect Hooks ---

  // Initial load of chats on component mount
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Load messages and documents when current chat changes
  useEffect(() => {
    if (currentChatId) {
      loadMessages(currentChatId);
      loadDocuments(currentChatId);
      localStorage.setItem('chatbot-current-chat-id', currentChatId); // Persist current chat ID
    } else {
      localStorage.removeItem('chatbot-current-chat-id');
    }
  }, [currentChatId, loadMessages, loadDocuments]);

  // --- Chat Management Functions ---

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
          title: 'Neuer Chat', // Default title
          user_id: parseInt(user.id)
        }),
      });

      if (response.ok) {
        const newChatData = await response.json();
        const newChat: Chat = {
          id: newChatData.id.toString(),
          title: newChatData.title,
          createdAt: new Date(newChatData.created_at),
          updatedAt: new Date(newChatData.updated_at || newChatData.created_at),
          systemPrompt: newChatData.system_prompt || '',
          messages: [],
          files: [],
          preview: newChatData.preview || '',
        };

        setChats(prevChats => [newChat, ...prevChats]);
        setCurrentChatId(newChat.id);
        return newChat.id;
      }
      throw new Error('Failed to create chat on backend');
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
        setChats(prevChats => {
          const updatedChats = prevChats.filter(chat => chat.id !== chatId);

          // Logic from old code: select new current chat if deleted one was active
          if (currentChatId === chatId) {
            if (updatedChats.length > 0) {
              setCurrentChatId(updatedChats[0].id);
            } else {
              setCurrentChatId(null);
            }
          }
          return updatedChats;
        });
      } else {
        console.error(`Failed to delete chat ${chatId}:`, response.statusText);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  };

  // This function is for immediate UI update of the user's message
  const addMessageToCurrentChat = (message: Message) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        // Prevent duplicate if message already exists (e.g., after API sync)
        if (chat.messages.some(msg => msg.id === message.id)) {
          return chat;
        }
        const updatedMessages = [...chat.messages, message];
        const preview = message.role === 'user'
          ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
          : chat.preview;

        // Auto-generate title from first user message if still default
        let title = chat.title;
        if (title === 'Neuer Chat' && message.role === 'user') {
          title = message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '');
        }

        return {
          ...chat,
          title,
          messages: updatedMessages,
          updatedAt: new Date(),
          preview
        };
      }
      return chat;
    }));
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
      } else {
        console.error(`Failed to update chat title for ${chatId}:`, response.statusText);
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
      } else {
        console.error(`Failed to update system prompt for ${chatId}:`, response.statusText);
      }
    } catch (error) {
      console.error('Error updating system prompt:', error);
      throw error;
    }
  };

  const addFilesToCurrentChat = async (files: File[]) => {
    if (!currentChatId) throw new Error('No chat selected to add files to.');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/documents`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Failed to upload file: ${file.name}`);
        }
      }
      // Reload documents after all uploads are complete
      await loadDocuments(currentChatId);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };

  const removeFileFromCurrentChat = async (fileId: string) => {
    if (!currentChatId) return; // Should not happen if a file is selected

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${fileId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload documents to reflect changes from backend
        await loadDocuments(currentChatId);
      } else {
        console.error(`Failed to remove file ${fileId}:`, response.statusText);
      }
    } catch (error) {
      console.error('Error removing file:', error);
      throw error;
    }
  };

  const sendMessage = async (messageContent: string): Promise<string> => {
    if (!currentChatId) throw new Error('No chat selected to send message');

    setIsLoading(true);
    try {
      // First, send the user's message to the backend to be stored
      const userMessageResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: messageContent }),
      });

      if (!userMessageResponse.ok) {
        throw new Error('Failed to save user message to backend');
      }

      // Then, request completion from the LLM
      const completionResponse = await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          chat_id: parseInt(currentChatId),
        }),
      });

      if (completionResponse.ok) {
        const data = await completionResponse.json();
        // Reload all messages for the current chat to include both user's and AI's response
        await loadMessages(currentChatId);
        return data.response; // Return AI's response content
      }
      throw new Error('Failed to get AI completion');
    } catch (error) {
      console.error('Error sending message or getting completion:', error);
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
