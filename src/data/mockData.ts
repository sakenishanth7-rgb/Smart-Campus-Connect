import { Authority, TimeSlot, Ticket, User } from '@/types';

export const mockAuthorities: Authority[] = [
  { id: 'auth1', name: 'Dr. Rajesh Kumar', designation: 'Director', email: 'director@rgukt.ac.in', status: 'in-office', busynessLevel: 'High', avgWaitTime: 35, available: true },
  { id: 'auth2', name: 'Sri. Venkatesh Rao', designation: 'Administrative Officer', email: 'ao@rgukt.ac.in', status: 'in-office', busynessLevel: 'Medium', avgWaitTime: 20, available: true },
  { id: 'auth3', name: 'Dr. Priya Sharma', designation: 'Dean of Student Welfare', email: 'dsw@rgukt.ac.in', status: 'elsewhere', currentLocation: 'Main Auditorium\nAttending Faculty Meeting\nExpected back at 3:00 PM\nContact: 9876543210', busynessLevel: 'Low', avgWaitTime: 10, available: true },
  { id: 'auth4', name: 'Dr. Suresh Babu', designation: 'Coordinator - CSE', email: 'cse.coord@rgukt.ac.in', status: 'in-office', busynessLevel: 'Medium', avgWaitTime: 15, available: true },
  { id: 'auth5', name: 'Dr. Lakshmi Devi', designation: 'HOD - CSE', email: 'hod.cse@rgukt.ac.in', status: 'in-office', busynessLevel: 'Low', avgWaitTime: 12, available: true },
  { id: 'auth6', name: 'Dr. Anil Reddy', designation: 'HOD - ECE', email: 'hod.ece@rgukt.ac.in', status: 'in-office', busynessLevel: 'High', avgWaitTime: 40, available: true },
];

