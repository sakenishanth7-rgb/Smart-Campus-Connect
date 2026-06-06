export type UserRole = 'admin' | 'authority' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email?: string;
  designation?: string;
}

export interface Authority {
  id: string;
  name: string;
  designation: string;
  email: string;
  status: 'in-office' | 'elsewhere';
  currentLocation?: string;
  busynessLevel: 'Low' | 'Medium' | 'High';
  avgWaitTime: number; // minutes
  available: boolean; // if false, no slots visible to students
}

export interface TimeSlot {
  id: string;
  authorityId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  status: 'free' | 'booked' | 'busy';
  bookedBy?: string;
}

export interface Ticket {
  id: string;
  studentId: string;
  studentName: string;
  authorityId: string;
  authorityName: string;
  slotId: string;
  date: string;
  time: string;
  message: string;
  status: 'pending' | 'accepted' | 'denied';
  reason?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
}
