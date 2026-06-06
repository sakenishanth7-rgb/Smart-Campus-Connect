import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, GraduationCap, UserCog } from 'lucide-react';

type RoleTab = 'student' | 'authority' | 'admin';

const roleConfig: Record<RoleTab, { label: string; icon: React.ReactNode; placeholder: string; hint: string }> = {
  student: { label: 'Student', icon: <GraduationCap className="w-5 h-5" />, placeholder: 'e.g. S210001', hint: 'Demo: S210001 / student123' },
  authority: { label: 'Authority', icon: <Shield className="w-5 h-5" />, placeholder: 'e.g. auth1', hint: 'Demo: auth1 / pass123' },
  admin: { label: 'Admin', icon: <UserCog className="w-5 h-5" />, placeholder: 'Enter Admin Username', hint: '' },
};

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<RoleTab>('student');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedId = userId.trim();
    const trimmedPass = password.trim();
    if (!trimmedId || !trimmedPass) {
      setError('Please enter both ID and password.');
      return;
    }
    const success = login(trimmedId, trimmedPass);
    if (success) {
      if (selectedRole === 'admin') navigate('/admin');
      else if (selectedRole === 'authority') navigate('/authority');
      else navigate('/student');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">RGUKT Campus</h1>
          <p className="text-muted-foreground mt-1">Smart Permission & Appointment System</p>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(roleConfig) as RoleTab[]).map(role => (
            <button
              key={role}
              onClick={() => { setSelectedRole(role); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                selectedRole === role
                  ? 'gradient-primary text-primary-foreground shadow-md'
                  : 'bg-muted text-muted-foreground hover:bg-secondary'
              }`}
            >
              {roleConfig[role].icon}
              {roleConfig[role].label}
            </button>
          ))}
        </div>

        <Card className="card-shadow border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-display">Sign In as {roleConfig[selectedRole].label}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  placeholder={roleConfig[selectedRole].placeholder}
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  maxLength={100}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                Sign In
              </Button>
              {roleConfig[selectedRole].hint && <p className="text-xs text-center text-muted-foreground">{roleConfig[selectedRole].hint}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
