export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export type PaymentStatus = 'Paid' | 'Due' | 'Expense' | 'Pending';

export type ActiveScreen = 'home' | 'members' | 'blood' | 'notices' | 'fund' | 'calendar' | 'admin';

export interface Member {
  id: string;
  name: string; // Name
  designation: string; // Designation
  phone: string; // Phone
  bloodGroup?: BloodGroup; // BloodGroup (optional)
  area?: string;
  photoUrl?: string; // Photo URL
  joinDate?: string;
  email?: string;
  status?: 'সক্রিয়' | 'স্থগিত';
}

export interface PaymentGatewayConfig {
  bkashNumber: string;
  bkashType: 'Personal' | 'Merchant' | 'Agent';
  bkashInstruction?: string;
  bkashInstructions?: string;
  nagadNumber: string;
  nagadType: 'Personal' | 'Merchant' | 'Agent';
  nagadInstruction?: string;
  nagadInstructions?: string;
  rocketNumber: string;
  rocketType: 'Personal' | 'Merchant' | 'Agent';
  rocketInstruction?: string;
  rocketInstructions?: string;
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
  memberName: string; // MemberName, Donor, or Expense Particular
  amount: number;
  status: PaymentStatus; // Status (Paid / Due / Expense / Pending)
  type?: 'income' | 'expense'; // Income / Expense
  totalBalance?: number; // TotalBalance column header support
  date: string;
  description?: string; // Particulars / Expense reason
  month?: string;
  phone?: string;
  category?: string;
  notes?: string;
  trxId?: string; // Transaction ID for verification
  senderPhone?: string; // Sender mobile number
  gateway?: string; // bKash / Nagad / Rocket
  disbursedTo?: string; // Person in charge / Disbursed to for expenses
  approvedAt?: string; // Timestamp when approved by admin
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
  logoUrl?: string;
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
