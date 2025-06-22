import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Annahme der User-Typ-Definition basierend auf deinem Code
// Falls du eine zentrale 'types.ts' Datei hast, importiere es von dort.
interface User {
  id: string; // Die Backend-ID wird hier als String gespeichert
  email: string;
  name: string;
  role: string;
  lastLogin: Date;
}

// Definiert die Struktur des Auth-Kontexts, der für die App bereitgestellt wird
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Die URL deines Backend-Servers (ngrok oder localhost)
// Es ist eine gute Praxis, dies an einer zentralen Stelle zu definieren.
const API_BASE_URL = 'https://ab01-78-42-249-25.ngrok-free.app'; // WICHTIG: Ersetze dies mit deiner aktuellen ngrok-URL

/**
 * Der AuthProvider ist eine Komponente, die die gesamte App umschließt
 * und den Authentifizierungs-Status (wer ist eingeloggt?) verwaltet.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dieser Effekt läuft nur einmal beim ersten Laden der App.
  // Er prüft, ob bereits ein Nutzer im lokalen Speicher des Browsers gespeichert ist.
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('chatbot-user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        // Wir müssen sicherstellen, dass das Datum wieder ein echtes Datumsobjekt ist
        parsedUser.lastLogin = new Date(parsedUser.lastLogin);
        setUser(parsedUser);
      }
    } catch (error) {
        console.error("Fehler beim Wiederherstellen der User-Session:", error);
        localStorage.removeItem('chatbot-user');
    }
    setIsLoading(false);
  }, []);

  /**
   * Die Login-Funktion. Sie sendet die Anmeldedaten an das Backend.
   */
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
          // Konvertiere die Backend-Antwort in unser Frontend-User-Format
          const userData: User = {
            id: data.user.id.toString(), // ID wird als String gespeichert
            email: data.user.email,
            name: data.user.name,
            role: "admin", // Annahme basierend auf dem alten Code
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

  /**
   * Die Logout-Funktion. Sie entfernt den Nutzer aus dem Zustand und dem Speicher.
   */
  const logout = () => {
    setUser(null);
    localStorage.removeItem('chatbot-user');
    // Hier könnte man auch einen API-Call zum Backend für den Logout machen, falls nötig
  };

  // Stellt den Zustand und die Funktionen für alle untergeordneten Komponenten bereit
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Ein benutzerdefinierter Hook, um den Auth-Kontext einfacher zu verwenden.
 * Statt `useContext(AuthContext)` schreibt man einfach `useAuth()`.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
