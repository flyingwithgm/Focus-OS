import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, Database, Trash2, Shield, Moon, Sun, Clock, Calendar, RefreshCw, GraduationCap, Flame, Target, CheckCircle, Download, Upload } from 'lucide-react';
import { SCALES } from '@/lib/gpa';
import { toast } from 'sonner';
import { BADGES } from '@/lib/achievements';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { clearFocusOsLocalCache, FOCUSOS_STORAGE_KEY } from '@/lib/store';

export default function Profile() {
  const { user } = useAuth();
  const profile = useStore(state => state.profile);
  const courses = useStore(state => state.courses);
  const updateProfile = useStore(state => state.updateProfile);
  const updatePreferences = useStore(state => state.updatePreferences);
  const addCourse = useStore(state => state.addCourse);
  const deleteCourse = useStore(state => state.deleteCourse);
  const resetData = useStore(state => state.resetData);

  const [name, setName] = useState(profile.name);
  const [year, setYear] = useState(profile.year);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseCredits, setNewCourseCredits] = useState(3);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    updateProfile({ name, year });
    toast.success('Profile updated');
  };

  const handleAddCourse = () => {
    if (!newCourseCode) return;
    addCourse({ code: newCourseCode, title: newCourseCode, credits: newCourseCredits, color: '#0be7a4' });
    setNewCourseCode('');
    setNewCourseCredits(3);
    toast.success('Course added');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetData();
      toast.success('Data reset successfully');
    }
  };

  const handleExport = () => {
    const data = localStorage.getItem(FOCUSOS_STORAGE_KEY);
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
          throw new Error('Invalid backup shape');
        }
        localStorage.setItem(FOCUSOS_STORAGE_KEY, content);
        toast.success('Data imported. Reloading...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err) {
        toast.error('Invalid backup file');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  const toggleSetting = (key: keyof typeof profile.preferences) => {
    updatePreferences({ [key]: !profile.preferences[key] });
  };

  const toggleNotification = (key: keyof typeof profile.preferences.notifications) => {
    updatePreferences({ 
      notifications: { ...profile.preferences.notifications, [key]: !profile.preferences.notifications[key] } 
    });
  };

  const handleSignOut = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
      toast.success('Signed out.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not sign out.';
      toast.error(message);
    }
  };

  const handleReloadCloudData = () => {
    if (!user) {
      toast.error('Sign in first so we can reload cloud data.');
      return;
    }

    if (!confirm('This clears the local device cache and reloads data from your signed-in cloud account. Continue?')) {
      return;
    }

    resetData();
    clearFocusOsLocalCache();
    toast.success('Local cache cleared. Reloading cloud data...');
    window.setTimeout(() => window.location.reload(), 300);
  };

  const earnedBadgeIds = new Set(profile.badges?.map(b => b.id) || []);

  const badgeIcons: Record<string, any> = { Target, Flame, Clock, CheckCircle, Shield, Moon, Sun, Calendar, RefreshCw, GraduationCap };

  return (
    <div className="page-shell">
      <div className="section-card">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Personal system</div>
        <h1 className="mt-2 balanced-title">Profile & Settings.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tune identity, study habits, accessibility, and backups from one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Connected Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-background/40 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Signed in as</p>
              <p className="mt-2 font-semibold">{user?.displayName || profile.name || 'FocusOS user'}</p>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email || 'No email available'}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>Year of Study</Label>
              <Input value={year} onChange={e => setYear(e.target.value)} className="bg-background/50" />
            </div>
            <div className="space-y-2">
              <Label>University Scale</Label>
              <Select value={profile.university} onValueChange={v => updateProfile({ university: v })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SCALES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSaveProfile} className="mint-glow w-full">Save Identity</Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Weekly Target Hours: {profile.preferences.weeklyTargetHours || 20}h</Label>
              <Input type="range" min="5" max="40" value={profile.preferences.weeklyTargetHours || 20} onChange={e => updatePreferences({ weeklyTargetHours: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div className="space-y-2">
              <Label>Default Session Length</Label>
              <Select value={profile.preferences.sessionMin.toString()} onValueChange={v => updatePreferences({ sessionMin: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Break Length</Label>
              <Select value={profile.preferences.breakMin.toString()} onValueChange={v => updatePreferences({ breakMin: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-primary" /> Display
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Dark Mode</Label>
              <Switch checked={profile.preferences.theme === 'dark'} onCheckedChange={(c) => {
                updatePreferences({ theme: c ? 'dark' : 'light' });
                document.documentElement.classList.toggle('dark', c);
              }} />
            </div>
            <div className="flex items-center justify-between">
              <Label>High Contrast</Label>
              <Switch checked={profile.preferences.highContrast} onCheckedChange={(c) => {
                updatePreferences({ highContrast: c });
                document.documentElement.classList.toggle('hc', c);
              }} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Large Text</Label>
              <Switch checked={profile.preferences.fontSize === 'large'} onCheckedChange={(c) => {
                updatePreferences({ fontSize: c ? 'large' : 'normal' });
                document.documentElement.classList.toggle('text-lg-mode', c);
              }} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Task Due Reminders</Label>
              <Switch checked={profile.preferences.notifications.tasks} onCheckedChange={() => toggleNotification('tasks')} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Exam Countdowns</Label>
              <Switch checked={profile.preferences.notifications.exams} onCheckedChange={() => toggleNotification('exams')} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Class Reminders</Label>
              <Switch checked={profile.preferences.notifications.classes} onCheckedChange={() => toggleNotification('classes')} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Streak Warnings</Label>
              <Switch checked={profile.preferences.notifications.streak} onCheckedChange={() => toggleNotification('streak')} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Course Manager
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input placeholder="Course Code" value={newCourseCode} onChange={e => setNewCourseCode(e.target.value)} className="bg-background/50 flex-1" />
              <Input type="number" min="1" max="6" value={newCourseCredits} onChange={e => setNewCourseCredits(parseInt(e.target.value))} className="bg-background/50 sm:w-20" />
              <Button onClick={handleAddCourse} className="mint-glow w-full sm:w-auto">Add</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {courses.map(c => (
                <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="font-medium">{c.code}</span>
                    <span className="text-xs text-muted-foreground">{c.credits} cr</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/20 hover:text-destructive" onClick={() => deleteCourse(c.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {BADGES.map(badge => {
                const Icon = badgeIcons[badge.icon] || Shield;
                const earned = earnedBadgeIds.has(badge.id);
                return (
                  <div key={badge.id} className={`flex flex-col items-center text-center p-3 rounded-xl border ${earned ? 'border-primary bg-primary/10 mint-glow' : 'border-white/5 bg-background/30 grayscale opacity-50'}`}>
                    <Icon className={`w-8 h-8 mb-2 ${earned ? 'text-primary' : 'text-muted-foreground'}`} />
                    <h4 className="text-xs font-bold">{badge.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Database className="w-5 h-5" /> Data & Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-2" /> Import JSON
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
            <Button variant="outline" onClick={handleReloadCloudData} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" /> Reload Cloud Data
            </Button>
            <Button variant="outline" onClick={() => updateProfile({ demoTourDone: false })} className="w-full sm:w-auto">
              Replay Tour
            </Button>
            <div className="w-full h-px bg-border my-2" />
            <Button variant="outline" className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground sm:w-auto" onClick={handleReset}>
              <Trash2 className="w-4 h-4 mr-2" /> Reset All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
