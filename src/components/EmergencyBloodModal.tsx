import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Phone, 
  Share2, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  PhoneCall, 
  Heart, 
  CheckCircle2, 
  MapPin, 
  Clock 
} from 'lucide-react';
import { BloodDonor, BloodGroup, OrganizationProfile } from '../types';
import { 
  toBengaliNumber, 
  getBloodGroupBadge, 
  isDonorEligible, 
  sanitizePhone 
} from '../utils/helpers';

interface EmergencyBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
  donors: BloodDonor[];
  profile: OrganizationProfile;
}

export const EmergencyBloodModal: React.FC<EmergencyBloodModalProps> = ({
  isOpen,
  onClose,
  donors,
  profile,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<BloodGroup>('O+');
  const [patientName, setPatientName] = useState('');
  const [hospital, setHospital] = useState('পতেঙ্গা / চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল');
  const [bags, setBags] = useState('১');
  const [contactNumber, setContactNumber] = useState(profile.phone || '');
  const [copiedText, setCopiedText] = useState(false);

  // Available Ready Donors for selected blood group
  const readyDonors = useMemo(() => {
    return donors.filter(d => d.bloodGroup === selectedGroup && isDonorEligible(d).eligible);
  }, [donors, selectedGroup]);

  if (!isOpen) return null;

  const generateMessage = () => {
    const phoneDisplay = contactNumber || profile.phone || 'জরুরি নম্বরে যোগাযোগ করুন';
    return `🚨 *জরুরি রক্তের আবেদন - ${profile.name} (${profile.address})* 🚨\n\n🩸 *রক্তের গ্রুপ:* ${selectedGroup}\n👤 *রোগীর নাম:* ${patientName || 'মুমূর্ষু রোগী'}\n🏥 *হাসপাতাল / স্থান:* ${hospital}\n📦 *পরিমাণ:* ${bags} ব্যাগ\n📞 *যোগাযোগের নম্বর:* ${phoneDisplay}\n\n_${profile.address}-র আশেপাশে কোনো মহান রক্তদাতা ভাই/বোন থাকলে দ্রুত যোগাযোগ করুন। মানবতার কল্যাণে শেয়ার করুন।_`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMessage());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateMessage());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-rose-200 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
              <Droplet className="w-6 h-6 fill-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                জরুরি রক্তের আবেদন ও দাতা অনুসন্ধান
              </h3>
              <p className="text-xs text-slate-500">
                {profile.name} • {profile.address}
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

        <div className="space-y-4 mt-4">
          {/* Blood Group Quick Select */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              ১. প্রয়োজনীয় রক্তের গ্রুপ সিলেক্ট করুন:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as BloodGroup[]).map(group => (
                <button
                  key={group}
                  onClick={() => setSelectedGroup(group)}
                  id={`emergency-group-${group}`}
                  className={`py-2 text-center rounded-xl font-extrabold text-sm border transition ${
                    selectedGroup === group
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs scale-105'
                      : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:border-rose-300 border-slate-200'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* List of currently ready donors for this blood group */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                প্রস্তুত রক্তদাতা পাওয়া গেছে ({toBengaliNumber(readyDonors.length)} জন)
              </span>
              <span className="text-[10px] text-rose-700 bg-rose-100 font-bold px-2.5 py-0.5 rounded-md">
                গ্রুপ {selectedGroup}
              </span>
            </div>

            {readyDonors.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                এই মুহূর্তে {selectedGroup} গ্রুপের কোনো প্রস্তুত দাতা ডাটাবেজে নেই। নিচে তৈরি পোস্টটি কপি বা WhatsApp-এ শেয়ার করুন।
              </p>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {readyDonors.map((d, i) => {
                  const cleanPhone = sanitizePhone(d.phone);
                  return (
                    <div
                      key={d.id || i}
                      className="bg-white rounded-xl p-2.5 border border-rose-100 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{d.name}</span>
                        <span className="text-[11px] text-slate-500">{d.area || profile.address} • {d.phone}</span>
                      </div>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-2xs transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>কল দিন</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Emergency Post Generator */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-rose-600" />
              ২. জরুরি রক্তের পোস্ট তৈরি ও শেয়ার করুন:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  রোগীর নাম / তথ্য
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="যেমন: রোগীর নাম"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  হাসপাতাল / স্থান
                </label>
                <input
                  type="text"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  রক্তের পরিমাণ (ব্যাগ)
                </label>
                <input
                  type="text"
                  value={bags}
                  onChange={(e) => setBags(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  যোগাযোগের নম্বর
                </label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="যোগাযোগের নম্বর লিখুন (যেমন: 01819-XXXXXX)"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Generated Text Box */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-700 whitespace-pre-line font-mono leading-relaxed">
              {generateMessage()}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                id="emergency-copy-text-btn"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>টেক্সট কপি</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                id="emergency-share-wa-btn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp এ শেয়ার</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
