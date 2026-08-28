import React from 'react';
import { 
  Users, 
  Droplet, 
  BellRing, 
  Wallet, 
  ChevronRight, 
  Heart, 
  Calendar, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  SlidersHorizontal,
  MapPin
} from 'lucide-react';
import { ActiveScreen, OrganizationStats, Notice, OrganizationProfile } from '../types';
import { toBengaliNumber, formatTaka } from '../utils/helpers';

interface HomeScreenProps {
  profile: OrganizationProfile;
  onNavigate: (screen: ActiveScreen) => void;
  stats: OrganizationStats;
  latestNotice?: Notice;
  isAdmin: boolean;
  openAdminModal: () => void;
  openEmergencyModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  onNavigate,
  stats,
  latestNotice,
  isAdmin,
  openAdminModal,
  openEmergencyModal,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Latest Notice Ticker */}
      {latestNotice && (
        <div 
          onClick={() => onNavigate('notices')}
          id="home-notice-ticker"
          className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs cursor-pointer hover:bg-red-100/70 transition group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex-shrink-0 bg-red-600 text-white text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 animate-pulse">
              <BellRing className="w-3.5 h-3.5" />
              জরুরি নোটিশ
            </span>
            <p className="text-sm font-semibold text-red-950 truncate">
              {latestNotice.title || latestNotice.noticeText}
            </p>
          </div>
          <span className="flex-shrink-0 text-xs text-red-700 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      )}

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-52 h-52 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-8 w-44 h-44 rounded-full bg-teal-400/10 blur-xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              <span>{profile.establishedDate || 'স্থাপিত : ১৫/০৮/২০২২ইং'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5 text-emerald-300" />
              <span>{profile.address} • {profile.tagline}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
            {profile.name}
          </h2>
          <p className="text-emerald-100/90 text-sm sm:text-base mt-2 leading-relaxed">
            স্বেচ্ছায় রক্তদান, সমাজসেবা, সদস্য ব্যবস্থাপনা এবং সম্পূর্ণ নিজস্ব ইন-অ্যাপ এডমিন প্যানেল দিয়ে পরিচালিত ডিজিটাল পোর্টাল।
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={openEmergencyModal}
              id="home-hero-emergency-helpline-btn"
              className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-400/50 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition hover:shadow cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-amber-300" />
              <span>জরুরি হেল্পলাইন</span>
            </button>
            <button
              onClick={() => {
                if (isAdmin) {
                  onNavigate('admin');
                } else {
                  openAdminModal();
                }
              }}
              id="home-hero-admin-btn"
              className="bg-emerald-950/80 hover:bg-emerald-950 text-emerald-100 font-bold text-sm px-4 py-2.5 rounded-xl border border-emerald-500/50 flex items-center gap-2 transition"
            >
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>ইন-অ্যাপ এডমিন প্যানেল</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 4 Primary Sections Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            প্রধান সেবাসমূহ (Main Features)
          </h3>
          <span className="text-xs text-slate-500">যে কোনো সেবায় ট্যাপ করুন</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. সদস্য তালিকা */}
          <button
            onClick={() => onNavigate('members')}
            id="home-btn-members"
            className="group relative overflow-hidden bg-white hover:bg-slate-50/80 border-2 border-emerald-100 hover:border-emerald-500/80 rounded-2xl p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-13 h-13 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-200">
                <Users className="w-7 h-7" />
              </div>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                {toBengaliNumber(stats.totalMembers)} জন সদস্য
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  ১. সদস্য তালিকা (Members)
                </h4>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                সংগঠনের সকল সদস্যের নাম, পদবি, মোবাইল নম্বর ও রক্তের গ্রুপ ডিরেক্টরি
              </p>
            </div>
          </button>

          {/* 2. রক্ত দান */}
          <button
            onClick={() => onNavigate('blood')}
            id="home-btn-blood"
            className="group relative overflow-hidden bg-white hover:bg-slate-50/80 border-2 border-rose-100 hover:border-rose-500/80 rounded-2xl p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-13 h-13 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors duration-200">
                <Droplet className="w-7 h-7 fill-current" />
              </div>
              <span className="bg-rose-50 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full border border-rose-200">
                {toBengaliNumber(stats.readyDonors)} জন প্রস্তুত দাতা
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-rose-700 transition-colors">
                  ২. রক্ত দান (Blood Donation)
                </h4>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-rose-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                রক্তদাতাদের তালিকা, পরবর্তী সম্ভাব্য তারিখ (+৯০ দিন) ও নতুন নিবন্ধন ফর্ম
              </p>
            </div>
          </button>

          {/* 3. জরুরি নোটিশ */}
          <button
            onClick={() => onNavigate('notices')}
            id="home-btn-notices"
            className="group relative overflow-hidden bg-white hover:bg-slate-50/80 border-2 border-blue-100 hover:border-blue-500/80 rounded-2xl p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-13 h-13 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                <BellRing className="w-7 h-7" />
              </div>
              <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full border border-blue-200">
                {toBengaliNumber(stats.activeNotices)} টি নোটিশ
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  ৩. জরুরি নোটিশ (Notices)
                </h4>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                সংগঠনের সাধারণ ও জরুরি নোটিশ বোর্ড এবং নতুন বিজ্ঞপ্তি প্রকাশনা
              </p>
            </div>
          </button>

          {/* 4. ফান্ড হিসাব */}
          <button
            onClick={() => onNavigate('fund')}
            id="home-btn-fund"
            className="group relative overflow-hidden bg-white hover:bg-slate-50/80 border-2 border-teal-100 hover:border-teal-500/80 rounded-2xl p-5 text-left transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between min-h-[140px]"
          >
            <div className="flex items-start justify-between w-full">
              <div className="w-13 h-13 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors duration-200">
                <Wallet className="w-7 h-7" />
              </div>
              <span className="bg-teal-50 text-teal-800 text-xs font-black px-2.5 py-1 rounded-full border border-teal-200">
                {formatTaka(stats.totalFundBalance)} ব্যালেন্স
              </span>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                  ৪. ফান্ড হিসাব (Fund)
                </h4>
                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all group-hover:translate-x-1">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                বর্তমান মোট ব্যালেন্স, পরিশোধিত ও বকেয়া চাঁদার পূর্ণাঙ্গ হিসাব খাতা
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Admin Panel Feature Highlight Card */}
      <div 
        onClick={() => {
          if (isAdmin) {
            onNavigate('admin');
          } else {
            openAdminModal();
          }
        }}
        id="home-admin-panel-card"
        className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border-2 border-amber-300/80 rounded-2xl p-5 cursor-pointer hover:border-amber-400 transition-all shadow-xs flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-amber-800 uppercase bg-amber-200/60 px-2 py-0.5 rounded">
                ইন-অ্যাপ ম্যানেজমেন্ট
              </span>
              <span className="text-xs text-slate-500">ভবিষ্যতে কোনো কোডিং পরিবর্তনের প্রয়োজন নেই</span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              ফুল কন্ট্রোল এডমিন প্যানেল (Admin Panel)
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              সরাসরি অ্যাপ থেকেই সকল মেম্বার, ব্লাড ডোনার, ফান্ড হিসাব ও নোটিশ অ্যাড/এডিট/ডিলিট করুন।
            </p>
          </div>
        </div>

        <button
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition whitespace-nowrap"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{isAdmin ? 'প্যানেলে প্রবেশ করুন' : 'লগইন করে প্রবেশ করুন'}</span>
        </button>
      </div>

      {/* Quick Summary Numbers Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          সংগঠনের সার্বিক সারসংক্ষেপ ({profile.address})
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block mb-1">মোট সদস্য</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-800 font-sans">
              {toBengaliNumber(stats.totalMembers)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block mb-1">প্রস্তুত রক্তদাতা</span>
            <span className="text-xl sm:text-2xl font-bold text-rose-700 font-sans">
              {toBengaliNumber(stats.readyDonors)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block mb-1">আদায়কৃত ফান্ড</span>
            <span className="text-lg sm:text-xl font-bold text-teal-700">
              {formatTaka(stats.totalPaidAmount)}
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
            <span className="text-xs text-slate-500 block mb-1">বকেয়া চাঁদা</span>
            <span className="text-lg sm:text-xl font-bold text-amber-700">
              {formatTaka(stats.totalDueAmount)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
