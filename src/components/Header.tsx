import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  PhoneCall, 
  ArrowLeft,
  Settings,
  MapPin,
  Calendar
} from 'lucide-react';
import { ActiveScreen, OrganizationProfile } from '../types';
import orgLogo from '../assets/images/org_logo_1787709579485.jpg';

interface HeaderProps {
  profile: OrganizationProfile;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  openAdminModal: () => void;
  openEmergencyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeScreen,
  setActiveScreen,
  isAdmin,
  setIsAdmin,
  openAdminModal,
  openEmergencyModal,
}) => {
  return (
    <header className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-md sticky top-0 z-30">
      {/* Top Micro Bar */}
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex justify-between items-center text-xs border-b border-emerald-600/50">
        <div className="flex items-center gap-2 text-emerald-100 font-medium">
          <span className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2 py-0.5 rounded text-[11px] font-bold">
            <Calendar className="w-3 h-3 text-amber-300" />
            {profile.establishedDate || 'স্থাপিত : ১৫/০৮/২০২২ইং'}
          </span>
          <span className="hidden sm:inline text-emerald-300">•</span>
          <span className="hidden sm:inline flex items-center gap-1">
            <MapPin className="w-3 h-3 text-emerald-300 flex-shrink-0" />
            {profile.address}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={openEmergencyModal}
            id="emergency-top-btn"
            className="flex items-center gap-1.5 text-emerald-100 hover:text-white bg-emerald-900/80 hover:bg-emerald-950 border border-emerald-500/50 px-3 py-1 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            title="জরুরি হেল্পলাইন নম্বরসমূহ"
          >
            <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
            <span>জরুরি হেল্পলাইন</span>
          </button>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
        <div 
          onClick={() => setActiveScreen('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
          id="header-brand"
        >
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center p-0.5 border-2 border-emerald-200/80 group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
            <img 
              src={orgLogo} 
              alt={profile.name} 
              className="w-full h-full object-cover rounded-xl"
              onError={(e) => {
                // Fallback gracefully if image fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              {profile.name}
            </h1>
            <div className="text-xs text-emerald-100 font-medium flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span className="font-bold text-amber-300 bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-600/50">
                {profile.establishedDate || 'স্থাপিত : ১৫/০৮/২০২২ইং'}
              </span>
              <span>•</span>
              <span>{profile.tagline}</span>
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {activeScreen !== 'home' && (
            <button
              onClick={() => setActiveScreen('home')}
              id="nav-home-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-900 text-white text-xs font-semibold border border-emerald-500/40 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>হোম</span>
            </button>
          )}

          {/* Admin panel direct access button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveScreen('admin')}
                id="header-goto-admin-btn"
                className="flex items-center gap-1.5 hover:text-white"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>এডমিন প্যানেল</span>
              </button>
              <button
                onClick={() => {
                  setIsAdmin(false);
                  if (activeScreen === 'admin') setActiveScreen('home');
                }}
                id="logout-admin-btn"
                className="ml-1 text-[10px] bg-amber-900/80 hover:bg-amber-900 text-amber-200 px-2 py-0.5 rounded-md border border-amber-500/30"
              >
                লগআউট
              </button>
            </div>
          ) : (
            <button
              onClick={openAdminModal}
              id="admin-login-btn"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-950 text-emerald-100 text-xs font-bold border border-emerald-500/50 transition hover:text-white shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>এডমিন প্যানেল</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
