// Server API synchronization client for persistent cloud/container storage
import {
  Member,
  BloodDonor,
  Notice,
  FundRecord,
  OrganizationProfile,
  PaymentGatewayConfig
} from '../types';

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
 * Fetch full persisted database state from the server
 */
export async function fetchServerDatabase(): Promise<ServerDatabasePayload | null> {
  try {
    const response = await fetch('/api/data', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
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
 * Push specific key update to the server in background
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
 * Push full dataset to server
 */
export async function syncFullToServer(data: ServerDatabasePayload): Promise<boolean> {
  try {
    const response = await fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.warn('[ServerApi] Failed to sync full database to server:', response.status);
      return false;
    }

    const result = await response.json();
    return Boolean(result && result.success);
  } catch (error) {
    console.warn('[ServerApi] Error syncing full database to server:', error);
    return false;
  }
}

/**
 * Reset server database to default
 */
export async function resetServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error resetting server database:', e);
    return false;
  }
}

/**
 * Clear server data collections
 */
export async function clearServerDatabase(): Promise<boolean> {
  try {
    const response = await fetch('/api/data-action/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (e) {
    console.warn('[ServerApi] Error clearing server database:', e);
    return false;
  }
}
