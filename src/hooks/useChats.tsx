import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Chat, Message, ChatFile } from '../types';

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => string;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessageToCurrentChat: (message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => void;
  addFilesToCurrentChat: (files: ChatFile[]) => void;
  removeFileFromCurrentChat: (fileId: string) => void;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Load chats from localStorage on mount
  useEffect(() => {
    const savedChats = localStorage.getItem('chatbot-chats');
    const savedCurrentChatId = localStorage.getItem('chatbot-current-chat-id');
    
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
        files: chat.files || [],
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
      setChats(parsedChats);
      
      if (savedCurrentChatId && parsedChats.some((chat: Chat) => chat.id === savedCurrentChatId)) {
        setCurrentChatId(savedCurrentChatId);
      } else if (parsedChats.length > 0) {
        setCurrentChatId(parsedChats[0].id);
      }
    } else {
      // Create initial chat if none exists
      const initialChatId = createInitialChat();
      setCurrentChatId(initialChatId);
    }
  }, []);

  // Save chats to localStorage whenever chats change
  useEffect(() => {
    // --- KORREKTUR 1: Sicherstellen, dass localStorage geleert wird, wenn alle Chats gelöscht sind ---
    if (chats.length > 0) {
      localStorage.setItem('chatbot-chats', JSON.stringify(chats));
    } else {
      // Wenn keine Chats mehr da sind, auch den Speicher leeren
      localStorage.removeItem('chatbot-chats');
      localStorage.removeItem('chatbot-current-chat-id');
    }
  }, [chats]);

  // Save current chat ID to localStorage
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('chatbot-current-chat-id', currentChatId);
    } else {
      // Wenn kein Chat ausgewählt ist, auch den Speicher leeren
      localStorage.removeItem('chatbot-current-chat-id');
    }
  }, [currentChatId]);

  const createInitialChat = (): string => {
    const initialMessage: Message = {
      id: '1',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?',
      sender: 'bot',
      timestamp: new Date()
    };

    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'Neuer Chat',
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
      preview: 'Hallo! Ich bin Ihr KI-Assistent...',
      files: []
    };

    setChats([newChat]);
    return newChat.id;
  };

  const createNewChat = (): string => {
    const initialMessage: Message = {
      id: Date.now().toString(),
      content: 'Hallo! Ich bin Ihr KI-Assistent. Wie kann ich Ihnen heute helfen?',
      sender: 'bot',
      timestamp: new Date()
    };

    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'Neuer Chat',
      messages: [initialMessage],
      createdAt: new Date(),
      updatedAt: new Date(),
      preview: 'Hallo! Ich bin Ihr KI-Assistent...',
      files: []
    };

    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  // --- KORREKTUR 2: Die deleteChat-Funktion wie von Ihnen beschrieben angepasst ---
  const deleteChat = (chatId: string) => {
    setChats(prev => {
      const updatedChats = prev.filter(chat => chat.id !== chatId);
      
      // Wenn der aktuell ausgewählte Chat gelöscht wird...
      if (currentChatId === chatId) {
        if (updatedChats.length > 0) {
          // ...wähle den ersten verbleibenden Chat aus.
          setCurrentChatId(updatedChats[0].id);
        } else {
          // ...oder setze die Auswahl auf null, wenn keine Chats mehr übrig sind.
          setCurrentChatId(null);
        }
      }
      
      return updatedChats;
    });
  };

  const addMessageToCurrentChat = (message: Message) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        const updatedMessages = [...chat.messages, message];
        const preview = message.sender === 'user' 
          ? message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '')
          : chat.preview;
        
        // Auto-generate title from first user message if still default
        let title = chat.title;
        if (title === 'Neuer Chat' && message.sender === 'user') {
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

  const updateChatTitle = (chatId: string, title: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, title, updatedAt: new Date() }
        : chat
    ));
  };

  const updateChatSystemPrompt = (chatId: string, systemPrompt: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId 
        ? { ...chat, systemPrompt, updatedAt: new Date() }
        : chat
    ));
  };

  const addFilesToCurrentChat = (files: ChatFile[]) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, files: [...chat.files, ...files], updatedAt: new Date() }
        : chat
    ));
  };

  const removeFileFromCurrentChat = (fileId: string) => {
    if (!currentChatId) return;

    setChats(prev => prev.map(chat => 
      chat.id === currentChatId 
        ? { ...chat, files: chat.files.filter(file => file.id !== fileId), updatedAt: new Date() }
        : chat
    ));
  };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  return (
    <ChatsContext.Provider value={{
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
      removeFileFromCurrentChat
    }}>
      {children}
    </ChatsContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatsContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatsProvider');
  }
  return context;
};
