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

// Main Document References
export const ORG_DOC_PATH = 'organizations/sylhetmanobseba';
export const ORG_DOC_REF = doc(db, 'organizations', 'sylhetmanobseba');

// Collection References (Exact collection names matching Firebase Console)
export const MEMBERS_COLLECTION = collection(db, 'members');
export const DONORS_COLLECTION = collection(db, 'donors');
export const NOTICES_COLLECTION = collection(db, 'notices');
export const FUNDS_COLLECTION = collection(db, 'funds');

// Live in-memory cache to prevent race conditions during multi-collection onSnapshot merges
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
 * Initializes Firestore document and collections with default data if completely empty
 */
export async function initFirestoreDefaults(): Promise<void> {
  try {
    const docSnap = await getDoc(ORG_DOC_REF);
    if (!docSnap.exists()) {
      await setDoc(ORG_DOC_REF, {
        ...DEFAULT_APP_DATA,
        updatedAt: serverTimestamp()
      });
      console.log('[Firestore] Default organization document initialized.');

      try {
        const batch = writeBatch(db);
        DEFAULT_APP_DATA.members.forEach((m) => {
          batch.set(doc(db, 'members', m.id), m);
        });
        DEFAULT_APP_DATA.donors.forEach((d) => {
          batch.set(doc(db, 'donors', d.id), d);
        });
        DEFAULT_APP_DATA.notices.forEach((n) => {
          batch.set(doc(db, 'notices', n.id), n);
        });
        DEFAULT_APP_DATA.funds.forEach((f) => {
          batch.set(doc(db, 'funds', f.id), f);
        });
        await batch.commit();
        console.log('[Firestore] Default collections initialized.');
      } catch (colErr) {
        console.warn('[Firestore] Batch init collections skipped:', colErr);
      }
    }
  } catch (e) {
    console.warn('[Firestore] Error in initFirestoreDefaults:', e);
  }
}

/**
 * Real-time listener for Firestore data changes.
 * Listens to the primary document and individual collections, continuously updating the frontend.
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
    // 1. Listen to Organization Document (organizations/sylhetmanobseba)
    const unsubOrg = onSnapshot(
      ORG_DOC_REF,
      async (docSnap) => {
        try {
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
            if (Array.isArray(raw.members)) {
              activeCache.members = raw.members;
            }
            if (Array.isArray(raw.donors)) {
              activeCache.donors = raw.donors;
            }
            if (Array.isArray(raw.notices)) {
              activeCache.notices = raw.notices;
            }
            if (Array.isArray(raw.funds)) {
              activeCache.funds = raw.funds;
            }
            activeCache.updatedAt = raw.updatedAt;

            broadcastCurrentCache();
          } else {
            // First time setup
            initFirestoreDefaults().then(() => {
              broadcastCurrentCache();
            });
          }
        } catch (innerErr) {
          console.warn('[Firestore] Error in Org Snapshot handler:', innerErr);
        }
      },
      (err) => {
        console.warn('[Firestore] Org Snapshot error:', err);
        if (onError) onError(err);
      }
    );
    unsubscribers.push(unsubOrg);

    // 2. Listen to Members Collection in real-time
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
          if (colMembers.length > 0) {
            activeCache.members = colMembers;
            broadcastCurrentCache();
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Members collection subscription warning:', err);
      }
    );
    unsubscribers.push(unsubMembers);

    // 3. Listen to Donors Collection in real-time
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
          if (colDonors.length > 0) {
            activeCache.donors = colDonors;
            broadcastCurrentCache();
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Donors collection subscription warning:', err);
      }
    );
    unsubscribers.push(unsubDonors);

    // 4. Listen to Notices Collection in real-time
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
          if (colNotices.length > 0) {
            activeCache.notices = colNotices;
            broadcastCurrentCache();
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Notices collection subscription warning:', err);
      }
    );
    unsubscribers.push(unsubNotices);

    // 5. Listen to Funds Collection in real-time
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
          if (colFunds.length > 0) {
            activeCache.funds = colFunds;
            broadcastCurrentCache();
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Funds collection subscription warning:', err);
      }
    );
    unsubscribers.push(unsubFunds);

  } catch (e) {
    console.warn('[Firestore] Failed to attach realtime listeners:', e);
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
 * Fetch full Firestore app data asynchronously (getDoc / getDocs)
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

    // 1. Fetch main document
    try {
      const docSnap = await getDoc(ORG_DOC_REF);
      if (docSnap.exists()) {
        const raw = docSnap.data() as Partial<AppFirestoreData>;
        if (raw.profile) profile = { ...DEFAULT_APP_DATA.profile, ...raw.profile };
        if (raw.adminPin) adminPin = raw.adminPin;
        if (raw.paymentConfig) paymentConfig = { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig };
        if (raw.manualTotalBalance !== undefined) manualTotalBalance = raw.manualTotalBalance;
        if (Array.isArray(raw.members)) members = raw.members;
        if (Array.isArray(raw.donors)) donors = raw.donors;
        if (Array.isArray(raw.notices)) notices = raw.notices;
        if (Array.isArray(raw.funds)) funds = raw.funds;
        if (raw.updatedAt) updatedAt = raw.updatedAt;
      }
    } catch (docErr) {
      console.warn('[Firestore] Error fetching org document:', docErr);
    }

    // 2. Fetch from individual collections if arrays were empty
    if (members.length === 0) {
      try {
        const snap = await getDocs(MEMBERS_COLLECTION);
        if (!snap.empty) {
          members = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as Member));
        }
      } catch (e) {}
    }

    if (donors.length === 0) {
      try {
        const snap = await getDocs(DONORS_COLLECTION);
        if (!snap.empty) {
          donors = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as BloodDonor));
        }
      } catch (e) {}
    }

    if (notices.length === 0) {
      try {
        const snap = await getDocs(NOTICES_COLLECTION);
        if (!snap.empty) {
          notices = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as Notice));
        }
      } catch (e) {}
    }

    if (funds.length === 0) {
      try {
        const snap = await getDocs(FUNDS_COLLECTION);
        if (!snap.empty) {
          funds = snap.docs.map((d) => ({ ...d.data(), id: d.data().id || d.id } as FundRecord));
        }
      } catch (e) {}
    }

    const result: AppFirestoreData = {
      profile,
      members: members.length > 0 ? members : DEFAULT_APP_DATA.members,
      donors: donors.length > 0 ? donors : DEFAULT_APP_DATA.donors,
      notices: notices.length > 0 ? notices : DEFAULT_APP_DATA.notices,
      funds: funds.length > 0 ? funds : DEFAULT_APP_DATA.funds,
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
 * Update a specific key in Firestore.
 * Synchronizes to both the central organization document AND the specific collection documents.
 */
