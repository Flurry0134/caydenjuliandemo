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
  addMessageToCurrentChat: (message: Message) => void;
  updateChatTitle: (chatId: string, title: string) => Promise<void>;
  updateChatSystemPrompt: (chatId: string, systemPrompt: string) => Promise<void>;
  addFilesToCurrentChat: (files: File[]) => Promise<void>;
  removeFileFromCurrentChat: (fileId: string) => Promise<void>;
  sendMessage: (messageContent: string) => Promise<void>;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app'; // WICHTIG: Deine ngrok URL

export const ChatsProvider = ({ children }: { children: ReactNode } ) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper to get current user from localStorage (used for API calls)
  const getCurrentUser = useCallback(() => {
    const savedUser = localStorage.getItem('chatbot-user');
    return savedUser ? JSON.parse(savedUser) : null;
  }, []);

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
        const formattedChats = chatsData.map(chat => ({
          ...chat,
          id: chat.id.toString(),
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
          messages: [], // Nachrichten werden separat geladen
          files: [],    // Dateien werden separat geladen
          preview: chat.preview || "Noch keine Nachrichten", // Sicherstellen, dass preview existiert
        }));
        setChats(formattedChats);
        const savedId = localStorage.getItem('chatbot-current-chat-id');
        if (savedId && formattedChats.some(c => c.id === savedId)) {
          setCurrentChatId(savedId);
        } else if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
        } else {
          // Wenn keine Chats vorhanden sind, einen neuen erstellen
          await createNewChat();
        }
      }
    } catch (e) { console.error("Fehler beim Laden der Chats:", e); }
  }, [user]); // createNewChat als Dependency hinzugefügt

  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/messages`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (response.ok) {
        const messagesData: any[] = await response.json();
        const formattedMessages = messagesData.map(msg => ({
          ...msg,
          id: msg.id.toString(),
          sender: msg.role, // 'sender' für Frontend-Kompatibilität
          timeStamp: new Date(msg.created_at)
        }));
        setMessages(formattedMessages);
      }
    } catch (e) { console.error("Fehler beim Laden der Nachrichten:", e); }
  }, []);

  // NEUE FUNKTION: Dateien für den aktuellen Chat abrufen
  const fetchDocuments = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}/documents`, {
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });
      if (response.ok) {
        const documentsData: any[] = await response.json();
        const formattedFiles: ChatFile[] = documentsData.map(doc => ({
          id: doc.id.toString(),
          name: doc.filename,
          size: doc.filesize,
          type: doc.filename.split('.').pop() || 'unknown' // Dateityp extrahieren
        }));
        // Aktualisiere den 'files'-Array im entsprechenden Chat-Objekt
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, files: formattedFiles }
              : chat
          )
        );
      }
    } catch (e) { console.error("Fehler beim Laden der Dokumente:", e); }
  }, []);


  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem('chatbot-current-chat-id', currentChatId);
      fetchMessages(currentChatId);
      fetchDocuments(currentChatId); // Dokumente laden, wenn Chat wechselt
    } else {
        setMessages([]);
        // Wenn kein Chat ausgewählt ist, auch die Dateien leeren
        setChats(prevChats => prevChats.map(chat => ({ ...chat, files: [] })));
    }
  }, [currentChatId, fetchMessages, fetchDocuments]);

  const selectChat = (chatId: string) => setCurrentChatId(chatId);

  const createNewChat = async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ title: 'Neuer Chat', user_id: parseInt(user.id) }),
      });
      if(response.ok) {
        const newChatData = await response.json();
        const newChat = {
            ...newChatData,
            id: newChatData.id.toString(),
            createdAt: new Date(newChatData.created_at),
            updatedAt: new Date(newChatData.updated_at),
            messages: [],
            files: [],
            preview: 'Hallo! Ich bin Ihr KI-Assistent...',
        };
        setChats(prev => [newChat, ...prev]);
        setCurrentChatId(newChat.id);
      }
    } catch (e) { console.error("Fehler beim Erstellen des Chats:", e); }
  };
  
  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatId}`, { method: 'DELETE', headers: { 'ngrok-skip-browser-warning': 'true' } });
      const updatedChats = chats.filter(c => c.id !== chatId);
      setChats(updatedChats);
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
    } catch (e) { console.error("Fehler beim Löschen des Chats:", e); }
  };

  const addMessageToCurrentChat = (message: Message) => {
      if(!currentChatId) return;
      // Temporäre Nachricht für sofortige UI-Anzeige hinzufügen
      setMessages(prev => [...prev, message]);
      // Optional: Hier könnte man auch den Chat-Titel aktualisieren, wenn es die erste Nachricht ist
      // und die Vorschau aktualisieren. Das wird aber auch durch fetchMessages nach der API-Antwort synchronisiert.
  }
  
  const sendMessage = async (messageContent: string) => {
    if (!currentChatId) return;
    setIsLoading(true);
    
    // Temporäre User-Nachricht für sofortige UI-Anzeige hinzufügen
    addMessageToCurrentChat({ id: `temp-${Date.now()}`, content: messageContent, sender: 'user', timeStamp: new Date() });
    
    try {
      // Zuerst die User-Nachricht im Backend speichern
      const userMessageResponse = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ role: 'user', content: messageContent }),
      });

      if (!userMessageResponse.ok) {
        throw new Error('Failed to save user message to backend');
      }

      // Dann die Completion vom LLM anfordern
      const completionResponse = await fetch(`${API_BASE_URL}/api/chat/completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify({ chat_id: parseInt(currentChatId), message: messageContent }),
      });

      if (!completionResponse.ok) {
        throw new Error('Failed to get AI completion');
      }

      // Nach erfolgreicher Completion alle Nachrichten neu laden (inkl. KI-Antwort)
      await fetchMessages(currentChatId);

      // Optional: Chat-Titel aktualisieren, falls es die erste Nachricht war
      const currentChatData = chats.find(chat => chat.id === currentChatId);
      if (currentChatData && currentChatData.title === 'Neuer Chat' && messageContent.length > 0) {
        const newTitle = messageContent.length > 40
          ? messageContent.substring(0, 40) + '...'
          : messageContent;
        await updateChatTitle(currentChatId, newTitle);
      }

    } catch (e: any) {
      console.error("Fehler beim Senden der Nachricht:", e);
      // Fehlermeldung für den Benutzer anzeigen
      addMessageToCurrentChat({ id: `error-${Date.now()}`, content: `Fehler: ${e.message || "Antwort konnte nicht empfangen werden."}`, sender: 'bot', timeStamp: new Date() });
    } finally {
      setIsLoading(false);
    }
  };

  const updateChatTitle = async (chatId: string, title: string) => {
    // Sofortige UI-Aktualisierung
    setChats(prev => prev.map(c => (c.id === chatId ? { ...c, title } : c)));
    try {
        await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ title }),
        });
    } catch (e) { console.error("Fehler beim Aktualisieren des Titels:", e); }
  };

  const updateChatSystemPrompt = async (chatId: string, systemPrompt: string) => {
    // Sofortige UI-Aktualisierung
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, systemPrompt } : c));
     try {
        await fetch(`${API_BASE_URL}/api/chats/${chatId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify({ system_prompt: systemPrompt }),
        });
    } catch (e) { console.error("Fehler beim Aktualisieren des System-Prompts:", e); }
  };
  
  // KORRIGIERTE FUNKTION: Dateien hochladen
  const addFilesToCurrentChat = async (files: File[]) => {
    if (!currentChatId) throw new Error('No chat selected to add files to.');

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file); // 'file' muss dem Namen im FastAPI-Endpunkt entsprechen

        const response = await fetch(`${API_BASE_URL}/api/chats/${currentChatId}/documents`, {
          method: 'POST',
          body: formData,
          // 'Content-Type' wird bei FormData automatisch gesetzt (multipart/form-data)
          headers: { 'ngrok-skip-browser-warning': 'true' },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Failed to upload file: ${file.name}`);
        }
        console.log(`Datei ${file.name} erfolgreich hochgeladen.`);
      }
      // Nach erfolgreichem Upload alle Dokumente für den Chat neu laden
      await fetchDocuments(currentChatId);
    } catch (error) {
      console.error('Fehler beim Hochladen der Dateien:', error);
      throw error;
    }
  };

  // KORRIGIERTE FUNKTION: Datei entfernen
  const removeFileFromCurrentChat = async (fileId: string) => {
    if (!currentChatId) return; // Sollte nicht passieren, wenn eine Datei ausgewählt ist

    try {
      const response = await fetch(`${API_BASE_URL}/api/documents/${fileId}`, {
        method: 'DELETE',
        headers: { 'ngrok-skip-browser-warning': 'true' },
      });

      if (response.ok) {
        console.log(`Datei ${fileId} erfolgreich entfernt.`);
        // Nach erfolgreichem Entfernen alle Dokumente für den Chat neu laden
        await fetchDocuments(currentChatId);
      } else {
        console.error(`Fehler beim Entfernen der Datei ${fileId}:`, response.statusText);
      }
    } catch (error) {
      console.error('Fehler beim Entfernen der Datei:', error);
      throw error;
    }
  };

  const currentChat = chats.find(chat => chat.id === currentChatId) || null;

  return (
    <ChatsContext.Provider value={{
      chats, currentChatId, currentChat, messages, isLoading, createNewChat,
      selectChat, deleteChat, addMessageToCurrentChat, updateChatTitle,
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
