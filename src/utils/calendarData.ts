import { toBengaliNumber } from './helpers';

export interface PublicHoliday {
  id: string;
  nameBn: string;
  nameEn: string;
  dateStr: string; // YYYY-MM-DD
  endDateStr?: string; // For multi-day holidays (e.g., Eid)
  dayNameBn: string;
  daysCount: number;
  type: 'general' | 'executive' | 'optional';
  typeLabelBn: string;
  category: 'national' | 'muslim' | 'hindu' | 'buddhist' | 'christian' | 'ethnic';
  categoryLabelBn: string;
  isMoonDependent?: boolean;
  description: string;
}

export interface BanglaDate {
  day: number;
  monthNameBn: string;
  year: number;
  seasonBn: string; // ঋতু
}

export interface HijriDate {
  day: number;
  monthNameBn: string;
  year: number;
}

export interface DayCalendarInfo {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  dayNameBn: string;
  dayNameShortBn: string;
  isWeekend: boolean; // Friday (5) or Saturday (6)
  bangla: BanglaDate;
  hijri: HijriDate;
  holidays: PublicHoliday[];
  isToday: boolean;
}

// 2026 Official Government Holidays in Bangladesh
export const BANGLADESH_HOLIDAYS_2026: PublicHoliday[] = [
  {
    id: 'h-1',
    nameBn: 'পবিত্র শবে বরাত',
    nameEn: 'Shab-e-Barat',
    dateStr: '2026-02-04',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র সৌভাগ্যের রজনী উপলক্ষে নির্বাহী আদেশে সরকারি ছুটি।',
  },
  {
    id: 'h-2',
    nameBn: 'শহীদ দিবস ও আন্তর্জাতিক মাতৃভাষা দিবস',
    nameEn: 'Shaheed Day & International Mother Language Day',
    dateStr: '2026-02-21',
    dayNameBn: 'শনিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৫২ সালের মহান ভাষা আন্দোলনের অমর শহীদদের স্মরণে জাতীয় শোক ও সাধারণ ছুটি।',
  },
  {
    id: 'h-3',
    nameBn: 'পবিত্র শবে কদর',
    nameEn: 'Shab-e-Qadr',
    dateStr: '2026-03-17',
    dayNameBn: 'মঙ্গলবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র লাইলাতুল কদর মহিমান্বিত রজনী উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-4',
    nameBn: 'জুমাতুল বিদা',
    nameEn: 'Jumatul Wida',
    dateStr: '2026-03-20',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র মাহে রমজানের শেষ জুমুয়াবার উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-5',
    nameBn: 'পবিত্র ঈদুল ফিতর (চাঁদ রাত ও ৩ দিনের ছুটি)',
    nameEn: 'Eid-ul-Fitr',
    dateStr: '2026-03-20',
    endDateStr: '2026-03-22',
    dayNameBn: 'শুক্রবার – রবিবার',
    daysCount: 3,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি ও নির্বাহী আদেশ',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ঈদুল ফিতর উপলক্ষে ৩ দিনের সরকারি ছুটি (ঈদের আগের দিন, ঈদের দিন ও ঈদের পরের দিন)।',
  },
  {
    id: 'h-6',
    nameBn: 'স্বাধীনতা ও জাতীয় দিবস',
    nameEn: 'Independence & National Day',
    dateStr: '2026-03-26',
    dayNameBn: 'বৃহস্পতিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭১ সালের মহান মুক্তিযুদ্ধের সূচনালগ্ন ও বাংলাদেশের স্বাধীনতা দিবস।',
  },
  {
    id: 'h-7',
    nameBn: 'বাংলা নববর্ষ (পহেলা বৈশাখ ১৪৩৩)',
    nameEn: 'Bengali New Year (Pahela Baishakh)',
    dateStr: '2026-04-14',
    dayNameBn: 'মঙ্গলবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় উৎসব',
    description: 'বাঙালির প্রাণের উৎসব বাংলা শুভ নববর্ষ ১৪৩৩ উদযাপন উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-8',
    nameBn: 'মে দিবস (আন্তর্জাতিক শ্রমিক দিবস)',
    nameEn: 'May Day',
    dateStr: '2026-05-01',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'আন্তর্জাতিক দিবস',
    description: 'আন্তর্জাতিক শ্রমিক দিবস ও অধিকার আদায়ের স্মরণে সাধারণ ছুটি।',
  },
  {
    id: 'h-9',
    nameBn: 'বুদ্ধ পূর্ণিমা (বৈশাখী পূর্ণিমা)',
    nameEn: 'Buddha Purnima',
    dateStr: '2026-05-02',
    dayNameBn: 'শনিবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'buddhist',
    categoryLabelBn: 'বৌদ্ধ পর্ব',
    isMoonDependent: true,
    description: 'গৌতম বুদ্ধের জন্ম, বোধিলাভ ও মহাপরিনির্বাণ তিথি উপলক্ষে সাধারণ ছুটি।',
  },
  {
    id: 'h-10',
    nameBn: 'পবিত্র ঈদুল আজহা (কোরবানির ঈদ ও ৩ দিনের ছুটি)',
    nameEn: 'Eid-ul-Adha',
    dateStr: '2026-05-27',
    endDateStr: '2026-05-29',
    dayNameBn: 'বুধবার – শুক্রবার',
    daysCount: 3,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি ও নির্বাহী আদেশ',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ঈদুল আজহা উপলক্ষে ৩ দিনের সরকারি ছুটি (ঈদের আগের দিন, ঈদের দিন ও ঈদের পরের দিন)।',
  },
  {
    id: 'h-11',
    nameBn: 'পবিত্র আশুরা (মহররম)',
    nameEn: 'Holy Ashura',
    dateStr: '2026-06-26',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'executive',
    typeLabelBn: 'নির্বাহী আদেশে ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'পবিত্র ১০ই মহররম কারবালার শোকাবহ স্মৃতি ও আশুরা উপলক্ষে সরকারি ছুটি।',
  },
  {
    id: 'h-12',
    nameBn: 'পবিত্র ঈদে মিলাদুন্নবী (সা.)',
    nameEn: 'Eid-e-Miladunnabi (PBUH)',
    dateStr: '2026-08-26',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'muslim',
    categoryLabelBn: 'মুসলিম পর্ব',
    isMoonDependent: true,
    description: 'সর্বকালের সর্বশ্রেষ্ঠ মানব হযরত মুহাম্মদ (সা.)-এর পবিত্র বেলাদত ও ওফাত দিবস।',
  },
  {
    id: 'h-13',
    nameBn: 'শ্রী শ্রী জন্মাষ্টমী',
    nameEn: 'Janmashtami',
    dateStr: '2026-09-04',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'ভগবান শ্রীকৃষ্ণের শুভ আবির্ভাব তিথি জন্মাষ্টমী উপলক্ষে সাধারণ ছুটি।',
  },
  {
    id: 'h-14',
    nameBn: 'শ্রী শ্রী দুর্গাপূজা (বিজয়া দশমী)',
    nameEn: 'Durga Puja (Bijoya Dashami)',
    dateStr: '2026-10-21',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'hindu',
    categoryLabelBn: 'হিন্দু পর্ব',
    description: 'সনাতন ধর্মাবলম্বীদের প্রধান ধর্মীয় উৎসব শারদীয় দুর্গাপূজার বিজয়া দশমী উপলক্ষে ছুটি।',
  },
  {
    id: 'h-15',
    nameBn: 'মহান বিজয় দিবস',
    nameEn: 'Victory Day',
    dateStr: '2026-12-16',
    dayNameBn: 'বুধবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'national',
    categoryLabelBn: 'জাতীয় দিবস',
    description: '১৯৭১ সালে নয় মাসের রক্তক্ষয়ী যুদ্ধের পর বিজয়ের স্মারক গৌরবময় জাতীয় বিজয় দিবস।',
  },
  {
    id: 'h-16',
    nameBn: 'যিশু খ্রিস্টের জন্মদিন (বড়দিন)',
    nameEn: 'Christmas Day',
    dateStr: '2026-12-25',
    dayNameBn: 'শুক্রবার',
    daysCount: 1,
    type: 'general',
    typeLabelBn: 'সাধারণ ছুটি',
    category: 'christian',
    categoryLabelBn: 'খ্রিস্টান পর্ব',
    description: 'খ্রিস্টধর্মাবলম্বীদের সর্বপ্রধান ধর্মীয় উৎসব শুভ বড়দিন উপলক্ষে সাধারণ ছুটি।',
  },
];

