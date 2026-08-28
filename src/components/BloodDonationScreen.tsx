import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Search, 
  Calendar, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  ArrowLeft, 
  Heart, 
  Clock, 
  CheckCircle2, 
  Send, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X 
} from 'lucide-react';
import { BloodDonor, BloodGroup } from '../types';
import { 
  toBengaliNumber, 
  getBloodGroupBadge, 
  calculateNextEligibleDate, 
  isDonorEligible, 
  formatBengaliDate, 
  sanitizePhone 
} from '../utils/helpers';

interface BloodDonationScreenProps {
  donors: BloodDonor[];
  initialBloodGroup?: string;
  onAddDonor: (donor: Omit<BloodDonor, 'id'>) => void;
  onEditDonor?: (donor: BloodDonor) => void;
  onDeleteDonor?: (id: string, name: string) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

export const BloodDonationScreen: React.FC<BloodDonationScreenProps> = ({
  donors,
  initialBloodGroup,
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  isAdmin = false,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(initialBloodGroup || 'all');
  const [onlyEligible, setOnlyEligible] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync initialBloodGroup if updated from parent navigation
  React.useEffect(() => {
    if (initialBloodGroup) {
      setSelectedGroup(initialBloodGroup);
    }
  }, [initialBloodGroup]);

  // Form states
  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorBloodGroup, setDonorBloodGroup] = useState<BloodGroup>('O+');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [nextEligibleDate, setNextEligibleDate] = useState('');
  const [area, setArea] = useState('পতেঙ্গা, চট্টগ্রাম');
  const [formError, setFormError] = useState('');
  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);

  // Auto-calculate Next Eligible Date (+90 days) when LastDonationDate changes
  const handleLastDateChange = (val: string) => {
    setLastDonationDate(val);
    if (val) {
      const computedNext = calculateNextEligibleDate(val);
      setNextEligibleDate(computedNext);
    } else {
      setNextEligibleDate('');
    }
  };

  // Filtered Donors List
  const filteredDonors = useMemo(() => {
    return donors.filter(d => {
      const matchesSearch = 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm) ||
        (d.area && d.area.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesGroup = selectedGroup === 'all' || d.bloodGroup === selectedGroup;
      const eligibility = isDonorEligible(d);
      const matchesEligibility = !onlyEligible || eligibility.eligible;

      return matchesSearch && matchesGroup && matchesEligibility;
    });
  }, [donors, searchTerm, selectedGroup, onlyEligible]);

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(phoneNumber);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenEdit = (donor: BloodDonor) => {
    setEditingDonor(donor);
    setDonorName(donor.name);
    setDonorPhone(donor.phone);
    setDonorBloodGroup(donor.bloodGroup);
    setLastDonationDate(donor.lastDonationDate || '');
    setNextEligibleDate(donor.nextEligibleDate || '');
    setArea(donor.area || 'পতেঙ্গা, চট্টগ্রাম');
    // Scroll to form
    const formElem = document.getElementById('donor-registration-form');
    if (formElem) formElem.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim()) {
      setFormError('রক্তদাতার নাম লিখুন');
      return;
    }
    if (!donorPhone.trim()) {
      setFormError('মোবাইল নম্বর লিখুন');
      return;
    }

    const calculatedNext = nextEligibleDate || (lastDonationDate ? calculateNextEligibleDate(lastDonationDate) : '');

    if (editingDonor && onEditDonor) {
      onEditDonor({
        ...editingDonor,
        name: donorName.trim(),
        phone: donorPhone.trim(),
        bloodGroup: donorBloodGroup,
        lastDonationDate: lastDonationDate || '',
        nextEligibleDate: calculatedNext,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম'
      });
      setEditingDonor(null);
    } else {
      onAddDonor({
        name: donorName.trim(),
        phone: donorPhone.trim(),
        bloodGroup: donorBloodGroup,
        lastDonationDate: lastDonationDate || '',
        nextEligibleDate: calculatedNext,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        totalDonations: 1
      });
    }

