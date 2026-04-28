import React from 'react';
import { useTimetableSync } from './useTimetable';

/**
 * TimetableDisplay component for Focus-OS
 * Drop this into your app to verify the sync and sort logic works!
 */
export const TimetableDisplay = ({ userId }: { userId: string }) => {
  const { classes, loading, error } = useTimetableSync(userId);

  if (loading) return <div className="p-12 text-center animate-pulse text-zinc-400 font-medium">Syncing with Focus-OS Cloud...</div>;
  
  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">
      ⚠️ Focus-OS Sync Error: {error.message}
    </div>
  );

  return (
    <div className="space-y-4 p-6 bg-black/40 backdrop-blur-xl rounded-[28px] border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Your Schedule</h2>
        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Live</div>
      </div>

      {classes.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 font-light italic">No classes found. Add one to Firestore to see the magic.</div>
      ) : (
        <div className="grid gap-3">
          {classes.map((item) => (
            <div key={item.id} className="group flex items-center justify-between p-5 bg-white/5 hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all duration-300">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-widest leading-none">{item.dayOfWeek}</span>
                <span className="text-white font-semibold text-lg leading-tight group-hover:text-emerald-300 transition-colors">{item.title}</span>
                {item.location && <span className="text-xs text-zinc-400 font-medium opacity-60">{item.location}</span>}
              </div>
              <div className="text-right flex flex-col justify-center">
                <div className="text-white font-mono font-bold text-2xl tracking-tighter leading-none">{item.startTime}</div>
                <div className="text-zinc-500 text-[10px] font-mono mt-1 opacity-50 uppercase">{item.endTime}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};