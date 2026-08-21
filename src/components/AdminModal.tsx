import React, { useState } from 'react';
import { Lock, Unlock, Shield, X, KeyRound, Check, AlertCircle } from 'lucide-react';
import { getAdminPin, setAdminPin, verifyAdminPin } from '../utils/storage';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPinForChange, setCurrentPinForChange] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [changeError, setChangeError] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = pinInput.trim();
    if (verifyAdminPin(cleanInput)) {
      setErrorMessage('');
      setPinInput('');
      onSuccessLogin();
      onClose();
    } else {
      setErrorMessage('ভুল এডমিন কোড! সঠিক পাসওয়ার্ড দিন।');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCurrent = currentPinForChange.trim();
    const cleanNew = newPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!cleanCurrent) {
      setChangeError('বর্তমান পাসওয়ার্ড প্রদান করুন');
      return;
    }
    if (!verifyAdminPin(cleanCurrent)) {
      setChangeError('বর্তমান পাসওয়ার্ড সঠিক নয়!');
      return;
    }
    if (cleanNew.length < 4) {
      setChangeError('নতুন পাসওয়ার্ড কমপক্ষে ৪ ডিজিটের বা অক্ষরের হতে হবে');
      return;
    }
    if (cleanNew !== cleanConfirm) {
      setChangeError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না');
      return;
    }

    setAdminPin(cleanNew);
    setChangeSuccess(true);
    setChangeError('');
    setCurrentPinForChange('');
    setNewPin('');
    setConfirmNewPin('');
    setTimeout(() => {
      setChangeSuccess(false);
      setIsChangingPin(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              এডমিন প্যানেল প্রবেশ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isChangingPin ? (
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <p className="text-xs text-slate-600">
              জরুরি নোটিশ প্রকাশ ও সংগঠনের প্রশাসনিক নিয়ন্ত্রণ আনলক করতে আপনার গোপন এডমিন কোড দিন:
            </p>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                এডমিন পাসওয়ার্ড / পিন কোড
              </label>
              <input
                type="password"
                autoFocus
                id="admin-modal-pin-input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন..."
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="submit"
                id="admin-modal-submit-btn"
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>এডমিন মোড আনলক করুন</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(true);
                  setErrorMessage('');
                }}
                className="text-[11px] text-slate-500 hover:text-slate-700 text-center font-medium mt-1 underline cursor-pointer"
              >
                পাসওয়ার্ড পরিবর্তন করতে চান?
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePin} className="space-y-3 mt-4">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              এডমিন পাসওয়ার্ড পরিবর্তন
            </h4>

            {changeSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে!</span>
              </div>
            )}

            {changeError && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold flex items-center gap-1.5 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{changeError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                বর্তমান পাসওয়ার্ড
              </label>
              <input
                type="password"
                required
                value={currentPinForChange}
                onChange={(e) => setCurrentPinForChange(e.target.value)}
                placeholder="বর্তমান পাসওয়ার্ড দিন..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none text-center font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  নতুন পাসওয়ার্ড
                </label>
                <input
                  type="password"
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="৪+ ডিজিট"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none text-center font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  পুনরায় লিখুন
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="একই পাসওয়ার্ড"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none text-center font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setChangeError('');
                }}
                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                ফিরে যান
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 shadow-xs"
              >
                আপডেট করুন
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
