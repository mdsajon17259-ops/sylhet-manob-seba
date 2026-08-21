import React from 'react';
import { Home, Users, Droplet, BellRing, Wallet } from 'lucide-react';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  noticeCount?: number;
  readyDonorsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  setActiveScreen,
  noticeCount = 0,
  readyDonorsCount = 0,
}) => {
  const navItems: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'home',
      label: 'হোম পেজ',
      icon: <Home className="w-5 h-5" />,
    },
    {
      id: 'members',
      label: 'সদস্য তালিকা',
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: 'blood',
      label: 'রক্ত দান',
      icon: <Droplet className="w-5 h-5 fill-current" />,
      badge: readyDonorsCount,
    },
    {
      id: 'notices',
      label: 'জরুরি নোটিশ',
      icon: <BellRing className="w-5 h-5" />,
      badge: noticeCount,
    },
    {
      id: 'fund',
      label: 'ফান্ড হিসাব',
      icon: <Wallet className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 sm:hidden">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setActiveScreen(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`relative p-1 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-700' : ''}`}>
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
