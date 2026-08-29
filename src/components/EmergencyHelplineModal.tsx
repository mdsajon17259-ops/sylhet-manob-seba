import React, { useState } from 'react';
import { 
  PhoneCall, 
  Phone, 
  Copy, 
  Check, 
  X, 
  ShieldAlert, 
  Building2, 
  Flame, 
  HeartPulse, 
  Radio, 
  AlertCircle, 
  Edit3,
  ExternalLink,
  Save,
  Lock
} from 'lucide-react';
import { OrganizationProfile } from '../types';
import { verifyAdminPin, saveOrgProfile } from '../utils/storage';

interface EmergencyHelplineModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: OrganizationProfile;
  onUpdateProfile?: (updatedProfile: OrganizationProfile) => void;
  isAdmin?: boolean;
  onNavigateToAdmin?: () => void;
}

interface HelplineItem {
  id: string;
  name: string;
  category: 'পুলিশ' | 'ফায়ার সার্ভিস' | 'চিকিৎসা' | 'জাতীয় সেবা';
  number: string;
  displayNumber: string;
  desc: string;
  badgeColor: string;
}

export const EmergencyHelplineModal: React.FC<EmergencyHelplineModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  isAdmin = false,
  onNavigateToAdmin,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Direct In-Modal Helpline Editing State
  const [isEditingHotline, setIsEditingHotline] = useState(false);
  const [hotlineInput, setHotlineInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenEdit = () => {
    if (!isAdmin) return;
    setHotlineInput(profile.hotline || profile.phone || '');
    setPinInput('');
    setEditError('');
    setIsEditingHotline(true);
  };

  const handleSaveHotline = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = hotlineInput.trim();

    // Verify admin PIN if user is not already authenticated as admin
    if (!isAdmin) {
      const cleanPin = pinInput.trim();
      if (!cleanPin) {
        setEditError('হেল্পলাইন নম্বর পরিবর্তন করতে ৪ ডিজিটের অ্যাডমিন পিন দিন (ডিফল্ট: 1234)');
        return;
      }
      if (!verifyAdminPin(cleanPin)) {
        setEditError('ভুল অ্যাডমিন পিন! সঠিক পিন কোড দিন (ডিফল্ট: 1234)');
        return;
      }
    }

    const updatedProfile: OrganizationProfile = {
      ...profile,
      hotline: cleanNumber,
      phone: cleanNumber || profile.phone,
    };

    saveOrgProfile(updatedProfile);
    if (onUpdateProfile) {
      onUpdateProfile(updatedProfile);
    }

    setIsEditingHotline(false);
    setEditSuccess(true);
    setEditError('');
    setTimeout(() => setEditSuccess(false), 3500);
  };

  // Fixed Patenga Thana Helplines (Non-editable)
  const patengaHelplines: HelplineItem[] = [
    {
      id: 'ptg-duty',
      name: 'পতেঙ্গা থানা ডিউটি অফিসার',
      category: 'পুলিশ',
      number: '01320052988',
      displayNumber: '01320-052988',
      desc: 'পতেঙ্গা থানার সার্বক্ষণিক জরুরি ডিউটি অফিসার',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'ptg-oc',
      name: 'পতেঙ্গা থানা অফিসার ইনচার্জ (OC)',
      category: 'পুলিশ',
      number: '01320052980',
      displayNumber: '01320-052980',
      desc: 'পতেঙ্গা থানার ভারপ্রাপ্ত কর্মকর্তার সরকারি নম্বর',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'ptg-landline',
      name: 'পতেঙ্গা থানা কন্ট্রোল / ল্যান্ডলাইন',
      category: 'পুলিশ',
      number: '0312501004',
      displayNumber: '০৩১-২৫০১০০৪',
      desc: 'থানা কার্যালয় সরাসরি ল্যান্ডলাইন টেলিফোন',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    {
      id: 'cmp-control',
      name: 'চট্টগ্রাম মেট্রোপলিটন পুলিশ (CMP) কন্ট্রোল রুম',
      category: 'পুলিশ',
      number: '01320052999',
      displayNumber: '01320-052999',
      desc: 'সিএমপি কেন্দ্রীয় জরুরি পুলিশ সহায়তা',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    {
      id: 'ptg-fire',
      name: 'পতেঙ্গা ফায়ার সার্ভিস ও সিভিল ডিফেন্স স্টেশন',
      category: 'ফায়ার সার্ভিস',
      number: '01730336655',
      displayNumber: '01730-336655 / ০৩১-৭৪০৩৮৮',
      desc: 'অগ্নিকাণ্ড, দুর্ঘটনা ও জরুরি উদ্ধার তৎপরতা',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      id: 'epz-fire',
      name: 'পতেঙ্গা ইপিজেড ফায়ার স্টেশন',
      category: 'ফায়ার সার্ভিস',
      number: '01730002446',
      displayNumber: '01730-002446',
      desc: 'ইপিজেড ও পতেঙ্গা সংলগ্ন জরুরি ফায়ার স্টেশন',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200'
    },
    {
      id: 'ptg-naval',
      name: 'পতেঙ্গা নৌ-পুলিশ ফাঁড়ি',
      category: 'পুলিশ',
      number: '01320169548',
      displayNumber: '01320-169548',
      desc: 'পতেঙ্গা সমুদ্র উপকূল ও নদী তীরবর্তী নিরাপত্তা',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-200'
    },
    {
      id: 'cmch-emergency',
      name: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল (চমেক) জরুরি বিভাগ',
      category: 'চিকিৎসা',
      number: '031619400',
      displayNumber: '০৩১-৬১৯৪০০ / 01713-106198',
      desc: '২৪ ঘণ্টা সরকারি জরুরি চিকিৎসা সেবা ও অ্যাম্বুলেন্স',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    },
    {
      id: 'port-hospital',
      name: 'চট্টগ্রাম বন্দর হাসপাতাল (পতেঙ্গা)',
      category: 'চিকিৎসা',
      number: '0312510884',
      displayNumber: '০৩১-২৫১০৮৮৪',
      desc: 'পতেঙ্গা বন্দর এলাকা সংলগ্ন জরুরি স্বাস্থ্য সেবা',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
  ];

  // Fixed Bangladesh National Helplines (Non-editable)
  const nationalHelplines: HelplineItem[] = [
    {
      id: 'nat-999',
      name: 'জাতীয় জরুরি সেবা (৯৯৯)',
      category: 'জাতীয় সেবা',
      number: '999',
      displayNumber: '999',
      desc: 'পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স (টোল ফ্রি)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-black'
    },
    {
      id: 'nat-333',
      name: 'সরকারি তথ্য ও সেবা হেল্পলাইন (৩৩৩)',
      category: 'জাতীয় সেবা',
      number: '333',
      displayNumber: '333',
      desc: 'নাগরিক সেবা, সামাজিক সমস্যা প্রতিকার ও তথ্য',
      badgeColor: 'bg-teal-100 text-teal-900 border-teal-300 font-bold'
    },
    {
      id: 'nat-109',
      name: 'নারী ও শিশু নির্যাতন প্রতিরোধ হেল্পলাইন (১০৯)',
      category: 'জাতীয় সেবা',
      number: '109',
      displayNumber: '109',
      desc: 'মহিলা ও শিশু বিষয়ক মন্ত্রণালয় (টোল ফ্রি)',
      badgeColor: 'bg-purple-100 text-purple-900 border-purple-300'
    },
    {
      id: 'nat-16263',
      name: 'স্বাস্থ্য বাতায়ন (১৬২৬৩)',
      category: 'চিকিৎসা',
      number: '16263',
      displayNumber: '16263',
      desc: '২৪ ঘণ্টা সরকারি ডাক্তার পরামর্শ ও চিকিৎসা সহায়তা',
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300'
    },
    {
      id: 'nat-106',
      name: 'দুদক অভিযোগ হেল্পলাইন (১০৬)',
      category: 'জাতীয় সেবা',
      number: '106',
      displayNumber: '106',
      desc: 'দুর্নীতি দমন কমিশন সরাসরি অভিযোগ কেন্দ্র',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300'
    },
    {
      id: 'nat-1090',
      name: 'দুর্যোগের আগাম বার্তা (১০৯০)',
      category: 'জাতীয় সেবা',
      number: '1090',
      displayNumber: '1090',
      desc: 'বন্যা, ঘূর্ণিঝড় ও আবহাওয়ার জরুরি সতর্কবার্তা',
      badgeColor: 'bg-yellow-100 text-yellow-900 border-yellow-300'
    },
    {
      id: 'nat-105',
      name: 'জাতীয় পরিচয়পত্র ও এনআইডি তথ্য (১০৫)',
      category: 'জাতীয় সেবা',
      number: '105',
      displayNumber: '105',
      desc: 'নির্বাচন কমিশন এনআইডি সংশোধন ও ভোটার তথ্য',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300'
    },
    {
      id: 'nat-16135',
      name: 'প্রবাসী কল্যাণ হেল্পলাইন (১৬১৩৫)',
      category: 'জাতীয় সেবা',
      number: '16135',
      displayNumber: '16135',
      desc: 'প্রবাসী ভাই-বোনদের যেকোনো সমস্যা ও সহায়তা কেন্দ্র',
      badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300'
    }
  ];

  const officialNumber = profile.hotline || profile.phone || '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-emerald-200 animate-scaleUp my-6 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 shadow-xs">
              <PhoneCall className="w-6 h-6 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  জরুরি হেল্পলাইন ও জরুরি সেবা
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  অফলাইন সক্রিয়
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {profile.name} • চট্টগ্রাম পতেঙ্গা থানা ও জাতীয় হেল্পলাইন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6 mt-5">
          
          {/* SECTION 1: সংগঠনের অফিশিয়াল হেল্পলাইন কার্ড */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-400/80 shadow-xs">
            {/* ১ নম্বর জায়গা: কার্ডের টাইটেল */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-emerald-950 bg-emerald-200/90 px-3 py-1 rounded-full border border-emerald-400">
                  সিলেট মানবসেবা সংগঠন এর জরুরি হেল্পলাইন নাম্বার
                </span>
              </div>
              {isAdmin && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  অ্যাডমিন কর্তৃক পরিবর্তনযোগ্য
                </span>
              )}
            </div>

            {/* সরাসরি এডিট ফর্ম অথবা কার্ড ভিউ */}
            {isEditingHotline ? (
              <form 
                onSubmit={handleSaveHotline} 
                className="bg-white p-4 sm:p-5 rounded-xl border-2 border-emerald-500 shadow-md space-y-3.5 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <Edit3 className="w-4 h-4 text-emerald-700" />
                    <span>সিলেট মানবসেবা সংগঠন এর হেল্পলাইন নম্বর পরিবর্তন করুন</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingHotline(false);
                      setEditError('');
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
                    title="বাতিল"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    সংগঠনের হেল্পলাইন নম্বর (ফোন বা মোবাইল) <span className="text-emerald-700">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={hotlineInput}
                    onChange={(e) => setHotlineInput(e.target.value)}
                    placeholder="যেমন: 017XXXXXXXX বা 018XXXXXXXX"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    এই নম্বরটি সকল ব্যবহারকারীর কাছে জরুরি হেল্পলাইন হিসেবে প্রদর্শিত হবে।
                  </p>
                </div>

                {!isAdmin && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>অ্যাডমিন পিন কোড দিন</span>
                      </label>
                      <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ডিফল্ট পিন: 1234
                      </span>
                    </div>
                    <input
                      type="password"
                      required
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value)}
                      placeholder="৪ ডিজিটের পিন (যেমন: 1234)"
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {editError && (
                  <div className="text-xs text-rose-700 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{editError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingHotline(false);
                      setEditError('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>সংরক্ষণ করুন</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-xs p-4 rounded-xl border border-emerald-300/80 shadow-2xs">
                {/* ২ নম্বর জায়গা: সংগঠনের মূল ফোন নম্বরটি */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-700">
                    সিলেট মানবসেবা সংগঠন এর জরুরি হেল্পলাইন নাম্বার
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-emerald-800 tracking-tight">
                    {officialNumber ? officialNumber : 'নম্বর এখনও যুক্ত করা হয়নি'}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    সংগঠনের যেকোনো প্রয়োজনে সরাসরি যোগাযোগ করুন।
                  </p>
                </div>

                {/* ৩ নম্বর জায়গা: কার্ডের ভেতরে বা পাশে সরাসরি 'পরিবর্তন করুন' বাটন */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  {officialNumber && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleCopy('official-hotline', officialNumber)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                        title="নম্বর কপি করুন"
                      >
                        {copiedId === 'official-hotline' ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-500" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`tel:${officialNumber.replace(/[^0-9+]/g, '')}`}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>সরাসরি কল করুন</span>
                      </a>
                    </>
                  )}

                  {/* ৩ নম্বর জায়গার সরাসরি 'পরিবর্তন করুন' বাটন (শুধুমাত্র এডমিন প্যানেল বা লগইন অবস্থায় দৃশ্যমান) */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenEdit}
                      className={`px-3.5 py-2 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        officialNumber 
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-400' 
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      title="হেল্পলাইন নম্বর পরিবর্তন করুন"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>পরিবর্তন করুন</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* সফলভাবে সেভ হলে নোটিফিকেশন */}
            {editSuccess && (
              <div className="mt-2.5 text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-2 rounded-xl flex items-center gap-2 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>সিলেট মানবসেবা সংগঠন এর জরুরি হেল্পলাইন নম্বর সফলভাবে আপডেট হয়েছে!</span>
              </div>
            )}
          </div>

          {/* SECTION 2 (FIXED): চট্টগ্রাম পতেঙ্গা থানার সকল জরুরি হেল্পলাইন */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <h4 className="text-sm font-black text-slate-900">
                  চট্টগ্রাম পতেঙ্গা থানার জরুরি হেল্পলাইনসমূহ
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                ফিক্সড ও অপরিবর্তনীয়
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {patengaHelplines.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">পতেঙ্গা এলাকা</span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm mt-1.5 leading-snug">
                      {item.name}
                    </h5>
                    <div className="font-mono font-bold text-blue-800 text-xs mt-1">
                      {item.displayNumber}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.number)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="নম্বর কপি করুন"
                    >
                      {copiedId === item.id ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> কপি হয়েছে
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`tel:${item.number}`}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-xl shadow-2xs transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>কল করুন</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3 (FIXED): বাংলাদেশের সকল জাতীয় জরুরি হেল্পলাইন নম্বর */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-700" />
                <h4 className="text-sm font-black text-slate-900">
                  বাংলাদেশের সকল জাতীয় জরুরি হেল্পলাইন নম্বর (টোল ফ্রি ও সরকারি)
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                জাতীয় সেবা • স্থায়ী
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {nationalHelplines.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                        {item.category}
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                        {item.displayNumber}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm mt-2 leading-snug">
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.number)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="নম্বর কপি করুন"
                    >
                      {copiedId === item.id ? (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> কপি
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`tel:${item.number}`}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold text-[11px] rounded-xl shadow-2xs transition flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>কল করুন</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>জরুরি প্রয়োজনে যেকোনো নম্বরে সরাসরি ডায়াল করুন।</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
          >
            বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
};
