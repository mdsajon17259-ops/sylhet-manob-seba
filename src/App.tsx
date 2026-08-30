import React, { useState, useEffect, useMemo } from 'react';
import { 
  ActiveScreen, 
  Member, 
  BloodDonor, 
  Notice, 
  FundRecord, 
  OrganizationStats,
  OrganizationProfile,
  PaymentStatus,
  PaymentGatewayConfig
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
  loadPaymentSettings,
  savePaymentSettings,
  populateLocalStorageFromServer,
  resetAllData, 
  clearAllData 
} from './utils/storage';
import { fetchServerDatabase } from './utils/serverApi';
import {
  listenToFirestoreAppData,
  fetchFirestoreAppData,
  saveSingleMemberToFirestore,
  deleteMemberFromFirestore,
  saveSingleDonorToFirestore,
  deleteDonorFromFirestore,
  saveSingleNoticeToFirestore,
  deleteNoticeFromFirestore,
  saveSingleFundToFirestore,
  deleteFundFromFirestore,
  saveOrgProfileToFirestore,
  savePaymentConfigToFirestore,
  saveManualTotalBalanceToFirestore
} from './utils/firestoreService';
import { isDonorEligible } from './utils/helpers';
import { Header } from './components/Header';
import { HomeScreen } from './components/HomeScreen';
import { MemberListScreen } from './components/MemberListScreen';
import { BloodDonationScreen } from './components/BloodDonationScreen';
import { NoticeScreen } from './components/NoticeScreen';
import { FundScreen } from './components/FundScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { AdminPanelScreen } from './components/AdminPanelScreen';
import { AdminModal } from './components/AdminModal';
import { EmergencyHelplineModal } from './components/EmergencyHelplineModal';
import { SheetGuideModal } from './components/SheetGuideModal';
import { BottomNav } from './components/BottomNav';
import { OfflineStatusBanner } from './components/OfflineStatusBanner';
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
  const [paymentConfig, setPaymentConfig] = useState<PaymentGatewayConfig>(() => loadPaymentSettings());
  const [selectedBloodGroupFilter, setSelectedBloodGroupFilter] = useState<string>('all');

  // Modals
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSheetGuideOpen, setIsSheetGuideOpen] = useState(false);

  // Real-time synchronization across Admin Panel, Member views, and other browser tabs
  useEffect(() => {
    let isMounted = true;

    const syncAllFromStorage = () => {
      if (!isMounted) return;
      setProfile(loadOrgProfile());
      setMembers(loadMembers());
      setDonors(loadDonors());
      setNotices(loadNotices());
      setFunds(loadFunds());
      setManualTotalBalance(loadManualTotalBalance());
      setPaymentConfig(loadPaymentSettings());
    };

    // Load and sync from central server database (auto-fetches latest admin updates instantly)
    const syncWithServer = async () => {
      try {
        const serverData = await fetchServerDatabase();
        if (serverData && isMounted) {
          populateLocalStorageFromServer(serverData, true);
          if (serverData.profile) setProfile(serverData.profile);
          if (Array.isArray(serverData.members)) setMembers(serverData.members);
          if (Array.isArray(serverData.donors)) setDonors(serverData.donors);
          if (Array.isArray(serverData.notices)) setNotices(serverData.notices);
          if (Array.isArray(serverData.funds)) setFunds(serverData.funds);
          if (serverData.manualTotalBalance !== undefined) setManualTotalBalance(serverData.manualTotalBalance);
          if (serverData.paymentConfig) setPaymentConfig(serverData.paymentConfig);
        }
      } catch (e) {
        console.warn('Background server sync error:', e);
      }
    };

    // 1. Instant Firestore Real-time Listener (Sub-second sync across all members & devices)
    const unsubscribeFirestore = listenToFirestoreAppData((firestoreData) => {
      if (!isMounted || !firestoreData) return;
      populateLocalStorageFromServer(firestoreData, true);
      if (firestoreData.profile) setProfile(firestoreData.profile);
      if (Array.isArray(firestoreData.members)) setMembers(firestoreData.members);
      if (Array.isArray(firestoreData.donors)) setDonors(firestoreData.donors);
      if (Array.isArray(firestoreData.notices)) setNotices(firestoreData.notices);
      if (Array.isArray(firestoreData.funds)) setFunds(firestoreData.funds);
      if (firestoreData.manualTotalBalance !== undefined) setManualTotalBalance(firestoreData.manualTotalBalance);
      if (firestoreData.paymentConfig) setPaymentConfig(firestoreData.paymentConfig);
    });

    // 2. Initial instant sync on app launch / page open
    syncWithServer();

    // 3. Continuous Background Heartbeat Auto-Sync (Every 5 seconds)
    // Ensures non-technical members always see live updates without ever having to refresh
    const autoSyncInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncWithServer();
      }
    }, 5000);

    // 4. Cross-tab storage event
    window.addEventListener('storage', syncAllFromStorage);
    // 5. In-app custom sync event
    window.addEventListener('pms_data_updated', syncAllFromStorage);
    
    // 6. Tab visibility / Focus event & Network reconnect
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAllFromStorage();
        syncWithServer();
      }
    };
    const handleFocus = () => {
      syncAllFromStorage();
      syncWithServer();
    };
    const handleOnline = () => {
      syncWithServer();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 7. BroadcastChannel support for modern browsers
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('pms_realtime_sync_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'PMS_DATA_SYNC') {
            syncAllFromStorage();
            syncWithServer();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel setup error:', e);
      }
    }

    return () => {
      isMounted = false;
      unsubscribeFirestore();
      clearInterval(autoSyncInterval);
      window.removeEventListener('storage', syncAllFromStorage);
      window.removeEventListener('pms_data_updated', syncAllFromStorage);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) {
        bc.close();
      }
    };
  }, []);

  // Quick background sync on navigation tab changes to guarantee fresh view
  useEffect(() => {
    fetchServerDatabase().then((serverData) => {
      if (serverData) {
        populateLocalStorageFromServer(serverData, true);
        if (serverData.profile) setProfile(serverData.profile);
        if (Array.isArray(serverData.members)) setMembers(serverData.members);
        if (Array.isArray(serverData.donors)) setDonors(serverData.donors);
        if (Array.isArray(serverData.notices)) setNotices(serverData.notices);
        if (Array.isArray(serverData.funds)) setFunds(serverData.funds);
        if (serverData.manualTotalBalance !== undefined) setManualTotalBalance(serverData.manualTotalBalance);
        if (serverData.paymentConfig) setPaymentConfig(serverData.paymentConfig);
      }
    }).catch(() => {});
  }, [activeScreen]);

  const handleUpdateProfile = (newProfile: OrganizationProfile) => {
    setProfile(newProfile);
    saveOrgProfile(newProfile);
    saveOrgProfileToFirestore(newProfile).catch(() => {});
  };

  const handleUpdatePaymentConfig = (newConfig: PaymentGatewayConfig) => {
    setPaymentConfig(newConfig);
    savePaymentSettings(newConfig);
    savePaymentConfigToFirestore(newConfig).catch(() => {});
  };

  // Member Handlers
  const handleAddMember = async (newMember: Omit<Member, 'id'>) => {
    const member: Member = {
      ...newMember,
      id: `m-${Date.now()}`
    };
    setMembers(prev => {
      const updated = [member, ...prev];
      saveMembers(updated);
      return updated;
    });
    try {
      await saveSingleMemberToFirestore(member);
    } catch (e) {
      console.warn('[Firestore] Error saving member:', e);
    }
  };

  const handleEditMember = async (updatedMember: Member) => {
    setMembers(prev => {
      const updated = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      saveMembers(updated);
      return updated;
    });
    try {
      await saveSingleMemberToFirestore(updatedMember);
    } catch (e) {
      console.warn('[Firestore] Error updating member:', e);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm(`আপনি কি সদস্য "${name}" কে মুছে ফেলতে চান?`)) {
      setMembers(prev => {
        const updated = prev.filter(m => m.id !== id);
        saveMembers(updated);
        return updated;
      });
      try {
        await deleteMemberFromFirestore(id);
      } catch (e) {
        console.warn('[Firestore] Error deleting member:', e);
      }
    }
  };

  // Donor Handlers
  const handleAddDonor = async (newDonor: Omit<BloodDonor, 'id'>) => {
    const donor: BloodDonor = {
      ...newDonor,
      id: `d-${Date.now()}`
    };
    setDonors(prev => {
      const updated = [donor, ...prev];
      saveDonors(updated);
      return updated;
    });
    try {
      await saveSingleDonorToFirestore(donor);
    } catch (e) {
      console.warn('[Firestore] Error saving donor:', e);
    }
  };

  const handleEditDonor = async (updatedDonor: BloodDonor) => {
    setDonors(prev => {
      const updated = prev.map(d => d.id === updatedDonor.id ? updatedDonor : d);
      saveDonors(updated);
      return updated;
    });
    try {
      await saveSingleDonorToFirestore(updatedDonor);
    } catch (e) {
      console.warn('[Firestore] Error updating donor:', e);
    }
  };

  const handleDeleteDonor = async (id: string, name: string) => {
    if (confirm(`আপনি কি রক্তদাতা "${name}" এর তথ্য মুছে ফেলতে চান?`)) {
      setDonors(prev => {
        const updated = prev.filter(d => d.id !== id);
        saveDonors(updated);
        return updated;
      });
      try {
        await deleteDonorFromFirestore(id);
      } catch (e) {
        console.warn('[Firestore] Error deleting donor:', e);
      }
    }
  };

  // Notice Handlers
  const handleAddNotice = async (newNotice: Omit<Notice, 'id'>) => {
    const notice: Notice = {
      ...newNotice,
      id: `n-${Date.now()}`
    };
    setNotices(prev => {
      const updated = [notice, ...prev];
      saveNotices(updated);
      return updated;
    });
    try {
      await saveSingleNoticeToFirestore(notice);
    } catch (e) {
      console.warn('[Firestore] Error saving notice:', e);
    }
  };

  const handleEditNotice = async (updatedNotice: Notice) => {
    setNotices(prev => {
      const updated = prev.map(n => n.id === updatedNotice.id ? updatedNotice : n);
      saveNotices(updated);
      return updated;
    });
    try {
      await saveSingleNoticeToFirestore(updatedNotice);
    } catch (e) {
      console.warn('[Firestore] Error updating notice:', e);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      setNotices(prev => {
        const updated = prev.filter(n => n.id !== id);
        saveNotices(updated);
        return updated;
      });
      try {
        await deleteNoticeFromFirestore(id);
      } catch (e) {
        console.warn('[Firestore] Error deleting notice:', e);
      }
    }
  };

  // Fund Handlers
  const handleAddFund = async (newFund: Omit<FundRecord, 'id'>) => {
    const fund: FundRecord = {
      ...newFund,
      id: `f-${Date.now()}`
    };
    setFunds(prev => {
      const updated = [fund, ...prev];
      saveFunds(updated);
      return updated;
    });
    try {
      await saveSingleFundToFirestore(fund);
    } catch (e) {
      console.warn('[Firestore] Error saving fund:', e);
    }
  };

  const handleEditFund = async (updatedFund: FundRecord) => {
    setFunds(prev => {
      const updated = prev.map(f => f.id === updatedFund.id ? updatedFund : f);
      saveFunds(updated);
      return updated;
    });
    try {
      await saveSingleFundToFirestore(updatedFund);
    } catch (e) {
      console.warn('[Firestore] Error updating fund:', e);
    }
  };

  const handleDeleteFund = async (id: string) => {
    if (confirm('আপনি কি এই ফান্ড এন্ট্রিটি মুছে ফেলতে চান?')) {
      setFunds(prev => {
        const updated = prev.filter(f => f.id !== id);
        saveFunds(updated);
        return updated;
      });
      try {
        await deleteFundFromFirestore(id);
      } catch (e) {
        console.warn('[Firestore] Error deleting fund:', e);
      }
    }
  };

  const handleToggleFundStatus = async (id: string, newStatus: PaymentStatus) => {
    let updatedRecord: FundRecord | null = null;
    setFunds(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          updatedRecord = {
            ...f,
            status: newStatus,
            approvedAt: newStatus === 'Paid' ? new Date().toISOString() : f.approvedAt,
            date: f.date || new Date().toISOString().split('T')[0]
          };
          return updatedRecord;
        }
        return f;
      });
      saveFunds(updated);
      return updated;
    });
    if (updatedRecord) {
      try {
        await saveSingleFundToFirestore(updatedRecord);
      } catch (e) {
        console.warn('[Firestore] Error updating fund status:', e);
      }
    }
  };

  const handleUpdateManualTotalBalance = (val: number | null) => {
    setManualTotalBalance(val);
    saveManualTotalBalance(val);
    saveManualTotalBalanceToFirestore(val).catch(() => {});
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
      {/* Offline Status Reassurance Banner */}
      <OfflineStatusBanner />

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
              if (screen === 'blood') {
                setSelectedBloodGroupFilter('all');
              }
              setActiveScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectBloodGroup={(bg) => {
              setSelectedBloodGroupFilter(bg);
              setActiveScreen('blood');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            donors={donors}
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
            initialBloodGroup={selectedBloodGroupFilter}
            onAddDonor={handleAddDonor}
            onEditDonor={handleEditDonor}
            onDeleteDonor={handleDeleteDonor}
            isAdmin={isAdmin}
            onBack={() => {
              setSelectedBloodGroupFilter('all');
              setActiveScreen('home');
            }}
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
            paymentConfig={paymentConfig}
            isAdmin={isAdmin}
            onBack={() => setActiveScreen('home')}
          />
        )}

        {activeScreen === 'calendar' && (
          <CalendarScreen
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
            paymentConfig={paymentConfig}
            onUpdatePaymentConfig={handleUpdatePaymentConfig}
            onUpdateProfile={handleUpdateProfile}
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

      <EmergencyHelplineModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        profile={profile}
        onUpdateProfile={(updatedProfile) => {
          setProfile(updatedProfile);
          saveOrgProfile(updatedProfile);
        }}
        isAdmin={isAdmin}
        onNavigateToAdmin={() => {
          if (isAdmin) {
            setActiveScreen('admin');
          } else {
            setIsAdminModalOpen(true);
          }
        }}
      />

      <SheetGuideModal
        isOpen={isSheetGuideOpen}
        onClose={() => setIsSheetGuideOpen(false)}
      />
    </div>
  );
}
