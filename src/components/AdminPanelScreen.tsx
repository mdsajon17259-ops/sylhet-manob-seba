import React, { useState, useMemo, useEffect } from 'react';
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
  TrendingDown,
  FileText,
  CreditCard,
  ArrowRight,
  Smartphone,
  Sparkles,
  Copy,
  Eye,
  Camera
} from 'lucide-react';
import { ExpenseModal } from './ExpenseModal';
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  BloodGroup,
  PaymentGatewayConfig,
  PaymentStatus
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
  resetAllData,
  clearAllData,
  setAdminPin,
  getAdminPin,
  verifyAdminPin,
  loadPaymentSettings,
  savePaymentSettings
} from '../utils/storage';

interface AdminPanelScreenProps {
  profile: OrganizationProfile;
  onUpdateProfile?: (p: OrganizationProfile) => void;
  setProfile?: (p: OrganizationProfile) => void;
  members: Member[];
  onAddMember?: (m: Omit<Member, 'id'>) => void;
  onEditMember?: (m: Member) => void;
  onDeleteMember?: (id: string, name: string) => void;
  setMembers?: React.Dispatch<React.SetStateAction<Member[]>>;
  donors: BloodDonor[];
  onAddDonor?: (d: Omit<BloodDonor, 'id'>) => void;
  onEditDonor?: (d: BloodDonor) => void;
  onDeleteDonor?: (id: string, name: string) => void;
  setDonors?: React.Dispatch<React.SetStateAction<BloodDonor[]>>;
  notices: Notice[];
  onAddNotice?: (n: Omit<Notice, 'id'>) => void;
  onEditNotice?: (n: Notice) => void;
  onDeleteNotice?: (id: string) => void;
  setNotices?: React.Dispatch<React.SetStateAction<Notice[]>>;
  funds: FundRecord[];
  onAddFund?: (f: Omit<FundRecord, 'id'>) => void;
  onEditFund?: (f: FundRecord) => void;
  onDeleteFund?: (id: string) => void;
  onToggleFundStatus?: (id: string, newStatus: PaymentStatus) => void;
  setFunds?: React.Dispatch<React.SetStateAction<FundRecord[]>>;
  paymentConfig?: PaymentGatewayConfig;
  onUpdatePaymentConfig?: (config: PaymentGatewayConfig) => void;
  onResetAll?: () => void;
  isAdmin?: boolean;
  setIsAdmin?: (val: boolean) => void;
  onBack: () => void;
  activeScreen?: string;
}

