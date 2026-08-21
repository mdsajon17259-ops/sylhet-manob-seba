import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageSquare, 
  Copy, 
  Check, 
  Download, 
  Filter, 
  ArrowLeft,
  UserCheck,
  MapPin,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Member, BloodGroup } from '../types';
import { toBengaliNumber, getBloodGroupBadge, sanitizePhone } from '../utils/helpers';
import { exportSheetCSV } from '../utils/storage';

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
  const [selectedBloodGroup, setSelectedBloodGroup] = useState<string>('all');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('A+');
  const [area, setArea] = useState('');
  const [formError, setFormError] = useState('');

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
      
      const matchesBlood = selectedBloodGroup === 'all' || m.bloodGroup === selectedBloodGroup;
      const matchesDesignation = selectedDesignation === 'all' || m.designation === selectedDesignation;

      return matchesSearch && matchesBlood && matchesDesignation;
    });
  }, [members, searchTerm, selectedBloodGroup, selectedDesignation]);

  const handleCopyPhone = (phoneNumber: string) => {
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(phoneNumber);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  const handleOpenEdit = (m: Member) => {
    if (onEditMember) {
      onEditMember(m);
    } else {
      setEditingMember(m);
      setName(m.name);
      setDesignation(m.designation);
      setPhone(m.phone);
      setBloodGroup(m.bloodGroup);
      setArea(m.area || 'পতেঙ্গা, চট্টগ্রাম');
      setIsAddModalOpen(true);
    }
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

    if (editingMember && onEditMember) {
      onEditMember({
        ...editingMember,
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        bloodGroup,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম'
      });
    } else {
      onAddMember({
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        bloodGroup,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        joinDate: new Date().toISOString().split('T')[0],
        status: 'সক্রিয়'
      });
    }

    setName('');
    setDesignation('');
    setPhone('');
    setBloodGroup('A+');
    setArea('');
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
          <button
            onClick={() => exportSheetCSV('members')}
            id="members-export-csv-btn"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="CSV ফাইল ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV ডাউনলোড</span>
          </button>

          {/* Admin Only: Add Member Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingMember(null);
                setName('');
                setDesignation('');
                setPhone('');
                setBloodGroup('A+');
                setArea('পতেঙ্গা, চট্টগ্রাম');
                setIsAddModalOpen(true);
              }}
              id="members-add-new-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন সদস্য যোগ</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="members-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="নাম, পদবি, এলাকা বা ফোন নম্বর দিয়ে খুঁজুন..."
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

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-500 font-medium whitespace-nowrap flex items-center gap-1">
              <Filter className="w-3 h-3" />
              রক্তের গ্রুপ:
            </span>
            {['all', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
              <button
                key={bg}
                onClick={() => setSelectedBloodGroup(bg)}
                id={`filter-bg-${bg}`}
                className={`px-2.5 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                  selectedBloodGroup === bg
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {bg === 'all' ? 'সকল' : bg}
              </button>
            ))}
          </div>

          {/* Designation Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium whitespace-nowrap">পদবি:</span>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              id="filter-designation-select"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          <span>মোট সদস্য: <strong className="text-slate-800">{toBengaliNumber(filteredMembers.length)}</strong> জন</span>
          <span>ঠিকানা: পতেঙ্গা, চট্টগ্রাম</span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">কোনো সদস্য পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">অনুসন্ধান ফিল্টার পরিবর্তন করুন অথবা অ্যাডমিন প্যানেল থেকে নতুন সদস্য যুক্ত করুন</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredMembers.map((member, idx) => {
              const bgBadge = getBloodGroupBadge(member.bloodGroup);
              const cleanPhone = sanitizePhone(member.phone);

              return (
                <div
                  key={member.id || idx}
                  id={`member-card-${member.id || idx}`}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 hover:border-emerald-300 transition-all duration-200 shadow-xs hover:shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-base flex-shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {member.name}
                        </h3>
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200/60">
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span>{member.designation}</span>
                        </div>
                        {member.area && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{member.area}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Blood Group Badge */}
                    <div className={`px-2.5 py-1 rounded-xl border ${bgBadge.bg} ${bgBadge.border} ${bgBadge.text} text-center flex-shrink-0`}>
                      <span className="text-[10px] block font-medium uppercase tracking-wider text-slate-500">গ্রুপ</span>
                      <span className="text-sm font-extrabold">{member.bloodGroup}</span>
                    </div>
                  </div>

                  {/* Actions & Phone Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="text-xs font-mono font-semibold text-slate-700">
                      {member.phone}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Inline Admin Controls if Admin */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(member)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs transition"
                            title="সদস্য এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteMember && (
                            <button
                              onClick={() => onDeleteMember(member.id, member.name)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs transition"
                              title="সদস্য ডিলিট করুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => handleCopyPhone(member.phone)}
                        id={`member-copy-${member.id || idx}`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                        title="নম্বর কপি করুন"
                      >
                        {copiedPhone === member.phone ? (
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
                        title="হোয়াটসঅ্যাপে বার্তা পাঠান"
                      >
                        <span className="font-bold text-xs">WA</span>
                      </a>

                      <a
                        href={`tel:${cleanPhone}`}
                        id={`member-call-${member.id || idx}`}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল</span>
                      </a>
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

              <div className="grid grid-cols-2 gap-3">
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
                    রক্তের গ্রুপ (BloodGroup) *
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
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
