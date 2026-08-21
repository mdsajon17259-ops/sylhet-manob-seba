import { BloodDonor, BloodGroup } from '../types';

// Convert English numerals to Bengali
export function toBengaliNumber(num: number | string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
}

// Format Bangladeshi Taka
export function formatTaka(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN').format(amount);
  return `৳ ${toBengaliNumber(formatted)}`;
}

export const toBengaliCurrency = formatTaka;

// Calculate Next Eligible Donation Date (+90 days from last donation date)
export function calculateNextEligibleDate(lastDateStr: string): string {
  if (!lastDateStr) return '';
  try {
    const date = new Date(lastDateStr);
    if (isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// Check if donor is currently eligible
export function isDonorEligible(donor: BloodDonor): { eligible: boolean; daysRemaining: number } {
  if (!donor.lastDonationDate) {
    return { eligible: true, daysRemaining: 0 };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eligibleDate = donor.nextEligibleDate 
    ? new Date(donor.nextEligibleDate) 
    : new Date(calculateNextEligibleDate(donor.lastDonationDate));
  
  eligibleDate.setHours(0, 0, 0, 0);

  if (isNaN(eligibleDate.getTime())) {
    return { eligible: true, daysRemaining: 0 };
  }

  const diffTime = eligibleDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return { eligible: true, daysRemaining: 0 };
  }
  return { eligible: false, daysRemaining: diffDays };
}

// Format date to Bengali readable string
export function formatBengaliDate(dateStr?: string): string {
  if (!dateStr) return 'নির্ধারিত নয়';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = toBengaliNumber(parts[0]);
      const monthNum = parseInt(parts[1], 10);
      const day = toBengaliNumber(parts[2]);
      
      const months = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const monthName = months[monthNum - 1] || parts[1];
      return `${day} ${monthName}, ${year}`;
    }
    return toBengaliNumber(dateStr);
  } catch {
    return toBengaliNumber(dateStr);
  }
}

// Get Blood Group Color Badge Styling
export function getBloodGroupBadge(group: BloodGroup): { bg: string; text: string; border: string } {
  switch (group) {
    case 'A+':
    case 'A-':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'B+':
    case 'B-':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'O+':
    case 'O-':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    case 'AB+':
    case 'AB-':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

// Clean phone number for tel: or wa.me links
export function sanitizePhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+88' + cleaned;
  }
  return cleaned;
}