export const AdminPanelScreen: React.FC<AdminPanelScreenProps> = ({
  profile,
  onUpdateProfile,
  setProfile,
  members,
  onAddMember,
  onEditMember,
  onDeleteMember,
  setMembers,
  donors,
  onAddDonor,
  onEditDonor,
  onDeleteDonor,
  setDonors,
  notices,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  setNotices,
  funds,
  onAddFund,
  onEditFund,
  onDeleteFund,
  onToggleFundStatus,
  setFunds,
  paymentConfig: initialPaymentConfig,
  onUpdatePaymentConfig,
  onResetAll,
  isAdmin,
  setIsAdmin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'donors' | 'funds' | 'notices' | 'payments' | 'settings'>('overview');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentPreviewTab, setPaymentPreviewTab] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [copiedTestField, setCopiedTestField] = useState<string | null>(null);

  // Search terms per tab
  const [memberSearch, setMemberSearch] = useState('');
  const [donorSearch, setDonorSearch] = useState('');
  const [fundSearch, setFundSearch] = useState('');

  // Modals / Edit states
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberPhotoBase64, setMemberPhotoBase64] = useState<string>('');

  useEffect(() => {
    if (editingMember) {
      setMemberPhotoBase64(editingMember.photoUrl || '');
    } else {
      setMemberPhotoBase64('');
    }
  }, [editingMember, isAddMemberOpen]);

  const handleMemberPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notifyError('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setMemberPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [editingDonor, setEditingDonor] = useState<BloodDonor | null>(null);
  const [isAddDonorOpen, setIsAddDonorOpen] = useState(false);
  const [loggingDonationDonor, setLoggingDonationDonor] = useState<BloodDonor | null>(null);

  const [editingFund, setEditingFund] = useState<FundRecord | null>(null);
  const [isAddFundOpen, setIsAddFundOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FundRecord | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [isAddNoticeOpen, setIsAddNoticeOpen] = useState(false);

  // Settings State
  const [editProfileData, setEditProfileData] = useState<OrganizationProfile>(profile);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(
    () => initialPaymentConfig || loadPaymentSettings()
  );

  useEffect(() => {
    if (initialPaymentConfig) {
      setPaymentConfig(initialPaymentConfig);
    }
  }, [initialPaymentConfig]);

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

  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();
    savePaymentSettings(paymentConfig);
    if (onUpdatePaymentConfig) {
      onUpdatePaymentConfig(paymentConfig);
    }
    notifySuccess('বিকাশ, নগদ ও রকেট পেমেন্ট গেটওয়ে নম্বর সফলভাবে সংরক্ষিত ও লাইভ আপডেট হয়েছে');
  };

  const handleTestCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedTestField(field);
    setTimeout(() => setCopiedTestField(null), 2500);
  };

  // Fund balance calculations (Auto Balance Calculation)
  const fundSummary = useMemo(() => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpense = 0;
    let totalPending = 0;
    let paidItems = 0;
    let dueItems = 0;
    let expenseItems = 0;
    let pendingItems = 0;

    funds.forEach(f => {
      if (f.status === 'Paid') {
        totalPaid += f.amount;
        paidItems++;
      } else if (f.status === 'Expense') {
        totalExpense += f.amount;
        expenseItems++;
      } else if (f.status === 'Pending') {
        totalPending += f.amount;
        pendingItems++;
      } else if (f.status === 'Due') {
        totalDue += f.amount;
        dueItems++;
      }
    });

    const netBalance = totalPaid - totalExpense;

    return {
      totalBalance: netBalance,
      totalPaid,
      totalDue,
      totalExpense,
      totalPending,
      paidItems,
      dueItems,
      expenseItems,
      pendingItems
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
    const area = formData.get('area') as string;
    const photoUrl = memberPhotoBase64.trim();
    const joinDate = formData.get('joinDate') as string;
    const email = formData.get('email') as string;
    const status = formData.get('status') as 'সক্রিয়' | 'স্থগিত';

    if (!name.trim() || !phone.trim()) {
      notifyError('নাম এবং মোবাইল নম্বর অবশ্যই প্রদান করুন');
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
          photoUrl: photoUrl?.trim() || undefined,
          joinDate: joinDate || editingMember.joinDate,
          email: email.trim(),
          status
        });
      } else if (setMembers) {
        setMembers(prev => prev.map(m => m.id === editingMember.id ? {
          ...m,
          name: name.trim(),
          designation: designation.trim(),
          phone: phone.trim(),
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          photoUrl: photoUrl?.trim() || undefined,
          joinDate: joinDate || m.joinDate,
          email: email.trim(),
          status
        } : m));
      }
      setEditingMember(null);
      notifySuccess('সদস্যের তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddMember) {
        onAddMember({
          name: name.trim(),
          designation: designation.trim() || 'সদস্য',
          phone: phone.trim(),
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          photoUrl: photoUrl?.trim() || undefined,
          joinDate: joinDate || new Date().toISOString().split('T')[0],
          email: email.trim(),
          status: status || 'সক্রিয়'
        });
      } else if (setMembers) {
        const newMember: Member = {
          id: `m-${Date.now()}`,
          name: name.trim(),
          designation: designation.trim() || 'সদস্য',
          phone: phone.trim(),
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          photoUrl: photoUrl?.trim() || undefined,
          joinDate: joinDate || new Date().toISOString().split('T')[0],
          email: email.trim(),
          status: status || 'সক্রিয়'
        };
        setMembers(prev => [newMember, ...prev]);
      }
      setIsAddMemberOpen(false);
      notifySuccess('নতুন সদস্য সফলভাবে ডাটাবেজে যুক্ত হয়েছে');
    }
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${name}"-কে সদস্য তালিকা থেকে মুছে ফেলতে চান?`)) {
      if (onDeleteMember) {
        onDeleteMember(id, name);
      } else if (setMembers) {
        setMembers(prev => prev.filter(m => m.id !== id));
      }
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
      if (onEditDonor) {
        onEditDonor({
          ...editingDonor,
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        });
      } else if (setDonors) {
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
      }
      setEditingDonor(null);
      notifySuccess('রক্তদাতার তথ্য সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddDonor) {
        onAddDonor({
          name: name.trim(),
          phone: phone.trim(),
          bloodGroup,
          lastDonationDate: lastDonationDate || '',
          nextEligibleDate: calculatedNext,
          area: area.trim() || 'পতেঙ্গা, চট্টগ্রাম',
          totalDonations,
          notes: notes.trim()
        });
      } else if (setDonors) {
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
      }
      setIsAddDonorOpen(false);
      notifySuccess('নতুন রক্তদাতা সফলভাবে নিবন্ধিত হয়েছে');
    }
  };

  const handleDeleteDonor = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}" রক্তদাতাকে মুছে ফেলতে চান?`)) {
      if (onDeleteDonor) {
        onDeleteDonor(id, name);
      } else if (setDonors) {
        setDonors(prev => prev.filter(d => d.id !== id));
      }
      notifySuccess(`"${name}" রক্তদাতা ডিরেক্টরি থেকে মুছে ফেলা হয়েছে`);
    }
  };

  const handleQuickLogDonation = (donorId: string, donationDateStr: string) => {
    const nextDate = calculateNextEligibleDate(donationDateStr);
    const donorToUpdate = donors.find(d => d.id === donorId);
    if (donorToUpdate && onEditDonor) {
      onEditDonor({
        ...donorToUpdate,
        lastDonationDate: donationDateStr,
        nextEligibleDate: nextDate,
        totalDonations: (donorToUpdate.totalDonations || 0) + 1
      });
    } else if (setDonors) {
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
    }
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
    const status = (formData.get('status') as PaymentStatus) || 'Paid';
    const month = formData.get('month') as string;
    const phone = formData.get('phone') as string;
    const notes = formData.get('notes') as string;

    if (!memberName.trim() || isNaN(amount) || amount <= 0) {
      notifyError('সদস্যের নাম এবং সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (editingFund) {
      if (onEditFund) {
        onEditFund({
          ...editingFund,
          memberName: memberName.trim(),
          amount,
          status,
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim()
        });
      } else if (setFunds) {
        setFunds(prev => prev.map(f => f.id === editingFund.id ? {
          ...f,
          memberName: memberName.trim(),
          amount,
          status,
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim()
        } : f));
      }
      setEditingFund(null);
      notifySuccess('ফান্ড এন্ট্রি ও ব্যালেন্স সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddFund) {
        onAddFund({
          memberName: memberName.trim(),
          amount,
          status,
          date: new Date().toISOString().split('T')[0],
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim() || (status === 'Paid' ? 'পরিশোধিত' : status === 'Expense' ? 'সংগঠনের ব্যয়' : 'বকেয়া'),
          type: status === 'Expense' ? 'expense' : undefined
        });
      } else if (setFunds) {
        const newFund: FundRecord = {
          id: `f-${Date.now()}`,
          memberName: memberName.trim(),
          amount,
          status,
          date: new Date().toISOString().split('T')[0],
          month: month.trim() || 'চলতি মাস',
          phone: phone.trim(),
          notes: notes.trim() || (status === 'Paid' ? 'পরিশোধিত' : status === 'Expense' ? 'সংগঠনের ব্যয়' : 'বকেয়া'),
          type: status === 'Expense' ? 'expense' : undefined
        };
        setFunds(prev => [newFund, ...prev]);
      }
      setIsAddFundOpen(false);
      notifySuccess('নতুন ফান্ড এন্ট্রি যুক্ত হয়েছে এবং ব্যালেন্স স্বয়ংক্রিয়ভাবে আপডেট হয়েছে');
    }
  };

  const handleSaveExpense = (data: {
    description: string;
    amount: number;
    disbursedTo: string;
    date: string;
    category: string;
    voucherNo?: string;
    notes?: string;
  }) => {
    let noteText: string | undefined = undefined;
    const cleanVoucher = data.voucherNo ? data.voucherNo.trim() : '';
    const cleanNotes = data.notes ? data.notes.trim() : '';

    if (cleanVoucher && cleanNotes) {
      noteText = `ভাউচার: ${cleanVoucher} - ${cleanNotes}`;
    } else if (cleanVoucher) {
      noteText = `ভাউচার: ${cleanVoucher}`;
    } else if (cleanNotes) {
      noteText = cleanNotes;
    }

    if (editingExpense && onEditFund) {
      onEditFund({
        ...editingExpense,
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
      notifySuccess('খরচের বিবরণ সফলভাবে আপডেট হয়েছে');
    } else if (onAddFund) {
      onAddFund({
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      });
      notifySuccess('নতুন খরচের বিবরণ সফলভাবে সংরক্ষিত হয়েছে');
    } else if (setFunds) {
      const newRecord: FundRecord = {
        id: `f-${Date.now()}`,
        memberName: data.disbursedTo,
        amount: data.amount,
        status: 'Expense',
        type: 'expense',
        description: data.description,
        date: data.date,
        category: (data.category as any) || 'বিবিধ ও অন্যান্য ব্যয়',
        disbursedTo: data.disbursedTo,
        notes: noteText
      };
      setFunds(prev => [newRecord, ...prev]);
      notifySuccess('নতুন খরচের বিবরণ সফলভাবে সংরক্ষিত হয়েছে');
    }
    setIsExpenseModalOpen(false);
    setEditingExpense(null);
  };

  const handleToggleFundStatus = (fundId: string) => {
    const target = funds.find(f => f.id === fundId);
    if (!target || target.status === 'Expense') return;

    const nextStatus: PaymentStatus = target.status === 'Pending' ? 'Paid' : target.status === 'Paid' ? 'Due' : 'Paid';

    if (onToggleFundStatus) {
      onToggleFundStatus(fundId, nextStatus);
    } else if (setFunds) {
      setFunds(prev => prev.map(f => {
        if (f.id === fundId) {
          return {
            ...f,
            status: nextStatus,
            approvedAt: nextStatus === 'Paid' ? new Date().toISOString() : f.approvedAt
          };
        }
        return f;
      }));
    }
    notifySuccess(nextStatus === 'Paid' ? 'পেমেন্ট অনুমোদিত ও পরিশোধিত হিসেবে চিহ্নিত হয়েছে' : 'স্ট্যাটাস বকেয়া (Due) করা হয়েছে');
  };

  const handleDeleteFund = (id: string, name: string) => {
    if (window.confirm(`আপনি কি "${name}"-এর ফান্ড এন্ট্রিটি মুছে ফেলতে চান?`)) {
      if (onDeleteFund) {
        onDeleteFund(id);
      } else if (setFunds) {
        setFunds(prev => prev.filter(f => f.id !== id));
      }
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
      if (onEditNotice) {
        onEditNotice({
          ...editingNotice,
          title: title.trim() || 'সাধারণ নোটিশ',
          noticeText: noticeText.trim(),
          priority,
          date: date || editingNotice.date,
          isPinned
        });
      } else if (setNotices) {
        setNotices(prev => prev.map(n => n.id === editingNotice.id ? {
          ...n,
          title: title.trim() || 'সাধারণ নোটিশ',
          noticeText: noticeText.trim(),
          priority,
          date: date || n.date,
          isPinned
        } : n));
      }
      setEditingNotice(null);
      notifySuccess('নোটিশ সফলভাবে আপডেট হয়েছে');
    } else {
      if (onAddNotice) {
        onAddNotice({
          title: title.trim() || 'সাধারণ নোটিশ',
          noticeText: noticeText.trim(),
          priority: priority || 'সাধারণ',
          date: date || new Date().toISOString().split('T')[0],
          isPinned: isPinned || priority === 'জরুরি'
        });
      } else if (setNotices) {
        const newNotice: Notice = {
          id: `n-${Date.now()}`,
          title: title.trim() || 'সাধারণ নোটিশ',
          noticeText: noticeText.trim(),
          priority: priority || 'সাধারণ',
          date: date || new Date().toISOString().split('T')[0],
          isPinned: isPinned || priority === 'জরুরি'
        };
        setNotices(prev => [newNotice, ...prev]);
      }
      setIsAddNoticeOpen(false);
      notifySuccess('নতুন নোটিশ সফলভাবে বোর্ডে প্রকাশিত হয়েছে');
    }
  };

  const handleDeleteNotice = (id: string) => {
    if (window.confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      if (onDeleteNotice) {
        onDeleteNotice(id);
      } else if (setNotices) {
        setNotices(prev => prev.filter(n => n.id !== id));
      }
      notifySuccess('নোটিশ সফলভাবে মুছে ফেলা হয়েছে');
    }
  };

  const handleTogglePinNotice = (id: string) => {
    const target = notices.find(n => n.id === id);
    if (target && onEditNotice) {
      onEditNotice({ ...target, isPinned: !target.isPinned });
    } else if (setNotices) {
      setNotices(prev => prev.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    }
  };

  // ORGANIZATION PROFILE & SETTINGS
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile(editProfileData);
    } else if (setProfile) {
      setProfile(editProfileData);
    }
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
              onClick={() => {
                setIsAdmin(false);
                onBack();
              }}
              id="admin-logout-btn"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 rounded-xl transition"
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
          onClick={() => setActiveTab('payments')}
          id="admin-tab-payments"
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'payments'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>পেমেন্ট নম্বর ব্যবস্থাপনা</span>
          {(paymentConfig.bkashNumber || paymentConfig.nagadNumber || paymentConfig.rocketNumber) && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          )}
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              সংগঠনের পরিচিতি ও সরাসরি নিয়ন্ত্রণ
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

            {/* Direct Shortcut to Payment Numbers */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    বিকাশ, নগদ ও রকেট পেমেন্ট নম্বর পরিবর্তন ও লাইভ ব্যবস্থাপনা
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    সদস্যদের চাঁদা পরিশোধের জন্য যেকোনো সময় নতুন মোবাইল ব্যাংকিং নম্বর সেট করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('payments')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <span>নম্বর ম্যানেজ করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
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
                    <th className="p-3.5">মোবাইল নম্বর</th>
                    <th className="p-3.5">এলাকা</th>
                    <th className="p-3.5">যোগদান</th>
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
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden shadow-2xs">
                              {m.photoUrl ? (
                                <img
                                  src={m.photoUrl}
                                  alt={m.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                m.name.charAt(0)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{m.name}</div>
                              <div className="text-[11px] text-slate-500">{m.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-800 font-semibold">{m.phone}</td>
                        <td className="p-3.5 text-slate-600">{m.area || 'পতেঙ্গা, চট্টগ্রাম'}</td>
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {m.joinDate ? toBengaliNumber(m.joinDate) : '১৫/০৮/২০২২'}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {m.status || 'সক্রিয়'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => setEditingMember(m)}
                            id={`edit-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                            title="এডিট করুন"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(m.id, m.name)}
                            id={`delete-member-${m.id}`}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
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

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-emerald-300 block font-semibold">আদায়কৃত (Paid)</span>
                <span className="text-sm font-bold text-white">{formatTaka(fundSummary.totalPaid)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-rose-300 block font-semibold">মোট খরচ (Expense)</span>
                <span className="text-sm font-bold text-rose-200">{formatTaka(fundSummary.totalExpense)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-amber-300 block font-semibold">যাচাই বাকি (Pending)</span>
                <span className="text-sm font-bold text-amber-200">{formatTaka(fundSummary.totalPending)}</span>
              </div>
              <div className="bg-white/10 px-3 py-2 rounded-xl text-center min-w-[90px]">
                <span className="text-[10px] text-slate-300 block font-semibold">বকেয়া (Due)</span>
                <span className="text-sm font-bold text-slate-200">{formatTaka(fundSummary.totalDue)}</span>
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
                placeholder="সদস্যের নাম, TrxID বা মাস দিয়ে খুঁজুন..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                id="admin-add-expense-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl shadow-xs transition cursor-pointer"
              >
                <TrendingDown className="w-4 h-4 text-rose-600" />
                <span>নতুন খরচ এন্ট্রি</span>
              </button>

              <button
                onClick={() => {
                  setEditingFund(null);
                  setIsAddFundOpen(true);
                }}
                id="admin-add-fund-btn"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition cursor-pointer"
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
                    <th className="p-3.5">সদস্যের নাম / বিবরণ</th>
                    <th className="p-3.5">পরিমাণ (৳)</th>
                    <th className="p-3.5">মাস/তারিখ</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5">নোট / TrxID</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {funds
                    .filter(f =>
                      f.memberName.toLowerCase().includes(fundSearch.toLowerCase()) ||
                      (f.month && f.month.toLowerCase().includes(fundSearch.toLowerCase())) ||
                      (f.notes && f.notes.toLowerCase().includes(fundSearch.toLowerCase())) ||
                      (f.trxId && f.trxId.toLowerCase().includes(fundSearch.toLowerCase()))
                    )
                    .map(f => (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex flex-col">
                            <span>{f.memberName}</span>
                            {f.category && (
                              <span className="text-[10px] text-slate-400 font-normal">{f.category}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 font-extrabold text-sm">
                          {f.status === 'Expense' ? (
                            <span className="text-rose-600 font-mono">- {formatTaka(f.amount)}</span>
                          ) : (
                            <span className="text-slate-900 font-mono">{formatTaka(f.amount)}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">{f.month || f.date}</td>
                        <td className="p-3.5">
                          {f.status === 'Pending' ? (
                            <button
                              onClick={() => handleToggleFundStatus(f.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition bg-amber-50 text-amber-800 border-amber-300 hover:bg-emerald-600 hover:text-white cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="ক্লিক করে ট্রানজেকশন অনুমোদন (Approve) করুন"
                            >
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending (অনুমোদন করুন)</span>
                            </button>
                          ) : f.status === 'Expense' ? (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-rose-50 text-rose-700 border-rose-200 inline-block">
                              Expense (ব্যয়)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleFundStatus(f.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                f.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                              }`}
                              title="স্ট্যাটাস পরিবর্তন করতে ক্লিক করুন"
                            >
                              {f.status === 'Paid' ? 'Paid (পরিশোধিত)' : 'Due (বকেয়া)'}
                            </button>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-500">
                          <div className="flex flex-col gap-0.5">
                            {f.trxId && (
                              <span className="font-mono text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded w-fit">
                                TrxID: {f.trxId}
                              </span>
                            )}
                            <span>{f.notes || '-'}</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            onClick={() => {
                              if (f.status === 'Expense') {
                                setEditingExpense(f);
                                setIsExpenseModalOpen(true);
                              } else {
                                setEditingFund(f);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition cursor-pointer"
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

      {/* TAB 5.5: DEDICATED PAYMENT GATEWAY & MOBILE BANKING NUMBERS MANAGEMENT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>বিকাশ, নগদ ও রকেট পেমেন্ট নম্বর ব্যবস্থাপনা</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      লাইভ কানেক্টেড
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    এখানে যে নম্বরগুলো সেট ও সেভ করবেন, তা সরাসরি মেম্বারদের পেমেন্ট স্ক্রিনে দৃশ্যমান হবে।
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.bkashNumber ? 'bg-pink-50/80 border-pink-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                  বিকাশ (bKash)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.bkashNumber ? 'bg-pink-200/80 text-pink-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.bkashNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.bkashNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.nagadNumber ? 'bg-orange-50/80 border-orange-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
                  নগদ (Nagad)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.nagadNumber ? 'bg-orange-200/80 text-orange-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.nagadNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.nagadNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition ${
              paymentConfig.rocketNumber ? 'bg-purple-50/80 border-purple-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                  রকেট (Rocket)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  paymentConfig.rocketNumber ? 'bg-purple-200/80 text-purple-950' : 'bg-slate-200 text-slate-600'
                }`}>
                  {paymentConfig.rocketNumber ? 'সক্রিয়' : 'খালি'}
                </span>
              </div>
              <div className="mt-2 text-sm font-mono font-bold text-slate-800">
                {paymentConfig.rocketNumber || 'নম্বর সেট করা হয়নি'}
              </div>
            </div>
          </div>

          {/* Form with Dedicated Inputs */}
          <form onSubmit={handleSavePaymentSettings} className="space-y-4">
            {/* 1. bKash Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-pink-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-pink-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-pink-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    bK
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">১. বিকাশ (bKash) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">বিকাশ মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.bkashNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.bkashNumber, 'test-bkash')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-lg border border-pink-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-bkash' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-pink-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    বিকাশ মোবাইল নম্বর (bKash Phone Number) <span className="text-pink-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-bkash-number-input"
                      value={paymentConfig.bkashNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashNumber: e.target.value })}
                      placeholder="যেমন: 018XXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-pink-200 focus:border-pink-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-pink-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.bkashNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, bkashNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১১ ডিজিটের সচল বিকাশ ব্যক্তিগত বা মার্চেন্ট নম্বর দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.bkashType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-pink-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.bkashInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashInstructions: e.target.value })}
                  placeholder="যেমন: আপনার বিকাশ অ্যাপ থেকে Send Money করুন। রেফারেন্সে মেম্বার আইডি লিখুন।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-pink-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* 2. Nagad Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-orange-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-orange-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    নগদ
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">২. নগদ (Nagad) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">নগদ মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.nagadNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.nagadNumber, 'test-nagad')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-nagad' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-orange-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    নগদ মোবাইল নম্বর (Nagad Phone Number) <span className="text-orange-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-nagad-number-input"
                      value={paymentConfig.nagadNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadNumber: e.target.value })}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-orange-200 focus:border-orange-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-orange-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.nagadNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, nagadNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১১ ডিজিটের সচল নগদ ব্যক্তিগত বা মার্চেন্ট নম্বর দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.nagadType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-orange-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.nagadInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadInstructions: e.target.value })}
                  placeholder="যেমন: নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন এবং ট্রানজেকশন আইডি দিন।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-orange-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* 3. Rocket Dedicated Card */}
            <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-100">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-purple-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    রকেট
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">৩. রকেট (Rocket) নম্বর ও তথ্য</h4>
                    <span className="text-[11px] text-slate-500">ডাচ্-বাংলা রকেট মোবাইল ব্যাংকিং সেটিংস</span>
                  </div>
                </div>

                {paymentConfig.rocketNumber && (
                  <button
                    type="button"
                    onClick={() => handleTestCopy(paymentConfig.rocketNumber, 'test-rocket')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-200 transition cursor-pointer"
                  >
                    {copiedTestField === 'test-rocket' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-purple-600" />
                        <span>কপি হয়েছে!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>কপি টেস্ট</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    রকেট মোবাইল নম্বর (Rocket 12-Digit Phone Number) <span className="text-purple-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="admin-rocket-number-input"
                      value={paymentConfig.rocketNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketNumber: e.target.value })}
                      placeholder="যেমন: 019XXXXXXXXX"
                      className="w-full px-3.5 py-2.5 border-2 border-purple-200 focus:border-purple-500 rounded-xl text-sm font-mono font-bold text-slate-900 bg-purple-50/30 focus:bg-white focus:outline-none transition shadow-inner"
                    />
                    {paymentConfig.rocketNumber && (
                      <button
                        type="button"
                        onClick={() => setPaymentConfig({ ...paymentConfig, rocketNumber: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        title="মুছুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    ১২ ডিজিটের রকেট নম্বর (চেক ডিজিট সহ) দিন।
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    অ্যাকাউন্টের ধরন (Account Type)
                  </label>
                  <select
                    value={paymentConfig.rocketType}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 focus:border-purple-500 rounded-xl text-xs font-bold bg-white focus:outline-none transition"
                  >
                    <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                    <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                    <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  পেমেন্ট নির্দেশনা (Instructions / Note for Users)
                </label>
                <input
                  type="text"
                  value={paymentConfig.rocketInstructions || ''}
                  onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketInstructions: e.target.value })}
                  placeholder="যেমন: রকেট অ্যাপ থেকে Send Money করে ট্রানজেকশন আইডি অ্যাডমিনকে জানান।"
                  className="w-full px-3.5 py-2 border border-slate-300 focus:border-purple-500 rounded-xl text-xs bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>সংরক্ষণ বাটনে ক্লিক করার সাথে সাথে ইউজার পেমেন্ট স্ক্রিনে লাইভ আপডেট হয়ে যাবে।</span>
              </div>

              <button
                type="submit"
                id="admin-save-all-payment-numbers-btn"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>পেমেন্ট নম্বরসমূহ সেভ ও লাইভ আপডেট করুন</span>
              </button>
            </div>
          </form>

          {/* Interactive Live User Preview (লাইভ ইউজার ভিউ প্রিভিউ) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                  <Eye className="w-4 h-4" />
                  <span>সদস্যদের স্ক্রিনে লাইভ ভিউ প্রিভিউ (Live User Preview)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  সদস্যরা ফান্ড পেজে বিকাশ, নগদ বা রকেট নির্বাচন করলে ঠিক যেভাবে দেখতে পাবেন:
                </p>
              </div>

              {/* Preview Method Selector */}
              <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('bkash')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'bkash'
                      ? 'bg-pink-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  বিকাশ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('nagad')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'nagad'
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  নগদ
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentPreviewTab('rocket')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    paymentPreviewTab === 'rocket'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  রকেট
                </button>
              </div>
            </div>

            {/* Preview Display Box */}
            {paymentPreviewTab === 'bkash' && (
              <div className="p-4 rounded-xl bg-pink-950/40 border border-pink-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-pink-600 text-white font-bold text-[11px]">
                      বিকাশ একাউন্ট
                    </span>
                    {paymentConfig.bkashNumber ? (
                      <div className="text-xl font-mono font-black text-pink-300 mt-1.5 tracking-wider">
                        {paymentConfig.bkashNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-rose-300 mt-1.5">
                        অ্যাডমিন এখনো বিকাশ নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.bkashNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-pink-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-pink-900/50">
                  <span className="font-bold text-pink-300">নির্দেশনা: </span>
                  {paymentConfig.bkashInstructions || 'বিকাশ অ্যাপ থেকে Send Money করুন।'}
                </div>
              </div>
            )}

            {paymentPreviewTab === 'nagad' && (
              <div className="p-4 rounded-xl bg-orange-950/40 border border-orange-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-orange-600 text-white font-bold text-[11px]">
                      নগদ একাউন্ট
                    </span>
                    {paymentConfig.nagadNumber ? (
                      <div className="text-xl font-mono font-black text-orange-300 mt-1.5 tracking-wider">
                        {paymentConfig.nagadNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-orange-300 mt-1.5">
                        অ্যাডমিন এখনো নগদ নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.nagadNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-orange-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-orange-900/50">
                  <span className="font-bold text-orange-300">নির্দেশনা: </span>
                  {paymentConfig.nagadInstructions || 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন।'}
                </div>
              </div>
            )}

            {paymentPreviewTab === 'rocket' && (
              <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-700/60 text-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded bg-purple-600 text-white font-bold text-[11px]">
                      রকেট একাউন্ট
                    </span>
                    {paymentConfig.rocketNumber ? (
                      <div className="text-xl font-mono font-black text-purple-300 mt-1.5 tracking-wider">
                        {paymentConfig.rocketNumber}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-purple-300 mt-1.5">
                        অ্যাডমিন এখনো রকেট নম্বর যুক্ত করেননি (উপরে ইনপুটে নম্বর লিখে সেভ করুন)
                      </div>
                    )}
                  </div>

                  {paymentConfig.rocketNumber && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-xl self-start sm:self-auto">
                      <Copy className="w-3.5 h-3.5" />
                      <span>কপি বাটন সক্রিয়</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-purple-200/80 bg-slate-950/60 p-2.5 rounded-lg border border-purple-900/50">
                  <span className="font-bold text-purple-300">নির্দেশনা: </span>
                  {paymentConfig.rocketInstructions || 'রকেট অ্যাপ থেকে Send Money করে ট্রানজেকশন আইডি দিন।'}
                </div>
              </div>
            )}
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

          {/* Payment Gateway Settings (bKash, Nagad, Rocket) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-600" />
                  মাসিক চাঁদা পেমেন্ট গেটওয়ে নম্বর ও তথ্য সেটিংস
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  সদস্যদের চাঁদা ও অনুদান পরিশোধের জন্য বিকাশ, নগদ ও রকেট মোবাইল ব্যাংকিং নম্বরসমূহ এখানে সেট করুন।
                </p>
              </div>
            </div>

            <form onSubmit={handleSavePaymentSettings} className="space-y-4 pt-1">
              {/* bKash Config */}
              <div className="p-4 bg-pink-50/60 rounded-xl border border-pink-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-600 inline-block" />
                    বিকাশ (bKash) সেটিংস
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">বিকাশ নম্বর (Phone Number)</label>
                    <input
                      type="text"
                      value={paymentConfig.bkashNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashNumber: e.target.value })}
                      placeholder="যেমন: 018XXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.bkashType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.bkashInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, bkashInstructions: e.target.value })}
                    placeholder="যেমন: Send Money করার সময় রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Nagad Config */}
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
                    নগদ (Nagad) সেটিংস
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">নগদ নম্বর (Phone Number)</label>
                    <input
                      type="text"
                      value={paymentConfig.nagadNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadNumber: e.target.value })}
                      placeholder="যেমন: 017XXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.nagadType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.nagadInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, nagadInstructions: e.target.value })}
                    placeholder="যেমন: নগদ Send Money বা ক্যাশ ইন করে TrxID সংরক্ষণ করুন"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Rocket Config */}
              <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    রকেট (Rocket) সেটিংস
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">রকেট নম্বর (Phone Number with Check Digit)</label>
                    <input
                      type="text"
                      value={paymentConfig.rocketNumber}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketNumber: e.target.value })}
                      placeholder="যেমন: 019XXXXXXXXX"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">অ্যাকাউন্টের ধরন (Account Type)</label>
                    <select
                      value={paymentConfig.rocketType}
                      onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:outline-none"
                    >
                      <option value="Personal">Personal (ব্যক্তিগত - Send Money)</option>
                      <option value="Merchant">Merchant (মার্চেন্ট - Payment)</option>
                      <option value="Agent">Agent (এজেন্ট - Cash In)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">পেমেন্ট নির্দেশনা (Instructions / Note)</label>
                  <input
                    type="text"
                    value={paymentConfig.rocketInstructions || ''}
                    onChange={(e) => setPaymentConfig({ ...paymentConfig, rocketInstructions: e.target.value })}
                    placeholder="যেমন: রকেট সেন্ড মানি করে ট্রানজেকশন আইডি অ্যাডমিনকে জানান"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  id="admin-save-payments-btn"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>পেমেন্ট নম্বরসমূহ সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>সদস্যের ছবি (মোবাইল গ্যালারি থেকে আপলোড)</span>
                  <span className="text-[11px] text-slate-400 font-normal">ঐচ্ছিক</span>
                </label>
                <input
                  type="file"
                  id="admin-member-photo-picker"
                  accept="image/*"
                  onChange={handleMemberPhotoSelect}
                  className="hidden"
                />

                {memberPhotoBase64 ? (
                  <div className="flex items-center gap-3.5 bg-blue-50/70 p-3 rounded-2xl border border-blue-200">
                    <div className="w-14 h-14 rounded-2xl border-2 border-blue-500 overflow-hidden flex-shrink-0 bg-white shadow-xs">
                      <img 
                        src={memberPhotoBase64} 
                        alt="Member Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>গ্যালারি থেকে ছবি সিলেক্ট করা হয়েছে</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('admin-member-photo-picker')?.click()}
                          className="px-2.5 py-1 bg-white hover:bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-300 transition flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3" />
                          <span>পরিবর্তন</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberPhotoBase64('')}
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
                    onClick={() => document.getElementById('admin-member-photo-picker')?.click()}
                    className="w-full py-3.5 px-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/40 text-slate-600 hover:text-blue-800 transition flex flex-col items-center justify-center gap-1 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-slate-200 group-hover:border-blue-300 flex items-center justify-center text-blue-600">
                      <Upload className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                      মোবাইল গ্যালারি থেকে ছবি নির্বাচন করুন
                    </span>
                    <span className="text-[10px] text-slate-400">
                      ট্যাপ করে গ্যালারি থেকে ছবি নিন (JPG, PNG, WEBP)
                    </span>
                  </button>
                )}
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
                    <option value="Pending">Pending (অপেক্ষমান যাচাই)</option>
                    <option value="Due">Due (বকেয়া)</option>
                    <option value="Expense">Expense (সংগঠনের খরচ)</option>
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

      {/* EXPENSE MODAL (Add / Edit) */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleSaveExpense}
        onSave={handleSaveExpense}
        initialData={
          editingExpense
            ? {
                description: editingExpense.description || '',
                amount: editingExpense.amount,
                disbursedTo: editingExpense.disbursedTo || editingExpense.memberName,
                date: editingExpense.date,
                category: editingExpense.category || 'ত্রাণ ও খাদ্য সহায়তা',
                voucherNo: editingExpense.notes?.includes('ভাউচার:')
                  ? editingExpense.notes.split('ভাউচার:')[1].split('-')[0].trim()
                  : '',
                notes: editingExpense.notes?.includes('ভাউচার:')
                  ? (editingExpense.notes.split(' - ').length > 1 ? editingExpense.notes.split(' - ').slice(1).join(' - ').trim() : '')
                  : (editingExpense.notes || '')
              }
            : null
        }
      />

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
