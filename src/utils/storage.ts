import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile, PaymentGatewayConfig } from '../types';
import { INITIAL_MEMBERS, INITIAL_DONORS, INITIAL_NOTICES, INITIAL_FUNDS, INITIAL_ORG_PROFILE } from '../data/initialData';

const STORAGE_KEYS = {
  PROFILE: 'pms_profile_v2',
  MEMBERS: 'pms_members_v2',
  DONORS: 'pms_donors_v2',
  NOTICES: 'pms_notices_v2',
  FUNDS: 'pms_funds_v2',
  TOTAL_ORG_BALANCE: 'pms_total_org_balance_v2',
  ADMIN_PIN: 'pms_admin_pin_v2',
  PAYMENT_SETTINGS: 'pms_payment_settings_v2',
};

// Admin PIN normalization and verification
export function normalizePin(pin: string): string {
  if (!pin) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let res = pin.trim();
  for (let i = 0; i < 10; i++) {
    res = res.split(banglaDigits[i]).join(i.toString());
  }
  return res;
}

export function getAdminPin(): string {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '1234';
}

export function setAdminPin(pin: string): void {
  const cleanPin = pin.trim();
  localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, cleanPin);
}

export function verifyAdminPin(inputPin: string): boolean {
  const cleanInput = inputPin.trim();
  if (!cleanInput) return false;
  const currentPin = getAdminPin().trim();

  // Direct match
  if (cleanInput === currentPin) return true;

  // Normalized numeral match (e.g. '১২৩৪' vs '1234')
  const normInput = normalizePin(cleanInput);
  const normCurrent = normalizePin(currentPin);
  if (normInput === normCurrent) return true;

  // Default fallbacks if pin hasn't been changed
  if (normCurrent === '1234' && (normInput === '1234' || cleanInput.toLowerCase() === 'admin123')) {
    return true;
  }

  return false;
}

// Organization Profile
export function loadOrgProfile(): OrganizationProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    if (saved) {
      const parsed: OrganizationProfile = JSON.parse(saved);
      if (!parsed.name || parsed.name === 'মানব সেবা সংগঠন' || parsed.name === 'পতেঙ্গা মানব সেবা সংগঠন' || parsed.name === 'সিলেট মানব সেবা সংঘঠন') {
        parsed.name = 'সিলেট মানব সেবা সংগঠন';
      }
      if (!parsed.establishedDate) {
        parsed.establishedDate = '১৫/০৮/২০২২ইং';
      }
      if (!parsed.establishedYear) {
        parsed.establishedYear = '২০২২';
      }
      return parsed;
    }
  } catch (e) {
    console.error('Error loading org profile', e);
  }
  return INITIAL_ORG_PROFILE;
}

export function saveOrgProfile(profile: OrganizationProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving org profile', e);
  }
}

// Members
export function loadMembers(): Member[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading members', e);
  }
  return INITIAL_MEMBERS;
}

export function saveMembers(members: Member[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (e) {
    console.error('Error saving members', e);
  }
}

// Donors
export function loadDonors(): BloodDonor[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DONORS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading donors', e);
  }
  return INITIAL_DONORS;
}

export function saveDonors(donors: BloodDonor[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify(donors));
  } catch (e) {
    console.error('Error saving donors', e);
  }
}

// Notices
export function loadNotices(): Notice[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading notices', e);
  }
  return INITIAL_NOTICES;
}

export function saveNotices(notices: Notice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(notices));
  } catch (e) {
    console.error('Error saving notices', e);
  }
}

// Funds
export function loadFunds(): FundRecord[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FUNDS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading funds', e);
  }
  return INITIAL_FUNDS;
}

export function saveFunds(funds: FundRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(funds));
  } catch (e) {
    console.error('Error saving funds', e);
  }
}

// Manual Total Organization Balance
export function loadManualTotalBalance(): number | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
    if (saved !== null && saved !== '') {
      const parsed = Number(saved);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading manual total balance', e);
  }
  return null;
}

export function saveManualTotalBalance(amount: number | null): void {
  try {
    if (amount === null) {
      localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
    } else {
      localStorage.setItem(STORAGE_KEYS.TOTAL_ORG_BALANCE, amount.toString());
    }
  } catch (e) {
    console.error('Error saving manual total balance', e);
  }
}

