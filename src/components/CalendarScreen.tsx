import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ArrowLeft, 
  Sun, 
  Moon, 
  Clock, 
  CheckCircle2, 
  Tag, 
  Info,
  CalendarCheck,
  CalendarDays,
  Flame,
  Globe,
  MapPin
} from 'lucide-react';
import { 
  BANGLADESH_HOLIDAYS_2026, 
  MONTH_NAMES_BN, 
  MONTH_NAMES_EN, 
  DAY_NAMES_SHORT_BN, 
  DAY_NAMES_BN,
  getMonthDaysInfo, 
  getFullDateSummary, 
  getBanglaDate, 
  getHijriDate, 
  PublicHoliday, 
  DayCalendarInfo 
} from '../utils/calendarData';
import { toBengaliNumber } from '../utils/helpers';

interface CalendarScreenProps {
  onBack: () => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ onBack }) => {
  // Current real date (or 2026 date context)
  const realDate = useMemo(() => new Date(), []);
  
  // Year is fixed to 2026 as per user requirement, default month to current month in 2026
  const [selectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const m = realDate.getMonth();
    return Math.min(11, Math.max(0, m));
  });

  // Selected Day for Detail Modal / Inspector
  const [selectedDayInfo, setSelectedDayInfo] = useState<DayCalendarInfo | null>(null);

  // Holiday Tab Filter: 'all' | 'general' | 'executive' | 'upcoming'
  const [holidayFilter, setHolidayFilter] = useState<'all' | 'general' | 'executive' | 'upcoming'>('all');

  // Month filter for holiday list
  const [selectedHolidayMonth, setSelectedHolidayMonth] = useState<number | 'all'>('all');

  // Days for the selected month
  const monthDays = useMemo(() => {
    return getMonthDaysInfo(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // First day offset (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOffset = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    return firstDay.getDay();
  }, [selectedYear, selectedMonth]);

  // Today's summary
  const todaySummary = useMemo(() => {
    return getFullDateSummary(realDate);
  }, [realDate]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth > 0) {
      setSelectedMonth(selectedMonth - 1);
    } else {
      setSelectedMonth(11);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth < 11) {
      setSelectedMonth(selectedMonth + 1);
    } else {
      setSelectedMonth(0);
    }
  };

  const handleGoToCurrentMonth = () => {
    setSelectedMonth(realDate.getMonth());
  };

  // Filtered Holidays
  const filteredHolidays = useMemo(() => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    
    return BANGLADESH_HOLIDAYS_2026.filter((holiday) => {
      // Month filter
      if (selectedHolidayMonth !== 'all') {
        const holidayMonth = parseInt(holiday.dateStr.split('-')[1], 10) - 1;
        if (holidayMonth !== selectedHolidayMonth) return false;
      }

      // Type filter
      if (holidayFilter === 'general') {
        return holiday.type === 'general';
      }
      if (holidayFilter === 'executive') {
        return holiday.type === 'executive';
      }
      if (holidayFilter === 'upcoming') {
        const endDate = holiday.endDateStr || holiday.dateStr;
        return endDate >= todayStr;
      }
      return true;
    });
  }, [holidayFilter, selectedHolidayMonth, realDate]);

  // Upcoming holiday highlight
  const nextUpcomingHoliday = useMemo(() => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    return BANGLADESH_HOLIDAYS_2026.find((h) => (h.endDateStr || h.dateStr) >= todayStr) || BANGLADESH_HOLIDAYS_2026[0];
  }, [realDate]);

  // Helper for days remaining
  const getDaysRemainingText = (dateStr: string, endDateStr?: string) => {
    const todayStr = `${realDate.getFullYear()}-${String(realDate.getMonth() + 1).padStart(2, '0')}-${String(realDate.getDate()).padStart(2, '0')}`;
    const todayMs = new Date(todayStr).getTime();
    const targetMs = new Date(dateStr).getTime();
    const endMs = endDateStr ? new Date(endDateStr).getTime() : targetMs;

    if (todayMs >= targetMs && todayMs <= endMs) {
      return { text: 'আজ ছুটি চলছে', status: 'today' };
    }

    const diffDays = Math.ceil((targetMs - todayMs) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: 'অতিক্রান্ত', status: 'past' };
    }
    if (diffDays === 1) {
      return { text: 'আগামীকাল', status: 'tomorrow' };
    }
    return { text: `আর ${toBengaliNumber(diffDays)} দিন বাকি`, status: 'future' };
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            onClick={onBack}
            id="calendar-back-btn"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex-shrink-0"
            title="হোমে ফিরে যান"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                বাংলাদেশ সরকারি ক্যালেন্ডার ২০২৬
              </span>
              <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                ১৪৩২–১৪৩৩ বঙ্গাব্দ
              </span>
              <span className="bg-teal-50 text-teal-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                ১০০% অফলাইন কার্যকর
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
              ক্যালেন্ডার ও সরকারি ছুটি ২০২৬
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              ইংরেজি, বাংলা ও আরবি হিজরি সন-তারিখ সমন্বিত পূর্ণাঙ্গ ক্যালেন্ডার ও ছুটির তালিকা
            </p>
          </div>
        </div>

        {/* Live Today Summary Chip */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white p-3.5 rounded-2xl shadow-xs border border-emerald-700 flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider flex items-center justify-end gap-1">
              <Clock className="w-3 h-3 text-amber-300" />
              <span>আজকের তারিখ ({todaySummary.dayName})</span>
            </div>
            <div className="text-sm font-black text-white mt-0.5">
              {todaySummary.englishFormatted}
            </div>
            <div className="text-[11px] text-amber-200 font-bold mt-0.5">
              {todaySummary.banglaFormatted} • {todaySummary.hijriFormatted}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 font-bold text-lg flex-shrink-0">
            {toBengaliNumber(realDate.getDate())}
          </div>
        </div>
      </div>

      {/* SECTION 1: ক্যলেন্ডার (CALENDAR DISPLAY) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Section Header & Month Navigator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>১. ক্যালেন্ডার (Calendar)</span>
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  ইংরেজি • বাংলা • হিজরি
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              প্রতিটি তারিখে ইংরেজি তারিখের সাথে বাংলা ও হিজরি তারিখ প্রদর্শিত রয়েছে
            </p>
          </div>

          {/* Month Navigator Controls */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              id="calendar-prev-month-btn"
              className="p-2 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs border border-slate-200 transition cursor-pointer"
              title="পূর্ববর্তী মাস"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3 text-center min-w-[150px]">
              <span className="block text-sm font-black text-slate-900">
                {MONTH_NAMES_BN[selectedMonth]} {toBengaliNumber(selectedYear)}
              </span>
              <span className="block text-[10px] text-slate-500 font-medium">
                {MONTH_NAMES_EN[selectedMonth]} {selectedYear}
              </span>
            </div>

            <button
              onClick={handleNextMonth}
              id="calendar-next-month-btn"
              className="p-2 rounded-xl bg-white hover:bg-slate-200/80 text-slate-700 shadow-2xs border border-slate-200 transition cursor-pointer"
              title="পরবর্তী মাস"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleGoToCurrentMonth}
              id="calendar-current-month-btn"
              className="ml-1 px-2.5 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl transition cursor-pointer"
              title="বর্তমান মাসে যান"
            >
              চলতি মাস
            </button>
          </div>
        </div>

        {/* Quick Month Bar Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {MONTH_NAMES_BN.map((name, idx) => {
            const isSelected = selectedMonth === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedMonth(idx)}
                id={`calendar-month-pill-${idx}`}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Calendar Grid Container */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-2.5 sm:p-4 overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {DAY_NAMES_SHORT_BN.map((dayName, idx) => {
              const isWeekendHeader = idx === 5 || idx === 6; // Fri or Sat
              return (
                <div
                  key={idx}
                  className={`py-2 text-xs font-bold rounded-xl ${
                    isWeekendHeader
                      ? 'bg-rose-100/80 text-rose-700 border border-rose-200/70'
                      : 'bg-white text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <span className="hidden sm:inline">{DAY_NAMES_BN[idx]}</span>
                  <span className="sm:hidden">{dayName}</span>
                </div>
              );
            })}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty offset spaces before 1st of the month */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="min-h-[70px] sm:min-h-[90px] rounded-xl bg-slate-100/40 border border-dashed border-slate-200/50 opacity-40"
              />
            ))}

            {/* Month Days */}
            {monthDays.map((dayInfo) => {
              const hasHoliday = dayInfo.holidays.length > 0;
              const isSelected = selectedDayInfo?.dateStr === dayInfo.dateStr;

              return (
                <div
                  key={dayInfo.dateStr}
                  onClick={() => setSelectedDayInfo(dayInfo)}
                  id={`calendar-day-${dayInfo.dateStr}`}
                  className={`group relative min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected
                      ? 'ring-2 ring-emerald-600 bg-emerald-50/90 border-emerald-300 shadow-xs'
                      : dayInfo.isToday
                      ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/80 shadow-xs'
                      : hasHoliday
                      ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80'
                      : dayInfo.isWeekend
                      ? 'bg-slate-100/90 border-slate-200/90 hover:bg-slate-200/70'
                      : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 shadow-2xs'
                  }`}
                >
                  {/* Top Header in Cell: English Date & Holiday Indicator */}
                  <div className="flex items-start justify-between w-full">
                    <span
                      className={`text-sm sm:text-base font-black leading-none ${
                        dayInfo.isToday
                          ? 'text-amber-900 bg-amber-200/80 px-1.5 py-0.5 rounded-md'
                          : hasHoliday
                          ? 'text-rose-700'
                          : dayInfo.isWeekend
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {toBengaliNumber(dayInfo.dayOfMonth)}
                    </span>

                    {/* Holiday badge or Today marker */}
                    {dayInfo.isToday ? (
                      <span className="text-[9px] font-bold bg-amber-500 text-white px-1 rounded-sm leading-tight">
                        আজ
                      </span>
                    ) : hasHoliday ? (
                      <span
                        className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0 animate-pulse"
                        title={dayInfo.holidays[0].nameBn}
                      />
                    ) : null}
                  </div>

                  {/* Holiday title tag if any (visible on desktop or small text) */}
                  {hasHoliday && (
                    <div className="my-0.5 hidden sm:block truncate">
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100/80 px-1 rounded block truncate">
                        {dayInfo.holidays[0].nameBn}
                      </span>
                    </div>
                  )}

                  {/* Bottom Footer in Cell: Bangla Date & Hijri Date */}
                  <div className="mt-auto pt-1 border-t border-slate-200/60 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
                    <span className="text-emerald-800 font-bold truncate">
                      {toBengaliNumber(dayInfo.bangla.day)} {dayInfo.bangla.monthNameBn}
                    </span>
                    <span className="text-teal-700 font-medium hidden sm:inline truncate">
                      {toBengaliNumber(dayInfo.hijri.day)} {dayInfo.hijri.monthNameBn}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend / Info guide */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-amber-100 border-2 border-amber-400"></span>
              <span className="font-semibold text-amber-900">আজকের দিন</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-rose-100 border border-rose-300"></span>
              <span className="font-semibold text-rose-800">সরকারি ছুটি</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-slate-100 border border-slate-300"></span>
              <span className="font-semibold text-slate-700">সাপ্তাহিক ছুটি (শুক্র ও শনি)</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400">
            * যে কোনো তারিখে ক্লিক করে বিস্তারিত তথ্য দেখুন
          </span>
        </div>

        {/* Date Detail Banner if a date is selected */}
        {selectedDayInfo && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex flex-col items-center justify-center flex-shrink-0 shadow-xs">
                  <span className="text-xs font-semibold leading-none">{selectedDayInfo.dayNameShortBn}</span>
                  <span className="text-lg font-black leading-none mt-0.5">{toBengaliNumber(selectedDayInfo.dayOfMonth)}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-base font-bold text-slate-900">
                      {toBengaliNumber(selectedDayInfo.dayOfMonth)} {MONTH_NAMES_BN[selectedDayInfo.date.getMonth()]}, {toBengaliNumber(selectedDayInfo.date.getFullYear())} ({selectedDayInfo.dayNameBn})
                    </h4>
                    {selectedDayInfo.isToday && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        আজকের তারিখ
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-1 text-xs text-slate-700">
                    <div>
                      <span className="font-bold text-emerald-800">বাংলা তারিখ: </span>
                      <span>{toBengaliNumber(selectedDayInfo.bangla.day)} {selectedDayInfo.bangla.monthNameBn}, {toBengaliNumber(selectedDayInfo.bangla.year)} বঙ্গাব্দ ({selectedDayInfo.bangla.seasonBn})</span>
                    </div>
                    <div>
                      <span className="font-bold text-teal-800">হিজরি তারিখ: </span>
                      <span>{toBengaliNumber(selectedDayInfo.hijri.day)} {selectedDayInfo.hijri.monthNameBn}, {toBengaliNumber(selectedDayInfo.hijri.year)} হিজরি</span>
                    </div>
                  </div>

                  {selectedDayInfo.holidays.length > 0 ? (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-900 text-xs">
                      {selectedDayInfo.holidays.map((h) => (
                        <div key={h.id} className="space-y-0.5">
                          <div className="flex items-center gap-2 font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                              {h.typeLabelBn}
                            </span>
                            <span>{h.nameBn} ({h.nameEn})</span>
                          </div>
                          <p className="text-rose-800 text-[11px] mt-0.5">{h.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {selectedDayInfo.isWeekend ? 'এটি সাপ্তাহিক ছুটির দিন।' : 'এই দিনে কোনো সরকারি ছুটি নেই (স্বাভাবিক কর্মদিবস)।'}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedDayInfo(null)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white/80 p-1.5 rounded-lg border border-slate-200 cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: সরকারি ছুটি (PUBLIC HOLIDAYS SECTION) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>২. সরকারি ছুটি (Public Holidays ২০২৬)</span>
                <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  মোট {toBengaliNumber(BANGLADESH_HOLIDAYS_2026.length)} টি প্রধান সরকারি ছুটি
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের অফিশিয়াল গেজেট অনুযায়ী ২০২৬ সালের সরকারি ছুটির নির্ভুল তালিকা
            </p>
          </div>

          {/* Upcoming Holiday Spotlight Chip */}
          {nextUpcomingHoliday && (
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 rounded-2xl p-3 flex items-center gap-3 self-start md:self-auto">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wide block">
                  পরবর্তী আসন্ন ছুটি
                </span>
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[200px]">
                  {nextUpcomingHoliday.nameBn}
                </span>
                <span className="text-[10px] text-amber-800 font-semibold">
                  {nextUpcomingHoliday.dateStr} ({nextUpcomingHoliday.dayNameBn})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Buttons & Month Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Holiday Type Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setHolidayFilter('all')}
              id="holiday-filter-all"
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                holidayFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সকল ছুটি ({toBengaliNumber(BANGLADESH_HOLIDAYS_2026.length)})
            </button>

            <button
              onClick={() => setHolidayFilter('general')}
              id="holiday-filter-general"
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                holidayFilter === 'general'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সাধারণ ছুটি
            </button>

            <button
              onClick={() => setHolidayFilter('executive')}
              id="holiday-filter-executive"
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                holidayFilter === 'executive'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              নির্বাহী আদেশে ছুটি
            </button>

            <button
              onClick={() => setHolidayFilter('upcoming')}
              id="holiday-filter-upcoming"
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                holidayFilter === 'upcoming'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              আসন্ন ছুটি
            </button>
          </div>

          {/* Filter by Month Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">মাস অনুযায়ী:</span>
            <select
              value={selectedHolidayMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedHolidayMonth(val === 'all' ? 'all' : parseInt(val, 10));
              }}
              id="holiday-month-select"
              className="text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="all">পুরো বছর (সব মাস)</option>
              {MONTH_NAMES_BN.map((name, idx) => (
                <option key={idx} value={idx}>
                  {name} ২০২৬
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Holiday Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredHolidays.map((holiday) => {
            const hDate = new Date(holiday.dateStr);
            const bangla = getBanglaDate(hDate);
            const countdown = getDaysRemainingText(holiday.dateStr, holiday.endDateStr);

            return (
              <div
                key={holiday.id}
                id={`holiday-card-${holiday.id}`}
                className="bg-slate-50/80 hover:bg-white rounded-2xl p-4 border border-slate-200 hover:border-rose-300 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Top Row: Category & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                        holiday.type === 'general'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}
                    >
                      {holiday.typeLabelBn}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {holiday.isMoonDependent && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          চাঁদ দেখার ওপর
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          countdown.status === 'today'
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : countdown.status === 'tomorrow'
                            ? 'bg-amber-500 text-white font-bold'
                            : countdown.status === 'future'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {countdown.text}
                      </span>
                    </div>
                  </div>

                  {/* Holiday Title */}
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {holiday.nameBn}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {holiday.nameEn}
                  </p>

                  {/* Description note */}
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed bg-white/80 p-2 rounded-xl border border-slate-100">
                    {holiday.description}
                  </p>
                </div>

                {/* Bottom Row: Exact Dates & Bangla Dates */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                    <CalendarDays className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    <span>
                      {toBengaliNumber(hDate.getDate())} {MONTH_NAMES_BN[hDate.getMonth()]}, ২০২৬ ({holiday.dayNameBn})
                    </span>
                  </div>

                  <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    {toBengaliNumber(bangla.day)} {bangla.monthNameBn}, {toBengaliNumber(bangla.year)} বঙ্গাব্দ
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredHolidays.length === 0 && (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">কোনো ছুটি পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-500 mt-1">অনুগ্রহ করে ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।</p>
          </div>
        )}
      </div>
    </div>
  );
};
