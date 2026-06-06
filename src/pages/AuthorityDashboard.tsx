import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ticket } from '@/types';
import { to12Hour } from '@/lib/timeFormat';
import { LogOut, MapPin, Clock, Users, CalendarPlus, CheckCircle2, XCircle, BarChart3, Building2, Bell, Power } from 'lucide-react';

function TicketActionDialog({ ticket, open, onClose, onAction }: {
  ticket: Ticket; open: boolean; onClose: () => void;
  onAction: (status: 'accepted' | 'denied', reason?: string) => void;
}) {
  const [reason, setReason] = useState('');

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Ticket from {ticket.studentName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm"><strong>Date:</strong> {ticket.date} at {to12Hour(ticket.time)}</div>
          <div className="text-sm"><strong>Message:</strong> {ticket.message}</div>
          <div className="space-y-2">
            <Label>Reason (optional for accept, required for deny)</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={300} placeholder="Enter reason..." />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 bg-status-available text-primary-foreground hover:opacity-90" onClick={() => { onAction('accepted', reason.trim() || undefined); onClose(); }}>
              <CheckCircle2 className="w-4 h-4 mr-1" /> Accept
            </Button>
            <Button className="flex-1 bg-status-booked text-primary-foreground hover:opacity-90" onClick={() => {
              if (!reason.trim()) return;
              onAction('denied', reason.trim());
              onClose();
            }}>
              <XCircle className="w-4 h-4 mr-1" /> Deny
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AuthorityDashboard() {
  const { user, logout, notifications, markNotificationRead, addNotification } = useAuth();
  const { authorities, slots, tickets, updateAuthorityStatus, updateTicketStatus, addSlot, toggleSlotStatus, toggleAuthorityAvailability } = useAppData();
  const navigate = useNavigate();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusMode, setStatusMode] = useState<'office' | 'elsewhere'>('office');
  const [locationText, setLocationText] = useState('');
  const [newSlotDate, setNewSlotDate] = useState('');
  const [newSlotTime, setNewSlotTime] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) { navigate('/'); return null; }

  const authority = authorities.find(a => a.id === user.id);
  const mySlots = slots.filter(s => s.authorityId === user.id);
  const myTickets = tickets.filter(t => t.authorityId === user.id);
  const pendingTickets = myTickets.filter(t => t.status === 'pending');
  const totalRequests = myTickets.length;
  const acceptedCount = myTickets.filter(t => t.status === 'accepted').length;
  const busySlots = mySlots.filter(s => s.status === 'booked' || s.status === 'busy').length;

  const myNotifs = notifications.filter(n => n.userId === user.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  const handleStatusUpdate = () => {
    if (statusMode === 'office') {
      updateAuthorityStatus(user.id, 'in-office');
    } else {
      if (locationText.trim().length > 0) {
        updateAuthorityStatus(user.id, 'elsewhere', locationText.trim());
      }
    }
  };

  const handleAddSlot = () => {
    if (!newSlotDate || !newSlotTime) return;
    addSlot({ authorityId: user.id, date: newSlotDate, time: newSlotTime, duration: 15, status: 'free' });
    setNewSlotDate('');
    setNewSlotTime('');
  };

  const handleTicketAction = (status: 'accepted' | 'denied', reason?: string) => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, status, reason);
    const msg = status === 'accepted'
      ? `Your ticket for ${user.name} on ${selectedTicket.date} at ${to12Hour(selectedTicket.time)} has been ACCEPTED.${reason ? ' Reason: ' + reason : ''}`
      : `Your ticket for ${user.name} on ${selectedTicket.date} at ${to12Hour(selectedTicket.time)} has been DENIED. Reason: ${reason}`;
    addNotification(selectedTicket.studentId, msg);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 gradient-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-primary-foreground">Authority Dashboard</h1>
            <p className="text-xs text-primary-foreground/70">{user.name} — {user.designation}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 rounded-lg text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive rounded-full text-[10px] flex items-center justify-center text-destructive-foreground">{unreadCount}</span>}
            </button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {showNotifs && (
        <div className="max-w-6xl mx-auto px-4 animate-fade-in">
          <Card className="mt-2 border-border card-shadow">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-sm font-display">Notifications</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              {myNotifs.length === 0 ? <p className="text-sm text-muted-foreground">No notifications.</p> : myNotifs.map(n => (
                <div key={n.id} className={`p-2 rounded text-sm mb-1 cursor-pointer ${n.read ? 'text-muted-foreground' : 'bg-secondary text-foreground font-medium'}`} onClick={() => markNotificationRead(n.id)}>
                  {n.message}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: totalRequests, icon: <Users className="w-5 h-5" /> },
            { label: 'Pending', value: pendingTickets.length, icon: <Clock className="w-5 h-5" /> },
            { label: 'Accepted', value: acceptedCount, icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: 'Busy Slots', value: busySlots, icon: <BarChart3 className="w-5 h-5" /> },
          ].map(s => (
            <Card key={s.label} className="card-shadow border-border">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary text-primary">{s.icon}</div>
                <div>
                  <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Update */}
          <Card className="card-shadow border-border">
            <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><Building2 className="w-4 h-4" /> Update Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setStatusMode('office')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${statusMode === 'office' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>In Office</button>
                <button onClick={() => setStatusMode('elsewhere')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${statusMode === 'elsewhere' ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>Elsewhere</button>
              </div>
              {statusMode === 'elsewhere' && (
                <Textarea placeholder="Enter current location (4 lines max)..." value={locationText} onChange={e => setLocationText(e.target.value)} maxLength={200} rows={4} />
              )}
              <Button onClick={handleStatusUpdate} className="w-full">Update Status</Button>
              {authority && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Current: <Badge className={authority.status === 'in-office' ? 'status-available' : 'status-booked'}>{authority.status === 'in-office' ? 'In Office' : 'Elsewhere'}</Badge></span>
                  <Button
                    size="sm"
                    variant={authority.available ? 'default' : 'destructive'}
                    className="text-xs h-7"
                    onClick={() => toggleAuthorityAvailability(user.id)}
                  >
                    <Power className="w-3 h-3 mr-1" />
                    {authority.available ? 'Available' : 'Unavailable'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Slot */}
          <Card className="card-shadow border-border">
            <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><CalendarPlus className="w-4 h-4" /> Add Time Slot</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Time</Label>
                  <Input type="time" value={newSlotTime} onChange={e => setNewSlotTime(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleAddSlot} className="w-full"><CalendarPlus className="w-4 h-4 mr-1" /> Add Slot</Button>
            </CardContent>
          </Card>
        </div>

        {/* My Slots */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">My Slots</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {mySlots.map(slot => (
              <button
                key={slot.id}
                onClick={() => toggleSlotStatus(slot.id)}
                disabled={slot.status === 'booked'}
                className={`p-3 rounded-lg text-xs font-medium border transition-all ${
                  slot.status === 'free' ? 'status-available border-status-available/30 hover:opacity-80' :
                  slot.status === 'booked' ? 'status-booked border-status-booked/30 cursor-not-allowed' :
                  'bg-muted text-muted-foreground border-border'
                }`}
              >
                <div className="font-semibold">{to12Hour(slot.time)}</div>
                <div className="text-[10px] mt-0.5">{slot.date}</div>
                <div className="mt-1 capitalize">{slot.status}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Pending Tickets */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3">Pending Requests ({pendingTickets.length})</h2>
          {pendingTickets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingTickets.map(t => (
                <Card key={t.id} className="card-shadow border-border cursor-pointer hover:card-shadow-hover transition-all" onClick={() => setSelectedTicket(t)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground text-sm">{t.studentName} ({t.studentId})</h4>
                      <p className="text-xs text-muted-foreground">{t.date} at {to12Hour(t.time)} — {t.message.slice(0, 60)}...</p>
                    </div>
                    <Badge className="status-pending">Pending</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      {selectedTicket && (
        <TicketActionDialog
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onAction={handleTicketAction}
        />
      )}
    </div>
  );
}
