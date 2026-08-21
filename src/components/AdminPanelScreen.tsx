import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Droplet,
  BellRing,
  Wallet,
  Settings,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  Upload,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Phone,
  Lock,
  Key,
  Building2,
  Save,
  Check,
  X,
  Clock,
  Pin,
  TrendingUp,
  FileText
} from 'lucide-react';
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  BloodGroup
} from '../types';
import {
  toBengaliNumber,
  formatTaka,
  calculateNextEligibleDate,
  isDonorEligible,
  formatBengaliDate,
  sanitizePhone,
  getBloodGroupBadge
} from '../utils/helpers';
import {
  exportAppBackupJSON,
  importAppBackupJSON,
  resetAllData,
  clearAllData,
  exportSheetCSV,
  setAdminPin,
  getAdminPin,
  verifyAdminPin
} from '../utils/storage';

interface AdminPanelScreenProps {
  profile: OrganizationProfile;
  setProfile: (p: OrganizationProfile) => void;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  donors: BloodDonor[];
  setDonors: React.Dispatch<React.SetStateAction<BloodDonor[]>>;
  notices: Notice[];
  setNotices: React.Dispatch<React.SetStateAction<Notice[]>>;
  funds: FundRecord[];
  setFunds: React.Dispatch<React.SetStateAction<FundRecord[]>>;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  onBack: () => void;
  activeScreen: string;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  profile,
  setProfile,
  members,
  setMembers,
  donors,
  setDonors,
  notices,
  setNotices,
  funds,
  setFunds,
  isAdmin,
  setIsAdmin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'donors' | 'funds' | 'notices' | 'settings'>('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search terms per tab
  const [memberSearch, setMemberSearch] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [fundSearch, setFundSearch] = useState('');

  // Modals / Edit states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);
  const [isAddDonorOpen, setIsAddDonorOpen] = useState(false);
  const [loggingDonationDonor, setLoggingDonationDonor] = useState<BloodDonor | null>(null);

  const [editingFund, setEditingFund] = useState<FundRecord | null>(null);
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);

  // Settings State
  const [editProfileData, setEditProfileData] = useState<OrganizationProfile>(profile);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Helper trigger for notifications
  const notifySuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const notifyError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // Fund balance calculations (Auto Balance Calculation)
  const fundSummary = useMemo(() => {
    let totalPaid = 0;
    let totalDue = 0;
    let paidItems = 0;
    let dueItems = 0;

    funds.forEach(f => {
      if (f.status === 'Paid') {
        totalPaid += f.amount;
        paidItems++;
      } else {
        totalDue += f.amount;
        dueItems++;
      }
    });

    return {
      totalBalance: totalPaid,
      totalPaid,
      totalDue,
      paidItems,
      dueItems
    };
  }, [funds]);

  // MEMBER CRUD
  const handleSaveMember = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const designation = formData.get('designation') as string;
    const phone = formData.get('phone') as string;
    const bloodGroup = formData.get('bloodGroup') as BloodGroup;
    const area = formData.get('area') as string;
    const joinDate = formData.get('joinDate') as string;
    const email = formData.get('email') as string;
    const status = formData.get('status') as 'সক্রিয়' | 'স্থগিত';

