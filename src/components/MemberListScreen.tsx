import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Filter, 
  ArrowLeft,
  UserCheck,
  MapPin,
  Edit2,
  Trash2,
  X,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { Member } from '../types';
import { toBengaliNumber, sanitizePhone } from '../utils/helpers';

interface MemberListScreenProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onEditMember?: (member: Member) => void;
  onDeleteMember?: (id: string, name: string) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

export const MemberListScreen: React.FC<MemberListScreenProps> = ({
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  isAdmin = false,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [formError, setFormError] = useState('');

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে');
        return;
      }
      setFormError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Extract unique designations for filter
  const designations = useMemo(() => {
    const set = new Set(members.map(m => m.designation));
    return Array.from(set);
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.phone.includes(searchTerm) ||
        m.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.area && m.area.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDesignation = selectedDesignation === 'all' || m.designation === selectedDesignation;

      return matchesSearch && matchesDesignation;
    });
  }, [members, searchTerm, selectedDesignation]);

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(phoneNumber);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    setName(m.name);
    setDesignation(m.designation);
    setPhone(m.phone);
    setArea(m.area || 'পতেঙ্গা, চট্টগ্রাম');
    setPhotoUrl(m.photoUrl || '');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingMember(null);
    setName('');
    setDesignation('');
    setPhone('');
    setArea('পতেঙ্গা, চট্টগ্রাম');
    setPhotoUrl('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('সদস্যের নাম লিখুন');
      return;
    }
    if (!designation.trim()) {
      setFormError('সদস্যের পদবি লিখুন');
      return;
    }
    if (!phone.trim()) {
      setFormError('মোবাইল নম্বর লিখুন');
      return;
    }

    if (editingMember) {
      if (onEditMember) {
        onEditMember({
          ...editingMember,
          name: name.trim(),
          designation: designation.trim(),
          phone: phone.trim(),
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          photoUrl: photoUrl.trim() || '',
        });
      }
    } else {
      onAddMember({
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        photoUrl: photoUrl.trim() || '',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'সক্রিয়'
      });
    }

    setName('');
    setDesignation('');
    setPhone('');
    setArea('');
    setPhotoUrl('');
    setEditingMember(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="members-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-700">পতেঙ্গা, চট্টগ্রাম • সদস্য ডিরেক্টরি</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              সদস্য তালিকা (Members)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Only: Add Member Button */}
          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              id="members-add-new-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সদস্য যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="members-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="নাম, পদবি, এলাকা বা ফোন নম্বর দিয়ে সদস্য খুঁজুন..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Designation Dropdown */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">পদবি:</span>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              id="filter-designation-select"
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">সকল পদবি ({toBengaliNumber(members.length)})</option>
              {designations.map(des => (
                <option key={des} value={des}>{des}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Member Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>মোট সদস্য: <strong className="text-slate-800 font-bold">{toBengaliNumber(filteredMembers.length)}</strong> জন</span>
          <span>ঠিকানা: পতেঙ্গা, চট্টগ্রাম</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              {searchTerm || selectedDesignation !== 'all' ? 'কোনো সদস্য পাওয়া যায়নি' : 'সদস্য তালিকা বর্তমানে সম্পূর্ণ খালি'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              {searchTerm || selectedDesignation !== 'all' 
                ? 'আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো সদস্য নেই। ফিল্টার রিসেট করে আবার চেষ্টা করুন।'
                : 'সংগঠনে এখনও কোনো সদস্য অন্তর্ভুক্ত করা হয়নি। অ্যাডমিন প্যানেল থেকে লগইন করে নতুন সদস্যদের নাম, পদবি, মোবাইল নম্বর ও ছবি যুক্ত করুন।'}
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMembers.map((member, idx) => {
              const cleanPhone = sanitizePhone(member.phone);

              return (
                <div
                  key={member.id || idx}
                  id={`member-card-${member.id || idx}`}
                  className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-400/80 transition-all duration-200 shadow-xs hover:shadow-md overflow-hidden flex flex-col justify-between"
                >
                  {/* Top ID Card Header Strip */}
                  <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    {/* Professional ID Card Body */}
                    <div className="flex items-start gap-4">
                      {/* Large ID Card Portrait Photo */}
                      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-emerald-500/30 text-emerald-800 flex flex-col items-center justify-center font-bold flex-shrink-0 overflow-hidden shadow-xs relative">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-2">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-base font-black mb-1">
                              {member.name.charAt(0)}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">সদস্য</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Member Info Column */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug break-words">
                          {member.name}
                        </h3>

                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/70">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            <span>{member.designation}</span>
                          </span>
                        </div>

                        {member.area && (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 pt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{member.area}</span>
                          </p>
                        )}

                        <p className="text-[11px] text-slate-400 font-medium">
                          যোগদান: {member.joinDate ? toBengaliNumber(member.joinDate) : '১৫/০৮/২০২২'}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Phone Bar */}
                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-slate-800 tracking-wide">
                          {member.phone}
                        </span>
                        <button
                          onClick={() => handleCopyPhone(member.phone)}
                          id={`member-copy-${member.id || idx}`}
                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition cursor-pointer"
                          title="নম্বর কপি করুন"
                        >
                          {copiedPhone === member.phone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Inline Admin Controls */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 mr-1 pr-1 border-r border-slate-200">
                            <button
                              onClick={() => handleOpenEdit(member)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs transition cursor-pointer"
                              title="সদস্য এডিট করুন"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {onDeleteMember && (
                              <button
                                onClick={() => onDeleteMember(member.id, member.name)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition cursor-pointer"
                                title="সদস্য ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

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
                          className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition flex items-center gap-1 border border-emerald-200/70"
                          title="হোয়াটসঅ্যাপে বার্তা পাঠান"
                        >
                          <span>WA</span>
                        </a>

                        <a
                          href={`tel:${cleanPhone}`}
                          id={`member-call-${member.id || idx}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>কল</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Member Modal (Admin Only Triggered) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                {editingMember ? 'সদস্যের তথ্য সম্পাদনা' : 'নতুন সদস্য যুক্ত করুন'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingMember(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সদস্যের নাম (Name) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    পদবি (Designation) *
                  </label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="যেমন: সদস্য / সাধারণ সম্পাদক"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    মোবাইল নম্বর (Phone) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="যেমন: 01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  এলাকা / ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="যেমন: কাঠগড়, পতেঙ্গা, চট্টগ্রাম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>সদস্যের ছবি (মোবাইল গ্যালারি থেকে আপলোড)</span>
                  <span className="text-[11px] text-slate-400 font-normal">ঐচ্ছিক</span>
                </label>
                <input
                  type="file"
                  id="member-photo-gallery-picker"
                  accept="image/*"
                  onChange={handlePhotoFileChange}
                  className="hidden"
                />

                {photoUrl ? (
                  <div className="flex items-center gap-3.5 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200">
                    <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500 overflow-hidden flex-shrink-0 bg-white shadow-xs">
                      <img 
                        src={photoUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>গ্যালারি থেকে ছবি সিলেক্ট করা হয়েছে</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('member-photo-gallery-picker')?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition flex items-center gap-1"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 transition"
                        >
                          মুছুন
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.getElementById('member-photo-gallery-picker')?.click()}
                    className="w-full py-4 px-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-800 transition flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-emerald-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                      ফোনের গ্যালারি থেকে ছবি নির্বাচন করুন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ট্যাপ করে গ্যালারি বা ক্যামেরা থেকে ছবি নিন (JPG, PNG, WEBP)
                    </span>
                  </button>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingMember(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="members-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  {editingMember ? 'আপডেট সম্পন্ন করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
