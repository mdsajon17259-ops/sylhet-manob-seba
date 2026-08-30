import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';
import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile, PaymentGatewayConfig } from '../types';
import { INITIAL_ORG_PROFILE, INITIAL_MEMBERS, INITIAL_DONORS, INITIAL_NOTICES, INITIAL_FUNDS } from '../data/initialData';

export interface AppFirestoreData {
  profile: OrganizationProfile;
  members: Member[];
  donors: BloodDonor[];
  notices: Notice[];
  funds: FundRecord[];
  manualTotalBalance: number | null;
  paymentConfig: PaymentGatewayConfig;
  adminPin: string;
  updatedAt?: any;
}

export const DEFAULT_APP_DATA: AppFirestoreData = {
  profile: INITIAL_ORG_PROFILE,
  members: INITIAL_MEMBERS,
  donors: INITIAL_DONORS,
  notices: INITIAL_NOTICES,
  funds: INITIAL_FUNDS,
  manualTotalBalance: null,
  paymentConfig: {
    bkashNumber: '01886122678',
    bkashType: 'Personal',
    bkashInstructions: 'আপনার বিকাশ অ্যাপ থেকে উপরের নম্বরে Send Money করুন। রেফারেন্সে আপনার নাম বা মেম্বার আইডি লিখুন এবং সফল ট্রানজেকশনের TrxID নিচে সাবমিট করুন।',
    nagadNumber: '01886122678',
    nagadType: 'Personal',
    nagadInstructions: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন। সফল পেমেন্টের পর TrxID টি নিচের বক্সে লিখে সাবমিট করুন।',
    rocketNumber: '',
    rocketType: 'Personal',
    rocketInstructions: 'রকেট একাউন্ট থেকে Send Money করার পর ফিরতি এসএমএসের TrxID নিচে যুক্ত করে সাবমিট করুন।'
  },
  adminPin: '1234'
};

/**
 * Deep sanitization to eliminate 'undefined' values before passing to Firestore SDK.
 * Firestore throws a hard error if any field is undefined.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleanObj: Record<string, any> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      cleanObj[key] = sanitizeForFirestore(val);
    }
  }
  return cleanObj as T;
}

// Main Document References
export const ORG_DOC_PATH = 'organizations/sylhetmanobseba';
export const ORG_DOC_REF = doc(db, 'organizations', 'sylhetmanobseba');

// Collection References (Exact collection names matching Firebase Console)
export const MEMBERS_COLLECTION = collection(db, 'members');
export const DONORS_COLLECTION = collection(db, 'donors');
export const NOTICES_COLLECTION = collection(db, 'notices');
export const FUNDS_COLLECTION = collection(db, 'funds');

// In-memory active cache
let activeCache: AppFirestoreData = {
  profile: INITIAL_ORG_PROFILE,
  members: INITIAL_MEMBERS,
  donors: INITIAL_DONORS,
  notices: INITIAL_NOTICES,
  funds: INITIAL_FUNDS,
  manualTotalBalance: null,
  paymentConfig: DEFAULT_APP_DATA.paymentConfig,
  adminPin: '1234'
};

/**
 * Save a single member directly to Firestore members collection and mirror in org doc
 */