    // Reset Form and show success message
    setDonorName('');
    setDonorPhone('');
    setDonorBloodGroup('O+');
    setLastDonationDate('');
    setNextEligibleDate('');
    setArea('পতেঙ্গা, চট্টগ্রাম');
    setFormError('');
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 5000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="blood-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <span className="text-xs font-semibold text-rose-700">সিলেট মানব সেবা সংগঠন • রক্তের গ্রুপ ও রক্তদাতা সেবা</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-rose-600 fill-rose-600" />
              রক্তের গ্রুপ ও রক্তদান ডিরেক্টরি
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Only: New Donor Jump Button */}
          {isAdmin && (
            <a
              href="#donor-registration-form"
              id="blood-jump-to-form-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>নতুন দাতা নিবন্ধন</span>
            </a>
          )}
        </div>
      </div>

      {/* 8 Blood Groups Interactive Overview Cards */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
            <h3 className="text-sm font-bold text-slate-800">
              রক্তের গ্রুপ অনুযায়ী রক্তদাতা ডিরেক্টরি (Blood Group Selector)
            </h3>
            <span className="text-xs text-slate-400 font-normal hidden sm:inline">• নির্দিষ্ট গ্রুপে ক্লিক করে ফিল্টার করুন</span>
          </div>

          {selectedGroup !== 'all' && (
            <button
              onClick={() => setSelectedGroup('all')}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>ফিল্টার বাতিল (সব দেখুন)</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as BloodGroup[]).map((group) => {
            const groupDonors = donors.filter(d => d.bloodGroup === group);
            const count = groupDonors.length;
            const readyCount = groupDonors.filter(d => isDonorEligible(d).eligible).length;
            const isSelected = selectedGroup === group;

            return (
              <button
                key={group}
                id={`bg-selector-${group.replace('+', 'pos').replace('-', 'neg')}`}
                onClick={() => setSelectedGroup(isSelected ? 'all' : group)}
                className={`p-2.5 rounded-xl border-2 transition text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'border-rose-600 bg-rose-50 shadow-xs ring-2 ring-rose-400'
                    : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 bg-slate-50/70'
                }`}
                title={`${group} গ্রুপের রক্তদাতা ফিল্টার করুন`}
              >
                <span className={`text-base font-black ${isSelected ? 'text-rose-700' : 'text-slate-800'}`}>
                  {group}
                </span>
                <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {toBengaliNumber(count)} জন
                </span>
                {readyCount > 0 ? (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.5 rounded-full mt-1">
                    {toBengaliNumber(readyCount)} প্রস্তুত
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 mt-1">
                    {count > 0 ? 'অপেক্ষমান' : 'খালি'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Blood Group Alert Banner */}
      {selectedGroup !== 'all' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping flex-shrink-0"></span>
            <span>
              বর্তমানে ফিল্টার করা হয়েছে: <strong>{selectedGroup}</strong> রক্তের গ্রুপের রক্তদাতাগণ (পাওয়া গেছে <strong>{toBengaliNumber(filteredDonors.length)}</strong> জন)
            </span>
          </div>
          <button
            onClick={() => setSelectedGroup('all')}
            className="text-rose-700 hover:text-rose-900 underline font-bold whitespace-nowrap ml-2 cursor-pointer"
          >
            সকল রক্তদাতা দেখুন
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="blood-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="রক্তদাতার নাম, এলাকা বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
        </div>

        {/* Blood Groups Selector Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-500 font-medium whitespace-nowrap">গ্রুপ:</span>
            {['all', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                id={`blood-filter-${bg}`}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  selectedGroup === bg
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {bg === 'all' ? 'সকল' : bg}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 select-none">
            <input
              type="checkbox"
              id="filter-only-eligible-chk"
              checked={onlyEligible}
              onChange={(e) => setOnlyEligible(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>শুধুমাত্র প্রস্তুত রক্তদাতা ({toBengaliNumber(donors.filter(d => isDonorEligible(d).eligible).length)})</span>
          </label>
        </div>
      </div>

      {/* Donors Cards List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>মোট দাতা: <strong className="text-slate-800">{toBengaliNumber(filteredDonors.length)}</strong> জন</span>
          <span>ঠিকানা: পতেঙ্গা, চট্টগ্রাম</span>
        </div>

        {filteredDonors.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Droplet className="w-10 h-10 text-rose-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">এই ফিল্টারে কোনো রক্তদাতা পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">অন্য রক্তের গ্রুপ সিলেক্ট করুন বা এডমিন প্যানেল থেকে নতুন দাতা যোগ করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDonors.map((donor, idx) => {
              const bgBadge = getBloodGroupBadge(donor.bloodGroup);
              const eligibility = isDonorEligible(donor);
              const cleanPhone = sanitizePhone(donor.phone);

              return (
                <div
                  key={donor.id || idx}
                  id={`donor-card-${donor.id || idx}`}
                  className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-rose-300 transition-all duration-200 shadow-xs flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Blood Group Icon badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border font-black text-base flex-shrink-0 ${bgBadge.bg} ${bgBadge.border} ${bgBadge.text}`}>
                        {donor.bloodGroup}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {donor.name}
                        </h3>
                        
                        {/* Eligibility Status badge */}
                        <div className="mt-1">
                          {eligibility.eligible ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              রক্তদানে প্রস্তুত (Eligible)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              অপেক্ষমান ({toBengaliNumber(eligibility.daysRemaining)} দিন বাকি)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {donor.area && (
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {donor.area}
                      </span>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl text-xs border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block">সর্বশেষ রক্তদান:</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {donor.lastDonationDate ? formatBengaliDate(donor.lastDonationDate) : 'তথ্য নেই'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">পরবর্তী সম্ভাব্য তারিখ (+৯০ দিন):</span>
                      <span className="font-semibold text-rose-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-rose-400" />
                        {donor.nextEligibleDate ? formatBengaliDate(donor.nextEligibleDate) : calculateNextEligibleDate(donor.lastDonationDate) ? formatBengaliDate(calculateNextEligibleDate(donor.lastDonationDate)) : 'প্রস্তুত'}
                      </span>
                    </div>
                  </div>

                  {/* Actions & Phone */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs font-mono font-semibold text-slate-700">
                      {donor.phone}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Admin Only: Inline Edit & Delete */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(donor)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs transition"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteDonor && (
                            <button
                              onClick={() => onDeleteDonor(donor.id, donor.name)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => handleCopyPhone(donor.phone)}
                        id={`donor-copy-${donor.id || idx}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                        title="নম্বর কপি করুন"
                      >
                        {copiedPhone === donor.phone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={`sms:${cleanPhone}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                        title="এসএমএস পাঠান"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={`https://wa.me/${cleanPhone.replace('+', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs transition"
                        title="হোয়াটসঅ্যাপ"
                      >
                        <span className="font-bold text-xs">WA</span>
                      </a>

                      <a
                        href={`tel:${cleanPhone}`}
                        id={`donor-call-${donor.id || idx}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল দিন</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Only: Donor Registration Form */}
      {isAdmin && (
        <div id="donor-registration-form" className="bg-white rounded-2xl p-6 border-2 border-rose-100 shadow-sm scroll-mt-20">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                রক্তদাতা ফর্ম • স্বয়ংক্রিয় ডাটাবেজ
              </span>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                {editingDonor ? 'রক্তদাতার তথ্য পরিবর্তন ফর্ম' : 'নতুন রক্তদাতা নিবন্ধন / তথ্য আপডেট ফর্ম'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 bg-rose-50 px-2.5 py-1 rounded-lg text-rose-800 font-semibold border border-rose-200">
              অটো +৯০ দিন ক্যালকুলেটর
            </span>
          </div>

          {submitSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>ধন্যবাদ! রক্তদাতার তথ্য সফলভাবে ডাটাবেজে সংরক্ষিত হয়েছে।</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
              {formError}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রক্তদাতার নাম (Name) *
                </label>
                <input
                  type="text"
                  required
                  id="donor-form-name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="যেমন: সৈয়দ আহমেদ তানভীর"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  মোবাইল নম্বর (Phone) *
                </label>
                <input
                  type="text"
                  required
                  id="donor-form-phone"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  placeholder="যেমন: 01819-XXXXXX"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  রক্তের গ্রুপ (BloodGroup) *
                </label>
                <select
                  id="donor-form-bloodgroup"
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none bg-white font-bold text-rose-700"
                >
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                    <option key={bg} value={bg}>{bg} গ্রুপ</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সর্বশেষ রক্তদানের তারিখ (LastDonationDate)
                </label>
                <input
                  type="date"
                  id="donor-form-last-date"
                  value={lastDonationDate}
                  onChange={(e) => handleLastDateChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পরবর্তী সম্ভাব্য তারিখ (NextEligibleDate)
                </label>
                <input
                  type="date"
                  id="donor-form-next-date"
                  value={nextEligibleDate}
                  onChange={(e) => setNextEligibleDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none font-sans bg-rose-50/50 text-rose-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                এলাকা / বর্তমান ঠিকানা (Area)
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: কাঠগড়, পতেঙ্গা, চট্টগ্রাম"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                * রক্তদানের তারিখ দিলে পরবর্তী উপযুক্ত তারিখ স্বয়ংক্রিয়ভাবে (+৯০ দিন) তৈরি হবে।
              </p>

              <div className="flex items-center gap-2">
                {editingDonor && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDonor(null);
                      setDonorName('');
                      setDonorPhone('');
                      setLastDonationDate('');
                      setNextEligibleDate('');
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    বাতিল
                  </button>
                )}
                <button
                  type="submit"
                  id="donor-form-submit-btn"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingDonor ? 'আপডেট সম্পন্ন করুন' : 'সাবমিট ও সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
