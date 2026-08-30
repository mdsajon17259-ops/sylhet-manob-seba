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
  writeBatch
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

// Collection References (for direct collection queries and sync)
export const MEMBERS_COLLECTION = collection(db, 'members');
export const DONORS_COLLECTION = collection(db, 'donors');
export const NOTICES_COLLECTION = collection(db, 'notices');
export const FUNDS_COLLECTION = collection(db, 'funds');

/**
 * Real-time listener for Firestore data changes.
 * Listens to the primary document and falls back to / merges collection data if needed.
 */
export function listenToFirestoreAppData(
  onData: (data: AppFirestoreData) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const unsubscribeOrg = onSnapshot(
      ORG_DOC_REF,
      async (docSnap) => {
        try {
          if (docSnap.exists()) {
            const raw = docSnap.data() as Partial<AppFirestoreData>;
            
            // Check if members array is present in doc or in members collection
            let membersList: Member[] = [];
            if (Array.isArray(raw.members) && raw.members.length > 0) {
              membersList = raw.members;
            } else {
              // Try reading from members collection
              try {
                const membersSnap = await getDocs(MEMBERS_COLLECTION);
                if (!membersSnap.empty) {
                  membersList = membersSnap.docs.map(d => d.data() as Member);
                }
              } catch (e) {
                // Ignore collection read error
              }
              // If still empty and doc had an explicit array, use it; otherwise fallback to initial members
              if (membersList.length === 0) {
                membersList = Array.isArray(raw.members) ? raw.members : DEFAULT_APP_DATA.members;
              }
            }

            // Check donors
            let donorsList: BloodDonor[] = [];
            if (Array.isArray(raw.donors) && raw.donors.length > 0) {
              donorsList = raw.donors;
            } else {
              try {
                const donorsSnap = await getDocs(DONORS_COLLECTION);
                if (!donorsSnap.empty) {
                  donorsList = donorsSnap.docs.map(d => d.data() as BloodDonor);
                }
              } catch (e) {}
              if (donorsList.length === 0) {
                donorsList = Array.isArray(raw.donors) ? raw.donors : DEFAULT_APP_DATA.donors;
              }
            }

            // Check notices
            let noticesList: Notice[] = [];
            if (Array.isArray(raw.notices) && raw.notices.length > 0) {
              noticesList = raw.notices;
            } else {
              try {
                const noticesSnap = await getDocs(NOTICES_COLLECTION);
                if (!noticesSnap.empty) {
                  noticesList = noticesSnap.docs.map(d => d.data() as Notice);
                }
              } catch (e) {}
              if (noticesList.length === 0) {
                noticesList = Array.isArray(raw.notices) ? raw.notices : DEFAULT_APP_DATA.notices;
              }
            }

            // Check funds
            let fundsList: FundRecord[] = [];
            if (Array.isArray(raw.funds) && raw.funds.length > 0) {
              fundsList = raw.funds;
            } else {
              try {
                const fundsSnap = await getDocs(FUNDS_COLLECTION);
                if (!fundsSnap.empty) {
                  fundsList = fundsSnap.docs.map(d => d.data() as FundRecord);
                }
              } catch (e) {}
              if (fundsList.length === 0) {
                fundsList = Array.isArray(raw.funds) ? raw.funds : DEFAULT_APP_DATA.funds;
              }
            }

            const merged: AppFirestoreData = {
              profile: raw.profile ? { ...DEFAULT_APP_DATA.profile, ...raw.profile } : DEFAULT_APP_DATA.profile,
              members: membersList,
              donors: donorsList,
              notices: noticesList,
              funds: fundsList,
              manualTotalBalance: raw.manualTotalBalance !== undefined ? raw.manualTotalBalance : null,
              paymentConfig: raw.paymentConfig ? { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig } : DEFAULT_APP_DATA.paymentConfig,
              adminPin: raw.adminPin || '1234',
              updatedAt: raw.updatedAt
            };
            onData(merged);
          } else {
            // Document does not exist yet; initialize it in Firestore
            await initFirestoreDefaults();
            onData(DEFAULT_APP_DATA);
          }
        } catch (innerErr) {
          console.warn('[Firestore] Error processing snapshot data:', innerErr);
        }
      },
      (error) => {
        console.warn('[Firestore] Realtime subscription error:', error);
        if (onError) onError(error);
      }
    );

    // Also listen to the individual members collection in real-time
    const unsubscribeMembers = onSnapshot(
      MEMBERS_COLLECTION,
      (colSnap) => {
        if (!colSnap.empty) {
          const colMembers = colSnap.docs.map(d => d.data() as Member);
          if (colMembers.length > 0) {
            onData({
              ...DEFAULT_APP_DATA,
              members: colMembers
            });
          }
        }
      },
      (err) => {
        // Silent error for optional collection listener
      }
    );

    return () => {
      unsubscribeOrg();
      unsubscribeMembers();
    };
  } catch (e) {
    console.warn('[Firestore] Failed to attach realtime listener:', e);
    return () => {};
  }
}

/**
 * Initializes Firestore document with initial data if it doesn't already exist
 */
