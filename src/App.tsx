import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActiveScreen, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationStats,
  OrganizationProfile,
  PaymentStatus
} from './types';
import { 
  loadMembers, 
  saveMembers, 
  loadDonors, 
  saveDonors, 
  loadNotices, 
  saveNotices, 
  loadFunds, 
  saveFunds, 
  loadOrgProfile, 
  saveOrgProfile, 
  loadManualTotalBalance, 
  saveManualTotalBalance, 
  resetAllData, 
  clearAllData 
} from './utils/storage';
import { isDonorEligible } from './utils/helpers';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { MemberListScreen } from './components/MemberListScreen';
import { BloodDonationScreen } from './components/BloodDonationScreen';
import { NoticeScreen } from './components/NoticeScreen';
import { FundScreen } from './components/FundScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { AdminModal } from './components/AdminModal';
import { EmergencyBloodModal } from './components/EmergencyBloodModal';
import { SheetGuideModal } from './components/SheetGuideModal';
import { BottomNav } from './components/BottomNav';
import { HeartHandshake, MapPin, ShieldCheck, Heart } from 'lucide-react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('home');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  // Data States
  const [profile, setProfile] = useState<OrganizationProfile>(() => loadOrgProfile());
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [donors, setDonors] = useState<BloodDonor[]>(() => loadDonors());
  const [notices, setNotices] = useState<Notice[]>(() => loadNotices());
  const [funds, setFunds] = useState<FundRecord[]>(() => loadFunds());
  const [manualTotalBalance, setManualTotalBalance] = useState<number | null>(() => loadManualTotalBalance());

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSheetGuideOpen, setIsSheetGuideOpen] = useState(false);

  // Sync with LocalStorage
  useEffect(() => {
    saveOrgProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveMembers(members);
  }, [members]);

  useEffect(() => {
    saveDonors(donors);
  }, [donors]);

  useEffect(() => {
    saveNotices(notices);
  }, [notices]);

  useEffect(() => {
    saveFunds(funds);
  }, [funds]);

  // Member Handlers
  const handleAddMember = (newMember: Omit<Member, 'id'>) => {
    const member: Member = {
      ...newMember,
      id: `m-${Date.now()}`
    };
    setMembers(prev => [member, ...prev]);
  };

  const handleEditMember = (updatedMember: Member) => {
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleDeleteMember = (id: string, name: string) => {
    if (confirm(`আপনি কি সদস্য "${name}" কে মুছে ফেলতে চান?`)) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
  };

  // Donor Handlers
  const handleAddDonor = (newDonor: Omit<BloodDonor, 'id'>) => {
    const donor: BloodDonor = {
      ...newDonor,
      id: `d-${Date.now()}`
    };
    setDonors(prev => [donor, ...prev]);
  };

  const handleEditDonor = (updatedDonor: BloodDonor) => {
    setDonors(prev => prev.map(d => d.id === updatedDonor.id ? updatedDonor : d));
  };

  const handleDeleteDonor = (id: string, name: string) => {
    if (confirm(`আপনি কি রক্তদাতা "${name}" এর তথ্য মুছে ফেলতে চান?`)) {
      setDonors(prev => prev.filter(d => d.id !== id));
    }
  };

  // Notice Handlers
  const handleAddNotice = (newNotice: Omit<Notice, 'id'>) => {
    const notice: Notice = {
      ...newNotice,
      id: `n-${Date.now()}`
    };
    setNotices(prev => [notice, ...prev]);
  };

  const handleEditNotice = (updatedNotice: Notice) => {
    setNotices(prev => prev.map(n => n.id === updatedNotice.id ? updatedNotice : n));
  };

  const handleDeleteNotice = (id: string) => {
    if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      setNotices(prev => prev.filter(n => n.id !== id));
    }
  };

  // Fund Handlers
  const handleAddFund = (newFund: Omit<FundRecord, 'id'>) => {
    const fund: FundRecord = {
      ...newFund,
      id: `f-${Date.now()}`
    };
    setFunds(prev => [fund, ...prev]);
  };

  const handleEditFund = (updatedFund: FundRecord) => {
    setFunds(prev => prev.map(f => f.id === updatedFund.id ? updatedFund : f));
  };

  const handleDeleteFund = (id: string) => {
    if (confirm('আপনি কি এই ফান্ড এন্ট্রিটি মুছে ফেলতে চান?')) {
      setFunds(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleToggleFundStatus = (id: string, newStatus: PaymentStatus) => {
    setFunds(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: newStatus,
          date: new Date().toISOString().split('T')[0]
        };
      }
      return f;
    }));
  };

  const handleUpdateManualTotalBalance = (val: number | null) => {
    setManualTotalBalance(val);
    saveManualTotalBalance(val);
  };

  const handleResetData = () => {
    if (confirm('আপনি কি সকল ডাটা রিসেট করে ডিফল্ট অবস্থায় ফিরিয়ে নিতে চান?')) {
      resetAllData();
      window.location.reload();
    }
  };

  // Aggregated Stats
  const stats: OrganizationStats = useMemo(() => {
    const readyDonors = donors.filter(d => isDonorEligible(d).eligible).length;
    const paidAmt = funds.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const dueAmt = funds.filter(f => f.status === 'Due').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const expAmt = funds.filter(f => f.status === 'Expense').reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const netBal = paidAmt - expAmt;

    return {
      totalMembers: members.length,
      totalDonors: donors.length,
      readyDonors,
      totalFundBalance: manualTotalBalance !== null ? manualTotalBalance : netBal,
      totalPaidAmount: paidAmt,
      totalDueAmount: dueAmt,
      activeNotices: notices.length,
    };
  }, [members, donors, notices, funds, manualTotalBalance]);

  // Latest notice for ticker
  const latestNotice = notices[0];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800 selection:bg-emerald-200">
      {/* Top Header */}
      <Header
        profile={profile}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        openAdminModal={() => setIsAdminModalOpen(true)}
        openEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      {/* Main Screen Content */}
      <main className="max-w-6xl w-full mx-auto px-4 py-6 flex-1">
        {activeScreen === 'home' && (
          <HomeScreen
            profile={profile}
            onNavigate={(screen) => {
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            stats={stats}
            latestNotice={latestNotice}
            isAdmin={isAdmin}
            openAdminModal={() => setIsAdminModalOpen(true)}
            openEmergencyModal={() => setIsEmergencyModalOpen(true)}
          />
        )}

        {activeScreen === 'members' && (
          <MemberListScreen
            members={members}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'blood' && (
          <BloodDonationScreen
            donors={donors}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'notices' && (
          <NoticeScreen
            notices={notices}
            isAdmin={isAdmin}
            onAddNotice={handleAddNotice}
            onEditNotice={handleEditNotice}
            onDeleteNotice={handleDeleteNotice}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'fund' && (
          <FundScreen
            fundRecords={funds}
            onAddFundRecord={handleAddFund}
            onEditFundRecord={handleEditFund}
            onDeleteFundRecord={handleDeleteFund}
            onToggleStatus={handleToggleFundStatus}
            manualTotalBalance={manualTotalBalance}
            onUpdateManualTotalBalance={handleUpdateManualTotalBalance}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminPanelScreen
            profile={profile}
            members={members}
            donors={donors}
            notices={notices}
            funds={funds}
            onUpdateProfile={setProfile}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            onAddNotice={handleAddNotice}
            onEditNotice={handleEditNotice}
            onDeleteNotice={handleDeleteNotice}
            onAddFund={handleAddFund}
            onEditFund={handleEditFund}
            onDeleteFund={handleDeleteFund}
            onToggleFundStatus={handleToggleFundStatus}
            onResetAll={handleResetData}
            onBack={() => setActiveScreen('home')}
          />
        )}
      </main>

      {/* Cleaned up Footer UI with Slogan */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 text-xs py-6 px-4 mb-14 sm:mb-0">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span className="font-bold text-slate-800">{profile.name}</span>
            <span className="text-slate-400">|</span>
            <span className="text-amber-700 font-semibold text-xs bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {profile.establishedDate || 'স্থাপিত : ১৫/০৮/২০২২ইং'}
            </span>
            <span className="text-slate-400">|</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              {profile.address}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-500">
            {/* Organization Slogan */}
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs">
              <Heart className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>মানবতার কল্যাণে নিবেদিত প্রাণ</span>
            </div>

            {/* Admin Access Option */}
            <button
              onClick={() => {
                if (isAdmin) {
                  setActiveScreen('admin');
                } else {
                  setIsAdminModalOpen(true);
                }
              }}
              className="hover:text-amber-700 flex items-center gap-1 font-bold text-amber-700 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ইন-অ্যাপ এডমিন প্যানেল</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation for Mobile */}
      <BottomNav
        activeScreen={activeScreen}
        setActiveScreen={(scr) => {
          setActiveScreen(scr);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        noticeCount={notices.length}
        readyDonorsCount={stats.readyDonors}
      />

      {/* Modals */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccessLogin={() => {
          setIsAdmin(true);
          setActiveScreen('admin');
        }}
      />

      <EmergencyBloodModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        donors={donors}
        profile={profile}
      />

      <SheetGuideModal
        isOpen={isSheetGuideOpen}
        onClose={() => setIsSheetGuideOpen(false)}
      />
    </div>
  );
}
