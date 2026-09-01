import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
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
  ensureFirestoreCollectionsAndSettings,
  sanitizeForFirestore,
  updateFirestoreKey,
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

  // Real-time synchronization across Firestore, Admin Panel, Member views, and other browser tabs
  useEffect(() => {
    let isMounted = true;

    // Master data applicator: Firestore is the Single Source of Truth
    const applyFirestoreData = (firestoreData: any) => {
      if (!isMounted || !firestoreData) return;

      // 1. Exclusively populate React states from Firebase Firestore
      if (firestoreData.profile) setProfile(firestoreData.profile);
      if (Array.isArray(firestoreData.members)) setMembers(firestoreData.members);
      if (Array.isArray(firestoreData.donors)) setDonors(firestoreData.donors);
      if (Array.isArray(firestoreData.notices)) setNotices(firestoreData.notices);
      if (Array.isArray(firestoreData.funds)) setFunds(firestoreData.funds);
      if (firestoreData.manualTotalBalance !== undefined) setManualTotalBalance(firestoreData.manualTotalBalance);
      if (firestoreData.paymentConfig) setPaymentConfig(firestoreData.paymentConfig);

      // 2. Update local storage purely as a cache AFTER fresh data is received from Firestore
      populateLocalStorageFromServer(firestoreData, true);
    };

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

    // Direct Firestore Load for collections
    const loadDirectFromFirestore = async () => {
      try {
        console.log('[App Startup] Direct Firestore fetch initiated...');
        const [memSnap, donorSnap, notSnap, fundSnap, paySnap, profSnap] = await Promise.allSettled([
          getDocs(collection(db, 'members')),
          getDocs(collection(db, 'donors')),
          getDocs(collection(db, 'notices')),
          getDocs(collection(db, 'funds')),
          getDoc(doc(db, 'settings', 'payment')),
          getDoc(doc(db, 'settings', 'profile'))
        ]);

        if (memSnap.status === 'fulfilled' && !memSnap.value.empty && isMounted) {
          const loadedMembers: Member[] = memSnap.value.docs.map(d => ({
            id: d.id,
            name: d.data().name || '',
            designation: d.data().designation || 'সদস্য',
            phone: d.data().phone || '',
            area: d.data().area || 'পতেঙ্গা, চট্টগ্রাম',
            photoUrl: d.data().photoUrl || '',
            joinDate: d.data().joinDate || '',
            email: d.data().email || '',
            status: d.data().status || 'সক্রিয়'
          }));
          console.log(`[App Direct Firestore] Loaded ${loadedMembers.length} members.`);
          setMembers(loadedMembers);
          saveMembers(loadedMembers);
        }

        if (donorSnap.status === 'fulfilled' && !donorSnap.value.empty && isMounted) {
          const loadedDonors = donorSnap.value.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setDonors(loadedDonors);
          saveDonors(loadedDonors);
        }

        if (notSnap.status === 'fulfilled' && !notSnap.value.empty && isMounted) {
          const loadedNotices = notSnap.value.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setNotices(loadedNotices);
          saveNotices(loadedNotices);
        }

        if (fundSnap.status === 'fulfilled' && !fundSnap.value.empty && isMounted) {
          const loadedFunds = fundSnap.value.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setFunds(loadedFunds);
          saveFunds(loadedFunds);
        }

        if (paySnap.status === 'fulfilled' && paySnap.value.exists() && isMounted) {
          const payData = paySnap.value.data() as PaymentGatewayConfig;
          console.log('[App Direct Firestore] Loaded payment settings:', payData);
          setPaymentConfig(payData);
          savePaymentSettings(payData);
        }

        if (profSnap.status === 'fulfilled' && profSnap.value.exists() && isMounted) {
          const profData = profSnap.value.data() as OrganizationProfile;
          setProfile(profData);
          saveOrgProfile(profData);
        }
      } catch (err) {
        console.error('[App Direct Firestore Error]:', err);
      }
    };

    loadDirectFromFirestore();

    // 1. Instant Firestore Real-time Listener (Sub-second sync across all members & devices)
    const unsubscribeFirestore = listenToFirestoreAppData((firestoreData) => {
      applyFirestoreData(firestoreData);
    });

    // 2. Direct Firestore Fetch & Collection Structure Verification on App Startup
    ensureFirestoreCollectionsAndSettings()
      .then((initRes) => {
        if (initRes.initializedCollections.length > 0 || initRes.initializedDocuments.length > 0) {
          console.log('[Firestore] Successfully ensured collections/documents:', initRes);
        }
      })
      .catch((initErr) => {
        console.error('[Firestore ERROR] ensureFirestoreCollectionsAndSettings error:', initErr);
      });

    fetchFirestoreAppData().then((firestoreData) => {
      if (firestoreData) {
        applyFirestoreData(firestoreData);
      }
    }).catch((err) => {
      console.warn('[Firestore] Startup direct fetch error:', err);
    });

    // 3. Periodic cloud poll fallback (Every 10 seconds)
    const cloudPollInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchFirestoreAppData().then((data) => {
          if (data) applyFirestoreData(data);
        }).catch(() => {});
      }
    }, 10000);

    // 4. Cross-tab storage event
    window.addEventListener('storage', syncAllFromStorage);
    
    // 5. Tab visibility / Focus event & Network reconnect
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFirestoreAppData().then((data) => {
          if (data) applyFirestoreData(data);
        }).catch(() => {});
      }
    };
    const handleFocus = () => {
      fetchFirestoreAppData().then((data) => {
        if (data) applyFirestoreData(data);
      }).catch(() => {});
    };
    const handleOnline = () => {
      fetchFirestoreAppData().then((data) => {
        if (data) applyFirestoreData(data);
      }).catch(() => {});
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 6. BroadcastChannel support for modern browsers
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('pms_realtime_sync_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.type === 'PMS_DATA_SYNC') {
            fetchFirestoreAppData().then((data) => {
              if (data) applyFirestoreData(data);
            }).catch(() => {});
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel setup error:', e);
      }
    }

    return () => {
      isMounted = false;
      unsubscribeFirestore();
      clearInterval(cloudPollInterval);
      window.removeEventListener('storage', syncAllFromStorage);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (bc) {
        bc.close();
      }
    };
  }, []);

  // Quick background sync on navigation tab changes directly from Firestore
  useEffect(() => {
    fetchFirestoreAppData().then((firestoreData) => {
      if (firestoreData) {
        if (firestoreData.profile) setProfile(firestoreData.profile);
        if (Array.isArray(firestoreData.members)) setMembers(firestoreData.members);
        if (Array.isArray(firestoreData.donors)) setDonors(firestoreData.donors);
        if (Array.isArray(firestoreData.notices)) setNotices(firestoreData.notices);
        if (Array.isArray(firestoreData.funds)) setFunds(firestoreData.funds);
        if (firestoreData.manualTotalBalance !== undefined) setManualTotalBalance(firestoreData.manualTotalBalance);
        if (firestoreData.paymentConfig) setPaymentConfig(firestoreData.paymentConfig);
        populateLocalStorageFromServer(firestoreData, true);
      }
    }).catch(() => {});
  }, [activeScreen]);

  const handleUpdateProfile = async (newProfile: OrganizationProfile) => {
    const cleanProfile = sanitizeForFirestore(newProfile);
    setProfile(cleanProfile);
    saveOrgProfile(cleanProfile);
    try {
      await setDoc(doc(db, 'settings', 'profile'), {
        ...cleanProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firestore] Profile update fallback:', e);
      saveOrgProfileToFirestore(cleanProfile).catch(() => {});
    }
  };

  const handleUpdatePaymentConfig = async (newConfig: PaymentGatewayConfig) => {
    const cleanConfig = sanitizeForFirestore(newConfig);
    setPaymentConfig(cleanConfig);
    savePaymentSettings(cleanConfig);
    try {
      await setDoc(doc(db, 'settings', 'payment'), {
        ...cleanConfig,
        updatedAt: serverTimestamp()
      }, { merge: true });
      await updateFirestoreKey('paymentConfig', cleanConfig);
      console.log('[Firestore SUCCESS] App handleUpdatePaymentConfig saved doc(settings, payment)');
    } catch (e) {
      console.warn('[Firestore] Payment config update fallback:', e);
      savePaymentConfigToFirestore(cleanConfig).catch(() => {});
    }
  };

  // Member Handlers - Direct Firestore addDoc & setDoc (Single Write & Sanitized)
  const handleAddMember = async (newMember: Omit<Member, 'id'>): Promise<Member> => {
    const cleanMemberData = sanitizeForFirestore(newMember);
    try {
      console.log('[Firestore App] Adding member to collection(db, "members")...', cleanMemberData);
      const docRef = await addDoc(collection(db, 'members'), {
        ...cleanMemberData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('[Firestore App SUCCESS] Created member with doc ID:', docRef.id);

      const member: Member = {
        ...cleanMemberData,
        id: docRef.id
      };
      
      setMembers(prev => {
        const updated = [member, ...prev.filter(m => m.id !== member.id)];
        saveMembers(updated);
        return updated;
      });
      return member;
    } catch (err) {
      console.error('[Firestore App ERROR] addDoc(members) failed:', err);
      const memberId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const member: Member = {
        ...cleanMemberData,
        id: memberId
      };
      setMembers(prev => {
        const updated = [member, ...prev.filter(m => m.id !== member.id)];
        saveMembers(updated);
        saveSingleMemberToFirestore(member, updated).catch(() => {});
        return updated;
      });
      return member;
    }
  };

  const handleEditMember = async (updatedMember: Member): Promise<void> => {
    const cleanMember = sanitizeForFirestore(updatedMember);
    try {
      console.log('[Firestore App] Updating member doc(db, "members", id):', cleanMember.id);
      await setDoc(doc(db, 'members', cleanMember.id), {
        ...cleanMember,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('[Firestore App ERROR] setDoc(members) failed:', err);
      saveSingleMemberToFirestore(cleanMember, members).catch(() => {});
    }

    setMembers(prev => {
      const updated = prev.map(m => m.id === cleanMember.id ? cleanMember : m);
      saveMembers(updated);
      return updated;
    });
  };

  const handleDeleteMember = async (id: string, name: string): Promise<void> => {
    if (confirm(`আপনি কি সদস্য "${name}" কে মুছে ফেলতে চান?`)) {
      try {
        console.log('[Firestore App] Deleting member doc(db, "members", id):', id);
        await deleteDoc(doc(db, 'members', id));
      } catch (err) {
        console.error('[Firestore App ERROR] deleteDoc(members) failed:', err);
        deleteMemberFromFirestore(id, members).catch(() => {});
      }

      setMembers(prev => {
        const updated = prev.filter(m => m.id !== id);
        saveMembers(updated);
        return updated;
      });
    }
  };

  // Donor Handlers
  const handleAddDonor = async (newDonor: Omit<BloodDonor, 'id'>): Promise<BloodDonor> => {
    const cleanDonorData = sanitizeForFirestore(newDonor);
    try {
      const docRef = await addDoc(collection(db, 'donors'), {
        ...cleanDonorData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const donor: BloodDonor = {
        ...cleanDonorData,
        id: docRef.id
      };
      setDonors(prev => {
        const updated = [donor, ...prev.filter(d => d.id !== donor.id)];
        saveDonors(updated);
        return updated;
      });
      return donor;
    } catch (err) {
      const donorId = `d-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const donor: BloodDonor = {
        ...cleanDonorData,
        id: donorId
      };
      setDonors(prev => {
        const updated = [donor, ...prev.filter(d => d.id !== donor.id)];
        saveDonors(updated);
        saveSingleDonorToFirestore(donor, updated).catch(() => {});
        return updated;
      });
      return donor;
    }
  };

  const handleEditDonor = async (updatedDonor: BloodDonor): Promise<void> => {
    const cleanDonor = sanitizeForFirestore(updatedDonor);
    try {
      await setDoc(doc(db, 'donors', cleanDonor.id), {
        ...cleanDonor,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      saveSingleDonorToFirestore(cleanDonor, donors).catch(() => {});
    }

    setDonors(prev => {
      const updated = prev.map(d => d.id === cleanDonor.id ? cleanDonor : d);
      saveDonors(updated);
      return updated;
    });
  };

  const handleDeleteDonor = async (id: string, name: string): Promise<void> => {
    if (confirm(`আপনি কি রক্তদাতা "${name}" এর তথ্য মুছে ফেলতে চান?`)) {
      try {
        await deleteDoc(doc(db, 'donors', id));
      } catch (err) {
        deleteDonorFromFirestore(id, donors).catch(() => {});
      }

      setDonors(prev => {
        const updated = prev.filter(d => d.id !== id);
        saveDonors(updated);
        return updated;
      });
    }
  };

  // Notice Handlers
  const handleAddNotice = async (newNotice: Omit<Notice, 'id'>): Promise<Notice> => {
    const cleanNoticeData = sanitizeForFirestore(newNotice);
    try {
      const docRef = await addDoc(collection(db, 'notices'), {
        ...cleanNoticeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const notice: Notice = {
        ...cleanNoticeData,
        id: docRef.id
      };
      setNotices(prev => {
        const updated = [notice, ...prev.filter(n => n.id !== notice.id)];
        saveNotices(updated);
        return updated;
      });
      return notice;
    } catch (err) {
      const noticeId = `n-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const notice: Notice = {
        ...cleanNoticeData,
        id: noticeId
      };
      setNotices(prev => {
        const updated = [notice, ...prev.filter(n => n.id !== notice.id)];
        saveNotices(updated);
        saveSingleNoticeToFirestore(notice, updated).catch(() => {});
        return updated;
      });
      return notice;
    }
  };

  const handleEditNotice = async (updatedNotice: Notice): Promise<void> => {
    const cleanNotice = sanitizeForFirestore(updatedNotice);
    try {
      await setDoc(doc(db, 'notices', cleanNotice.id), {
        ...cleanNotice,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      saveSingleNoticeToFirestore(cleanNotice, notices).catch(() => {});
    }

    setNotices(prev => {
      const updated = prev.map(n => n.id === cleanNotice.id ? cleanNotice : n);
      saveNotices(updated);
      return updated;
    });
  };

  const handleDeleteNotice = async (id: string): Promise<void> => {
    if (confirm('আপনি কি এই নোটিশটি মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (err) {
        deleteNoticeFromFirestore(id, notices).catch(() => {});
      }

      setNotices(prev => {
        const updated = prev.filter(n => n.id !== id);
        saveNotices(updated);
        return updated;
      });
    }
  };

  // Fund Handlers
  const handleAddFund = async (newFund: Omit<FundRecord, 'id'>): Promise<FundRecord> => {
    const cleanFundData = sanitizeForFirestore(newFund);
    try {
      const docRef = await addDoc(collection(db, 'funds'), {
        ...cleanFundData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const fund: FundRecord = {
        ...cleanFundData,
        id: docRef.id
      };
      setFunds(prev => {
        const updated = [fund, ...prev.filter(f => f.id !== fund.id)];
        saveFunds(updated);
        return updated;
      });
      return fund;
    } catch (err) {
      const fundId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const fund: FundRecord = {
        ...cleanFundData,
        id: fundId
      };
      setFunds(prev => {
        const updated = [fund, ...prev.filter(f => f.id !== fund.id)];
        saveFunds(updated);
        saveSingleFundToFirestore(fund, updated).catch(() => {});
        return updated;
      });
      return fund;
    }
  };

  const handleEditFund = async (updatedFund: FundRecord): Promise<void> => {
    const cleanFund = sanitizeForFirestore(updatedFund);
    try {
      await setDoc(doc(db, 'funds', cleanFund.id), {
        ...cleanFund,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      saveSingleFundToFirestore(cleanFund, funds).catch(() => {});
    }

    setFunds(prev => {
      const updated = prev.map(f => f.id === cleanFund.id ? cleanFund : f);
      saveFunds(updated);
      return updated;
    });
  };

  const handleDeleteFund = async (id: string): Promise<void> => {
    if (confirm('আপনি কি এই ফান্ড এন্ট্রিটি মুছে ফেলতে চান?')) {
      try {
        await deleteDoc(doc(db, 'funds', id));
      } catch (err) {
        deleteFundFromFirestore(id, funds).catch(() => {});
      }

      setFunds(prev => {
        const updated = prev.filter(f => f.id !== id);
        saveFunds(updated);
        return updated;
      });
    }
  };

  const handleToggleFundStatus = async (id: string, newStatus: PaymentStatus): Promise<void> => {
    let updatedRecord: FundRecord | null = null;
    setFunds(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          updatedRecord = sanitizeForFirestore({
            ...f,
            status: newStatus,
            approvedAt: newStatus === 'Paid' ? new Date().toISOString() : f.approvedAt,
            date: f.date || new Date().toISOString().split('T')[0]
          });
          return updatedRecord;
        }
        return f;
      });
      saveFunds(updated);
      return updated;
    });

    if (updatedRecord) {
      try {
        await setDoc(doc(db, 'funds', id), {
          ...updatedRecord,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        saveSingleFundToFirestore(updatedRecord, funds).catch(() => {});
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