export const MONTH_NAMES_BN = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const DAY_NAMES_BN = [
  'রবিবার',
  'সোমবার',
  'মঙ্গলবার',
  'বুধবার',
  'বৃহস্পতিবার',
  'শুক্রবার',
  'শনিবার',
];

export const DAY_NAMES_SHORT_BN = [
  'রবি',
  'সোম',
  'মঙ্গল',
  'বুধ',
  'বৃহঃ',
  'শুক্র',
  'শনি',
];

// Helper to convert Gregorian Date to Bangla Date (Bangladesh Standard)
export function getBanglaDate(date: Date): BanglaDate {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const day = date.getDate();

  // Determine Bangla Year
  // Pahela Baishakh is on April 14
  let banglaYear = year - 593;
  if (month < 3 || (month === 3 && day < 14)) {
    banglaYear = year - 594;
  }

  let banglaMonth = '';
  let banglaDay = 1;
  let season = '';

  // Dates in Bangladesh calendar
  // 1. Boishakh (31 days): Apr 14 - May 14
  // 2. Jaishthe (31 days): May 15 - Jun 14
  // 3. Ashadh (31 days): Jun 15 - Jul 15
  // 4. Shraban (31 days): Jul 16 - Aug 15
  // 5. Bhadra (31 days): Aug 16 - Sep 15
  // 6. Ashwin (31 days): Sep 16 - Oct 16
  // 7. Kartik (30 days): Oct 17 - Nov 15
  // 8. Agrahayan (30 days): Nov 16 - Dec 15
  // 9. Poush (30 days): Dec 16 - Jan 14
  // 10. Magh (30 days): Jan 15 - Feb 13
  // 11. Falgun (29 days in non-leap): Feb 14 - Mar 14
  // 12. Chaitra (30 days): Mar 15 - Apr 13

  if (month === 0) {
    // January
    if (day <= 14) {
      banglaMonth = 'পৌষ';
      banglaDay = day + 16;
      season = 'শীতকাল';
    } else {
      banglaMonth = 'মাঘ';
      banglaDay = day - 14;
      season = 'শীতকাল';
    }
  } else if (month === 1) {
    // February
    if (day <= 13) {
      banglaMonth = 'মাঘ';
      banglaDay = day + 17;
      season = 'শীতকাল';
    } else {
      banglaMonth = 'ফাল্গুন';
      banglaDay = day - 13;
      season = 'বসন্তকাল';
    }
  } else if (month === 2) {
    // March
    if (day <= 14) {
      banglaMonth = 'ফাল্গুন';
      banglaDay = day + 15; // Feb 28 days -> Feb 14 = 1 Falgun, Feb 28 = 15 Falgun, Mar 1 = 16 Falgun
      season = 'বসন্তকাল';
    } else {
      banglaMonth = 'চৈত্র';
      banglaDay = day - 14;
      season = 'বসন্তকাল';
    }
  } else if (month === 3) {
    // April
    if (day <= 13) {
      banglaMonth = 'চৈত্র';
      banglaDay = day + 17;
      season = 'বসন্তকাল';
    } else {
      banglaMonth = 'বৈশাখ';
      banglaDay = day - 13;
      season = 'গ্রীষ্মকাল';
    }
  } else if (month === 4) {
    // May
    if (day <= 14) {
      banglaMonth = 'বৈশাখ';
      banglaDay = day + 17;
      season = 'গ্রীষ্মকাল';
    } else {
      banglaMonth = 'জ্যৈষ্ঠ';
      banglaDay = day - 14;
      season = 'গ্রীষ্মকাল';
    }
  } else if (month === 5) {
    // June
    if (day <= 14) {
      banglaMonth = 'জ্যৈষ্ঠ';
      banglaDay = day + 17;
      season = 'গ্রীষ্মকাল';
    } else {
      banglaMonth = 'আষাঢ়';
      banglaDay = day - 14;
      season = 'বর্ষাকাল';
    }
  } else if (month === 6) {
    // July
    if (day <= 15) {
      banglaMonth = 'আষাঢ়';
      banglaDay = day + 16;
      season = 'বর্ষাকাল';
    } else {
      banglaMonth = 'শ্রাবণ';
      banglaDay = day - 15;
      season = 'বর্ষাকাল';
    }
  } else if (month === 7) {
    // August
    if (day <= 15) {
      banglaMonth = 'শ্রাবণ';
      banglaDay = day + 16;
      season = 'বর্ষাকাল';
    } else {
      banglaMonth = 'ভাদ্র';
      banglaDay = day - 15;
      season = 'শরৎকাল';
    }
  } else if (month === 8) {
    // September
    if (day <= 15) {
      banglaMonth = 'ভাদ্র';
      banglaDay = day + 16;
      season = 'শরৎকাল';
    } else {
      banglaMonth = 'আশ্বিন';
      banglaDay = day - 15;
      season = 'শরৎকাল';
    }
  } else if (month === 9) {
    // October
    if (day <= 16) {
      banglaMonth = 'আশ্বিন';
      banglaDay = day + 15;
      season = 'শরৎকাল';
    } else {
      banglaMonth = 'কার্তিক';
      banglaDay = day - 16;
      season = 'হেমন্তকাল';
    }
  } else if (month === 10) {
    // November
    if (day <= 15) {
      banglaMonth = 'কার্তিক';
      banglaDay = day + 15;
      season = 'হেমন্তকাল';
    } else {
      banglaMonth = 'অগ্রহায়ণ';
      banglaDay = day - 15;
      season = 'হেমন্তকাল';
    }
  } else if (month === 11) {
    // December
    if (day <= 15) {
      banglaMonth = 'অগ্রহায়ণ';
      banglaDay = day + 15;
      season = 'হেমন্তকাল';
    } else {
      banglaMonth = 'পৌষ';
      banglaDay = day - 15;
      season = 'শীতকাল';
    }
  }

  return {
    day: banglaDay,
    monthNameBn: banglaMonth,
    year: banglaYear,
    seasonBn: season,
  };
}

