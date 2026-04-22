import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, X, Music, Volume2, Target, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { audioPlayer } from '@/lib/audio';
import { toast } from 'sonner';

export default function Focus() {
  const [location, setLocation] = useLocation();
  const profile = useStore(state => state.profile);
  const activeSessionId = useStore(state => state.activeFocusSessionId);
  const setActiveSession = useStore(state => state.setActiveFocusSessionId);
  const addSession = useStore(state => state.addSession);
  const addXP = useStore(state => state.addXP);

  const [timeLeft, setTimeLeft] = useState(profile.preferences.sessionMin * 60);
  const [isActive, setIsActive] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [volume, setVolume] = useState(50);
  const [showQuality, setShowQuality] = useState(false);
  const [track, setTrack] = useState<'ambient' | 'lofi' | 'rain' | null>(null);

  const timerRef = useRef<number | null>(null);
  const totalTime = profile.preferences.sessionMin * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(crypto.randomUUID());
    }
    return () => {
      audioPlayer.stop();
    };
  }, []);

  const handlePlayPause = () => {
    setIsActive(!isActive);
    if (!isActive && track) {
      audioPlayer.resume();
    } else if (isActive) {
      audioPlayer.pause();
    }
  };

  const handleTrackChange = (newTrack: 'ambient' | 'lofi' | 'rain') => {
    if (track === newTrack) {
      audioPlayer.pause();
      setTrack(null);
    } else {
      setTrack(newTrack);
      audioPlayer.play(newTrack);
      if (!isActive) setIsActive(true);
    }
  };

  const handleVolumeChange = (vals: number[]) => {
    const v = vals[0];
    setVolume(v);
    audioPlayer.setVolume(v / 100);
  };

  const handleComplete = () => {
    setIsActive(false);
    audioPlayer.stop();
    setShowQuality(true);
  };

  const handleEndEarly = () => {
    if (confirm('Are you sure you want to end this session early?')) {
      handleComplete();
    }
  };

  const submitSession = (quality: 'done' | 'partial' | 'rescheduled') => {
    const actualMin = Math.round((totalTime - timeLeft) / 60);
    addSession({
      startedAt: new Date(Date.now() - actualMin * 60000).toISOString(),
      endedAt: new Date().toISOString(),
      plannedMin: profile.preferences.sessionMin,
      actualMin,
      quality
    });
    
    let xpEarned = 0;
    if (quality === 'done') xpEarned = 20;
    else if (quality === 'partial') xpEarned = 10;
    else xpEarned = 5;
    
    addXP(xpEarned);
    toast.success(`Session logged! +${xpEarned} XP`);
    
    setActiveSession(null);
    setLocation('/');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (showQuality) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-sm w-full space-y-6">
          <Target className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold">Session Complete</h2>
          <p className="text-muted-foreground">How was your focus?</p>
          
          <div className="flex flex-col gap-3 mt-8">
            <Button size="lg" className="w-full text-lg mint-glow" onClick={() => submitSession('done')}>
              Deep Focus (Done) <span className="text-primary-foreground/70 ml-auto">+20 XP</span>
            </Button>
            <Button size="lg" variant="secondary" className="w-full text-lg" onClick={() => submitSession('partial')}>
              Distracted (Partial) <span className="text-foreground/50 ml-auto">+10 XP</span>
            </Button>
            <Button size="lg" variant="outline" className="w-full text-lg border-white/10" onClick={() => submitSession('rescheduled')}>
              Interrupted (Reschedule) <span className="text-foreground/50 ml-auto">+5 XP</span>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background ambient glow based on progress */}
      <div 
        className="absolute inset-0 opacity-10 transition-opacity duration-1000 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle at center, var(--color-primary) 0%, transparent ${Math.max(30, progress)}%)` 
        }}
      />

      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <Button variant="ghost" size="icon" onClick={handleEndEarly} className="rounded-full text-muted-foreground hover:bg-destructive/20 hover:text-destructive">
          <X className="w-6 h-6" />
        </Button>
        <div className="glass px-4 py-1.5 rounded-full text-sm font-medium tracking-widest uppercase">
          FOCUS MODE
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowMusic(!showMusic)} className={`rounded-full transition-colors ${showMusic || track ? 'text-primary mint-glow bg-primary/10' : 'text-muted-foreground'}`}>
          <Music className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Timer Ring */}
        <div className="relative w-72 h-72 sm:w-96 sm:h-96 mb-12">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="50%" cy="50%" r="48%" className="stroke-secondary fill-none" strokeWidth="8" />
            <circle 
              cx="50%" cy="50%" r="48%" 
              className="stroke-primary fill-none transition-all duration-1000 ease-linear drop-shadow-[0_0_15px_rgba(11,231,164,0.5)]" 
              strokeWidth="8" 
              strokeLinecap="round"
              strokeDasharray="300%"
              strokeDashoffset={`${300 - (progress * 3)}%`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl sm:text-8xl font-bold tabular-nums tracking-tighter drop-shadow-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <Button 
          size="lg" 
          className={`h-20 w-20 rounded-full ${isActive ? 'bg-secondary hover:bg-secondary/80 text-foreground' : 'bg-primary hover:bg-primary/90 text-primary-foreground mint-glow shadow-lg shadow-primary/30'} transition-all duration-300 transform hover:scale-105 active:scale-95`}
          onClick={handlePlayPause}
        >
          {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </Button>
      </div>

      {/* Music Panel */}
      <AnimatePresence>
        {showMusic && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 glass rounded-2xl p-6 w-[90%] max-w-md z-20 shadow-2xl border-white/10"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2"><Music className="w-4 h-4" /> Focus Audio</h3>
            <div className="flex justify-between gap-2 mb-6">
              <Button variant={track === 'lofi' ? 'default' : 'secondary'} className={track === 'lofi' ? 'mint-glow' : ''} onClick={() => handleTrackChange('lofi')}>Lo-Fi</Button>
              <Button variant={track === 'ambient' ? 'default' : 'secondary'} className={track === 'ambient' ? 'mint-glow' : ''} onClick={() => handleTrackChange('ambient')}>Ambient</Button>
              <Button variant={track === 'rain' ? 'default' : 'secondary'} className={track === 'rain' ? 'mint-glow' : ''} onClick={() => handleTrackChange('rain')}>Rain</Button>
            </div>
            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider value={[volume]} min={0} max={100} step={1} onValueChange={handleVolumeChange} className="flex-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
