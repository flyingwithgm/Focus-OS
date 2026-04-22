import { Link, useLocation } from 'wouter';
import { Home, ListTodo, Calendar as CalendarIcon, Clock, BarChart3, Brain, Target, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();

  const links = [
    { href: '/', icon: Home, label: 'Cockpit' },
    { href: '/plan', icon: ListTodo, label: 'Plan' },
    { href: '/calendar', icon: CalendarIcon, label: 'Calendar' },
    { href: '/schedule', icon: Clock, label: 'Schedule' },
    { href: '/analytics', icon: BarChart3, label: 'Stats' },
    { href: '/hub', icon: Brain, label: 'Hub' },
    { href: '/gpa', icon: Target, label: 'GPA' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <aside className={cn('w-64 glass border-r flex flex-col h-[100dvh] sticky top-0', className)}>
      <div className="h-16 flex items-center px-6 gap-3 border-b border-border/50">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mint-glow">
          <img src="/icon-192.png" alt="Logo" className="w-5 h-5" />
        </div>
        <span className="font-bold text-xl tracking-tight">FocusOS</span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-1">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;

          return (
            <Link key={link.href} href={link.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer group",
                isActive 
                  ? "bg-primary/20 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}>
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                {link.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto">
        <Link href="/focus">
          <div className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-bold rounded-xl mint-glow hover:opacity-90 transition-opacity cursor-pointer shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5" />
            Start Focus
          </div>
        </Link>
      </div>
    </aside>
  );
}
