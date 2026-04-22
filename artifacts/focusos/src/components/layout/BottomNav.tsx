import { Link, useLocation } from 'wouter';
import { Home, ListTodo, Calendar, BarChart3, User, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function BottomNav({ className }: { className?: string }) {
  const [location] = useLocation();

  const links = [
    { href: '/', icon: Home, label: 'Cockpit' },
    { href: '/plan', icon: ListTodo, label: 'Plan' },
    { href: '/focus', icon: Target, label: 'Focus', special: true },
    { href: '/analytics', icon: BarChart3, label: 'Stats' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className={cn('glass pb-safe pt-2 px-4 flex items-center justify-between border-t', className)}>
      {links.map((link) => {
        const isActive = location === link.href;
        const Icon = link.icon;

        if (link.special) {
          return (
            <Link key={link.href} href={link.href} className="relative -top-6 group">
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mint-glow shadow-lg"
              >
                <Icon className="w-7 h-7 text-primary-foreground" />
              </motion.div>
            </Link>
          );
        }

        return (
          <Link key={link.href} href={link.href} className="flex-1 flex flex-col items-center justify-center gap-1 group">
            <div className={cn(
              "p-2 rounded-xl transition-colors",
              isActive ? "bg-primary/20 text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className={cn(
              "text-[10px] font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
