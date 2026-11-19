'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import toast from 'react-hot-toast';
import { orderService } from '@/services/order-service';
import { paymentService } from '@/services/payment-service';
import { classifyRepayError } from '@/utils/repay-error';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface UseRepayOrderOptions {
  guestPhone?: string | null;
  onRefetch: () => void | Promise<void>;
}

export function useRepayOrder({ guestPhone, onRefetch }: UseRepayOrderOptions) {
  const t = useTranslations('order');
  const [isRepaying, setIsRepaying] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        inFlightRef.current = false;
        setIsRepaying(false);
        void onRefetch();
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [onRefetch]);

  const handleRepay = useCallback(
    async (orderId: string) => {
      if (inFlightRef.current || isRepaying) {
        return;
      }

      inFlightRef.current = true;
      setIsRepaying(true);

      // Bước 1: Gia hạn hạn thanh toán hoặc mở lại đơn hết hạn
      try {
        if (guestPhone) {
          await orderService.payAgainGuest(orderId, guestPhone);
        } else {
          await orderService.payAgain(orderId);
        }
      } catch (err: unknown) {
        const category = classifyRepayError(err);
        if (category === 'RATE_LIMIT') {
          toast.error(t('rateLimitError'));
        } else if (category === 'TRANSIENT') {
          toast.error(t('repayError'));
        } else {
          toast.error(getApiErrorMessage(err) ?? t('repayError'));
        }
        inFlightRef.current = false;
        setIsRepaying(false);
        void onRefetch();
        return;
      }

      // Bước 2: Tạo link thanh toán VNPay mới
      try {
        const { orderUrl } = guestPhone
          ? await paymentService.createGuestVnPayOrder(orderId, guestPhone)
          : await paymentService.createVnPayOrder(orderId);

        toast.success(t('redirectingToGateway'));
        window.location.href = orderUrl;
      } catch (err: unknown) {
        const category = classifyRepayError(err);
        if (category === 'RATE_LIMIT') {
          toast.error(t('rateLimitError'));
        } else if (category === 'TRANSIENT') {
          toast.error(t('stockClaimedVnPayUrlFailed'));
        } else {
          toast.error(getApiErrorMessage(err) ?? t('repayError'));
        }
        inFlightRef.current = false;
        setIsRepaying(false);
        void onRefetch();
      }
    },
    [guestPhone, isRepaying, onRefetch, t]
  );

  return {
    isRepaying,
    handleRepay,
  };
}
