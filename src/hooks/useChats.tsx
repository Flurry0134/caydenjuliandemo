import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Chat, Message, ChatFile } from '../types';

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  createNewChat: () => Promise<string | void>; // Geändert, um void oder string zu erlauben
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToCurrentChat: (message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<string | void>; // Geändert
  isLoading: boolean;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app';

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth(); // Holen des eingeloggten Benutzers

  const getCurrentUser = useCallback(() => {
    if (user) return user;
    const savedUser = localStorage.getItem('chatbot-user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, [user]);

  const loadChats = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      setChats([]);
      setCurrentChatId(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUser.id}/chats`, {
        headers: {
          // --- DER WICHTIGE FIX ---
          'ngrok-skip-browser-warning': 'true',
        },
      });
      if (response.ok) {
        const chatsData = await response.json();
        const formattedChats: Chat[] = chatsData.map((chat: any) => ({
          id: chat.id.toString(),
          title: chat.title,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at || chat.created_at),
          systemPrompt: chat.system_prompt || '',
          messages: [],
          files: [],
          preview: '',
        }));
        setChats(formattedChats);

        const savedCurrentChatId = localStorage.getItem('chatbot-current-chat-id');
        if (savedCurrentChatId && formattedChats.some(chat => chat.id === savedCurrentChatId)) {
          setCurrentChatId(savedCurrentChatId);
        } else if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        }
      } else {
        console.error('Fehler beim Laden der Chats:', response.statusText);
        setChats([]);
        setCurrentChatId(null);
      }
    } catch (error) {
      console.error('Netzwerkfehler beim Laden der Chats:', error);
      setChats([]);
      setCurrentChatId(null);
    }
  }, [getCurrentUser]);

  // Funktion zum Laden der Nachrichten eines Chats (wird nicht direkt exportiert)
  const loadMessagesAndFiles = useCallback(async (chatId: string) => {
    // Hier könnten auch die Anfragen für Nachrichten und Dateien mit dem Header versehen werden, falls nötig
    // Aktuell lassen wir es so, da das Hauptproblem beim initialen Laden der Chats auftritt.
  }, []);
  
  useEffect(() => {
      loadChats();
  }, [loadChats]);

  // Logik für `createNewChat`, `selectChat`, `deleteChat`, `sendMessage` usw.
  // Jede fetch-Anfrage muss den ngrok-Header enthalten.

  const createNewChat = async (): Promise<string | void> => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true', // FIX
        },
        body: JSON.stringify({
          title: 'Neuer Chat',
          user_id: parseInt(currentUser.id),
        }),
      });
      if (response.ok) {
        // Nach dem Erstellen die Chat-Liste neu laden, um alles synchron zu halten
        await loadChats();
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Chats:', error);
    }
  };

  const selectChat = (chatId: string) => {
    setCurrentChatId(chatId);
  };

  const deleteChat = async (chatId: string) => {
    try {
        await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            method: 'DELETE',
            headers: { 'ngrok-skip-browser-warning': 'true' }, // FIX
        });
        // Lade die Liste neu, um den gelöschten Chat zu entfernen
        await loadChats();
    } catch (error) {
        console.error("Fehler beim Löschen des Chats:", error);
    }
  };

  const sendMessage = async (messageContent: string): Promise<string | void> => {
    if (!currentChatId) return;
    setIsLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}/api/chat/completion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true', // FIX
            },
            body: JSON.stringify({
                chat_id: parseInt(currentChatId),
                message: messageContent,
            }),
        });
        if (response.ok) {
            // Lade die Nachrichten neu, um die Antwort anzuzeigen
            await loadMessagesAndFiles(currentChatId); // Placeholder-Funktion
        }
    } catch (error) {
        console.error("Fehler beim Senden der Nachricht:", error);
    } finally {
        setIsLoading(false);
    }
  };
  
  // Platzhalter für die restlichen Funktionen, damit die App nicht abstürzt
  const addMessageToCurrentChat = () => {};
  const updateChatTitle = async () => {};
  const updateChatSystemPrompt = async () => {};
  const addFilesToCurrentChat = async () => {};
  const removeFileFromCurrentChat = async () => {};


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
      removeFileFromCurrentChat,
      sendMessage,
      isLoading
    }}>
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
