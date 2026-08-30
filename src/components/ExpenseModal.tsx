import React, { useState, useEffect } from 'react';
import { X, TrendingDown, Receipt, Calendar, User, Tag, FileText, Check } from 'lucide-react';
import { FundRecord } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: {
    description: string;
    amount: number;
    disbursedTo: string;
    date: string;
    category: string;
    voucherNo?: string;
    notes?: string;
  }) => void;
  onSave?: (data: {
    description: string;
    amount: number;
    disbursedTo: string;
    date: string;
    category: string;
    voucherNo?: string;
    notes?: string;
  }) => void;
  initialData?: any;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSave,
  initialData
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [disbursedTo, setDisbursedTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('ত্রাণ ও খাদ্য সহায়তা');
  const [voucherNo, setVoucherNo] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '');
      setAmount(initialData.amount !== undefined && initialData.amount !== null && initialData.amount !== '' ? initialData.amount : '');
      setDisbursedTo(initialData.disbursedTo || initialData.memberName || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setCategory(initialData.category || 'ত্রাণ ও খাদ্য সহায়তা');
      
      let vNo = initialData.voucherNo || '';
      let nText = initialData.notes || '';
      if (!vNo && initialData.notes && initialData.notes.includes('ভাউচার:')) {
        const afterVoucher = initialData.notes.replace('ভাউচার:', '').trim();
        const parts = afterVoucher.split(' - ');
        vNo = parts[0]?.trim() || '';
        nText = parts.slice(1).join(' - ').trim();
      }
      setVoucherNo(vNo);
      setNotes(nText);
    } else {
      setDescription('');
      setAmount('');
      setDisbursedTo('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('ত্রাণ ও খাদ্য সহায়তা');
      setVoucherNo('');
      setNotes('');
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('খরচ বা ব্যয়ের সুনির্দিষ্ট বিবরণ / কারণ লিখুন');
      return;
    }
    if (!disbursedTo.trim()) {
      setError('কার মাধ্যমে বা দায়িত্বে খরচ হয়েছে তার নাম লিখুন');
      return;
    }
    const numAmount = Number(amount);
    if (amount === '' || isNaN(numAmount) || numAmount <= 0) {
      setError('সঠিক খরচের টাকার পরিমাণ লিখুন');
      return;
    }

    const payload = {
      description: description.trim(),
      amount: numAmount,
      disbursedTo: disbursedTo.trim(),
      date: date || new Date().toISOString().split('T')[0],
      category: category || 'ত্রাণ ও খাদ্য সহায়তা',
      voucherNo: voucherNo?.trim() || '',
      notes: notes?.trim() || ''
    };

    const saveHandler = onSubmit || onSave;
    if (typeof saveHandler === 'function') {
      try {
        saveHandler(payload);
      } catch (err) {
        console.error('Error submitting expense breakdown:', err);
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-rose-100 animate-scaleUp overflow-y-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialData ? 'খরচের বিবরণ সম্পাদনা (Edit Expense)' : 'ফান্ড খরচের নতুন বিবরণ (Add Expense Breakdown)'}
              </h3>
              <p className="text-xs text-slate-500">
                সংগঠনের যেকোনো ব্যয়ের কারণ, দায়িত্বপ্রাপ্ত ব্যক্তি ও ভাউচার তথ্য লিপিবদ্ধ করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-semibold border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Reason / Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>খরচ বা ব্যয়ের সুনির্দিষ্ট কারণ / বিবরণ (Particulars) *</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="যেমন: পতেঙ্গা এলাকার অসহায় পরিবারে খাদ্য ও বস্ত্র সহায়তা বিতরণ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Person in Charge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-rose-600" />
                <span>কার মাধ্যমে / দায়িত্বে খরচ হয়েছে *</span>
              </label>
              <input
                type="text"
                required
                value={disbursedTo}
                onChange={(e) => setDisbursedTo(e.target.value)}
                placeholder="যেমন: কাজী তানভীর (সভাপতি) / কোষাধ্যক্ষ"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Expense Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-rose-600" />
                <span>খরচের পরিমাণ (টাকা ৳) *</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="২৫০০"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold text-rose-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>খরচের তারিখ (Date) *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none font-medium"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-600" />
                <span>খরচের খাত / ক্যাটাগরি *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none bg-white"
              >
                <option value="ত্রাণ ও খাদ্য সহায়তা">ত্রাণ ও খাদ্য সহায়তা</option>
                <option value="চিকিৎসা ও ওষুধ সহায়তা">চিকিৎসা ও ওষুধ সহায়তা</option>
                <option value="অফিস ভাড়া ও ইউটিলিটি">অফিস ভাড়া ও ইউটিলিটি</option>
                <option value="ব্যানার, প্রচার ও স্টেশনারি">ব্যানার, প্রচার ও স্টেশনারি</option>
                <option value="জরুরি সেবা ও অ্যাম্বুলেন্স">জরুরি সেবা ও অ্যাম্বুলেন্স</option>
                <option value="শিক্ষা ও ছাত্র সহায়তা">শিক্ষা ও ছাত্র সহায়তা</option>
                <option value="বিবিধ ও অন্যান্য ব্যয়">বিবিধ ও অন্যান্য ব্যয়</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Voucher No */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ভাউচার / মেমো নং (ঐচ্ছিক)
              </label>
              <input
                type="text"
                id="expense-voucher-no"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মন্তব্য / অতিরিক্ত তথ্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                id="expense-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              বাতিল
            </button>
            <button
              type="submit"
              id="submit-expense-breakdown-btn"
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'আপডেট সম্পন্ন করুন' : 'খরচের বিবরণ সংরক্ষণ করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