    if (!name.trim() || !phone.trim()) {
      notifyError('নাম এবং মোবাইল নম্বর অবশ্যই প্রদান করুন');
      return;
    }

    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember.id ? {
        ...m,
        name: name.trim(),
        designation: designation.trim(),
        phone: phone.trim(),
        bloodGroup,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        joinDate: joinDate || m.joinDate,
        email: email.trim(),
        status
      } : m));
      setEditingMember(null);
      notifySuccess('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      const newMember: Member = {
        id: `m-${Date.now()}`,
        name: name.trim(),
        designation: designation.trim() || 'সদস্য',
        phone: phone.trim(),
        bloodGroup,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        joinDate: joinDate || new Date().toISOString().split('T')[0],
        email: email.trim(),
        status: status || 'সক্রিয়'
      };
      setMembers(prev => [newMember, ...prev]);
      setIsAddMemberOpen(false);
      notifySuccess('নতুন সদস্য সফলভাবে ডাটাবেজে যুক্ত হয়েছে');
    }
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}"-কে সদস্য তালিকা থেকে মুছে ফেলতে চান?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
      notifySuccess(`"${name}" সদস্য তালিকা থেকে মুছে ফেলা হয়েছে`);
    }
  };

  // BLOOD DONOR CRUD
  const handleSaveDonor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const bloodGroup = formData.get('bloodGroup') as BloodGroup;
    const lastDonationDate = formData.get('lastDonationDate') as string;
    const nextEligibleDate = formData.get('nextEligibleDate') as string;
    const area = formData.get('area') as string;
    const totalDonations = parseInt(formData.get('totalDonations') as string, 10) || 1;
    const notes = formData.get('notes') as string;

    if (!name.trim() || !phone.trim()) {
      notifyError('রক্তদাতার নাম ও ফোন নম্বর প্রদান করুন');
      return;
    }

    const calculatedNext = nextEligibleDate || (lastDonationDate ? calculateNextEligibleDate(lastDonationDate) : '');

    if (editingDonor) {
      setDonors(prev => prev.map(d => d.id === editingDonor.id ? {
        ...d,
        name: name.trim(),
        phone: phone.trim(),
        bloodGroup,
        lastDonationDate: lastDonationDate || '',
        nextEligibleDate: calculatedNext,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        totalDonations,
        notes: notes.trim()
      } : d));
      setEditingDonor(null);
      notifySuccess('রক্তদাতার তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      const newDonor: BloodDonor = {
        id: `d-${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        bloodGroup,
        lastDonationDate: lastDonationDate || '',
        nextEligibleDate: calculatedNext,
        area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
        totalDonations,
        notes: notes.trim()
      };
      setDonors(prev => [newDonor, ...prev]);
      setIsAddDonorOpen(false);
      notifySuccess('নতুন রক্তদাতা সফলভাবে নিবন্ধিত হয়েছে');
    }
  };

  const handleDeleteDonor = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" রক্তদাতাকে মুছে ফেলতে চান?`)) {
      setDonors(prev => prev.filter(d => d.id !== id));
      notifySuccess(`"${name}" রক্তদাতা ডিরেক্টরি থেকে মুছে ফেলা হয়েছে`);
    }
  };

  const handleQuickLogDonation = (donorId: string, donationDateStr: string) => {
    const nextDate = calculateNextEligibleDate(donationDateStr);
    setDonors(prev => prev.map(d => {
      if (d.id === donorId) {
        return {
          ...d,
          lastDonationDate: donationDateStr,
          nextEligibleDate: nextDate,
          totalDonations: (d.totalDonations || 0) + 1
        };
      }
      return d;
    }));
    setLoggingDonationDonor(null);
    notifySuccess('নতুন রক্তদানের তথ্য লিপিবদ্ধ হয়েছে (+৯০ দিন পর পরবর্তী তারিখ স্বয়ংক্রিয়ভাবে নির্ধারণ করা হলো)');
  };

  // FUND CRUD & Auto Balance Calculation
  const handleSaveFund = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const memberName = formData.get('memberName') as string;
    const amount = parseInt(formData.get('amount') as string, 10);
    const status = formData.get('status') as 'Paid' | 'Due';
    const month = formData.get('month') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    if (!memberName.trim() || isNaN(amount) || amount <= 0) {
      notifyError('সদস্যের নাম এবং সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (editingFund) {
      setFunds(prev => prev.map(f => f.id === editingFund.id ? {
        ...f,
        memberName: memberName.trim(),
        amount,
        status,
        month: month.trim() || 'চলতি মাস',
        phone: phone.trim(),
        notes: notes.trim()
      } : f));
      setEditingFund(null);
      notifySuccess('ফান্ড এন্ট্রি ও ব্যালেন্স সফলভাবে আপডেট হয়েছে');
    } else {
      const newFund: FundRecord = {
        id: `f-${Date.now()}`,
        memberName: memberName.trim(),
        amount,
        status,
        date: new Date().toISOString().split('T')[0],
        month: month.trim() || 'চলতি মাস',
        phone: phone.trim(),
        notes: notes.trim() || (status === 'Paid' ? 'পরিশোধিত' : 'বকেয়া')
      };
      setFunds(prev => [newFund, ...prev]);
      setIsAddFundOpen(false);
      notifySuccess('নতুন ফান্ড এন্ট্রি যুক্ত হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়েছে');
    }
  };

  const handleToggleFundStatus = (fundId: string) => {
    setFunds(prev => prev.map(f => {
      if (f.id === fundId) {
        const nextStatus = f.status === 'Paid' ? 'Due' : 'Paid';
        return { ...f, status: nextStatus };
      }
      return f;
    }));
    notifySuccess('স্ট্যাটাস পরিবর্তিত হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে হিসাব করা হয়েছে');
  };

  const handleDeleteFund = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}"-এর ফান্ড এন্ট্রিটি মুছে ফেলতে চান?`)) {
      setFunds(prev => prev.filter(f => f.id !== id));
      notifySuccess('ফান্ড এন্ট্রি মুছে ফেলা হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়েছে');
    }
  };

  // NOTICE CRUD
  const handleSaveNotice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const noticeText = formData.get('noticeText') as string;
    const priority = formData.get('priority') as any;
    const date = formData.get('date') as string;
    const isPinned = formData.get('isPinned') === 'on';

    if (!noticeText.trim()) {
      notifyError('নোটিশের বিবরণ অবশ্যই লিখুন');
      return;
    }

    if (editingNotice) {
      setNotices(prev => prev.map(n => n.id === editingNotice.id ? {
        ...n,
        title: title.trim() || 'সাধারণ নোটিশ',
        noticeText: noticeText.trim(),
        priority,
        date: date || n.date,
        isPinned
      } : n));
      setEditingNotice(null);
      notifySuccess('নোটিশ সফলভাবে আপডেট হয়েছে');
    } else {
      const newNotice: Notice = {
        id: `n-${Date.now()}`,
        title: title.trim() || 'সাধারণ নোটিশ',
        noticeText: noticeText.trim(),
        priority: priority || 'সাধারণ',
        date: date || new Date().toISOString().split('T')[0],
        isPinned: isPinned || priority === 'জরুরি'
      };
      setNotices(prev => [newNotice, ...prev]);
      setIsAddNoticeOpen(false);
      notifySuccess('নতুন নোটিশ সফলভাবে বোর্ডে প্রকাশিত হয়েছে');
    }
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      setNotices(prev => prev.filter(n => n.id !== id));
      notifySuccess('নোটিশ সফলভাবে মুছে ফেলা হয়েছে');
    }
  };

  const handleTogglePinNotice = (id: string) => {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  // ORGANIZATION PROFILE & SETTINGS
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editProfileData);
    notifySuccess('সংগঠনের তথ্য ও পরিচিতি সফলভাবে সংরক্ষিত হয়েছে');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCurrent = currentPinInput.trim();
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!cleanCurrent) {
      notifyError('বর্তমান পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (!verifyAdminPin(cleanCurrent)) {
      notifyError('বর্তমান পাসওয়ার্ড সঠিক নয়!');
      return;
    }
    if (cleanNew.length < 4) {
      notifyError('নতুন পাসওয়ার্ড কমপক্ষে ৪ ডিজিট বা অক্ষরের হতে হবে');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      notifyError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না');
      return;
    }

    setAdminPin(cleanNew);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    notifySuccess('এডমিন পাসওয়ার্ড সফলভাবে আপডেট এবং লোকাল স্টোরেজে সেভ করা হয়েছে');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = importAppBackupJSON(json);
        if (ok) {
          if (json.profile) setProfile(json.profile);
          if (json.members) setMembers(json.members);
          if (json.donors) setDonors(json.donors);
          if (json.notices) setNotices(json.notices);
          if (json.funds) setFunds(json.funds);
          notifySuccess('ব্যাকআপ ফাইল থেকে সকল তথ্য সফলভাবে রিস্টোর হয়েছে');
        } else {
          notifyError('ব্যাকআপ ফাইলটি সঠিক ফরম্যাটের নয়');
        }
      } catch (err) {
        notifyError('ফাইল পড়তে সমস্যা হয়েছে');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDefault = () => {
    if (window.confirm('আপনি কি সিলেট মানব সেবা সংঘঠনের প্রাথমিক ডিফল্ট ডাটাতে রিসেট করতে চান? বর্তমান সকল পরিবর্তন মুছে যাবে।')) {
      resetAllData();
      window.location.reload();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('সতর্কতা: আপনি কি সব তথ্য খালি (Clean Slate) করতে চান? এটি করলে সব মেম্বার, ডোনার ও ফান্ডের হিসাব শূন্য হয়ে যাবে।')) {
      clearAllData();
      setMembers([]);
      setDonors([]);
      setNotices([]);
      setFunds([]);
      notifySuccess('সমস্ত ডেটা খালি করা হয়েছে। এখন আপনি নতুন করে এন্ট্রি দিতে পারেন।');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Admin Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              id="admin-back-btn"
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              title="হোমে ফিরুন"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  এডমিন মোড সক্রিয় • কোনো গুগল শিটের প্রয়োজন নেই
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                ইন-অ্যাপ সেন্ট্রাল এডমিন প্যানেল
              </h2>
              <p className="text-xs text-slate-300">
                {profile.name} • {profile.address}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportAppBackupJSON}
              id="admin-export-backup-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs transition"
              title="পুরো অ্যাপের ডেটা ব্যাকআপ JSON ডাউনলোড করুন"
            >
              <Download className="w-4 h-4" />
              <span>ফুল ব্যাকআপ JSON</span>
            </button>

            <button
              onClick={() => {
                setIsAdmin(false);
                onBack();
              }}
              id="admin-logout-btn"
              className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/20 text-red-200 border border-red-500/40 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Admin Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('overview')}
          id="admin-tab-overview"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ওভারভিউ</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          id="admin-tab-members"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'members'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>সদস্য ব্যবস্থাপনা ({toBengaliNumber(members.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          id="admin-tab-donors"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'donors'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>রক্তদান ব্যবস্থাপনা ({toBengaliNumber(donors.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('funds')}
          id="admin-tab-funds"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'funds'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>ফান্ড ও হিসাব ({toBengaliNumber(funds.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          id="admin-tab-notices"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'notices'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>নোটিশ বোর্ড ({toBengaliNumber(notices.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          id="admin-tab-settings"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>সংগঠন সেটিংস ও ব্যাকআপ</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Real-time Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">মোট সদস্য</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(members.length)} জন
              </div>
              <button
                onClick={() => { setActiveTab('members'); setIsAddMemberOpen(true); }}
                className="text-[11px] font-bold text-blue-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন সদস্য যোগ
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">স্বেচ্ছায় রক্তদাতা</span>
                <Droplet className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(donors.length)} জন
              </div>
              <button
                onClick={() => { setActiveTab('donors'); setIsAddDonorOpen(true); }}
                className="text-[11px] font-bold text-rose-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন দাতা নিবন্ধন
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">মোট ফান্ড ব্যালেন্স</span>
                <Wallet className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-2xl font-black text-teal-700 mt-2">
                {formatTaka(fundSummary.totalBalance)}
              </div>
              <span className="text-[11px] text-slate-500 mt-2 block">
                আদায়: {formatTaka(fundSummary.totalPaid)} • বকেয়া: {formatTaka(fundSummary.totalDue)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">প্রকাশিত নোটিশ</span>
                <BellRing className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {toBengaliNumber(notices.length)} টি
              </div>
              <button
                onClick={() => { setActiveTab('notices'); setIsAddNoticeOpen(true); }}
                className="text-[11px] font-bold text-amber-600 hover:underline mt-2 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> নতুন নোটিশ প্রকাশ
              </button>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              সংগঠনের পরিচিতি ও দ্রুত অ্যাকশন
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">স্থায়ী ঠিকানা:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.address}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">জরুরি হটলাইন:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block font-mono">{profile.hotline}</span>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 font-semibold block">রেজিস্ট্রেশন নম্বর:</span>
                <span className="text-slate-900 font-bold text-sm mt-0.5 block">{profile.regNumber}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS CRUD */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Action Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="সদস্যের নাম, পদবি, এলাকা বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSheetCSV('members')}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingMember(null);
                  setIsAddMemberOpen(true);
                }}
                id="admin-add-member-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন সদস্য যুক্ত করুন</span>
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">নাম ও পদবি</th>
                    <th className="p-3.5">গ্রুপ</th>
                    <th className="p-3.5">মোবাইল</th>
                    <th className="p-3.5">এলাকা</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {members
                    .filter(m =>
                      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      m.designation.toLowerCase().includes(memberSearch.toLowerCase()) ||
                      m.phone.includes(memberSearch) ||
                      (m.area && m.area.toLowerCase().includes(memberSearch.toLowerCase()))
                    )
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[11px] text-slate-500">{m.designation}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                            {m.bloodGroup}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-800">{m.phone}</td>
                        <td className="p-3.5 text-slate-600">{m.area || 'পতেঙ্গা, চট্টগ্রাম'}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status || 'সক্রিয়'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingMember(m)}
                            id={`edit-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            id={`delete-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BLOOD DONORS CRUD */}
      {activeTab === 'donors' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                placeholder="রক্তদাতার নাম, রক্তের গ্রুপ বা ফোন দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSheetCSV('donors')}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingDonor(null);
                  setIsAddDonorOpen(true);
                }}
                id="admin-add-donor-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন রক্তদাতা যোগ</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {donors
              .filter(d =>
                d.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
                d.bloodGroup.toLowerCase().includes(donorSearch.toLowerCase()) ||
                d.phone.includes(donorSearch) ||
                (d.area && d.area.toLowerCase().includes(donorSearch.toLowerCase()))
              )
              .map(d => {
                const eligibility = isDonorEligible(d);
                const bgBadge = getBloodGroupBadge(d.bloodGroup);

                return (
                  <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-sm ${bgBadge.bg} ${bgBadge.border} ${bgBadge.text}`}>
                            {d.bloodGroup}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                            <span className="text-xs text-slate-500 font-mono">{d.phone}</span>
                          </div>
                        </div>

                        {eligibility.eligible ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            প্রস্তুত
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {toBengaliNumber(eligibility.daysRemaining)} দিন বাকি
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl text-[11px]">
                        <div>
                          <span className="text-slate-500 block">সর্বশেষ দান:</span>
                          <span className="font-bold text-slate-700">{d.lastDonationDate ? formatBengaliDate(d.lastDonationDate) : 'তথ্য নেই'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">পরবর্তী তারিখ:</span>
                          <span className="font-bold text-rose-700">{d.nextEligibleDate ? formatBengaliDate(d.nextEligibleDate) : 'প্রস্তুত'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setLoggingDonationDonor(d)}
                        className="text-[11px] font-bold text-rose-700 hover:text-rose-900 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1"
                      >
                        <Droplet className="w-3 h-3" />
                        <span>নতুন রক্তদান এন্ট্রি</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingDonor(d)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="এডিট"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDonor(d.id, d.name)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                          title="ডিলিট"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 4: FUNDS CRUD (Live Auto Balance Calculation) */}
      {activeTab === 'funds' && (
        <div className="space-y-4">
          {/* Live Auto Balance Banner */}
          <div className="bg-gradient-to-r from-teal-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-teal-200 uppercase tracking-wider block">
                স্বয়ংক্রিয় ব্যালেন্স (Live Auto Balance)
              </span>
              <div className="text-3xl font-black text-white mt-1">
                {formatTaka(fundSummary.totalBalance)}
              </div>
              <p className="text-[11px] text-teal-300 mt-1">
                যেকোনো এন্ট্রি যোগ/বদল/মুছে ফেলার সাথে সাথে অটোমেটিক হিসাব আপডেট হয়
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-emerald-300 block font-semibold">আদায়কৃত (Paid)</span>
                <span className="text-base font-bold text-white">{formatTaka(fundSummary.totalPaid)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center">
                <span className="text-[10px] text-amber-300 block font-semibold">বকেয়া (Due)</span>
                <span className="text-base font-bold text-amber-200">{formatTaka(fundSummary.totalDue)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fundSearch}
                onChange={(e) => setFundSearch(e.target.value)}
                placeholder="সদস্যের নাম বা মাস দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSheetCSV('fund')}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => {
                  setEditingFund(null);
                  setIsAddFundOpen(true);
                }}
                id="admin-add-fund-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>নতুন ফান্ড এন্ট্রি যোগ</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">সদস্যের নাম</th>
                    <th className="p-3.5">পরিমাণ (৳)</th>
                    <th className="p-3.5">মাস/তারিখ</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5">নোট</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {funds
                    .filter(f =>
                      f.memberName.toLowerCase().includes(fundSearch.toLowerCase()) ||
                      (f.month && f.month.toLowerCase().includes(fundSearch.toLowerCase())) ||
                      (f.notes && f.notes.toLowerCase().includes(fundSearch.toLowerCase()))
                    )
                    .map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900">{f.memberName}</td>
                        <td className="p-3.5 font-extrabold text-sm text-slate-900">
                          {formatTaka(f.amount)}
                        </td>
                        <td className="p-3.5 text-slate-600">{f.month || f.date}</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleFundStatus(f.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                              f.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                            title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                          >
                            {f.status === 'Paid' ? 'Paid (পরিশোধিত)' : 'Due (বকেয়া)'}
                          </button>
                        </td>
                        <td className="p-3.5 text-slate-500">{f.notes || '-'}</td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingFund(f)}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                            title="এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFund(f.id, f.memberName)}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="ডিলিট"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NOTICES CRUD */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-4 h-4 text-amber-600" />
              নোটিশ ব্যবস্থাপনা
            </h3>

            <button
              onClick={() => {
                setEditingNotice(null);
                setIsAddNoticeOpen(true);
              }}
              id="admin-add-notice-btn"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নোটিশ প্রকাশ</span>
            </button>
          </div>

          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {n.priority || 'সাধারণ'}
                      </span>
                      <span className="text-xs text-slate-500">{formatBengaliDate(n.date)}</span>
                      {n.isPinned && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Pin className="w-3 h-3" /> পিন করা
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1.5">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{n.noticeText}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleTogglePinNotice(n.id)}
                      className={`p-1.5 rounded-lg text-xs transition ${n.isPinned ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}
                      title={n.isPinned ? 'আনপিন করুন' : 'পিন করুন'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingNotice(n)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                      title="এডিট"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                      title="ডিলিট"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS, PERMANENT ADDRESS & BACKUP */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Organization Profile Settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-700" />
              সংগঠনের পরিচিতি ও স্থায়ী ঠিকানা কনফিগারেশন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              ভবিষ্যতে কোনো কোড না বদলিয়ে অ্যাপের ভেতর থেকেই যেকোনো তথ্য পরিবর্তন করুন।
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংগঠনের পূর্ণ নাম
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileData.name}
                    onChange={(e) => setEditProfileData({ ...editProfileData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    প্রতিষ্ঠা সাল / তারিখ (যেমন: ১৫/০৮/২০২২ইং)
                  </label>
                  <input
                    type="text"
                    value={editProfileData.establishedDate || ''}
                    onChange={(e) => setEditProfileData({ ...editProfileData, establishedDate: e.target.value })}
                    placeholder="১৫/০৮/২০২২ইং"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-amber-900 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    সংগঠনের মূল বাণী / স্লোগান
                  </label>
                  <input
                    type="text"
                    value={editProfileData.tagline}
                    onChange={(e) => setEditProfileData({ ...editProfileData, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্থায়ী ঠিকানা (Permanent Address) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProfileData.address}
                    onChange={(e) => setEditProfileData({ ...editProfileData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none font-bold text-purple-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    জরুরি হটলাইন
                  </label>
                  <input
                    type="text"
                    value={editProfileData.hotline}
                    onChange={(e) => setEditProfileData({ ...editProfileData, hotline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রক্তদান জরুরি যোগাযোগ
                  </label>
                  <input
                    type="text"
                    value={editProfileData.emergencyContact}
                    onChange={(e) => setEditProfileData({ ...editProfileData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    রেজিস্ট্রেশন নম্বর
                  </label>
                  <input
                    type="text"
                    value={editProfileData.regNumber}
                    onChange={(e) => setEditProfileData({ ...editProfileData, regNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>সংগঠনের তথ্য সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Admin PIN */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              এডমিন গোপন পিন কোড পরিবর্তন
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              বর্তমান পিন কোড দিয়ে নতুন যেকোনো পিন কোড সেট করতে পারবেন।
            </p>

            <form onSubmit={handleChangePin} className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">বর্তমান পিন</label>
                <input
                  type="password"
                  required
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  placeholder="বর্তমান পিন কোড দিন..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নতুন পিন</label>
                  <input
                    type="password"
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="৪-৬ ডিজিটের পিন..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">নিশ্চিত করুন</label>
                  <input
                    type="password"
                    required
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    placeholder="একই পিন পুনরায় দিন..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                পিন কোড আপডেট করুন
              </button>
            </form>
          </div>

          {/* Backup, Restore & Reset Control Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              সম্পূর্ণ ডেটা ব্যাকআপ, রিস্টোর ও রিসেট
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={exportAppBackupJSON}
                className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-left transition"
              >
                <Download className="w-5 h-5 text-indigo-600 mb-1" />
                <span className="font-bold text-xs block">১. ব্যাকআপ ডাউনলোড (JSON)</span>
                <span className="text-[10px] text-slate-500">সকল ডেটা ফাইল আকারে নিজের ফোনে সংরক্ষণ করুন</span>
              </button>

              <label className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-left transition cursor-pointer">
                <Upload className="w-5 h-5 text-emerald-600 mb-1" />
                <span className="font-bold text-xs block">২. ব্যাকআপ রিস্টোর (JSON)</span>
                <span className="text-[10px] text-slate-500">পূর্বের সেভ করা JSON ফাইল আপলোড করুন</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>

              <button
                onClick={handleResetToDefault}
                className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-left transition"
              >
                <RefreshCw className="w-5 h-5 text-slate-600 mb-1" />
                <span className="font-bold text-xs block">৩. সিলেট ডিফল্ট ডেটা রিসেট</span>
                <span className="text-[10px] text-slate-500">সিলেট মানব সেবা সংঘঠনের স্ট্যান্ডার্ড তথ্যে রিসেট করুন</span>
              </button>

              <button
                onClick={handleClearAll}
                className="p-3 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-xl text-left transition"
              >
                <Trash2 className="w-5 h-5 text-red-600 mb-1" />
                <span className="font-bold text-xs block">৪. ফ্রেশ / ক্লিন স্লেট (Clear All)</span>
                <span className="text-[10px] text-red-600">সব রেকর্ড মুছে শূন্য (Clean) করে নিন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER MODAL (Add / Edit) */}
      {(isAddMemberOpen || editingMember) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {editingMember ? 'সদস্যের তথ্য সম্পাদনা (Edit)' : 'নতুন সদস্য যুক্তকরণ (Add)'}
              </h3>
              <button
                onClick={() => { setIsAddMemberOpen(false); setEditingMember(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">পূর্ণ নাম (Name) *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingMember?.name || ''}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পদবি (Designation) *</label>
                  <input
                    type="text"
                    name="designation"
                    required
                    defaultValue={editingMember?.designation || 'সদস্য'}
                    placeholder="যেমন: সাধারণ সম্পাদক"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তের গ্রুপ (BloodGroup) *</label>
                  <select
                    name="bloodGroup"
                    defaultValue={editingMember?.bloodGroup || 'O+'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-rose-700 bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর (Phone) *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={editingMember?.phone || ''}
                    placeholder="01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">এলাকা / ঠিকানা (Area)</label>
                  <input
                    type="text"
                    name="area"
                    defaultValue={editingMember?.area || 'পতেঙ্গা, চট্টগ্রাম'}
                    placeholder="যেমন: কাঠগড়, পতেঙ্গা, চট্টগ্রাম"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">যোগদানের তারিখ</label>
                  <input
                    type="date"
                    name="joinDate"
                    defaultValue={editingMember?.joinDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সদস্য পদ স্ট্যাটাস</label>
                  <select
                    name="status"
                    defaultValue={editingMember?.status || 'সক্রিয়'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="সক্রিয়">সক্রিয়</option>
                    <option value="স্থগিত">স্থগিত</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddMemberOpen(false); setEditingMember(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingMember ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BLOOD DONOR MODAL (Add / Edit) */}
      {(isAddDonorOpen || editingDonor) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-600" />
                {editingDonor ? 'রক্তদাতার তথ্য সম্পাদনা (Edit)' : 'নতুন রক্তদাতা নিবন্ধন (Add)'}
              </h3>
              <button
                onClick={() => { setIsAddDonorOpen(false); setEditingDonor(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDonor} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তদাতার নাম *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDonor?.name || ''}
                  placeholder="যেমন: কাজী আরমানুল হক"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={editingDonor?.phone || ''}
                    placeholder="01819-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-rose-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তের গ্রুপ *</label>
                  <select
                    name="bloodGroup"
                    defaultValue={editingDonor?.bloodGroup || 'A+'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-rose-700 bg-white"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">সর্বশেষ রক্তদানের তারিখ</label>
                  <input
                    type="date"
                    name="lastDonationDate"
                    defaultValue={editingDonor?.lastDonationDate || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">পরবর্তী উপযুক্ত তারিখ (+৯০ দিন)</label>
                  <input
                    type="date"
                    name="nextEligibleDate"
                    defaultValue={editingDonor?.nextEligibleDate || ''}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none bg-rose-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">এলাকা</label>
                  <input
                    type="text"
                    name="area"
                    defaultValue={editingDonor?.area || 'পতেঙ্গা, চট্টগ্রাম'}
                    placeholder="যেমন: পতেঙ্গা সী-বীচ রোড"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মোট রক্তদান সংখ্যা</label>
                  <input
                    type="number"
                    name="totalDonations"
                    defaultValue={editingDonor?.totalDonations || 1}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddDonorOpen(false); setEditingDonor(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  {editingDonor ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK LOG DONATION MODAL */}
      {loggingDonationDonor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              রক্তদান সম্পন্ন রেকর্ড করুন
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              <strong>{loggingDonationDonor.name}</strong> ({loggingDonationDonor.bloodGroup}) এর আজকের রক্তদানের তারিখ ও স্বয়ংক্রিয় +৯০ দিন সেট করুন।
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const dDate = (e.currentTarget.elements.namedItem('donationDate') as HTMLInputElement).value;
                handleQuickLogDonation(loggingDonationDonor.id, dDate);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">রক্তদানের তারিখ</label>
                <input
                  type="date"
                  name="donationDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLoggingDonationDonor(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                >
                  লিপিবদ্ধ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FUND MODAL (Add / Edit) */}
      {(isAddFundOpen || editingFund) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600" />
                {editingFund ? 'ফান্ড এন্ট্রি সম্পাদনা (Edit)' : 'নতুন চাঁদা / ফান্ড এন্ট্রি (Add)'}
              </h3>
              <button
                onClick={() => { setIsAddFundOpen(false); setEditingFund(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFund} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">সদস্য বা বিবরণ *</label>
                <input
                  type="text"
                  name="memberName"
                  required
                  defaultValue={editingFund?.memberName || ''}
                  placeholder="যেমন: মোহাম্মদ সাহেদুল আলম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    defaultValue={editingFund?.amount || '1000'}
                    placeholder="1000"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">স্ট্যাটাস *</label>
                  <select
                    name="status"
                    defaultValue={editingFund?.status || 'Paid'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="Paid">Paid (পরিশোধিত)</option>
                    <option value="Due">Due (বকেয়া)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">মাস / সাল</label>
                  <input
                    type="text"
                    name="month"
                    defaultValue={editingFund?.month || 'চলতি মাস'}
                    placeholder="যেমন: আগস্ট ২০২৬"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ফোন নম্বর (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={editingFund?.phone || ''}
                    placeholder="01811-XXXXXX"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নোট / মন্তব্য</label>
                <input
                  type="text"
                  name="notes"
                  defaultValue={editingFund?.notes || ''}
                  placeholder="যেমন: নগদ / বিকাশ মারফত জমা"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddFundOpen(false); setEditingFund(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  {editingFund ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTICE MODAL (Add / Edit) */}
      {(isAddNoticeOpen || editingNotice) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-600" />
                {editingNotice ? 'নোটিশ সম্পাদনা (Edit)' : 'নতুন নোটিশ প্রকাশ (Post)'}
              </h3>
              <button
                onClick={() => { setIsAddNoticeOpen(false); setEditingNotice(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotice} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">তারিখ *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={editingNotice?.date || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ধরন / ক্যাটাগরি</label>
                  <select
                    name="priority"
                    defaultValue={editingNotice?.priority || 'সাধারণ'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white"
                  >
                    <option value="সাধারণ">সাধারণ নোটিশ</option>
                    <option value="জরুরি">জরুরি নোটিশ</option>
                    <option value="মিটিং">মাসিক মিটিং</option>
                    <option value="রক্তদান">রক্তদান ক্যাম্প</option>
                    <option value="ত্রাণ">ত্রাণ ও সেবা</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">শিরোনাম / বিষয়</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingNotice?.title || ''}
                  placeholder="যেমন: পতেঙ্গা এলাকায় জরুরি রক্তদান ক্যাম্পেইন"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">নোটিশের বিবরণ *</label>
                <textarea
                  name="noticeText"
                  rows={4}
                  required
                  defaultValue={editingNotice?.noticeText || ''}
                  placeholder="বিস্তারিত নোটিশ লিখুন..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPinned"
                  id="admin-pin-checkbox"
                  defaultChecked={editingNotice?.isPinned}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="admin-pin-checkbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  বোর্ডের শীর্ষে পিন করে রাখুন
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddNoticeOpen(false); setEditingNotice(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs"
                >
                  {editingNotice ? 'আপডেট করুন' : 'প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