export const mockUsers: User[] = [
  { id: 'Admin@RKV', name: 'Webmaster', role: 'admin', email: 'admin@rgukt.ac.in' },
  { id: 'auth1', name: 'Dr. Rajesh Kumar', role: 'authority', email: 'director@rgukt.ac.in', designation: 'Director' },
  { id: 'auth2', name: 'Sri. Venkatesh Rao', role: 'authority', email: 'ao@rgukt.ac.in', designation: 'Administrative Officer' },
  { id: 'auth3', name: 'Dr. Priya Sharma', role: 'authority', email: 'dsw@rgukt.ac.in', designation: 'Dean of Student Welfare' },
  { id: 'S210001', name: 'Arjun Reddy', role: 'student', email: 'arjun@rgukt.ac.in' },
  { id: 'S210002', name: 'Meera Patel', role: 'student', email: 'meera@rgukt.ac.in' },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

export const mockSlots: TimeSlot[] = [
  // Director slots
  { id: 'slot1', authorityId: 'auth1', date: todayStr, time: '09:00', duration: 15, status: 'booked', bookedBy: 'S210001' },
  { id: 'slot2', authorityId: 'auth1', date: todayStr, time: '09:15', duration: 15, status: 'free' },
  { id: 'slot3', authorityId: 'auth1', date: todayStr, time: '09:30', duration: 15, status: 'free' },
  { id: 'slot4', authorityId: 'auth1', date: todayStr, time: '10:00', duration: 15, status: 'busy' },
  { id: 'slot5', authorityId: 'auth1', date: todayStr, time: '10:15', duration: 15, status: 'free' },
  { id: 'slot6', authorityId: 'auth1', date: todayStr, time: '14:00', duration: 15, status: 'free' },
  { id: 'slot7', authorityId: 'auth1', date: tomorrowStr, time: '09:00', duration: 15, status: 'free' },
  { id: 'slot8', authorityId: 'auth1', date: tomorrowStr, time: '09:15', duration: 15, status: 'free' },
  // AO slots
  { id: 'slot9', authorityId: 'auth2', date: todayStr, time: '10:00', duration: 15, status: 'free' },
  { id: 'slot10', authorityId: 'auth2', date: todayStr, time: '10:15', duration: 15, status: 'booked', bookedBy: 'S210002' },
  { id: 'slot11', authorityId: 'auth2', date: todayStr, time: '10:30', duration: 15, status: 'free' },
  { id: 'slot12', authorityId: 'auth2', date: todayStr, time: '11:00', duration: 15, status: 'free' },
  // DSW slots
  { id: 'slot13', authorityId: 'auth3', date: todayStr, time: '15:00', duration: 15, status: 'free' },
  { id: 'slot14', authorityId: 'auth3', date: todayStr, time: '15:15', duration: 15, status: 'free' },
  // Coordinator slots
  { id: 'slot15', authorityId: 'auth4', date: todayStr, time: '09:00', duration: 15, status: 'free' },
  { id: 'slot16', authorityId: 'auth4', date: todayStr, time: '09:15', duration: 15, status: 'free' },
  { id: 'slot17', authorityId: 'auth4', date: todayStr, time: '14:00', duration: 15, status: 'booked', bookedBy: 'S210001' },
  // HOD CSE slots
  { id: 'slot18', authorityId: 'auth5', date: todayStr, time: '11:00', duration: 15, status: 'free' },
  { id: 'slot19', authorityId: 'auth5', date: todayStr, time: '11:15', duration: 15, status: 'free' },
  // HOD ECE slots
  { id: 'slot20', authorityId: 'auth6', date: todayStr, time: '09:00', duration: 15, status: 'booked', bookedBy: 'S210002' },
  { id: 'slot21', authorityId: 'auth6', date: todayStr, time: '09:15', duration: 15, status: 'free' },
];

export const mockTickets: Ticket[] = [
  { id: 'tkt1', studentId: 'S210001', studentName: 'Arjun Reddy', authorityId: 'auth1', authorityName: 'Dr. Rajesh Kumar', slotId: 'slot1', date: todayStr, time: '09:00', message: 'Need permission for industrial visit to Hyderabad', status: 'accepted', createdAt: todayStr },
  { id: 'tkt2', studentId: 'S210002', studentName: 'Meera Patel', authorityId: 'auth2', authorityName: 'Sri. Venkatesh Rao', slotId: 'slot10', date: todayStr, time: '10:15', message: 'Requesting fee receipt clarification', status: 'pending', createdAt: todayStr },
  { id: 'tkt3', studentId: 'S210001', studentName: 'Arjun Reddy', authorityId: 'auth4', authorityName: 'Dr. Suresh Babu', slotId: 'slot17', date: todayStr, time: '14:00', message: 'Course elective change request', status: 'pending', createdAt: todayStr },
  { id: 'tkt4', studentId: 'S210002', studentName: 'Meera Patel', authorityId: 'auth6', authorityName: 'Dr. Anil Reddy', slotId: 'slot20', date: todayStr, time: '09:00', message: 'Lab equipment request for project', status: 'denied', reason: 'Please submit formal request through HOD office first.', createdAt: todayStr },
];

// Credentials for demo
export const credentials: Record<string, string> = {
  'Admin@RKV': 'webmaster@rkv',
  'auth1': 'pass123',
  'auth2': 'pass123',
  'auth3': 'pass123',
  'auth4': 'pass123',
  'auth5': 'pass123',
  'auth6': 'pass123',
  'S210001': 'student123',
  'S210002': 'student123',
};

export function getBestVisitingTime(authorityId: string): string {
  const recommendations: Record<string, string> = {
    'auth1': '9:15 AM - 10:00 AM (Least busy)',
    'auth2': '11:00 AM - 12:00 PM (Moderate traffic)',
    'auth3': '3:00 PM - 4:00 PM (Available after meetings)',
    'auth4': '9:00 AM - 9:30 AM (Early morning is best)',
    'auth5': '11:00 AM - 11:30 AM (Post-lecture hours)',
    'auth6': '2:00 PM - 3:00 PM (Afternoon slots preferred)',
  };
  return recommendations[authorityId] || '10:00 AM - 11:00 AM';
}

export function getQueueSize(authorityId: string, slots: TimeSlot[]): number {
  return slots.filter(s => s.authorityId === authorityId && s.status === 'booked').length;
}
