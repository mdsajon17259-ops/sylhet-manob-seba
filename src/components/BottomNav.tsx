import React from 'react';
import { Home, Users, Droplet, BellRing, Wallet, Calendar } from 'lucide-react';
import { ActiveScreen } from '../types';

interface BottomNavProps {
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  noticeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeScreen,
  setActiveScreen,
  noticeCount = 0,
}) => {
  const navItems: { id: ActiveScreen; label: string; icon: React.ReactNode; badge?: number; isBlood?: boolean; isCalendar?: boolean }[] = [
    {
      id: 'home',
      label: 'হোম',
      icon: <Home className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'members',
      label: 'সদস্য',
      icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'blood',
      label: 'রক্তদান',
      icon: <Droplet className="w-4 h-4 sm:w-5 sm:h-5" />,
      isBlood: true,
    },
    {
      id: 'notices',
      label: 'নোটিশ',
      icon: <BellRing className="w-4 h-4 sm:w-5 sm:h-5" />,
      badge: noticeCount,
    },
    {
      id: 'fund',
      label: 'ফান্ড',
      icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'calendar',
      label: 'ক্যালেন্ডার',
      icon: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />,
      isCalendar: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-1 py-1 sm:hidden">
      <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5">
        {navItems.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              id={`bottom-nav-${item.id}`}
              onClick={() => setActiveScreen(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? item.isBlood
                    ? 'text-rose-600 font-bold'
                    : item.isCalendar
                    ? 'text-amber-700 font-bold'
                    : 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-colors ${
                  isActive
                    ? item.isBlood
                      ? 'bg-rose-50 text-rose-600'
                      : item.isCalendar
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                    : ''
                }`}
              >
                {item.icon}
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white rounded-full text-[8px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] tracking-tight truncate max-w-full font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

