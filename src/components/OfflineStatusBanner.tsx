import React from 'react';
import { Wifi, WifiOff, X, CheckCircle2, ShieldCheck, Database, Calendar } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export const OfflineStatusBanner: React.FC = () => {
  const { isOnline, showToast, dismissToast, isCacheReady } = useOfflineStatus();

  if (!showToast) {
    return null;
  }

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-slideDown"
    >
      {!isOnline ? (
        <div className="bg-slate-900/95 text-white border-2 border-amber-400 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
              <WifiOff className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/40 uppercase tracking-wide">
                  অফলাইন মোড
                </span>
                <span className="text-xs font-bold text-slate-200">
                  ইন্টারনেট সংযোগ বিচ্ছিন্ন
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                কোনো সমস্যা নেই! ব্রাউজার ক্যাশ ও লোকাল মেমোরি থেকে <strong className="text-amber-200">ক্যালেন্ডার ও ছুটি ২০২৬</strong>, <strong className="text-emerald-200">জরুরি হেল্পলাইন</strong> এবং সংরক্ষিত সকল তথ্য সম্পূর্ণ লোড থাকবে।
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-emerald-400 font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ক্যাশ স্টোরেজ সক্রিয়
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  পূর্বের ডেটা সংরক্ষিত
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer flex-shrink-0"
            title="নোটিফিকেশন বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="bg-emerald-900/95 text-white border-2 border-emerald-400 p-3.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/30 border border-emerald-400 text-emerald-300 flex items-center justify-center flex-shrink-0">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-black text-emerald-200 flex items-center gap-1.5">
                <span>ইন্টারনেট সংযোগ চালু হয়েছে</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </h4>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                অ্যাপটি অনলাইনে পুরোপুরি সংযুক্ত এবং নতুন ডেটা স্বয়ংক্রিয়ভাবে ক্যাশে সিঙ্ক হচ্ছে।
              </p>
            </div>
          </div>

          <button
            onClick={dismissToast}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition cursor-pointer flex-shrink-0"
            title="নোটিফিকেশন বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
