'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Calendar, Clock, Check } from '@/components/base/icons';

interface PickupTimeSelectorProps {
  value?: string;
  onChange: (isoString: string) => void;
  error?: string;
}

export const PickupTimeSelector: React.FC<PickupTimeSelectorProps> = ({
  value,
  onChange,
  error,
}) => {
  const t = useTranslations('checkout');
  const locale = useLocale();

  // Generate next 5 days
  const availableDates = useMemo(() => {
    const dates: { date: Date; dateString: string; label: string; subLabel: string }[] = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      let label = '';
      if (i === 0) label = t('today');
      else if (i === 1) label = t('tomorrow');
      else {
        label = d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' });
      }

      const subLabel = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

      dates.push({ date: d, dateString, label, subLabel });
    }
    return dates;
  }, [locale, t]);

  // Available time slots from 08:00 to 21:30 (store closes at 22:00)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 8; hour <= 21; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  // Parse existing value or set defaults
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const timeString = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { dateString, timeString };
  }, [value]);

  const [selectedDateString, setSelectedDateString] = useState<string>(
    parsedValue?.dateString || availableDates[0].dateString
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(
    parsedValue?.timeString || '09:00'
  );

  // Sync internal state when external value changes
  useEffect(() => {
    if (parsedValue) {
      setSelectedDateString(parsedValue.dateString);
      setSelectedTimeSlot(parsedValue.timeString);
    }
  }, [parsedValue]);

  // Emit change when date or slot is picked
  const handleSelect = (dateStr: string, slotStr: string) => {
    setSelectedDateString(dateStr);
    setSelectedTimeSlot(slotStr);

    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = slotStr.split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hour, minute, 0);
    onChange(targetDate.toISOString());
  };

  // Check if a slot on the selected date is in the past
  const isSlotDisabled = (slot: string) => {
    const todayStr = availableDates[0].dateString;
    if (selectedDateString !== todayStr) return false;

    const now = new Date();
    const [hour, minute] = slot.split(':').map(Number);
    const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);

    // Disable if within 15 minutes of now or past
    return slotTime.getTime() <= now.getTime() + 15 * 60 * 1000;
  };

  return (
    <div className="space-y-4 bg-white border border-rule rounded-2xl p-5 shadow-xs">
      {/* HEADER & STORE HOURS */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-rule">
        <div className="flex items-center gap-2 text-ink font-bold text-sm">
          <Clock className="w-4 h-4 text-primary" />
          <span>{t('pickupTime')}</span>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {t('storeHours')}
        </span>
      </div>

      {/* DATE CHIPS SELECTOR */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-ink-2">{t('pickupDate')}</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {availableDates.map((item) => {
            const isSelected = selectedDateString === item.dateString;
            return (
              <button
                key={item.dateString}
                type="button"
                onClick={() => handleSelect(item.dateString, selectedTimeSlot)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center ${
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-xs'
                    : 'border-rule hover:border-ink-2 bg-white text-ink'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className="text-xs text-ink-2 mt-0.5">{item.subLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIME SLOTS SELECTOR */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-ink-2">{t('pickupTimeSlot')}</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
          {timeSlots.map((slot) => {
            const isSelected = selectedTimeSlot === slot;
            const disabled = isSlotDisabled(slot);

            return (
              <button
                key={slot}
                type="button"
                disabled={disabled}
                onClick={() => handleSelect(selectedDateString, slot)}
                className={`flex items-center justify-center py-2 px-2.5 rounded-xl text-xs font-medium border transition-all ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                    : isSelected
                      ? 'border-primary bg-primary text-white shadow-xs font-semibold'
                      : 'border-rule hover:border-primary hover:text-primary bg-white text-ink'
                }`}
              >
                <span>{slot}</span>
                {isSelected && !disabled && <Check className="w-3 h-3 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUMMARY BANNER */}
      <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-ink">
        <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="font-semibold text-primary">{t('selectedPickupTime')}</span>
        <span className="font-bold text-ink">
          {selectedTimeSlot} —{' '}
          {availableDates.find((d) => d.dateString === selectedDateString)?.label},{' '}
          {availableDates.find((d) => d.dateString === selectedDateString)?.subLabel}
        </span>
      </div>

      {error && <p className="text-xs font-medium text-red-500 mt-1">{error}</p>}
    </div>
  );
};
