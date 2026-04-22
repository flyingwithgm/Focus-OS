import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import confetti from 'canvas-confetti';

export function Onboarding() {
  const [step, setStep] = React.useState(1);
  const updateProfile = useStore(state => state.updateProfile);
  const updatePreferences = useStore(state => state.updatePreferences);
  const loadSampleData = useStore(state => state.loadSampleData);
  const profile = useStore(state => state.profile);

  const handleComplete = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0be7a4', '#57a3ff', '#f2ad46']
    });
    updateProfile({ onboardingDone: true });
  };

  const handleLoadSample = () => {
    loadSampleData();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#0be7a4', '#57a3ff', '#f2ad46']
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 sm:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      <div className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl flex flex-col h-[500px]">
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-2 rounded-full transition-all duration-500 ${s === step ? 'w-8 bg-primary mint-glow' : s < step ? 'w-4 bg-primary/50' : 'w-4 bg-border'}`} />
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
        </div>

        <div className="flex-1 relative">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to FocusOS</h2>
                  <p className="text-muted-foreground">Let's set up your command center.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>What should we call you?</Label>
                    <Input placeholder="e.g. George" value={profile.name} onChange={e => updateProfile({ name: e.target.value })} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>University Scale</Label>
                    <Select value={profile.university} onValueChange={v => updateProfile({ university: v })}>
                      <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UG">University of Ghana</SelectItem>
                        <SelectItem value="KNUST">KNUST</SelectItem>
                        <SelectItem value="US">US / Canada (4.0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Rhythm</h2>
                  <p className="text-muted-foreground">Configure your default focus blocks.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default Focus Session (min)</Label>
                    <Select value={profile.preferences.sessionMin.toString()} onValueChange={v => updatePreferences({ sessionMin: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 minutes (Pomodoro)</SelectItem>
                        <SelectItem value="50">50 minutes</SelectItem>
                        <SelectItem value="90">90 minutes (Deep Work)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Daily Focus Goal (min)</Label>
                    <Select value={profile.preferences.dailyGoalMin.toString()} onValueChange={v => updatePreferences({ dailyGoalMin: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="360">6 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Visual Mode</h2>
                  <p className="text-muted-foreground">Choose your cockpit lighting.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-4 transition-all ${profile.preferences.theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    onClick={() => {
                      updatePreferences({ theme: 'light' });
                      document.documentElement.classList.remove('dark');
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-white border shadow-sm flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#e7ebf8] rounded-sm"></div>
                    </div>
                    <span className="font-medium text-foreground">Light</span>
                  </div>
                  <div 
                    className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-4 transition-all ${profile.preferences.theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                    onClick={() => {
                      updatePreferences({ theme: 'dark' });
                      document.documentElement.classList.add('dark');
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#060915] border shadow-sm flex items-center justify-center">
                      <div className="w-6 h-6 bg-[#0be7a4] rounded-sm"></div>
                    </div>
                    <span className="font-medium text-foreground">Dark</span>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 flex flex-col gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Ready for Liftoff</h2>
                  <p className="text-muted-foreground">Do you want to start fresh or load some sample data to see how it works?</p>
                </div>
                
                <div className="flex flex-col gap-4 mt-auto">
                  <Button size="lg" className="w-full text-lg mint-glow" onClick={handleLoadSample}>
                    Load Sample Data (Recommended)
                  </Button>
                  <Button size="lg" variant="outline" className="w-full" onClick={handleComplete}>
                    Start Fresh
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || step === 4}>
            Back
          </Button>
          {step < 4 && (
            <Button onClick={() => setStep(Math.min(4, step + 1))} disabled={step === 1 && !profile.name}>
              Continue
            </Button>
          )}
        </div>

      </div>
    </div>
  );
}
