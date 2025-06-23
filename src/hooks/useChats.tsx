import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './useAuth';
import { Chat, Message, ChatFile } from '../types';

interface ChatsContextType {
  chats: Chat[];
  currentChatId: string | null;
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  createNewChat: () => Promise<void>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<void>;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app'; // WICHTIG: Deine ngrok-URL

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = useCallback(async () => {
    if (!user) { setChats([]); setCurrentChatId(null); return; }
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/chats`);
      if (response.ok) {
        const chatsData: any[] = await response.json();
        const formattedChats = chatsData.map(c => ({...c, id: c.id.toString(), messages:[], files: []}));
        setChats(formattedChats);
        if (formattedChats.length > 0 && !formattedChats.some(c => c.id === currentChatId)) {
          setCurrentChatId(formattedChats[0].id);
        }
      }
    } catch (e) { console.error("Fehler beim Laden der Chats:", e); }
  }, [user]);

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`);
      if(response.ok) {
        const messagesData: any[] = await response.json();
        const formattedMessages = messagesData.map(msg => ({ ...msg, id: msg.id.toString(), sender: msg.role, timeStamp: new Date(msg.created_at) }));
        setMessages(formattedMessages);
      }
    } catch (e) { console.error("Fehler beim Laden der Nachrichten:", e); }
  };

  useEffect(() => { fetchChats(); }, [fetchChats]);

  useEffect(() => {
    if (currentChatId) {
      fetchMessages(currentChatId);
    } else {
      setMessages([]);
    }
  }, [currentChatId]);

  const selectChat = (chatId: string) => { setCurrentChatId(chatId); };

  const createNewChat = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Neuer Chat', user_id: parseInt(user.id) }),
      });
      if (response.ok) {
        const newChatData = await response.json();
        const newChat = { ...newChatData, id: newChatData.id.toString(), messages: [], files: [] };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
      }
    } catch (e) { console.error("Fehler beim Erstellen des Chats:", e); }
  };
  
  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}`, { method: 'DELETE' });
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    } catch (e) { console.error("Fehler beim Löschen des Chats:", e); }
  };

  const sendMessage = async (messageContent: string) => {
    if (!currentChatId) return;
    setIsLoading(true);
    
    // Die 'optimistische' Nachricht, die sofort angezeigt wird
    const tempUserMessage = { id: `temp_${Date.now()}`, content: messageContent, sender: 'user', timeStamp: new Date() };
    setMessages(prev => [...prev, tempUserMessage]);
    
    try {
      await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: parseInt(currentChatId), message: messageContent }),
      });
      // Nachdem die KI geantwortet und alles gespeichert hat, laden wir den Chatverlauf neu
      await fetchMessages(currentChatId);
    } catch (e) {
      console.error("Fehler beim Senden der Nachricht:", e);
      // Ersetze die temporäre Nachricht durch eine Fehlermeldung
      const errorMessage = { id: `error_${Date.now()}`, content: "Fehler: Antwort konnte nicht empfangen werden.", sender: 'bot', timeStamp: new Date() };
      setMessages(prev => [...prev.filter(m => m.id !== tempUserMessage.id), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => { /* Hier API Call einfügen */ };
  const updateChatSystemPrompt = async (chatId: string, systemPrompt: string) => { /* Hier API Call einfügen */ };
  const addFilesToCurrentChat = async (files: File[]) => { /* Hier API Call einfügen */ };
  const removeFileFromCurrentChat = async (fileId: string) => { /* Hier API Call einfügen */ };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  return (
    <ChatsContext.Provider value={{
      chats, currentChatId, currentChat, messages, isLoading, createNewChat,
      selectChat, deleteChat, sendMessage, updateChatTitle,
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