export async function saveSingleMemberToFirestore(member: Member, allMembers?: Member[]): Promise<boolean> {
  try {
    const cleanMember = sanitizeForFirestore(member);
    const mRef = doc(db, 'members', member.id);
    await setDoc(mRef, cleanMember, { merge: true });

    // Update active cache with either provided list or computed list
    if (allMembers && Array.isArray(allMembers)) {
      activeCache.members = allMembers;
    } else {
      const existingIndex = activeCache.members.findIndex((m) => m.id === member.id);
      if (existingIndex >= 0) {
        activeCache.members[existingIndex] = member;
      } else {
        activeCache.members = [member, ...activeCache.members.filter(m => m.id !== member.id)];
      }
    }

    // Mirror to main org doc
    await setDoc(
      ORG_DOC_REF,
      {
        members: sanitizeForFirestore(activeCache.members),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error saving single member:', e);
    return false;
  }
}

/**
 * Delete a single member from Firestore members collection and org doc
 */
export async function deleteMemberFromFirestore(memberId: string, allMembers?: Member[]): Promise<boolean> {
  try {
    const mRef = doc(db, 'members', memberId);
    await deleteDoc(mRef);

    // Update active cache
    if (allMembers && Array.isArray(allMembers)) {
      activeCache.members = allMembers;
    } else {
      activeCache.members = activeCache.members.filter((m) => m.id !== memberId);
    }

    // Mirror to main org doc
    await setDoc(
      ORG_DOC_REF,
      {
        members: sanitizeForFirestore(activeCache.members),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error deleting single member:', e);
    return false;
  }
}

/**
 * Save a single blood donor to Firestore donors collection
 */
export async function saveSingleDonorToFirestore(donor: BloodDonor, allDonors?: BloodDonor[]): Promise<boolean> {
  try {
    const cleanDonor = sanitizeForFirestore(donor);
    const dRef = doc(db, 'donors', donor.id);
    await setDoc(dRef, cleanDonor, { merge: true });

    if (allDonors && Array.isArray(allDonors)) {
      activeCache.donors = allDonors;
    } else {
      const existingIndex = activeCache.donors.findIndex((d) => d.id === donor.id);
      if (existingIndex >= 0) {
        activeCache.donors[existingIndex] = donor;
      } else {
        activeCache.donors = [donor, ...activeCache.donors.filter(d => d.id !== donor.id)];
      }
    }

    await setDoc(
      ORG_DOC_REF,
      {
        donors: sanitizeForFirestore(activeCache.donors),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error saving single donor:', e);
    return false;
  }
}

/**
 * Delete a single donor from Firestore
 */
export async function deleteDonorFromFirestore(donorId: string, allDonors?: BloodDonor[]): Promise<boolean> {
  try {
    const dRef = doc(db, 'donors', donorId);
    await deleteDoc(dRef);

    if (allDonors && Array.isArray(allDonors)) {
      activeCache.donors = allDonors;
    } else {
      activeCache.donors = activeCache.donors.filter((d) => d.id !== donorId);
    }

    await setDoc(
      ORG_DOC_REF,
      {
        donors: sanitizeForFirestore(activeCache.donors),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error deleting single donor:', e);
    return false;
  }
}

/**
 * Save a single notice to Firestore
 */
export async function saveSingleNoticeToFirestore(notice: Notice, allNotices?: Notice[]): Promise<boolean> {
  try {
    const cleanNotice = sanitizeForFirestore(notice);
    const nRef = doc(db, 'notices', notice.id);
    await setDoc(nRef, cleanNotice, { merge: true });

    if (allNotices && Array.isArray(allNotices)) {
      activeCache.notices = allNotices;
    } else {
      const existingIndex = activeCache.notices.findIndex((n) => n.id === notice.id);
      if (existingIndex >= 0) {
        activeCache.notices[existingIndex] = notice;
      } else {
        activeCache.notices = [notice, ...activeCache.notices.filter(n => n.id !== notice.id)];
      }
    }

    await setDoc(
      ORG_DOC_REF,
      {
        notices: sanitizeForFirestore(activeCache.notices),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error saving single notice:', e);
    return false;
  }
}

/**
 * Delete a single notice from Firestore
 */
export async function deleteNoticeFromFirestore(noticeId: string, allNotices?: Notice[]): Promise<boolean> {
  try {
    const nRef = doc(db, 'notices', noticeId);
    await deleteDoc(nRef);

    if (allNotices && Array.isArray(allNotices)) {
      activeCache.notices = allNotices;
    } else {
      activeCache.notices = activeCache.notices.filter((n) => n.id !== noticeId);
    }

    await setDoc(
      ORG_DOC_REF,
      {
        notices: sanitizeForFirestore(activeCache.notices),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error deleting single notice:', e);
    return false;
  }
}

/**
 * Save a single fund record to Firestore
 */
export async function saveSingleFundToFirestore(fund: FundRecord, allFunds?: FundRecord[]): Promise<boolean> {
  try {
    const cleanFund = sanitizeForFirestore(fund);
    const fRef = doc(db, 'funds', fund.id);
    await setDoc(fRef, cleanFund, { merge: true });

    if (allFunds && Array.isArray(allFunds)) {
      activeCache.funds = allFunds;
    } else {
      const existingIndex = activeCache.funds.findIndex((f) => f.id === fund.id);
      if (existingIndex >= 0) {
        activeCache.funds[existingIndex] = fund;
      } else {
        activeCache.funds = [fund, ...activeCache.funds.filter(f => f.id !== fund.id)];
      }
    }

    await setDoc(
      ORG_DOC_REF,
      {
        funds: sanitizeForFirestore(activeCache.funds),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error saving single fund:', e);
    return false;
  }
}

/**
 * Delete a single fund record from Firestore
 */
export async function deleteFundFromFirestore(fundId: string, allFunds?: FundRecord[]): Promise<boolean> {
  try {
    const fRef = doc(db, 'funds', fundId);
    await deleteDoc(fRef);

    if (allFunds && Array.isArray(allFunds)) {
      activeCache.funds = allFunds;
    } else {
      activeCache.funds = activeCache.funds.filter((f) => f.id !== fundId);
    }

    await setDoc(
      ORG_DOC_REF,
      {
        funds: sanitizeForFirestore(activeCache.funds),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('[Firestore] Error deleting single fund:', e);
    return false;
  }
}

/**
 * Update an entire key in Firestore (members, donors, notices, funds, profile, etc.)
 */
export async function updateFirestoreKey(key: keyof AppFirestoreData, value: any): Promise<boolean> {
  try {
    const cleanValue = sanitizeForFirestore(value);
    (activeCache as any)[key] = cleanValue;

    // 1. Update in main document
    await setDoc(
      ORG_DOC_REF,
      {
        [key]: cleanValue,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // 2. Collection synchronization
    if (key === 'members' && Array.isArray(cleanValue)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        cleanValue.forEach((m: Member) => {
          if (m && m.id) {
            currentIds.add(m.id);
            const mRef = doc(db, 'members', m.id);
            batch.set(mRef, m, { merge: true });
          }
        });

        // Cleanup removed members
        try {
          const snap = await getDocs(MEMBERS_COLLECTION);
          snap.docs.forEach((d) => {
            if (!currentIds.has(d.id)) {
              batch.delete(d.ref);
            }
          });
        } catch (snapErr) {}

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Batch members sync error:', err);
      }
    } else if (key === 'donors' && Array.isArray(cleanValue)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        cleanValue.forEach((d: BloodDonor) => {
          if (d && d.id) {
            currentIds.add(d.id);
            const dRef = doc(db, 'donors', d.id);
            batch.set(dRef, d, { merge: true });
          }
        });

        try {
          const snap = await getDocs(DONORS_COLLECTION);
          snap.docs.forEach((docItem) => {
            if (!currentIds.has(docItem.id)) {
              batch.delete(docItem.ref);
            }
          });
        } catch (snapErr) {}

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Batch donors sync error:', err);
      }
    } else if (key === 'notices' && Array.isArray(cleanValue)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        cleanValue.forEach((n: Notice) => {
          if (n && n.id) {
            currentIds.add(n.id);
            const nRef = doc(db, 'notices', n.id);
            batch.set(nRef, n, { merge: true });
          }
        });

        try {
          const snap = await getDocs(NOTICES_COLLECTION);
          snap.docs.forEach((docItem) => {
            if (!currentIds.has(docItem.id)) {
              batch.delete(docItem.ref);
            }
          });
        } catch (snapErr) {}

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Batch notices sync error:', err);
      }
    } else if (key === 'funds' && Array.isArray(cleanValue)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        cleanValue.forEach((f: FundRecord) => {
          if (f && f.id) {
            currentIds.add(f.id);
            const fRef = doc(db, 'funds', f.id);
            batch.set(fRef, f, { merge: true });
          }
        });

        try {
          const snap = await getDocs(FUNDS_COLLECTION);
          snap.docs.forEach((docItem) => {
            if (!currentIds.has(docItem.id)) {
              batch.delete(docItem.ref);
            }
          });
        } catch (snapErr) {}

        await batch.commit();
      } catch (err) {
        console.warn('[Firestore] Batch funds sync error:', err);
      }
    }

    return true;
  } catch (e) {
    console.error(`[Firestore] Failed to update key ${key}:`, e);
    return false;
  }
}

/**
 * Fetch full Firestore app data asynchronously (getDocs / getDoc)
 */
export async function fetchFirestoreAppData(): Promise<AppFirestoreData | null> {
  try {
    let profile = DEFAULT_APP_DATA.profile;
    let members: Member[] = [];
    let donors: BloodDonor[] = [];
    let notices: Notice[] = [];
    let funds: FundRecord[] = [];
    let manualTotalBalance: number | null = null;
    let paymentConfig = DEFAULT_APP_DATA.paymentConfig;
    let adminPin = '1234';
    let updatedAt: any = null;

    // 1. Fetch from individual Firestore collections (primary source of truth)
    try {
      const snap = await getDocs(MEMBERS_COLLECTION);
      if (!snap.empty) {
        members = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as Member));
      }
    } catch (e) {
      console.warn('[Firestore] Error fetching members collection:', e);
    }

    try {
      const snap = await getDocs(DONORS_COLLECTION);
      if (!snap.empty) {
        donors = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as BloodDonor));
      }
    } catch (e) {
      console.warn('[Firestore] Error fetching donors collection:', e);
    }

    try {
      const snap = await getDocs(NOTICES_COLLECTION);
      if (!snap.empty) {
        notices = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as Notice));
      }
    } catch (e) {
      console.warn('[Firestore] Error fetching notices collection:', e);
    }

    try {
      const snap = await getDocs(FUNDS_COLLECTION);
      if (!snap.empty) {
        funds = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as FundRecord));
      }
    } catch (e) {
      console.warn('[Firestore] Error fetching funds collection:', e);
    }

    // 2. Fetch main organization document and merge
    try {
      const docSnap = await getDoc(ORG_DOC_REF);
      if (docSnap.exists()) {
        const raw = docSnap.data() as Partial<AppFirestoreData>;
        if (raw.profile) profile = { ...DEFAULT_APP_DATA.profile, ...raw.profile };
        if (raw.adminPin) adminPin = raw.adminPin;
        if (raw.paymentConfig) paymentConfig = { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig };
        if (raw.manualTotalBalance !== undefined) manualTotalBalance = raw.manualTotalBalance;
        
        // Comprehensive deduplicated union for members
        if (Array.isArray(raw.members) && raw.members.length > 0) {
          const memberMap = new Map<string, Member>();
          raw.members.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
          members.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
          members = Array.from(memberMap.values());
        }

        // Comprehensive deduplicated union for donors
        if (Array.isArray(raw.donors) && raw.donors.length > 0) {
          const donorMap = new Map<string, BloodDonor>();
          raw.donors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
          donors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
          donors = Array.from(donorMap.values());
        }

        // Comprehensive deduplicated union for notices
        if (Array.isArray(raw.notices) && raw.notices.length > 0) {
          const noticeMap = new Map<string, Notice>();
          raw.notices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
          notices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
          notices = Array.from(noticeMap.values());
        }

        // Comprehensive deduplicated union for funds
        if (Array.isArray(raw.funds) && raw.funds.length > 0) {
          const fundMap = new Map<string, FundRecord>();
          raw.funds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
          funds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
          funds = Array.from(fundMap.values());
        }

        if (raw.updatedAt) updatedAt = raw.updatedAt;
      }
    } catch (docErr) {
      console.warn('[Firestore] Error fetching org document:', docErr);
    }

    // If completely new project with 0 data, initialize defaults into Firestore
    if (members.length === 0 && donors.length === 0 && notices.length === 0 && funds.length === 0) {
      console.log('[Firestore] First-time initialization of Firestore collections...');
      members = DEFAULT_APP_DATA.members;
      donors = DEFAULT_APP_DATA.donors;
      notices = DEFAULT_APP_DATA.notices;
      funds = DEFAULT_APP_DATA.funds;

      // Seed to Firestore in background
      try {
        const batch = writeBatch(db);
        members.forEach((m) => batch.set(doc(db, 'members', m.id), sanitizeForFirestore(m)));
        donors.forEach((d) => batch.set(doc(db, 'donors', d.id), sanitizeForFirestore(d)));
        notices.forEach((n) => batch.set(doc(db, 'notices', n.id), sanitizeForFirestore(n)));
        funds.forEach((f) => batch.set(doc(db, 'funds', f.id), sanitizeForFirestore(f)));
        batch.set(ORG_DOC_REF, {
          profile,
          adminPin,
          paymentConfig,
          manualTotalBalance,
          members: sanitizeForFirestore(members),
          donors: sanitizeForFirestore(donors),
          notices: sanitizeForFirestore(notices),
          funds: sanitizeForFirestore(funds),
          updatedAt: serverTimestamp()
        });
        await batch.commit();
      } catch (seedErr) {
        console.warn('[Firestore] Seeding error:', seedErr);
      }
    }

    const result: AppFirestoreData = {
      profile,
      members,
      donors,
      notices,
      funds,
      manualTotalBalance,
      paymentConfig,
      adminPin,
      updatedAt
    };

    activeCache = { ...result };
    return result;
  } catch (e) {
    console.warn('[Firestore] Error in fetchFirestoreAppData:', e);
    return null;
  }
}

/**
 * Real-time listener for Firestore data changes.
 * Listens to each collection and main doc with onSnapshot.
 */
export function listenToFirestoreAppData(
  onData: (data: AppFirestoreData) => void,
  onError?: (err: any) => void
): () => void {
  const unsubscribers: Unsubscribe[] = [];

  const broadcastCurrentCache = () => {
    try {
      onData({ ...activeCache });
    } catch (e) {
      console.error('[Firestore] Error broadcasting data update:', e);
    }
  };

  try {
    // 1. Members collection listener
    const unsubMembers = onSnapshot(
      MEMBERS_COLLECTION,
      (snapshot) => {
        if (!snapshot.empty) {
          const colMembers = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              ...data,
              id: data.id || d.id
            } as Member;
          });
          const memberMap = new Map<string, Member>();
          activeCache.members.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
          colMembers.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
          activeCache.members = Array.from(memberMap.values());
          broadcastCurrentCache();
        }
      },
      (err) => {
        console.warn('[Firestore] Members subscription error:', err);
        if (onError) onError(err);
      }
    );
    unsubscribers.push(unsubMembers);

    // 2. Donors collection listener
    const unsubDonors = onSnapshot(
      DONORS_COLLECTION,
      (snapshot) => {
        if (!snapshot.empty) {
          const colDonors = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              ...data,
              id: data.id || d.id
            } as BloodDonor;
          });
          const donorMap = new Map<string, BloodDonor>();
          activeCache.donors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
          colDonors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
          activeCache.donors = Array.from(donorMap.values());
          broadcastCurrentCache();
        }
      },
      (err) => {
        console.warn('[Firestore] Donors subscription error:', err);
      }
    );
    unsubscribers.push(unsubDonors);

    // 3. Notices collection listener
    const unsubNotices = onSnapshot(
      NOTICES_COLLECTION,
      (snapshot) => {
        if (!snapshot.empty) {
          const colNotices = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              ...data,
              id: data.id || d.id
            } as Notice;
          });
          const noticeMap = new Map<string, Notice>();
          activeCache.notices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
          colNotices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
          activeCache.notices = Array.from(noticeMap.values());
          broadcastCurrentCache();
        }
      },
      (err) => {
        console.warn('[Firestore] Notices subscription error:', err);
      }
    );
    unsubscribers.push(unsubNotices);

    // 4. Funds collection listener
    const unsubFunds = onSnapshot(
      FUNDS_COLLECTION,
      (snapshot) => {
        if (!snapshot.empty) {
          const colFunds = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              ...data,
              id: data.id || d.id
            } as FundRecord;
          });
          const fundMap = new Map<string, FundRecord>();
          activeCache.funds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
          colFunds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
          activeCache.funds = Array.from(fundMap.values());
          broadcastCurrentCache();
        }
      },
      (err) => {
        console.warn('[Firestore] Funds subscription error:', err);
      }
    );
    unsubscribers.push(unsubFunds);

    // 5. Organization document listener (profile, PIN, settings, manualTotalBalance)
    const unsubOrg = onSnapshot(
      ORG_DOC_REF,
      (docSnap) => {
        if (docSnap.exists()) {
          const raw = docSnap.data() as Partial<AppFirestoreData>;
          if (raw.profile && typeof raw.profile === 'object') {
            activeCache.profile = { ...DEFAULT_APP_DATA.profile, ...raw.profile };
          }
          if (raw.adminPin) {
            activeCache.adminPin = raw.adminPin;
          }
          if (raw.paymentConfig && typeof raw.paymentConfig === 'object') {
            activeCache.paymentConfig = { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig };
          }
          if (raw.manualTotalBalance !== undefined) {
            activeCache.manualTotalBalance = raw.manualTotalBalance;
          }
          if (Array.isArray(raw.members) && raw.members.length > 0) {
            const memberMap = new Map<string, Member>();
            activeCache.members.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
            raw.members.forEach((m) => { if (m && m.id) memberMap.set(m.id, m); });
            activeCache.members = Array.from(memberMap.values());
          }
          if (Array.isArray(raw.donors) && raw.donors.length > 0) {
            const donorMap = new Map<string, BloodDonor>();
            activeCache.donors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
            raw.donors.forEach((d) => { if (d && d.id) donorMap.set(d.id, d); });
            activeCache.donors = Array.from(donorMap.values());
          }
          if (Array.isArray(raw.notices) && raw.notices.length > 0) {
            const noticeMap = new Map<string, Notice>();
            activeCache.notices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
            raw.notices.forEach((n) => { if (n && n.id) noticeMap.set(n.id, n); });
            activeCache.notices = Array.from(noticeMap.values());
          }
          if (Array.isArray(raw.funds) && raw.funds.length > 0) {
            const fundMap = new Map<string, FundRecord>();
            activeCache.funds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
            raw.funds.forEach((f) => { if (f && f.id) fundMap.set(f.id, f); });
            activeCache.funds = Array.from(fundMap.values());
          }
          broadcastCurrentCache();
        }
      },
      (err) => {
        console.warn('[Firestore] Org doc subscription error:', err);
      }
    );
    unsubscribers.push(unsubOrg);

  } catch (e) {
    console.warn('[Firestore] Failed to attach listeners:', e);
  }

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {}
    });
  };
}