// Helper to convert Gregorian Date to Hijri Date for 2026
export function getHijriDate(date: Date): HijriDate {
  // Approximate Hijri mapping for 2026 (1447 - 1448 AH) in Bangladesh (Islamic Foundation standard)
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  // Format: YYYY-MM-DD
  const curTime = new Date(y, m, d).getTime();

  // Key Hijri Month start boundaries in 2026:
  // Jan 1: 11 Rajab 1447
  // Jan 20: 1 Sha'ban 1447
  // Feb 18: 1 Ramadan 1447
  // Mar 20: 1 Shawwal 1447
  // Apr 19: 1 Dhul Qa'dah 1447
  // May 18: 1 Dhul Hijjah 1447
  // Jun 17: 1 Muharram 1448
  // Jul 17: 1 Safar 1448
  // Aug 15: 1 Rabi' al-Awwal 1448
  // Sep 14: 1 Rabi' al-Thani 1448
  // Oct 13: 1 Jumada al-Awwal 1448
  // Nov 12: 1 Jumada al-Thani 1448
  // Dec 11: 1 Rajab 1448

  const milestones: { startDate: string; monthNameBn: string; year: number }[] = [
    { startDate: '2025-12-21', monthNameBn: 'রজব', year: 1447 },
    { startDate: '2026-01-20', monthNameBn: 'শাবান', year: 1447 },
    { startDate: '2026-02-18', monthNameBn: 'রমজান', year: 1447 },
    { startDate: '2026-03-20', monthNameBn: 'শাওয়াল', year: 1447 },
    { startDate: '2026-04-19', monthNameBn: 'জিলকদ', year: 1447 },
    { startDate: '2026-05-18', monthNameBn: 'জিলহজ', year: 1447 },
    { startDate: '2026-06-17', monthNameBn: 'মহররম', year: 1448 },
    { startDate: '2026-07-17', monthNameBn: 'সফর', year: 1448 },
    { startDate: '2026-08-15', monthNameBn: 'রবিউল আউয়াল', year: 1448 },
    { startDate: '2026-09-14', monthNameBn: 'রবিউস সানি', year: 1448 },
    { startDate: '2026-10-13', monthNameBn: 'জমাদিউল আউয়াল', year: 1448 },
    { startDate: '2026-11-12', monthNameBn: 'জমাদিউস সানি', year: 1448 },
    { startDate: '2026-12-11', monthNameBn: 'রজব', year: 1448 },
  ];

  let currentMilestone = milestones[0];
  for (let i = 0; i < milestones.length; i++) {
    const mDate = new Date(milestones[i].startDate).getTime();
    if (curTime >= mDate) {
      currentMilestone = milestones[i];
    }
  }

  const startMs = new Date(currentMilestone.startDate).getTime();
  const diffDays = Math.floor((curTime - startMs) / (1000 * 60 * 60 * 24)) + 1;

  return {
    day: Math.max(1, Math.min(30, diffDays)),
    monthNameBn: currentMilestone.monthNameBn,
    year: currentMilestone.year,
  };
}

