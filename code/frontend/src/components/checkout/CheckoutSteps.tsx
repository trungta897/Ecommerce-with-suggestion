'use client';

import { useTranslations } from 'next-intl';
import { Truck, CreditCard, CheckCircle2 } from '@/components/base/icons';

const STEPS = ['step1', 'step2', 'step3'] as const;
const STEP_ICONS = [Truck, CreditCard, CheckCircle2];

interface CheckoutStepsProps {
  currentStep: number;
}

export function CheckoutSteps({ currentStep }: CheckoutStepsProps) {
  const t = useTranslations('checkout');

  return (
    <div className="flex items-center justify-center mb-10">
      {STEPS.map((step, idx) => {
        const Icon = STEP_ICONS[idx];
        return (
          <div key={step} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                idx <= currentStep ? 'bg-primary text-white shadow-md' : 'bg-paper-2 text-ink-2'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{t(step)}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-1 transition-colors ${
                  idx < currentStep ? 'bg-primary' : 'bg-rule'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
