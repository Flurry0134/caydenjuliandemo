import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Annahme der User-Typ-Definition basierend auf deinem alten Code
// Dies ist das gewünschte Interface für das Frontend
interface User {
  id: string;
  email: string;
  name: string;
  role: string; // z.B. 'admin', 'user'
  lastLogin: Date;
}

// Definiert die Struktur des Auth-Kontexts, wie im alten Code gewünscht
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Die URL deines Backend-Servers
// WICHTIG: Ersetze dies mit deiner aktuellen ngrok-URL oder der finalen Backend-URL
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app'; 

export const AuthProvider = ({ children }: { children: ReactNode } ) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dieser Effekt prüft beim Laden der App, ob bereits ein Nutzer im lokalen Speicher ist.
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('chatbot-user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Stelle sicher, dass lastLogin wieder ein Date-Objekt ist
        parsedUser.lastLogin = new Date(parsedUser.lastLogin);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Fehler beim Wiederherstellen der User-Session:", error);
      localStorage.removeItem('chatbot-user'); // Lösche ungültige Daten
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Mapping der Backend-Antwort auf das gewünschte Frontend-User-Interface
          const userData: User = {
            id: data.user.id.toString(), // Backend-ID als String speichern
            email: data.user.email,
            name: data.user.name,
            role: data.user.role || 'user', // Nutze die Rolle vom Backend, falls vorhanden, sonst 'user'
            lastLogin: new Date(data.user.lastLogin)
          };
          
          setUser(userData);
          localStorage.setItem('chatbot-user', JSON.stringify(userData));
          setIsLoading(false);
          return true; // Login erfolgreich
        }
      }
      // Wenn die Antwort nicht ok war oder success nicht true war
      setIsLoading(false);
      return false; // Login fehlgeschlagen
    } catch (error) {
      console.error('Login-Fehler:', error);
      setIsLoading(false);
      return false; // Login fehlgeschlagen bei Netzwerkfehler etc.
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chatbot-user');
    // Optional: Hier könnte ein API-Call zum Backend für den Logout erfolgen, falls nötig
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
