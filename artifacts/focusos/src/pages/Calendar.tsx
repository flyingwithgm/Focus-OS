import React from 'react';
import { useStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Plus, Target, CheckCircle2 } from 'lucide-react';

export default function Calendar() {
  const events = useStore(state => state.events);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Calendar.</h1>
      </div>
      
      <div className="glass p-8 rounded-2xl text-center space-y-4">
        <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
        <h2 className="text-xl font-bold">Calendar View</h2>
        <p className="text-muted-foreground">This is where you'll see your monthly and weekly events.</p>
        <p className="text-sm text-muted-foreground">(Fully functional calendar requires a bit more space, but the events are loaded!)</p>
      </div>
    </div>
  );
}
