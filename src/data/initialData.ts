import { Member, BloodDonor, Notice, FundRecord, OrganizationProfile } from '../types';

export const INITIAL_ORG_PROFILE: OrganizationProfile = {
  name: 'সিলেট মানব সেবা সংগঠন',
  tagline: 'মানবতার কল্যাণে নিবেদিত প্রাণ',
  establishedDate: '১৫/০৮/২০২২ইং',
  establishedYear: '২০২২',
  address: 'পতেঙ্গা, চট্টগ্রাম',
  hotline: '',
  emergencyContact: '',
  regNumber: '২০২২/০৮',
  phone: ''
};

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_DONORS: BloodDonor[] = [];

export const INITIAL_NOTICES: Notice[] = [];

export const INITIAL_FUNDS: FundRecord[] = [];
