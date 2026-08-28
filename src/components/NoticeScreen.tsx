import React, { useState, useMemo } from 'react';
import { 
  BellRing, 
  Calendar, 
  Plus, 
  ArrowLeft, 
  Pin, 
  Megaphone, 
  CheckCircle2, 
  Tag, 
  Clock, 
  Sparkles, 
  Edit2, 
  Trash2, 
  X 
} from 'lucide-react';
import { Notice } from '../types';
import { formatBengaliDate, toBengaliNumber } from '../utils/helpers';

interface NoticeScreenProps {
  notices: Notice[];
  onAddNotice: (notice: Omit<Notice, 'id'>) => void;
  onEditNotice?: (notice: Notice) => void;
  onDeleteNotice?: (id: string) => void;
  isAdmin?: boolean;
  onBack: () => void;
}

export const NoticeScreen: React.FC<NoticeScreenProps> = ({
  notices,
  onAddNotice,
  onEditNotice,
  onDeleteNotice,
  isAdmin = false,
  onBack,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [noticeText, setNoticeText] = useState('');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().split('T')[0]);
  const [noticeCategory, setNoticeCategory] = useState<'জরুরি' | 'সাধারণ' | 'কার্যক্রম' | 'রক্তদান'>('জরুরি');
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState('');

  // Sort: Pinned notices first, then date descending
  const sortedNotices = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [notices]);

  const handleOpenEdit = (n: Notice) => {
    setEditingNotice(n);
    setNoticeText(n.noticeText);
    setNoticeDate(n.date);
    setNoticeCategory(n.category || 'সাধারণ');
    setIsPinned(Boolean(n.isPinned));
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeText.trim()) {
      setFormError('নোটিশের বিবরণ লিখুন');
      return;
    }
    if (!noticeDate) {
      setFormError('তারিখ সিলেক্ট করুন');
      return;
    }

    if (editingNotice && onEditNotice) {
      onEditNotice({
        ...editingNotice,
        noticeText: noticeText.trim(),
        date: noticeDate,
        category: noticeCategory,
        isPinned
      });
    } else {
      onAddNotice({
        date: noticeDate,
        noticeText: noticeText.trim(),
        category: noticeCategory,
        isPinned
      });
    }

    setNoticeText('');
    setNoticeDate(new Date().toISOString().split('T')[0]);
    setNoticeCategory('জরুরি');
    setIsPinned(false);
    setEditingNotice(null);
    setFormError('');
    setIsAddModalOpen(false);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'জরুরি':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'রক্তদান':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'কার্যক্রম':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            id="notice-back-btn"
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition"
            title="হোমে ফিরুন"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-semibold text-blue-700">পতেঙ্গা, চট্টগ্রাম • জরুরি নোটিশ বোর্ড</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BellRing className="w-5 h-5 text-blue-600" />
              সংগঠনের নোটিশ ও বিজ্ঞপ্তি (Notices)
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Admin Only: Add Notice Button */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingNotice(null);
                setNoticeText('');
                setNoticeDate(new Date().toISOString().split('T')[0]);
                setNoticeCategory('জরুরি');
                setIsPinned(false);
                setIsAddModalOpen(true);
              }}
              id="notice-add-modal-btn"
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন নোটিশ প্রকাশ</span>
            </button>
          )}
        </div>
      </div>

      {/* Notices Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1 text-xs text-slate-500">
          <span>মোট নোটিশ: <strong className="text-slate-800">{toBengaliNumber(notices.length)}</strong> টি</span>
          <span>অবস্থান: পতেঙ্গা, চট্টগ্রাম</span>
        </div>

        {sortedNotices.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-medium text-sm">বর্তমানে কোনো নোটিশ প্রকাশিত নেই</p>
            <p className="text-xs text-slate-400 mt-1">নতুন নোটিশ যোগ করতে এডমিন প্যানেল ব্যবহার করুন</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedNotices.map((notice, idx) => {
              const catClass = getCategoryBadge(notice.category);

              return (
                <div
                  key={notice.id || idx}
                  id={`notice-card-${notice.id || idx}`}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-xs ${
                    notice.isPinned
                      ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-br from-amber-50/20 via-white to-white'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {notice.isPinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                          <Pin className="w-3 h-3 text-amber-700" />
                          পিন করা নোটিশ
                        </span>
                      )}

                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${catClass}`}>
                        <Tag className="w-3 h-3" />
                        {notice.category || 'সাধারণ'}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatBengaliDate(notice.date)}
                      </span>
                    </div>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(notice)}
                          className="p-1 rounded-md text-blue-600 hover:bg-blue-50 text-xs"
                          title="সম্পাদনা"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteNotice && (
                          <button
                            onClick={() => onDeleteNotice(notice.id)}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50 text-xs"
                            title="মুছুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notice Content */}
                  <div className="mt-3 text-slate-800 text-sm leading-relaxed whitespace-pre-line font-normal">
                    {notice.noticeText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Notice Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-blue-600" />
                {editingNotice ? 'নোটিশ সম্পাদনা' : 'নতুন জরুরি নোটিশ প্রকাশ'}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setEditingNotice(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    তারিখ (Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ক্যাটেগরি (Category)
                  </label>
                  <select
                    value={noticeCategory}
                    onChange={(e) => setNoticeCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white font-medium"
                  >
                    <option value="জরুরি">জরুরি</option>
                    <option value="সাধারণ">সাধারণ</option>
                    <option value="কার্যক্রম">কার্যক্রম</option>
                    <option value="রক্তদান">রক্তদান</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নোটিশের বিস্তারিত বিবরণ (NoticeText) *
                </label>
                <textarea
                  required
                  rows={4}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="নোটিশের বিস্তারিত বক্তব্য এখানে লিখুন..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-notice-chk"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <label htmlFor="pin-notice-chk" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  গুরুত্বপূর্ণ নোটিশ হিসেবে উপরে পিন (Pin) করে রাখুন
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingNotice(null); }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  id="notice-submit-btn"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
                >
                  {editingNotice ? 'আপডেট করুন' : 'নোটিশ প্রকাশ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
