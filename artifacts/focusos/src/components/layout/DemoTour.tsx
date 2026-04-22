import React, { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const TOUR_STEPS = [
  { target: 'body', title: 'Welcome to FocusOS', content: 'Your command center for academic momentum. Let\'s take a quick tour.', path: '/' },
  { target: '.focus-start-btn', title: 'Deep Work', content: 'Start a focus session to earn XP and level up your character.', path: '/' },
  { target: '.nav-plan', title: 'Task Manager', content: 'Organize tasks by priority and estimate. Swipe to complete.', path: '/plan' },
  { target: '.nav-calendar', title: 'Timetable', content: 'Track your classes and get early warnings for upcoming exams.', path: '/calendar' },
  { target: '.nav-schedule', title: 'Time Blocking', content: 'Drag and drop tasks into your daily schedule to guarantee they get done.', path: '/schedule' },
  { target: '.nav-analytics', title: 'Analytics', content: 'Monitor your completion rates and burnout risk score.', path: '/analytics' },
  { target: '.nav-gpa', title: 'GPA Simulator', content: 'Track your trajectory and use AI to predict your final grades.', path: '/gpa' }
];

export function DemoTour() {
  const profile = useStore(state => state.profile);
  const updateProfile = useStore(state => state.updateProfile);
  const [, setLocation] = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (profile.onboardingDone && !profile.demoTourDone) {
      setIsVisible(true);
    }
  }, [profile.onboardingDone, profile.demoTourDone]);

  useEffect(() => {
    if (!isVisible) return;
    const step = TOUR_STEPS[stepIndex];
    setLocation(step.path);
  }, [stepIndex, isVisible, setLocation]);

  if (!isVisible) return null;

  const currentStep = TOUR_STEPS[stepIndex];

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    updateProfile({ demoTourDone: true });
    setLocation('/');
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm pointer-events-auto" onClick={handleClose} />
      
      <AnimatePresence mode="wait">
        <motion.div 
          key={stepIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="glass border-primary/50 p-6 rounded-2xl w-full max-w-sm relative z-10 pointer-events-auto shadow-2xl"
        >
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>

          <div className="mb-6 mt-2">
            <h3 className="text-xl font-bold mb-2">{currentStep.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{currentStep.content}</p>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-1">
              {TOUR_STEPS.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === stepIndex ? 'w-4 bg-primary mint-glow' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handlePrev} disabled={stepIndex === 0}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="sm" className="mint-glow" onClick={handleNext}>
                {stepIndex === TOUR_STEPS.length - 1 ? 'Finish' : <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