// Payment Gateway Settings (Dynamic Admin Configured, no hardcoding)
export function loadPaymentSettings(): PaymentGatewayConfig {
  const defaults: PaymentGatewayConfig = {
    bkashNumber: '',
    bkashType: 'Personal',
    bkashInstruction: 'বিকাশ অ্যাপ বা *247# ডায়াল করে Send Money করুন',
    nagadNumber: '',
    nagadType: 'Personal',
    nagadInstruction: 'নগদ অ্যাপ বা *167# ডায়াল করে Send Money করুন',
    rocketNumber: '',
    rocketType: 'Personal',
    rocketInstruction: 'রকেট অ্যাপ বা *322# ডায়াল করে Send Money করুন',
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaults,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Error loading payment settings', e);
  }
  return defaults;
}

export function savePaymentSettings(settings: PaymentGatewayConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving payment settings', e);
  }
}

// Reset all data to default initial state
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
  localStorage.removeItem(STORAGE_KEYS.MEMBERS);
  localStorage.removeItem(STORAGE_KEYS.DONORS);
  localStorage.removeItem(STORAGE_KEYS.NOTICES);
  localStorage.removeItem(STORAGE_KEYS.FUNDS);
  localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
}

// Clear all data to empty
export function clearAllData(): void {
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.DONORS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify([]));
  localStorage.removeItem(STORAGE_KEYS.TOTAL_ORG_BALANCE);
}

// Export CSV for any data category
export function exportSheetCSV(type: 'members' | 'donors' | 'notices' | 'fund' | 'expenses'): void {
  let headers = '';
  let rows: string[] = [];
  let filename = '';

  if (type === 'members') {
    headers = 'Name,Designation,Phone,BloodGroup,Area';
    const members = loadMembers();
    rows = members.map(m => `"${m.name}","${m.designation}","${m.phone}","${m.bloodGroup || ''}","${m.area || ''}"`);
    filename = 'Members_Sylhet_Manob_Seba.csv';
  } else if (type === 'donors') {
    headers = 'Name,Phone,BloodGroup,LastDonationDate,NextEligibleDate,Area';
    const donors = loadDonors();
    rows = donors.map(d => `"${d.name}","${d.phone}","${d.bloodGroup}","${d.lastDonationDate || ''}","${d.nextEligibleDate || ''}","${d.area || ''}"`);
    filename = 'BloodDonors_Sylhet_Manob_Seba.csv';
  } else if (type === 'notices') {
    headers = 'Date,Title,NoticeText,Priority';
    const notices = loadNotices();
    rows = notices.map(n => `"${n.date}","${(n.title || '').replace(/"/g, '""')}","${n.noticeText.replace(/"/g, '""')}","${n.priority || ''}"`);
    filename = 'Notices_Sylhet_Manob_Seba.csv';
  } else if (type === 'expenses') {
    headers = 'Date,Particulars_Reason,DisbursedTo,Amount,Category,Notes_Voucher';
    const funds = loadFunds();
    const expenses = funds.filter(f => f.status === 'Expense');
    rows = expenses.map(e => `"${e.date || ''}","${(e.description || '').replace(/"/g, '""')}","${e.disbursedTo || e.memberName}","${e.amount}","${e.category || ''}","${(e.notes || '').replace(/"/g, '""')}"`);
    filename = 'ExpenseBreakdown_Sylhet_Manob_Seba.csv';
  } else if (type === 'fund') {
    headers = 'TotalBalance,MemberName,Status,Amount,Month,Date,TrxID,Notes';
    const funds = loadFunds();
    const manualBal = loadManualTotalBalance();
    const calculatedTotal = funds.filter(f => f.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
    const totalBalance = manualBal !== null ? manualBal : calculatedTotal;
    rows = funds.map(f => `"${totalBalance}","${f.memberName}","${f.status}","${f.amount}","${f.month || ''}","${f.date || ''}","${f.trxId || ''}","${(f.notes || '').replace(/"/g, '""')}"`);
    filename = 'Fund_Sylhet_Manob_Seba.csv';
  }

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