// Generate calendar cells for a given year & month (0-indexed month)
export function getMonthDaysInfo(year: number, monthIndex: number): DayCalendarInfo[] {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const days: DayCalendarInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d);
    const dayOfWeek = date.getDay(); // 0 = Sun, ..., 5 = Fri, 6 = Sat
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Find matching holidays
    const holidays = BANGLADESH_HOLIDAYS_2026.filter((h) => {
      if (h.endDateStr) {
        return dateStr >= h.dateStr && dateStr <= h.endDateStr;
      }
      return h.dateStr === dateStr;
    });

    const bangla = getBanglaDate(date);
    const hijri = getHijriDate(date);

    days.push({
      date,
      dateStr,
      dayOfMonth: d,
      dayOfWeek,
      dayNameBn: DAY_NAMES_BN[dayOfWeek],
      dayNameShortBn: DAY_NAMES_SHORT_BN[dayOfWeek],
      isWeekend: dayOfWeek === 5 || dayOfWeek === 6, // Fri & Sat are weekends in Bangladesh
      bangla,
      hijri,
      holidays,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

// Format full Bangla and English date for display
export function getFullDateSummary(date: Date = new Date()): {
  englishFormatted: string;
  banglaFormatted: string;
  hijriFormatted: string;
  dayName: string;
  season: string;
} {
  const d = date.getDate();
  const m = date.getMonth();
  const y = date.getFullYear();
  const dayOfWeek = date.getDay();

  const bangla = getBanglaDate(date);
  const hijri = getHijriDate(date);

  const englishFormatted = `${toBengaliNumber(d)} ${MONTH_NAMES_BN[m]}, ${toBengaliNumber(y)}ইং`;
  const banglaFormatted = `${toBengaliNumber(bangla.day)} ${bangla.monthNameBn}, ${toBengaliNumber(bangla.year)} বঙ্গাব্দ`;
  const hijriFormatted = `${toBengaliNumber(hijri.day)} ${hijri.monthNameBn}, ${toBengaliNumber(hijri.year)} হিজরি`;

  return {
    englishFormatted,
    banglaFormatted,
    hijriFormatted,
    dayName: DAY_NAMES_BN[dayOfWeek],
    season: bangla.seasonBn,
  };
}
