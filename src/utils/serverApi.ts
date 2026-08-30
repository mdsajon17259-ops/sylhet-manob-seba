// Server API & Firestore synchronization client for persistent cloud/container storage
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  PaymentGatewayConfig
} from '../types';
import {
  fetchFirestoreAppData,
  updateFirestoreKey,
  resetFirestoreData,
  clearFirestoreData
} from './firestoreService';

export interface ServerDatabasePayload {
  profile?: OrganizationProfile;
  members?: Member[];
  donors?: BloodDonor[];
  notices?: Notice[];
  funds?: FundRecord[];
  manualTotalBalance?: number | null;
  paymentConfig?: PaymentGatewayConfig;
  adminPin?: string;
  updatedAt?: string;
}

/**
 * Fetch full persisted database state from Firestore (with server fallback)
 */
export async function fetchServerDatabase(): Promise<ServerDatabasePayload | null> {
  try {
    // 1. Try Firestore first
    const firestoreData = await fetchFirestoreAppData();
    if (firestoreData) {
      return firestoreData;
    }

    // 2. Fallback to Express backend if Firestore is temporarily offline
    const timestamp = Date.now();
    const response = await fetch(`/api/data?_t=${timestamp}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      console.warn('[ServerApi] Failed to fetch server data:', response.status);
      return null;
    }

    const result = await response.json();
    if (result && result.success && result.data) {
      return result.data as ServerDatabasePayload;
    }
    return null;
  } catch (error) {
    console.warn('[ServerApi] Network or offline error fetching server database:', error);
    return null;
  }
}

/**
 * Push specific key update to Firestore and server in background
 */
export async function syncKeyToServer(
  key:
    | 'profile'
    | 'members'
    | 'donors'
    | 'notices'
    | 'funds'
    | 'manualTotalBalance'
    | 'paymentConfig'
    | 'adminPin',
  value: any
): Promise<boolean> {
  try {
    // 1. Update directly in Firestore
    updateFirestoreKey(key, value).catch((e) => {
      console.warn(`[Firestore] Async update failed for ${key}:`, e);
    });

    // 2. Backup update in local server
    const response = await fetch(`/api/data/${key}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value })
    });

    if (!response.ok) {
      console.warn(`[ServerApi] Failed to sync ${key} to server:`, response.status);
      return false;
    }

    const result = await response.json();
    return Boolean(result && result.success);
  } catch (error) {
    console.warn(`[ServerApi] Error syncing ${key} to server:`, error);
    return false;
  }
}

/**
 * Reset server & Firestore database to default
 */
export async function resetServerDatabase(): Promise<boolean> {
  try {
    resetFirestoreData().catch(() => {});
    const response = await fetch('/api/data-action/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error resetting database:', e);
    return false;
  }
}

/**
 * Clear data collections in Firestore & server
 */
export async function clearServerDatabase(): Promise<boolean> {
  try {
    clearFirestoreData().catch(() => {});
    const response = await fetch('/api/data-action/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error clearing database:', e);
    return false;
  }
}
