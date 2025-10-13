import React, { createContext, useContext, ReactNode, Dispatch, SetStateAction } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import * as api from '../services/apiService';
// FIX: Import User type from central types file to avoid circular dependencies.
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useLocalStorage<User | null>('user', null);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const loggedInUser = await api.login({ username, password });
      setUser(loggedInUser);
      return true;
    } catch (error) {
        console.error("Login API error:", error);
        // The error message from the server will be displayed on the login page.
        return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};