import React, { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Users, CalendarCheck, BarChart3, Shield, Clock, Pencil, Check, X, KeyRound, Upload, Power, Plus, Save, Settings } from 'lucide-react';
import { credentials, mockUsers } from '@/data/mockData';
import { to12Hour } from '@/lib/timeFormat';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { authorities, slots, tickets, users, updateAuthorityDetails, toggleAuthorityAvailability, importAuthoritiesFromCSV, addUser, updateUserCredentials } = useAppData();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [csvFeedback, setCsvFeedback] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Add user dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addRole, setAddRole] = useState<'student' | 'authority'>('student');
  const [addId, setAddId] = useState('');
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addDesignation, setAddDesignation] = useState('');
  const [addFeedback, setAddFeedback] = useState('');

  // Edit credentials
  const [editCredId, setEditCredId] = useState<string | null>(null);
  const [editCredName, setEditCredName] = useState('');
  const [editCredPassword, setEditCredPassword] = useState('');

  // Admin self-credential edit
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminFeedback, setAdminFeedback] = useState('');

  if (!user) { navigate('/'); return null; }

  const totalSlots = slots.length;
  const bookedSlots = slots.filter(s => s.status === 'booked').length;
  const pendingTickets = tickets.filter(t => t.status === 'pending').length;

  const startEdit = (auth: { id: string; name: string; designation: string; email: string }) => {
    setEditingId(auth.id); setEditName(auth.name); setEditDesignation(auth.designation); setEditEmail(auth.email);
  };
  const saveEdit = (id: string) => {
    if (editName.trim() && editDesignation.trim() && editEmail.trim()) {
      updateAuthorityDetails(id, { name: editName.trim(), designation: editDesignation.trim(), email: editEmail.trim() });
    }
    setEditingId(null);
  };
  const cancelEdit = () => setEditingId(null);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split('\n');
        if (lines.length < 2) { setCsvFeedback('CSV must have header + data rows.'); return; }
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const idIdx = header.indexOf('authority_id');
        const nameIdx = header.indexOf('name');
        const desIdx = header.indexOf('designation');
        const emailIdx = header.indexOf('email');
        const passIdx = header.indexOf('password');
        if ([idIdx, nameIdx, desIdx, emailIdx, passIdx].some(i => i === -1)) {
          setCsvFeedback('CSV must have columns: authority_id, name, designation, email, password'); return;
        }
        const data = lines.slice(1).filter(l => l.trim()).map(line => {
          const cols = line.split(',').map(c => c.trim());
          return { id: cols[idIdx], name: cols[nameIdx], designation: cols[desIdx], email: cols[emailIdx], password: cols[passIdx] };
        });
        importAuthoritiesFromCSV(data);
        setCsvFeedback(`Imported ${data.length} authorities successfully!`);
      } catch { setCsvFeedback('Error parsing CSV file.'); }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleAddUser = () => {
    if (!addId.trim() || !addName.trim() || !addEmail.trim() || !addPassword.trim()) {
      setAddFeedback('All fields are required.'); return;
    }
    if (users.find(u => u.id === addId.trim())) {
      setAddFeedback('User ID already exists.'); return;
    }
    if (addRole === 'authority' && !addDesignation.trim()) {
      setAddFeedback('Designation is required for authorities.'); return;
    }
    const newUser = { id: addId.trim(), name: addName.trim(), role: addRole as 'student' | 'authority', email: addEmail.trim(), designation: addRole === 'authority' ? addDesignation.trim() : undefined };
    const authorityData = addRole === 'authority' ? {
      name: addName.trim(), designation: addDesignation.trim(), email: addEmail.trim(),
      status: 'in-office' as const, busynessLevel: 'Low' as const, avgWaitTime: 10, available: true,
    } : undefined;
    addUser(newUser, addPassword.trim(), authorityData);
    setAddFeedback(`${addRole === 'authority' ? 'Authority' : 'Student'} added successfully!`);
    setAddId(''); setAddName(''); setAddEmail(''); setAddPassword(''); setAddDesignation('');
    setTimeout(() => { setShowAddDialog(false); setAddFeedback(''); }, 1000);
  };

  const startCredEdit = (id: string, name: string) => {
    setEditCredId(id); setEditCredName(name); setEditCredPassword(credentials[id] || '');
  };
  const saveCredEdit = (id: string) => {
    const updates: { name?: string; password?: string } = {};
    if (editCredName.trim()) updates.name = editCredName.trim();
    if (editCredPassword.trim()) updates.password = editCredPassword.trim();
    updateUserCredentials(id, updates);
    setEditCredId(null);
  };

  const handleAdminCredUpdate = () => {
    if (!adminUsername.trim() && !adminPassword.trim()) {
      setAdminFeedback('Enter a new username or password.'); return;
    }
    // Update admin credentials: change the key in credentials map
    const currentId = user.id;
    const newId = adminUsername.trim() || currentId;
    const newPass = adminPassword.trim() || credentials[currentId];

    if (newId !== currentId) {
      credentials[newId] = newPass;
      delete credentials[currentId];
      const mockUser = mockUsers.find((u) => u.id === currentId);
      if (mockUser) mockUser.id = newId;
      setAdminFeedback(`Username changed to "${newId}". Please re-login.`);
      setTimeout(() => { logout(); navigate('/'); }, 1500);
    } else {
      credentials[currentId] = newPass;
      setAdminFeedback('Password updated successfully!');
    }
    setAdminUsername('');
    setAdminPassword('');
    setTimeout(() => setAdminFeedback(''), 3000);
  };

  const authorityUsers = users.filter(u => u.role === 'authority');
  const studentUsers = users.filter(u => u.role === 'student');

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 gradient-primary">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-display font-bold text-primary-foreground">Admin Dashboard</h1>
            <p className="text-xs text-primary-foreground/70">Webmaster Panel</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowAddDialog(true)} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <Plus className="w-4 h-4 mr-1" /> Add User
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Authorities', value: authorities.length, icon: <Shield className="w-5 h-5" /> },
            { label: 'Total Slots', value: totalSlots, icon: <CalendarCheck className="w-5 h-5" /> },
            { label: 'Booked', value: bookedSlots, icon: <BarChart3 className="w-5 h-5" /> },
            { label: 'Pending Tickets', value: pendingTickets, icon: <Clock className="w-5 h-5" /> },
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

        {/* Admin Account Settings */}
        <Card className="card-shadow border-border">
          <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><Settings className="w-4 h-4" /> Admin Account Settings</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">Change your admin login username or password. Current username: <code className="bg-muted px-1 py-0.5 rounded text-foreground">{user.id}</code></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">New Username</label>
                <Input placeholder="Leave blank to keep current" value={adminUsername} onChange={e => setAdminUsername(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">New Password</label>
                <Input type="password" placeholder="Leave blank to keep current" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleAdminCredUpdate} className="gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Update Admin Credentials
            </Button>
            {adminFeedback && <p className={`text-sm ${adminFeedback.includes('success') ? 'text-status-available' : 'text-destructive'}`}>{adminFeedback}</p>}
          </CardContent>
        </Card>

        {/* CSV Upload */}
        <Card className="card-shadow border-border">
          <CardHeader><CardTitle className="font-display text-base flex items-center gap-2"><Upload className="w-4 h-4" /> Import Authorities via CSV</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">CSV format: <code className="bg-muted px-1 py-0.5 rounded text-foreground">authority_id, name, designation, email, password</code></p>
            <Input ref={fileRef} type="file" accept=".csv" onChange={handleCSVUpload} />
            {csvFeedback && <p className={`text-sm ${csvFeedback.includes('success') ? 'text-status-available' : 'text-destructive'}`}>{csvFeedback}</p>}
          </CardContent>
        </Card>

        {/* Authorities with edit */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" /> All Authorities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {authorities.map(auth => {
              const authTickets = tickets.filter(t => t.authorityId === auth.id);
              const authSlots = slots.filter(s => s.authorityId === auth.id);
              const isEditing = editingId === auth.id;
              return (
                <Card key={auth.id} className="card-shadow border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-1.5">
                            <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm" placeholder="Name" autoFocus />
                            <Input value={editDesignation} onChange={e => setEditDesignation(e.target.value)} className="h-7 text-sm" placeholder="Designation" />
                            <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="h-7 text-sm" placeholder="Email" />
                            <div className="flex gap-1">
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-status-available" onClick={() => saveEdit(auth.id)}><Check className="w-3.5 h-3.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={cancelEdit}><X className="w-3.5 h-3.5" /></Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-1">
                              <h3 className="font-display font-semibold text-foreground text-sm truncate">{auth.name}</h3>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => startEdit(auth)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{auth.designation}</p>
                            <p className="text-xs text-muted-foreground">{auth.email}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={auth.status === 'in-office' ? 'status-available' : 'status-booked'}>
                          {auth.status === 'in-office' ? 'In Office' : 'Away'}
                        </Badge>
                        <Button
                          size="sm"
                          variant={auth.available ? 'default' : 'destructive'}
                          className="text-xs h-6 px-2"
                          onClick={() => toggleAuthorityAvailability(auth.id)}
                        >
                          <Power className="w-3 h-3 mr-1" />
                          {auth.available ? 'Available' : 'Unavailable'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mt-3">
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-foreground">{authTickets.length}</div>
                        <div>Tickets</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-foreground">{authSlots.filter(s => s.status === 'free').length}</div>
                        <div>Free</div>
                      </div>
                      <div className="text-center p-2 bg-muted rounded">
                        <div className="font-bold text-foreground">{auth.avgWaitTime}m</div>
                        <div>Avg Wait</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Credentials Section with edit */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <KeyRound className="w-5 h-5" /> All Credentials
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Authority Credentials */}
            <Card className="card-shadow border-border">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3">Authority Credentials</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">ID</th>
                        <th className="py-2 pr-2 font-medium">Name</th>
                        <th className="py-2 pr-2 font-medium">Password</th>
                        <th className="py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {authorityUsers.map(u => (
                        <tr key={u.id} className="border-b border-border">
                          {editCredId === u.id ? (
                            <>
                              <td className="py-2 pr-2 text-foreground font-mono text-xs">{u.id}</td>
                              <td className="py-2 pr-2"><Input value={editCredName} onChange={e => setEditCredName(e.target.value)} className="h-7 text-xs w-full" /></td>
                              <td className="py-2 pr-2"><Input value={editCredPassword} onChange={e => setEditCredPassword(e.target.value)} className="h-7 text-xs w-full" /></td>
                              <td className="py-2 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-status-available" onClick={() => saveCredEdit(u.id)}><Check className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setEditCredId(null)}><X className="w-3 h-3" /></Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 pr-2 text-foreground font-mono text-xs">{u.id}</td>
                              <td className="py-2 pr-2 text-foreground text-xs">{u.name}</td>
                              <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">{credentials[u.id]}</td>
                              <td className="py-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => startCredEdit(u.id, u.name)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            {/* Student Credentials */}
            <Card className="card-shadow border-border">
              <CardContent className="p-4">
                <h3 className="font-display font-semibold text-foreground text-sm mb-3">Student Credentials</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">ID</th>
                        <th className="py-2 pr-2 font-medium">Name</th>
                        <th className="py-2 pr-2 font-medium">Password</th>
                        <th className="py-2 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentUsers.map(u => (
                        <tr key={u.id} className="border-b border-border">
                          {editCredId === u.id ? (
                            <>
                              <td className="py-2 pr-2 text-foreground font-mono text-xs">{u.id}</td>
                              <td className="py-2 pr-2"><Input value={editCredName} onChange={e => setEditCredName(e.target.value)} className="h-7 text-xs w-full" /></td>
                              <td className="py-2 pr-2"><Input value={editCredPassword} onChange={e => setEditCredPassword(e.target.value)} className="h-7 text-xs w-full" /></td>
                              <td className="py-2 flex gap-1">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-status-available" onClick={() => saveCredEdit(u.id)}><Check className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setEditCredId(null)}><X className="w-3 h-3" /></Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 pr-2 text-foreground font-mono text-xs">{u.id}</td>
                              <td className="py-2 pr-2 text-foreground text-xs">{u.name}</td>
                              <td className="py-2 pr-2 font-mono text-xs text-muted-foreground">{credentials[u.id]}</td>
                              <td className="py-2">
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => startCredEdit(u.id, u.name)}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* All Bookings */}
        <section>
          <h2 className="text-lg font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" /> All Bookings ({tickets.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Student</th>
                  <th className="py-2 pr-4 font-medium">Authority</th>
                  <th className="py-2 pr-4 font-medium">Date/Time</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id} className="border-b border-border">
                    <td className="py-2 pr-4 text-foreground">{t.studentName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{t.authorityName}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{t.date} {to12Hour(t.time)}</td>
                    <td className="py-2 pr-4">
                      <Badge className={t.status === 'accepted' ? 'status-available' : t.status === 'denied' ? 'status-booked' : 'status-pending'}>
                        {t.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2"><Plus className="w-5 h-5" /> Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Role</label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as 'student' | 'authority')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="authority">Authority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="User ID (e.g. S210003 or auth7)" value={addId} onChange={e => setAddId(e.target.value)} />
            <Input placeholder="Full Name" value={addName} onChange={e => setAddName(e.target.value)} />
            <Input placeholder="Email" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
            <Input placeholder="Password" value={addPassword} onChange={e => setAddPassword(e.target.value)} />
            {addRole === 'authority' && (
              <Input placeholder="Designation (e.g. HOD - ME)" value={addDesignation} onChange={e => setAddDesignation(e.target.value)} />
            )}
            <Button onClick={handleAddUser} className="w-full gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Add {addRole === 'authority' ? 'Authority' : 'Student'}
            </Button>
            {addFeedback && <p className={`text-sm ${addFeedback.includes('success') ? 'text-status-available' : 'text-destructive'}`}>{addFeedback}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