export async function initFirestoreDefaults(): Promise<void> {
  try {
    const docSnap = await getDoc(ORG_DOC_REF);
    if (!docSnap.exists()) {
      await setDoc(ORG_DOC_REF, {
        ...DEFAULT_APP_DATA,
        updatedAt: serverTimestamp()
      });
      console.log('[Firestore] Default data initialized in Firestore document');

      // Also seed individual members into members collection
      try {
        const batch = writeBatch(db);
        DEFAULT_APP_DATA.members.forEach((m) => {
          const mRef = doc(db, 'members', m.id);
          batch.set(mRef, m);
        });
        DEFAULT_APP_DATA.donors.forEach((d) => {
          const dRef = doc(db, 'donors', d.id);
          batch.set(dRef, d);
        });
        DEFAULT_APP_DATA.notices.forEach((n) => {
          const nRef = doc(db, 'notices', n.id);
          batch.set(nRef, n);
        });
        DEFAULT_APP_DATA.funds.forEach((f) => {
          const fRef = doc(db, 'funds', f.id);
          batch.set(fRef, f);
        });
        await batch.commit();
        console.log('[Firestore] Default collections seeded successfully');
      } catch (colErr) {
        console.warn('[Firestore] Error batch seeding collections:', colErr);
      }
    }
  } catch (e) {
    console.warn('[Firestore] Error initializing defaults in Firestore:', e);
  }
}

/**
 * Fetch once from Firestore
 */
export async function fetchFirestoreAppData(): Promise<AppFirestoreData | null> {
  try {
    const docSnap = await getDoc(ORG_DOC_REF);
    if (docSnap.exists()) {
      const raw = docSnap.data() as Partial<AppFirestoreData>;
      
      let members = Array.isArray(raw.members) ? raw.members : [];
      if (members.length === 0) {
        try {
          const mSnap = await getDocs(MEMBERS_COLLECTION);
          if (!mSnap.empty) {
            members = mSnap.docs.map(d => d.data() as Member);
          }
        } catch (e) {}
      }

      return {
        profile: raw.profile ? { ...DEFAULT_APP_DATA.profile, ...raw.profile } : DEFAULT_APP_DATA.profile,
        members: members.length > 0 ? members : DEFAULT_APP_DATA.members,
        donors: Array.isArray(raw.donors) && raw.donors.length > 0 ? raw.donors : DEFAULT_APP_DATA.donors,
        notices: Array.isArray(raw.notices) && raw.notices.length > 0 ? raw.notices : DEFAULT_APP_DATA.notices,
        funds: Array.isArray(raw.funds) && raw.funds.length > 0 ? raw.funds : DEFAULT_APP_DATA.funds,
        manualTotalBalance: raw.manualTotalBalance !== undefined ? raw.manualTotalBalance : null,
        paymentConfig: raw.paymentConfig ? { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig } : DEFAULT_APP_DATA.paymentConfig,
        adminPin: raw.adminPin || '1234',
        updatedAt: raw.updatedAt
      };
    }
    return null;
  } catch (e) {
    console.warn('[Firestore] Fetch error:', e);
    return null;
  }
}

/**
 * Update a specific key in Firestore.
 * Updates both the main document and the corresponding collection.
 */
export async function updateFirestoreKey(key: keyof AppFirestoreData, value: any): Promise<boolean> {
  try {
    // 1. Update in main document
    await setDoc(
      ORG_DOC_REF,
      {
        [key]: value,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );

    // 2. If it's a collection item, also sync to individual documents
    if (key === 'members' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        value.forEach((member: Member) => {
          if (member && member.id) {
            const mRef = doc(db, 'members', member.id);
            batch.set(mRef, member);
          }
        });
        await batch.commit();
      } catch (mErr) {
        console.warn('[Firestore] Error syncing members collection docs:', mErr);
      }
    } else if (key === 'donors' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        value.forEach((donor: BloodDonor) => {
          if (donor && donor.id) {
            const dRef = doc(db, 'donors', donor.id);
            batch.set(dRef, donor);
          }
        });
        await batch.commit();
      } catch (dErr) {
        console.warn('[Firestore] Error syncing donors collection docs:', dErr);
      }
    } else if (key === 'notices' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        value.forEach((notice: Notice) => {
          if (notice && notice.id) {
            const nRef = doc(db, 'notices', notice.id);
            batch.set(nRef, notice);
          }
        });
        await batch.commit();
      } catch (nErr) {
        console.warn('[Firestore] Error syncing notices collection docs:', nErr);
      }
    } else if (key === 'funds' && Array.isArray(value)) {
      try {
        const batch = writeBatch(db);
        value.forEach((fund: FundRecord) => {
          if (fund && fund.id) {
            const fRef = doc(db, 'funds', fund.id);
            batch.set(fRef, fund);
          }
        });
        await batch.commit();
      } catch (fErr) {
        console.warn('[Firestore] Error syncing funds collection docs:', fErr);
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
    return true;
  } catch (e) {
    console.warn('[Firestore] Error clearing data in Firestore:', e);
    return false;
  }
}
