import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('chatbot-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const userData: User = {
                    id: data.user.id.toString(),
                    email: data.user.email,
                    name: data.user.name,
                    role: data.user.role,
                    lastLogin: new Date(data.user.lastLogin)
                };
                setUser(userData);
                localStorage.setItem('chatbot-user', JSON.stringify(userData));
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Login error:', error);
        return false;
    } finally {
        setIsLoading(false);
    }
};

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chatbot-user');
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
