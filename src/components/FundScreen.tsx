import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Download, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Receipt, 
  UserCheck, 
  Edit2, 
  Trash2, 
  Calendar, 
  X,
  Sparkles,
  RotateCcw,
  Check
} from 'lucide-react';
import { FundRecord, PaymentStatus } from '../types';
import { toBengaliCurrency, toBengaliNumber, formatBengaliDate } from '../utils/helpers';
import { exportSheetCSV } from '../utils/storage';

interface FundScreenProps {
  fundRecords: FundRecord[];
  onAddFundRecord: (record: Omit<FundRecord, 'id'>) => void;
  onToggleStatus?: (id: string, newStatus: PaymentStatus) => void;
  onEditFundRecord?: (record: FundRecord) => void;
  onDeleteFundRecord?: (id: string) => void;
  manualTotalBalance?: number | null;
  onUpdateManualTotalBalance?: (amount: number | null) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

export const FundScreen: React.FC<FundScreenProps> = ({
  fundRecords,
  onAddFundRecord,
  onToggleStatus,
  onEditFundRecord,
  onDeleteFundRecord,
  manualTotalBalance = null,
  onUpdateManualTotalBalance,
  isAdmin = false,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FundRecord | null>(null);

  // Manual Total Balance Modal State
  const [isEditBalanceModalOpen, setIsEditBalanceModalOpen] = useState(false);
  const [manualBalanceInput, setManualBalanceInput] = useState<string>('');
  const [balanceSaveSuccess, setBalanceSaveSuccess] = useState(false);

  // Form State
  const [memberName, setMemberName] = useState('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [status, setStatus] = useState<PaymentStatus>('Paid');
  const [description, setDescription] = useState('মাসিক নিয়মিত চাঁদা');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'মাসিক চাঁদা' | 'এককালীন অনুদান' | 'জরুরি সাহায্য' | 'খরচ'>('মাসিক চাঁদা');
  const [formError, setFormError] = useState('');

  // Live Auto Calculations from records
  const stats = useMemo(() => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalExpense = 0;
    let paidCount = 0;
    let dueCount = 0;

    fundRecords.forEach(r => {
      const amt = Number(r.amount) || 0;
      if (r.status === 'Expense') {
        totalExpense += amt;
      } else if (r.status === 'Paid') {
        totalPaid += amt;
      } else if (r.status === 'Due') {
        totalDue += amt;
        dueCount++;
      }
    });

    const netBalance = totalPaid - totalExpense;

    return {
      totalPaid,
      totalDue,
      totalExpense,
      netBalance,
      paidCount,
      dueCount,
      totalRecords: fundRecords.length
    };
  }, [fundRecords]);

  // Effective Total Organization Balance (Manual or Calculated)
  const displayTotalBalance = useMemo(() => {
    if (manualTotalBalance !== null && manualTotalBalance !== undefined) {
      return manualTotalBalance;
    }
    return stats.netBalance;
  }, [manualTotalBalance, stats.netBalance]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return fundRecords.filter(r => {
      const matchesSearch = 
        r.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [fundRecords, searchTerm, statusFilter]);

  const handleOpenEdit = (rec: FundRecord) => {
    setEditingRecord(rec);
    setMemberName(rec.memberName);
    setAmount(rec.amount);
    setStatus(rec.status);
    setDescription(rec.description || '');
    setDate(rec.date);
    setCategory((rec.category as any) || 'মাসিক চাঁদা');
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      setFormError('সদস্য বা দাতার নাম লিখুন');
      return;
    }
    if (amount === '' || Number(amount) <= 0) {
      setFormError('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    if (editingRecord && onEditFundRecord) {
      onEditFundRecord({
        ...editingRecord,
        memberName: memberName.trim(),
        amount: Number(amount),
        status,
        description: description.trim(),
        date,
        category
      });
    } else {
      onAddFundRecord({
        memberName: memberName.trim(),
        amount: Number(amount),
        status,
        description: description.trim() || 'মাসিক অনুদান',
        date,
        category
      });
    }

    setMemberName('');
    setAmount(500);
    setStatus('Paid');
    setDescription('মাসিক নিয়মিত চাঁদা');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('মাসিক চাঁদা');
    setEditingRecord(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  // Open Edit Total Balance Modal
  const handleOpenBalanceModal = () => {
    setManualBalanceInput(displayTotalBalance.toString());
    setIsEditBalanceModalOpen(true);
    setBalanceSaveSuccess(false);
  };

  // Save manual total balance
  const handleSaveManualBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(manualBalanceInput);
    if (!isNaN(parsed) && onUpdateManualTotalBalance) {
      onUpdateManualTotalBalance(parsed);
      setBalanceSaveSuccess(true);
      setTimeout(() => {
        setBalanceSaveSuccess(false);
        setIsEditBalanceModalOpen(false);
      }, 1000);
    }
  };

  // Reset to auto-calculated balance
  const handleResetToAutoBalance = () => {
    if (onUpdateManualTotalBalance) {
      onUpdateManualTotalBalance(null);
      setIsEditBalanceModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="fund-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-xs font-semibold text-emerald-700">পতেঙ্গা, চট্টগ্রাম • ফান্ড ও আর্থিক হিসাব</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              সংগঠনের ফান্ড ও চাঁদা হিসাব (Fund Sheet)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportSheetCSV('fund')}
            id="fund-export-csv-btn"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            title="CSV ফাইল ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV ডাউনলোড</span>
          </button>

          {/* Admin Only: New Entry Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingRecord(null);
                setMemberName('');
                setAmount(500);
                setStatus('Paid');
                setDescription('মাসিক নিয়মিত চাঁদা');
                setDate(new Date().toISOString().split('T')[0]);
                setCategory('মাসিক চাঁদা');
                setIsAddModalOpen(true);
              }}
              id="fund-add-entry-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন জমা / খরচের এন্ট্রি</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. SEPARATE CARD: সংগঠনের মোট তহবিলের পরিমাণ (Total Organization Balance) */}
      <div 
        id="org-total-balance-section"
        className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md border border-emerald-500/30 relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>সংগঠনের মূল রিজার্ভ তহবিল</span>
              {manualTotalBalance !== null && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
                  ম্যানুয়াল আপডেট
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              সংগঠনের মোট তহবিলের পরিমাণ
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              সিলেট মানব সেবা সংঘঠনের সর্বমোট স্থিতি ও বর্তমান সংরক্ষিত তহবিল ব্যালেন্স।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-white/5 backdrop-blur-xs p-4 rounded-2xl border border-white/10">
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider block">
                সর্বমোট মূল ব্যালেন্স
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight">
                {toBengaliCurrency(displayTotalBalance)}
              </div>
            </div>

            {/* Admin Only: Edit Balance Option */}
            {isAdmin && (
              <button
                onClick={handleOpenBalanceModal}
                id="fund-edit-total-balance-btn"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                title="মোট তহবিল ব্যালেন্স পরিবর্তন করুন"
              >
                <Edit2 className="w-4 h-4" />
                <span>ব্যালেন্স এডিট করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Auto Balance Summary Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Available Balance */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-emerald-600" />
              শিট হিসাব অনুযায়ী মোট জমা
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalPaid)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>পরিশোধিত এন্ট্রি:</span>
            <span className="font-bold text-slate-700">{toBengaliNumber(stats.paidCount)} টি</span>
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4 text-rose-600" />
              সংগঠনের মোট খরচ (Expense)
            </span>
            <div className="text-2xl font-bold text-rose-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalExpense)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>মোট ব্যয়িত অর্থ</span>
            <span className="font-semibold text-slate-700">অফিস ও সেবা খাতে</span>
          </div>
        </div>

        {/* Total Due or Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              বকেয়া চাঁদা (Due Balance)
            </span>
            <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">
              {toBengaliCurrency(stats.totalDue)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-100 flex justify-between">
            <span>বকেয়া সদস্য:</span>
            <span className="font-bold text-amber-700">{toBengaliNumber(stats.dueCount)} জন</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="fund-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="সদস্যের নাম বা বাবত দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">স্ট্যাটাস ফিল্টার:</span>
            {(['all', 'Paid', 'Due', 'Expense'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                id={`fund-status-${st}`}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st === 'all' ? 'সব এন্ট্রি' : st === 'Paid' ? 'পরিশোধিত (Paid)' : st === 'Due' ? 'বকেয়া (Due)' : 'খরচ (Expense)'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500">
            দেখানো হচ্ছে: <strong>{toBengaliNumber(filteredRecords.length)}</strong> টি রেকর্ড
          </span>
        </div>
      </div>

      {/* Fund Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                <th className="py-3 px-4">সদস্য / এন্ট্রির নাম</th>
                <th className="py-3 px-4">বাবত / বিবরণ</th>
                <th className="py-3 px-4">তারিখ</th>
                <th className="py-3 px-4 text-right">পরিমাণ (টাকা)</th>
                <th className="py-3 px-4 text-center">স্ট্যাটাস</th>
                {isAdmin && <th className="py-3 px-4 text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-slate-400 text-xs">
                    কোনো রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, idx) => (
                  <tr key={record.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-black flex items-center justify-center">
                          {record.memberName.charAt(0)}
                        </div>
                        <span>{record.memberName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-xs">
                      <span>{record.description || 'মাসিক চাঁদা'}</span>
                      {record.category && (
                        <span className="ml-1.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {record.category}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                      {formatBengaliDate(record.date)}
                    </td>

                    <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                      {toBengaliCurrency(record.amount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {record.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Paid
                        </span>
                      ) : record.status === 'Due' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                          Due
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                          Expense
                        </span>
                      )}
                    </td>

                    {/* Admin Only: Row actions */}
                    {isAdmin && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onToggleStatus && record.status !== 'Expense' && (
                            <button
                              onClick={() => onToggleStatus(record.id, record.status === 'Paid' ? 'Due' : 'Paid')}
                              className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Paid বা Due পরিবর্তন করুন"
                            >
                              {record.status === 'Paid' ? 'Due করুন' : 'Paid করুন'}
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEdit(record)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="এডিট"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          {onDeleteFundRecord && (
                            <button
                              onClick={() => onDeleteFundRecord(record.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="মুছুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN ONLY: Edit Total Organization Balance Modal */}
      {isEditBalanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    সংগঠনের মোট তহবিল ব্যালেন্স এডিট
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    ম্যানুয়ালি মোট তহবিল ব্যালেন্স নির্ধারণ করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditBalanceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {balanceSaveSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>সংগঠনের মোট তহবিলের পরিমাণ সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            <form onSubmit={handleSaveManualBalance} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  সংগঠনের মোট তহবিলের পরিমাণ (টাকা ৳) *
                </label>
                <input
                  type="number"
                  required
                  autoFocus
                  id="fund-manual-balance-input"
                  value={manualBalanceInput}
                  onChange={(e) => setManualBalanceInput(e.target.value)}
                  placeholder="যেমন: 50000"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-lg font-mono font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  বর্তমান হিসাবকৃত স্থিতি: {toBengaliCurrency(stats.netBalance)}
                </span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  id="fund-manual-balance-save-btn"
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>তহবিল ব্যালেন্স সংরক্ষণ করুন</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToAutoBalance}
                  id="fund-manual-balance-reset-btn"
                  className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>অটো ক্যালকুলেশনে রিসেট করুন ({toBengaliCurrency(stats.netBalance)})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Entry Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {editingRecord ? 'ফান্ড এন্ট্রি সম্পাদনা' : 'নতুন চাঁদা / ফান্ড এন্ট্রি'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingRecord(null); }}
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
                  সদস্য / দাতার নাম (MemberName) *
                </label>
                <input
                  type="text"
                  required
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="যেমন: মো: কামরুল ইসলাম"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    টাকার পরিমাণ (Amount ৳) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="৫০০"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    স্ট্যাটাস (Status) *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white font-bold"
                  >
                    <option value="Paid">Paid (পরিশোধিত)</option>
                    <option value="Due">Due (বকেয়া)</option>
                    <option value="Expense">Expense (সংগঠনের খরচ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ (Date)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ধরন (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="মাসিক চাঁদা">মাসিক চাঁদা</option>
                    <option value="এককালীন অনুদান">এককালীন অনুদান</option>
                    <option value="জরুরি সাহায্য">জরুরি সাহায্য</option>
                    <option value="খরচ">খরচ / অফিস ব্যয়</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  বিবরণ / বাবত
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="যেমন: মার্চ মাসের মাসিক চাঁদা"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingRecord(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="fund-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                >
                  {editingRecord ? 'আপডেট সম্পন্ন করুন' : 'এন্ট্রি সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
