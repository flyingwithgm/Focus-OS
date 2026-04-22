import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Settings, Database, Trash2, Download, Upload } from 'lucide-react';
import { SCALES } from '@/lib/gpa';
import { toast } from 'sonner';

export default function Profile() {
  const profile = useStore(state => state.profile);
  const updateProfile = useStore(state => state.updateProfile);
  const updatePreferences = useStore(state => state.updatePreferences);
  const resetData = useStore(state => state.resetData);

  const [name, setName] = useState(profile.name);

  const handleSaveProfile = () => {
    updateProfile({ name });
    toast.success('Profile updated');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetData();
      toast.success('Data reset successfully');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings.</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" /> Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-background/50" />
                <Button onClick={handleSaveProfile} className="mint-glow">Save</Button>
              </div>
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
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" /> Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default Session Length</Label>
              <Select value={profile.preferences.sessionMin.toString()} onValueChange={v => updatePreferences({ sessionMin: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 minutes</SelectItem>
                  <SelectItem value="50">50 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={profile.preferences.theme} onValueChange={(v: 'dark' | 'light') => {
                updatePreferences({ theme: v });
                document.documentElement.classList.toggle('dark', v === 'dark');
              }}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark (Cockpit)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="glass md:col-span-2 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Database className="w-5 h-5" /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleReset}>
              <Trash2 className="w-4 h-4 mr-2" /> Reset All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
