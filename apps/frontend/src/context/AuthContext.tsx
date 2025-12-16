import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { SystemUser } from '../types';

interface AuthContextType {
  user: SystemUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: SystemUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await api.auth.getCurrentUser();
        const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
        
        if (storedUser && storedAuth) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth init failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // setIsLoading(true); // REMOVED: Do not trigger global loading during login action to prevent unmounting Login component
    try {
      const loggedUser = await api.auth.login(email, password);
      // In real app, we would store the JWT token here
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(loggedUser));
      setUser(loggedUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      // setIsLoading(false); // REMOVED
    }
  };

  const logout = () => {
    api.auth.logout();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: SystemUser) => {
    setUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, updateUser }}>
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
