import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Chat, Message, ChatFile } from '../types';

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  isLoading: boolean;
  createNewChat: () => Promise<void>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  addMessageToCurrentChat: (message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<void>;
  // Platzhalter für Datei-Funktionen, falls benötigt
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app';

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lädt die Chat-Liste vom Server
  const fetchChats = useCallback(async () => {
    if (!user) {
      setChats([]);
      setCurrentChatId(null);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/chats`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (response.ok) {
        const chatsData: any[] = await response.json();
        
        // KORREKTUR: Robuste Umwandlung mit Standardwerten
        const formattedChats: Chat[] = chatsData.map(chat => ({
          id: chat.id.toString(),
          title: chat.title || 'Unbenannter Chat',
          messages: [], // Wird separat geladen
          files: [],    // Wird separat geladen
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at), // Dieses Feld ist jetzt immer vorhanden
          systemPrompt: chat.system_prompt || '',
          preview: '',
        }));

        setChats(formattedChats);
        
        // Wähle einen Chat aus
        const savedCurrentChatId = localStorage.getItem('chatbot-current-chat-id');
        if (savedCurrentChatId && formattedChats.some(c => c.id === savedCurrentChatId)) {
            setCurrentChatId(savedCurrentChatId);
        } else if (formattedChats.length > 0) {
            setCurrentChatId(formattedChats[0].id);
        } else {
            setCurrentChatId(null);
        }
      }
    } catch (e) { console.error("Fehler beim Laden der Chats:", e); }
  }, [user]);

  // Lädt Nachrichten für einen spezifischen Chat
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if(response.ok) {
        const messagesData: any[] = await response.json();
        const formattedMessages = messagesData.map(msg => ({
            id: msg.id.toString(),
            content: msg.content,
            sender: msg.role, // 'user' oder 'assistant'
            timeStamp: new Date(msg.created_at)
        }));
        // Update der Nachrichten im richtigen Chat-Objekt
        setChats(prev => prev.map(c => c.id === chatId ? {...c, messages: formattedMessages} : c));
      }
    } catch(e) { console.error("Fehler beim Laden der Nachrichten:", e); }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('chatbot-current-chat-id', currentChatId);
      const chat = chats.find(c => c.id === currentChatId);
      // Lade Nachrichten nur, wenn der Chat existiert und die Nachrichtenliste leer ist
      if (chat && chat.messages.length === 0) {
        fetchMessages(currentChatId);
      }
    } else {
      localStorage.removeItem('chatbot-current-chat-id');
    }
  }, [currentChatId, chats, fetchMessages]);

  const selectChat = (chatId: string) => { setCurrentChatId(chatId); };

  const createNewChat = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ title: 'Neuer Chat', user_id: parseInt(user.id) }),
      });
      // Lade die Chat-Liste neu, um den neuen Chat ganz oben anzuzeigen
      await fetchChats();
    } catch (e) { console.error("Fehler beim Erstellen des Chats:", e); }
  };
  
  const addMessageToCurrentChat = (message: Message) => {
    if (!currentChatId) return;
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: [...chat.messages, message] }
        : chat
    ));
  };
  
  const sendMessage = async (messageContent: string) => {
    if (!currentChatId) return;
    setIsLoading(true);
    
    // Optimistisches Update für sofortiges Feedback
    addMessageToCurrentChat({ id: `temp-${Date.now()}`, content: messageContent, sender: 'user', timeStamp: new Date() });
    
    try {
      await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ chat_id: parseInt(currentChatId), message: messageContent }),
      });
      // Nachdem die KI geantwortet hat, laden wir den gesamten Nachrichtenverlauf neu
      await fetchMessages(currentChatId);
    } catch (e) {
      console.error("Fehler beim Senden der Nachricht:", e);
      addMessageToCurrentChat({ id: `error-${Date.now()}`, content: "Fehler: Konnte keine Antwort empfangen.", sender: 'bot', timeStamp: new Date() });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => { /* ... API Call ... */ };
  const updateChatTitle = async (chatId: string, title: string) => { /* ... API Call ... */ };
  const updateChatSystemPrompt = async (chatId: string, systemPrompt: string) => { /* ... API Call ... */ };
  const addFilesToCurrentChat = async (files: File[]) => { /* ... API Call ... */ };
  const removeFileFromCurrentChat = async (fileId: string) => { /* ... API Call ... */ };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;
  const messages = currentChat?.messages || []; // Nachrichten direkt aus dem Chat-Objekt holen

  return (
    <ChatsContext.Provider value={{
      chats, currentChatId, currentChat, messages, isLoading, createNewChat,
      selectChat, deleteChat, sendMessage, addMessageToCurrentChat, updateChatTitle,
      updateChatSystemPrompt, addFilesToCurrentChat, removeFileFromCurrentChat
    }}>
      {children}
    </ChatsContext.Provider>
  );
};

export const useChats = () => {
  const context = useContext(ChatsContext);
  if (context === undefined) { throw new Error('useChats must be used within a ChatsProvider'); }
  return context;
};