export async function updateFirestoreKey(key: keyof AppFirestoreData, value: any): Promise<boolean> {
  try {
    // 1. Update in active cache immediately
    (activeCache as any)[key] = value;

    // 2. Update in main document
    await setDoc(
      ORG_DOC_REF,
      {
        [key]: value,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // 3. Dual-sync to individual collection documents
    if (key === 'members' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        value.forEach((member: Member) => {
          if (member && member.id) {
            currentIds.add(member.id);
            const mRef = doc(db, 'members', member.id);
            batch.set(mRef, member, { merge: true });
          }
        });

        // Cleanup removed members from members collection
        try {
          const snap = await getDocs(MEMBERS_COLLECTION);
          snap.docs.forEach((docItem) => {
            if (!currentIds.has(docItem.id)) {
              batch.delete(docItem.ref);
            }
          });
        } catch (snapErr) {}

        await batch.commit();
      } catch (mErr) {
        console.warn('[Firestore] Error syncing members collection:', mErr);
      }
    } else if (key === 'donors' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        value.forEach((donor: BloodDonor) => {
          if (donor && donor.id) {
            currentIds.add(donor.id);
            const dRef = doc(db, 'donors', donor.id);
            batch.set(dRef, donor, { merge: true });
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
      } catch (dErr) {
        console.warn('[Firestore] Error syncing donors collection:', dErr);
      }
    } else if (key === 'notices' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        value.forEach((notice: Notice) => {
          if (notice && notice.id) {
            currentIds.add(notice.id);
            const nRef = doc(db, 'notices', notice.id);
            batch.set(nRef, notice, { merge: true });
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
      } catch (nErr) {
        console.warn('[Firestore] Error syncing notices collection:', nErr);
      }
    } else if (key === 'funds' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        const currentIds = new Set<string>();

        value.forEach((fund: FundRecord) => {
          if (fund && fund.id) {
            currentIds.add(fund.id);
            const fRef = doc(db, 'funds', fund.id);
            batch.set(fRef, fund, { merge: true });
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
      } catch (fErr) {
        console.warn('[Firestore] Error syncing funds collection:', fErr);
      }
    }

    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to update key ${key}:`, e);
    return false;
  }
}

/**
 * Delete a specific member from Firestore
 */
export async function deleteFirestoreMember(memberId: string): Promise<boolean> {
  try {
    const mRef = doc(db, 'members', memberId);
    await deleteDoc(mRef);
    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to delete member ${memberId}:`, e);
    return false;
  }
}

/**
 * Delete a specific donor from Firestore
 */
export async function deleteFirestoreDonor(donorId: string): Promise<boolean> {
  try {
    const dRef = doc(db, 'donors', donorId);
    await deleteDoc(dRef);
    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to delete donor ${donorId}:`, e);
    return false;
  }
}

/**
 * Delete a specific notice from Firestore
 */
export async function deleteFirestoreNotice(noticeId: string): Promise<boolean> {
  try {
    const nRef = doc(db, 'notices', noticeId);
    await deleteDoc(nRef);
    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to delete notice ${noticeId}:`, e);
    return false;
  }
}

/**
 * Delete a specific fund from Firestore
 */
export async function deleteFirestoreFund(fundId: string): Promise<boolean> {
  try {
    const fRef = doc(db, 'funds', fundId);
    await deleteDoc(fRef);
    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to delete fund ${fundId}:`, e);
    return false;
  }
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
      batch.set(doc(db, 'members', m.id), m);
    });
    DEFAULT_APP_DATA.donors.forEach((d) => {
      batch.set(doc(db, 'donors', d.id), d);
    });
    DEFAULT_APP_DATA.notices.forEach((n) => {
      batch.set(doc(db, 'notices', n.id), n);
    });
    DEFAULT_APP_DATA.funds.forEach((f) => {
      batch.set(doc(db, 'funds', f.id), f);
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

    // Also delete all docs from collections
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
