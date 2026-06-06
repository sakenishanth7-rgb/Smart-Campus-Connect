import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Notification } from '@/types';
import { mockUsers, credentials } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (id: string, password: string) => boolean;
  logout: () => void;
  notifications: Notification[];
  addNotification: (userId: string, message: string) => void;
  markNotificationRead: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const login = (id: string, password: string): boolean => {
    if (credentials[id] && credentials[id] === password) {
      const found = mockUsers.find(u => u.id === id);
      if (found) {
        setUser(found);
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addNotification = (userId: string, message: string) => {
    setNotifications(prev => [
      { id: `notif-${Date.now()}`, userId, message, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, notifications, addNotification, markNotificationRead }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
