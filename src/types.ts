export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type PaymentStatus = 'Paid' | 'Due' | 'Expense';

export type ActiveScreen = 'home' | 'members' | 'blood' | 'notices' | 'fund' | 'admin';

export interface Member {
  id: string;
  name: string; // Name
  designation: string; // Designation
  phone: string; // Phone
  bloodGroup: BloodGroup; // BloodGroup
  area?: string;
  joinDate?: string;
  email?: string;
  status?: 'সক্রিয়' | 'স্থগিত';
}

export interface BloodDonor {
  id: string;
  name: string; // Name
  phone: string; // Phone
  bloodGroup: BloodGroup; // BloodGroup
  lastDonationDate: string; // LastDonationDate (YYYY-MM-DD)
  nextEligibleDate: string; // NextEligibleDate (YYYY-MM-DD)
  area?: string;
  totalDonations?: number;
  notes?: string;
}

export interface Notice {
  id: string;
  date: string; // Date
  noticeText: string; // NoticeText
  title?: string;
  category?: 'জরুরি' | 'সাধারণ' | 'কার্যক্রম' | 'রক্তদান' | string;
  priority?: 'জরুরি' | 'সাধারণ' | 'মিটিং' | 'রক্তদান' | 'ত্রাণ';
  isPinned?: boolean;
}

export interface FundRecord {
  id: string;
  memberName: string; // MemberName or Particular
  amount: number;
  status: PaymentStatus; // Status (Paid / Due / Expense)
  type?: 'income' | 'expense'; // Income / Expense
  totalBalance?: number; // TotalBalance column header support
  date: string;
  description?: string;
  month?: string;
  phone?: string;
  category?: string;
  notes?: string;
}

export interface OrganizationProfile {
  name: string;
  tagline: string;
  address: string;
  establishedDate?: string;
  establishedYear?: string;
  phone?: string;
  hotline?: string;
  emergencyContact?: string;
  regNumber?: string;
  email?: string;
}

export interface OrganizationStats {
  totalMembers: number;
  totalDonors: number;
  readyDonors: number;
  totalFundBalance: number;
  totalPaidAmount: number;
  totalDueAmount: number;
  totalExpenses?: number;
  activeNotices: number;
}
