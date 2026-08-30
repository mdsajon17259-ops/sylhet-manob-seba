import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
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

const ORG_DOC_REF = doc(db, 'organizations', 'sylhetmanobseba');

/**
 * Real-time listener for Firestore data changes.
 * Automatically pushes updates to the callback function whenever anything changes in Firestore.
 */
export function listenToFirestoreAppData(
  onData: (data: AppFirestoreData) => void,
  onError?: (err: any) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      ORG_DOC_REF,
      (docSnap) => {
        if (docSnap.exists()) {
          const raw = docSnap.data() as Partial<AppFirestoreData>;
          const merged: AppFirestoreData = {
            profile: raw.profile ? { ...DEFAULT_APP_DATA.profile, ...raw.profile } : DEFAULT_APP_DATA.profile,
            members: Array.isArray(raw.members) ? raw.members : [],
            donors: Array.isArray(raw.donors) ? raw.donors : [],
            notices: Array.isArray(raw.notices) ? raw.notices : [],
            funds: Array.isArray(raw.funds) ? raw.funds : [],
            manualTotalBalance: raw.manualTotalBalance !== undefined ? raw.manualTotalBalance : null,
            paymentConfig: raw.paymentConfig ? { ...DEFAULT_APP_DATA.paymentConfig, ...raw.paymentConfig } : DEFAULT_APP_DATA.paymentConfig,
            adminPin: raw.adminPin || '1234',
            updatedAt: raw.updatedAt
          };
          onData(merged);
        } else {
          // Document does not exist yet; initialize it in background
          initFirestoreDefaults().then(() => {
            onData(DEFAULT_APP_DATA);
          }).catch(() => {
            onData(DEFAULT_APP_DATA);
          });
        }
      },
      (error) => {
        console.warn('[Firestore] Realtime subscription error:', error);
        if (onError) onError(error);
      }
    );
    return unsubscribe;
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
      console.log('[Firestore] Default data initialized in Firestore');
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
      return {
        profile: raw.profile ? { ...DEFAULT_APP_DATA.profile, ...raw.profile } : DEFAULT_APP_DATA.profile,
        members: Array.isArray(raw.members) ? raw.members : [],
        donors: Array.isArray(raw.donors) ? raw.donors : [],
        notices: Array.isArray(raw.notices) ? raw.notices : [],
        funds: Array.isArray(raw.funds) ? raw.funds : [],
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
 * Update a specific key in Firestore
 */
export async function updateFirestoreKey(key: keyof AppFirestoreData, value: any): Promise<boolean> {
  try {
    await setDoc(
      ORG_DOC_REF,
      {
        [key]: value,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn(`[Firestore] Failed to update key ${key}:`, e);
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