/**
 * Reset Firestore collection back to default
 */
export async function resetFirestoreData(): Promise<boolean> {
  try {
    await setDoc(ORG_DOC_REF, {
      ...DEFAULT_APP_DATA,
      updatedAt: serverTimestamp()
    });

    const batch = writeBatch(db);
    DEFAULT_APP_DATA.members.forEach((m) => {
      batch.set(doc(db, 'members', m.id), sanitizeForFirestore(m));
    });
    DEFAULT_APP_DATA.donors.forEach((d) => {
      batch.set(doc(db, 'donors', d.id), sanitizeForFirestore(d));
    });
    DEFAULT_APP_DATA.notices.forEach((n) => {
      batch.set(doc(db, 'notices', n.id), sanitizeForFirestore(n));
    });
    DEFAULT_APP_DATA.funds.forEach((f) => {
      batch.set(doc(db, 'funds', f.id), sanitizeForFirestore(f));
    });
    await batch.commit();

    return true;
  } catch (e) {
    console.warn('[Firestore] Error resetting data:', e);
    return false;
  }
}

/**
 * Clear collections in Firestore
 */
export async function clearFirestoreData(): Promise<boolean> {
  try {
    await updateDoc(ORG_DOC_REF, {
      members: [],
      donors: [],
      notices: [],
      funds: [],
      manualTotalBalance: null,
      updatedAt: serverTimestamp()
    });

    const collectionsToClear = [MEMBERS_COLLECTION, DONORS_COLLECTION, NOTICES_COLLECTION, FUNDS_COLLECTION];
    for (const col of collectionsToClear) {
      try {
        const snap = await getDocs(col);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      } catch (colErr) {}
    }

    return true;
  } catch (e) {
    console.warn('[Firestore] Error clearing data in Firestore:', e);
    return false;
  }
}

/**
 * Save Organization Profile to Firestore
 */
export async function saveOrgProfileToFirestore(profile: OrganizationProfile): Promise<boolean> {
  return updateFirestoreKey('profile', profile);
}

/**
 * Save Payment Gateway Config to Firestore
 */
export async function savePaymentConfigToFirestore(paymentConfig: PaymentGatewayConfig): Promise<boolean> {
  return updateFirestoreKey('paymentConfig', paymentConfig);
}

/**
 * Save Manual Total Balance to Firestore
 */
export async function saveManualTotalBalanceToFirestore(manualTotalBalance: number | null): Promise<boolean> {
  return updateFirestoreKey('manualTotalBalance', manualTotalBalance);
}

