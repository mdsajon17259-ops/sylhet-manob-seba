import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  X, 
  Check, 
  Layers, 
  Smartphone, 
  Code,
  Sparkles
} from 'lucide-react';

interface SheetGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SheetGuideModal: React.FC<SheetGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'screens' | 'blocks'>('sheets');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-emerald-200 animate-scaleUp my-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                গুগল শিট ও অ্যাপ কানেকশন গাইড
              </h3>
              <p className="text-xs text-slate-500">
                সিলেট মানব সেবা সংঘঠন • স্থাপিত : ১৫/০৮/২০২২ইং
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'sheets'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ১. ৪টি গুগল শিট স্ট্রাকচার
          </button>
          <button
            onClick={() => setActiveTab('screens')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'screens'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ২. ৫টি স্ক্রিনের বিবরণ
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'blocks'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            ৩. ব্লক লজিক ও এডমিন কোড
          </button>
        </div>

        {/* Content Tabs */}
        <div className="mt-4 space-y-4">
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনার গুগল স্প্রেডশিটের ৪টি ট্যাবের কলাম হেডারগুলো হুবহু নিচে দেওয়া হলো:
              </p>

              {/* Sheet 1 */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    ট্যাব ১: <code>Members</code> (সদস্য তালিকা)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard('Name\tDesignation\tPhone', 'm_hd')}
                      className="text-[11px] text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                    >
                      {copiedKey === 'm_hd' ? 'কপি হয়েছে' : 'হেডার কপি'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div className="bg-emerald-100 text-emerald-900 py-1 rounded font-bold">Name</div>
                  <div className="bg-emerald-100 text-emerald-900 py-1 rounded font-bold">Designation</div>
                  <div className="bg-emerald-100 text-emerald-900 py-1 rounded font-bold">Phone</div>
                </div>
              </div>

              {/* Sheet 2 */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    ট্যাব ২: <code>BloodDonation</code> (রক্ত দান)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard('Name\tPhone\tBloodGroup\tLastDonationDate\tNextEligibleDate', 'b_hd')}
                      className="text-[11px] text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                    >
                      {copiedKey === 'b_hd' ? 'কপি হয়েছে' : 'হেডার কপি'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[11px] font-mono text-center">
                  <div className="bg-rose-100 text-rose-900 py-1 rounded font-bold">Name</div>
                  <div className="bg-rose-100 text-rose-900 py-1 rounded font-bold">Phone</div>
                  <div className="bg-rose-100 text-rose-900 py-1 rounded font-bold">BloodGroup</div>
                  <div className="bg-rose-100 text-rose-900 py-1 rounded font-bold text-[10px]">LastDonationDate</div>
                  <div className="bg-rose-100 text-rose-900 py-1 rounded font-bold text-[10px]">NextEligibleDate</div>
                </div>
              </div>

              {/* Sheet 3 */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    ট্যাব ৩: <code>Notices</code> (জরুরি নোটিশ)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard('Date\tNoticeText', 'n_hd')}
                      className="text-[11px] text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                    >
                      {copiedKey === 'n_hd' ? 'কপি হয়েছে' : 'হেডার কপি'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-center">
                  <div className="bg-amber-100 text-amber-900 py-1 rounded font-bold">Date</div>
                  <div className="bg-amber-100 text-amber-900 py-1 rounded font-bold">NoticeText</div>
                </div>
              </div>

              {/* Sheet 4 */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-900">
                    ট্যাব ৪: <code>Fund</code> (ফান্ড ও চাঁদা হিসাব)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard('TotalBalance\tMemberName\tStatus', 'f_hd')}
                      className="text-[11px] text-slate-600 hover:text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 cursor-pointer"
                    >
                      {copiedKey === 'f_hd' ? 'কপি হয়েছে' : 'হেডার কপি'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-center">
                  <div className="bg-teal-100 text-teal-900 py-1 rounded font-bold">TotalBalance</div>
                  <div className="bg-teal-100 text-teal-900 py-1 rounded font-bold">MemberName</div>
                  <div className="bg-teal-100 text-teal-900 py-1 rounded font-bold">Status (Paid/Due)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'screens' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Screen 1 (Home Screen - হোম পেজ):</span>
                <p className="text-slate-600">
                  ৪টি বড় বাটন (সদস্য তালিকা, রক্ত দান, জরুরি নোটিশ, ফান্ড হিসাব) ও ইন-অ্যাপ এডমিন প্যানেল।
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Screen 2 (Member List - সদস্য তালিকা):</span>
                <p className="text-slate-600">
                  সদস্যদের নাম, পদবি, মোবাইল নম্বর, রক্তের গ্রুপ ডিরেক্টরি এবং ওয়ান-ক্লিক কল/এসএমএস অপশন।
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Screen 3 (Blood Donation - রক্ত দান):</span>
                <p className="text-slate-600">
                  রক্তদাতাদের তালিকা, প্রস্তুত রক্তদাতা ফিল্টার এবং স্বয়ংক্রিয় +৯০ দিন ক্যালকুলেটরসহ নিবন্ধন ফর্ম।
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Screen 4 (Notice Screen - জরুরি নোটিশ):</span>
                <p className="text-slate-600">
                  পিন করা ও সাধারণ নোটিশ তালিকা এবং জরুরি নোটিশ প্রকাশনা ফর্ম।
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">Screen 5 (Fund Accounting - ফান্ড হিসাব):</span>
                <p className="text-slate-600">
                  বর্তমান নেট ব্যালেন্স, আদায়কৃত চাঁদা (Paid) ও বকেয়া (Due) হিসাবের অটো ব্যালেন্সিং খাতা।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] leading-relaxed">
                <p className="text-emerald-400 font-bold mb-1">// এডমিন লগইন ব্লক লজিক:</p>
                <p>when AdminLogin Button Click</p>
                <p>&nbsp;&nbsp;if TextInput_AdminCode's Text = "১২৩৪" or "1234" then</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;set app variable isAdmin to true</p>
                <p>&nbsp;&nbsp;&nbsp;&nbsp;open AdminPanelScreen</p>
                <p>&nbsp;&nbsp;else Alert "কোড ভুল"</p>
              </div>

              <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-[11px] leading-relaxed">
                <p className="text-rose-400 font-bold mb-1">// রক্তদাতা ফর্ম সাবমিট ব্লক:</p>
                <p>when Submit Button Click</p>
                <p>&nbsp;&nbsp;create row in BloodDonation [Name, Phone, BloodGroup, LastDonationDate, NextEligibleDate]</p>
                <p>&nbsp;&nbsp;refresh Data Viewer List</p>
                <p>&nbsp;&nbsp;clear inputs</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
