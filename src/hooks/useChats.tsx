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
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app'; // DEINE NGROK URL

export const ChatsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lädt die Chat-Liste für den eingeloggten Nutzer
  const fetchChats = useCallback(async () => {
    if (!user) { setChats([]); setCurrentChatId(null); return; }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/chats`, { headers: { 'ngrok-skip-browser-warning': 'true' } });
      if (response.ok) {
        const chatsData: any[] = await response.json();
        const formattedChats = chatsData.map(c => ({
          ...c, id: c.id.toString(), createdAt: new Date(c.created_at), updatedAt: new Date(c.updated_at),
          messages: [], files: [], preview: "Noch keine Nachrichten",
        }));
        setChats(formattedChats);
        
        const savedId = localStorage.getItem('chatbot-current-chat-id');
        if (savedId && formattedChats.some(c => c.id === savedId)) {
          setCurrentChatId(savedId);
        } else if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        } else {
            await createNewChat();
        }
      }
    } catch (e) { console.error("Fehler beim Laden der Chats:", e); } 
    finally { setIsLoading(false); }
  }, [user]);

  // Lädt Nachrichten UND Dateien für den ausgewählten Chat
  const fetchChatDetails = useCallback(async (chatId: string) => {
    if(!chatId) return;
    try {
      const [msgRes, docRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, { headers: { 'ngrok-skip-browser-warning': 'true' } }),
        fetch(`${API_BASE_URL}/api/chats/${chatId}/documents`, { headers: { 'ngrok-skip-browser-warning': 'true' } })
      ]);
      const messagesData = await msgRes.json();
      const documentsData = await docRes.json();

      const formattedMessages = messagesData.map((msg: any) => ({ ...msg, id: msg.id.toString(), sender: msg.role, timeStamp: new Date(msg.created_at) }));
      const formattedFiles = documentsData.map((doc: any) => ({ ...doc, id: doc.id.toString(), name: doc.filename, size: doc.filesize, type: doc.filename.split('.').pop() || 'unknown' }));

      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: formattedMessages, files: formattedFiles } : c));
    } catch (e) { console.error("Fehler beim Laden der Chat-Details:", e); }
  }, []);

  useEffect(() => {
    if (user) {
        fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('chatbot-current-chat-id', currentChatId);
      fetchChatDetails(currentChatId);
    }
  }, [currentChatId, fetchChatDetails]);

  const selectChat = (chatId: string) => setCurrentChatId(chatId);

  const createNewChat = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ title: 'Neuer Chat', user_id: parseInt(user.id) }),
      });
      if(response.ok) await fetchChats();
    } catch (e) { console.error("Fehler beim Erstellen des Chats:", e); }
  };
  
  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}`, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' } });
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);
      if (currentChatId === chatId) setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
    } catch (e) { console.error("Fehler beim Löschen des Chats:", e); }
  };

  const addMessageToCurrentChat = (message: Message) => {
    if (!currentChatId) return;
    setChats(prev => prev.map(chat => chat.id === currentChatId ? { ...chat, messages: [...chat.messages, message] } : c));
  };
  
  const sendMessage = async (messageContent: string) => {
    if (!currentChatId) return;
    setIsLoading(true);
    addMessageToCurrentChat({ id: `temp-${Date.now()}`, content: messageContent, sender: 'user', timeStamp: new Date() });
    try {
      await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ chat_id: parseInt(currentChatId), message: messageContent }),
      });
      await fetchChatDetails(currentChatId);
    } catch (e) {
      console.error("Fehler beim Senden der Nachricht:", e);
      addMessageToCurrentChat({ id: `error-${Date.now()}`, content: "Fehler: Antwort konnte nicht empfangen werden.", sender: 'bot', timeStamp: new Date() });
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    setChats(prev => prev.map(c => (c.id === chatId ? { ...c, title } : c)));
    await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify({ title }),
    });
  };

  const updateChatSystemPrompt = async (chatId: string, systemPrompt: string) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, systemPrompt } : c));
     await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
      method: 'PUT', headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' }, body: JSON.stringify({ system_prompt: systemPrompt }),
    });
  };
  
  const addFilesToCurrentChat = async (files: File[]) => {
    if (!currentChatId) return;
    setIsLoading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/documents`, {
          method: 'POST', headers: { 'ngrok-skip-browser-warning': 'true' }, body: formData,
        });
      }
      await fetchChatDetails(currentChatId);
    } catch (e) { console.error("Fehler beim Hochladen:", e); } 
    finally { setIsLoading(false); }
  };

  const removeFileFromCurrentChat = async (fileId: string) => {
    if (!currentChatId) return;
    try {
      await fetch(`${API_BASE_URL}/api/documents/${fileId}`, {
        method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      await fetchChatDetails(currentChatId);
    } catch(e) { console.error("Fehler beim Löschen der Datei:", e); }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;
  
  return (
    <ChatsContext.Provider value={{
      chats, currentChatId, currentChat, 
      messages: currentChat?.messages || [],
      isLoading, createNewChat, selectChat, deleteChat, addMessageToCurrentChat, updateChatTitle,
      updateChatSystemPrompt, addFilesToCurrentChat, removeFileFromCurrentChat, sendMessage
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
