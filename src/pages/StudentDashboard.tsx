import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getBestVisitingTime, getQueueSize } from '@/data/mockData';
import { Authority, Ticket } from '@/types';
import { to12Hour } from '@/lib/timeFormat';
import { LogOut, Bell, Clock, MapPin, Users, Sparkles, CalendarCheck, MessageSquare, CheckCircle2, XCircle, AlertCircle, Ban } from 'lucide-react';

function AuthorityCard({ authority, onSelect }: { authority: Authority; onSelect: () => void }) {
  const { slots } = useAppData();
  const queueSize = getQueueSize(authority.id, slots);
  const freeSlots = slots.filter(s => s.authorityId === authority.id && s.status === 'free').length;
  const isUnavailable = !authority.available;

  return (
    <Card
      className={`card-shadow transition-all border-border ${isUnavailable ? 'opacity-60 cursor-not-allowed' : 'hover:card-shadow-hover cursor-pointer group'}`}
      onClick={() => !isUnavailable && onSelect()}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className={`font-display font-semibold text-foreground ${!isUnavailable ? 'group-hover:text-primary' : ''} transition-colors`}>{authority.name}</h3>
            <p className="text-sm text-muted-foreground">{authority.designation}</p>
          </div>
          {isUnavailable ? (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Ban className="w-3 h-3" /> Unavailable
            </Badge>
          ) : (
            <Badge className={authority.status === 'in-office' ? 'status-available' : 'status-booked'}>
              {authority.status === 'in-office' ? 'In Office' : 'Away'}
            </Badge>
          )}
        </div>
        {!isUnavailable && (
          <>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>~{authority.avgWaitTime}m wait</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{queueSize} in queue</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  authority.busynessLevel === 'Low' ? 'bg-status-available' :
                  authority.busynessLevel === 'Medium' ? 'bg-status-pending' : 'bg-status-booked'
                }`} />
                <span className="text-muted-foreground">{authority.busynessLevel}</span>
              </div>
            </div>
            {authority.status === 'elsewhere' && authority.currentLocation && (
              <div className="mt-3 p-2 bg-muted rounded-md text-xs text-muted-foreground flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span className="whitespace-pre-line">{authority.currentLocation}</span>
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="text-status-available font-medium">{freeSlots} free slots</span> available
            </div>
          </>
        )}
        {isUnavailable && (
          <p className="text-xs text-muted-foreground mt-2">This authority is currently not accepting appointments.</p>
        )}
      </CardContent>
    </Card>
  );
}

function SlotBookingDialog({ authority, open, onClose }: { authority: Authority; open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const { addNotification } = useAuth();
  const { slots, bookSlot } = useAppData();
  const [message, setMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const authoritySlots = slots.filter(s => s.authorityId === authority.id);
  const bestTime = getBestVisitingTime(authority.id);

  const handleBook = () => {
    if (!selectedSlot || !user) return;
    const trimmedMsg = message.trim();
    if (!trimmedMsg) { setFeedback('Please enter a message.'); return; }
    if (trimmedMsg.length > 300) { setFeedback('Message too long (max 300 chars).'); return; }
    const ticket = bookSlot(selectedSlot, user.id, user.name, trimmedMsg);
    if (ticket) {
      setFeedback('Ticket raised successfully!');
      addNotification(authority.id, `New booking request from ${user.name} (${user.id}) for ${ticket.date} at ${to12Hour(ticket.time)}: "${trimmedMsg}"`);
      setSelectedSlot(null);
      setMessage('');
      setTimeout(onClose, 1200);
    } else {
      setFeedback('Could not book. You may already have a ticket for this authority today.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{authority.name}</DialogTitle>
          <p className="text-sm text-muted-foreground">{authority.designation}</p>
        </DialogHeader>
        <div className="p-3 bg-secondary rounded-lg text-sm flex items-start gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <span className="font-medium text-secondary-foreground">Best time to visit:</span>
            <span className="ml-1 text-muted-foreground">{bestTime}</span>
          </div>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Available Slots</h4>
          {authoritySlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No slots available.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {authoritySlots.map(slot => (
                <button
                  key={slot.id}
                  disabled={slot.status !== 'free'}
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`p-2 rounded-lg text-xs font-medium transition-all border ${
                    slot.status === 'free'
                      ? selectedSlot === slot.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary text-foreground'
                      : slot.status === 'booked'
                        ? 'status-booked border-transparent cursor-not-allowed opacity-60'
                        : 'bg-muted border-transparent cursor-not-allowed opacity-40 text-muted-foreground'
                  }`}
                >
                  <div>{to12Hour(slot.time)}</div>
                  <div className="text-[10px] mt-0.5">{slot.date}</div>
                  <div className="mt-1 capitalize">{slot.status}</div>
                </button>
              ))}
            </div>
          )}
          {selectedSlot && (
            <div className="space-y-2 animate-fade-in">
              <Textarea placeholder="Short message for the authority (required)..." value={message} onChange={e => setMessage(e.target.value)} maxLength={300} rows={3} />
              <Button onClick={handleBook} className="w-full gradient-primary text-primary-foreground">
                <CalendarCheck className="w-4 h-4 mr-2" /> Book Slot
              </Button>
            </div>
          )}
          {feedback && <p className={`text-sm ${feedback.includes('success') ? 'text-status-available' : 'text-destructive'}`}>{feedback}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TicketCard({ ticket, onCancel }: { ticket: Ticket; onCancel?: () => void }) {
  const statusIcon = ticket.status === 'accepted' ? <CheckCircle2 className="w-4 h-4 text-status-available" /> :
    ticket.status === 'denied' ? <XCircle className="w-4 h-4 text-status-booked" /> :
    <AlertCircle className="w-4 h-4 text-status-pending" />;

  return (
    <Card className="card-shadow border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-foreground text-sm">{ticket.authorityName}</h4>
          <div className="flex items-center gap-1.5">
            {statusIcon}
            <Badge className={ticket.status === 'accepted' ? 'status-available' : ticket.status === 'denied' ? 'status-booked' : 'status-pending'}>
              {ticket.status}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-1">{ticket.date} at {to12Hour(ticket.time)}</p>
        <p className="text-xs text-muted-foreground flex items-start gap-1"><MessageSquare className="w-3 h-3 mt-0.5 shrink-0" /> {ticket.message}</p>
        {ticket.reason && <p className="text-xs text-destructive mt-1">Reason: {ticket.reason}</p>}
        {ticket.status === 'pending' && onCancel && (
          <Button variant="destructive" size="sm" className="mt-3 text-xs h-7" onClick={onCancel}>
            <XCircle className="w-3 h-3 mr-1" /> Cancel Ticket
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user, logout, notifications, markNotificationRead } = useAuth();
  const { authorities, tickets, cancelTicket } = useAppData();
  const navigate = useNavigate();
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) { navigate('/'); return null; }

  const myTickets = tickets.filter(t => t.studentId === user.id);
  const myNotifs = notifications.filter(n => n.userId === user.id);
  const unreadCount = myNotifs.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 gradient-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-primary-foreground">Student Dashboard</h1>
            <p className="text-xs text-primary-foreground/70">Welcome, {user.name}</p>
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

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        <section>
          <h2 className="text-xl font-display font-bold text-foreground mb-4">Authorities</h2>
          {authorities.length === 0 ? (
            <p className="text-muted-foreground">No authorities registered.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {authorities.map(auth => (
                <AuthorityCard key={auth.id} authority={auth} onSelect={() => setSelectedAuthority(auth)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-display font-bold text-foreground mb-4">My Tickets</h2>
          {myTickets.length === 0 ? (
            <p className="text-muted-foreground">No tickets yet. Book a slot above!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myTickets.map(t => <TicketCard key={t.id} ticket={t} onCancel={() => cancelTicket(t.id)} />)}
            </div>
          )}
        </section>
      </main>

      {selectedAuthority && (
        <SlotBookingDialog authority={selectedAuthority} open={!!selectedAuthority} onClose={() => setSelectedAuthority(null)} />
      )}
    </div>
  );
}
