import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Authority, TimeSlot, Ticket, User } from '@/types';
import { mockAuthorities, mockSlots, mockTickets, mockUsers, credentials } from '@/data/mockData';

interface AppDataContextType {
  authorities: Authority[];
  slots: TimeSlot[];
  tickets: Ticket[];
  users: User[];
  updateAuthorityStatus: (id: string, status: Authority['status'], location?: string) => void;
  updateAuthorityName: (id: string, name: string) => void;
  updateAuthorityDetails: (id: string, updates: Partial<Pick<Authority, 'name' | 'designation' | 'email'>>) => void;
  toggleAuthorityAvailability: (id: string) => void;
  bookSlot: (slotId: string, studentId: string, studentName: string, message: string) => Ticket | null;
  updateTicketStatus: (ticketId: string, status: 'accepted' | 'denied', reason?: string) => void;
  cancelTicket: (ticketId: string) => void;
  addSlot: (slot: Omit<TimeSlot, 'id'>) => void;
  addUser: (user: User, password: string, authorityData?: Omit<Authority, 'id'>) => void;
  updateUserCredentials: (id: string, updates: { name?: string; password?: string }) => void;
  toggleSlotStatus: (slotId: string) => void;
  importAuthoritiesFromCSV: (data: { id: string; name: string; designation: string; email: string; password: string }[]) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [authorities, setAuthorities] = useState<Authority[]>(mockAuthorities);
  const [slots, setSlots] = useState<TimeSlot[]>(mockSlots);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const updateAuthorityStatus = (id: string, status: Authority['status'], location?: string) => {
    setAuthorities(prev => prev.map(a => a.id === id ? { ...a, status, currentLocation: location } : a));
  };

  const updateAuthorityName = (id: string, name: string) => {
    setAuthorities(prev => prev.map(a => a.id === id ? { ...a, name } : a));
  };

  const updateAuthorityDetails = (id: string, updates: Partial<Pick<Authority, 'name' | 'designation' | 'email'>>) => {
    setAuthorities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    // Also update the user record
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const toggleAuthorityAvailability = (id: string) => {
    setAuthorities(prev => prev.map(a => a.id === id ? { ...a, available: !a.available } : a));
  };

  const bookSlot = (slotId: string, studentId: string, studentName: string, message: string): Ticket | null => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.status !== 'free') return null;

    const today = new Date().toISOString().split('T')[0];
    const existing = tickets.find(t => t.studentId === studentId && t.date === today && t.authorityId === slot.authorityId);
    if (existing) return null;

    const authority = authorities.find(a => a.id === slot.authorityId);
    if (!authority || !authority.available) return null;

    setSlots(prev => prev.map(s => s.id === slotId ? { ...s, status: 'booked', bookedBy: studentId } : s));

    const ticket: Ticket = {
      id: `tkt-${Date.now()}`,
      studentId,
      studentName,
      authorityId: slot.authorityId,
      authorityName: authority.name,
      slotId,
      date: slot.date,
      time: slot.time,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTickets(prev => [ticket, ...prev]);
    return ticket;
  };

  const updateTicketStatus = (ticketId: string, status: 'accepted' | 'denied', reason?: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, reason } : t));
  };

  const cancelTicket = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status !== 'pending') return;
    // Free up the slot
    setSlots(prev => prev.map(s => s.id === ticket.slotId ? { ...s, status: 'free' as const, bookedBy: undefined } : s));
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'denied' as const, reason: 'Cancelled by student' } : t));
  };

  const addUser = (user: User, password: string, authorityData?: Omit<Authority, 'id'>) => {
    credentials[user.id] = password;
    mockUsers.push(user);
    setUsers(prev => [...prev, user]);
    if (user.role === 'authority' && authorityData) {
      setAuthorities(prev => [...prev, { ...authorityData, id: user.id }]);
    }
  };

  const updateUserCredentials = (id: string, updates: { name?: string; password?: string }) => {
    if (updates.name) {
      const newName = updates.name;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, name: newName } : u));
      setAuthorities(prev => prev.map(a => a.id === id ? { ...a, name: newName } : a));
      // Update name in mockUsers for login display
      const mockUser = mockUsers.find(u => u.id === id);
      if (mockUser) mockUser.name = newName;
      // Update name in tickets
      setTickets(prev => prev.map(t => {
        if (t.studentId === id) return { ...t, studentName: newName };
        if (t.authorityId === id) return { ...t, authorityName: newName };
        return t;
      }));
    }
    if (updates.password) {
      credentials[id] = updates.password;
    }
  };

  const addSlot = (slot: Omit<TimeSlot, 'id'>) => {
    setSlots(prev => [...prev, { ...slot, id: `slot-${Date.now()}` }]);
  };

  const toggleSlotStatus = (slotId: string) => {
    setSlots(prev => prev.map(s => {
      if (s.id !== slotId) return s;
      if (s.status === 'booked') return s;
      return { ...s, status: s.status === 'free' ? 'busy' : 'free' };
    }));
  };

  const importAuthoritiesFromCSV = (data: { id: string; name: string; designation: string; email: string; password: string }[]) => {
    const newAuthorities: Authority[] = data.map(d => ({
      id: d.id,
      name: d.name,
      designation: d.designation,
      email: d.email,
      status: 'in-office' as const,
      busynessLevel: 'Low' as const,
      avgWaitTime: 10,
      available: true,
    }));

    const newUsers: User[] = data.map(d => ({
      id: d.id,
      name: d.name,
      role: 'authority' as const,
      email: d.email,
      designation: d.designation,
    }));

    // Add to credentials
    data.forEach(d => { credentials[d.id] = d.password; });

    setAuthorities(prev => {
      const existingIds = new Set(prev.map(a => a.id));
      const toAdd = newAuthorities.filter(a => !existingIds.has(a.id));
      return [...prev, ...toAdd];
    });

    setUsers(prev => {
      const existingIds = new Set(prev.map(u => u.id));
      const toAdd = newUsers.filter(u => !existingIds.has(u.id));
      return [...prev, ...toAdd];
    });
  };

  return (
    <AppDataContext.Provider value={{ authorities, slots, tickets, users, updateAuthorityStatus, updateAuthorityName, updateAuthorityDetails, toggleAuthorityAvailability, bookSlot, updateTicketStatus, cancelTicket, addSlot, toggleSlotStatus, importAuthoritiesFromCSV, addUser, updateUserCredentials }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
}
