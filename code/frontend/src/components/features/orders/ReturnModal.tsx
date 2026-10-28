import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { BaseModal, BaseButton } from '@/components/base';
import { orderService } from '@/services/order-service';
import { useToast } from '@/providers/toast-provider';
import { RETURN_MAX_EVIDENCE_FILES, RETURN_MAX_FILE_SIZE } from '@/constants/order';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSuccess: () => void;
}

const RETURN_REASONS = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'MISSING_PARTS',
  'DAMAGED_IN_TRANSIT',
  'NOT_AS_DESCRIBED',
  'POOR_QUALITY',
  'BETTER_PRICE_FOUND',
  'NO_LONGER_NEEDED',
  'OTHER',
];

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  orderId,
  onSuccess,
}) => {
  const t = useTranslations('order');
  const tCommon = useTranslations('common');
  const toast = useToast();
  const [reason, setReason] = useState(RETURN_REASONS[0]);
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      if (selectedFiles.length + files.length > RETURN_MAX_EVIDENCE_FILES) {
        toast.error(t('uploadLimitExceeded', { max: RETURN_MAX_EVIDENCE_FILES }));
        return;
      }

      for (const file of selectedFiles) {
        if (file.size > RETURN_MAX_FILE_SIZE) {
          toast.error(t('fileSizeExceeded', { size: 10 }));
          return;
        }
      }

      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error(t('returnReasonRequired'));
      return;
    }

    try {
      setLoading(true);
      await orderService.requestReturn(orderId, {
        returnReason: reason,
        note,
        files,
      });
      toast.success(t('returnSuccess'));
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error) ?? t('returnRequestError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={t('returnOrder')}>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('returnReason')}
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            {RETURN_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('returnNote')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('evidenceFiles')} ({files.length}/{RETURN_MAX_EVIDENCE_FILES})
          </label>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {files.length > 0 && (
            <div className="mt-2 space-y-2">
              {files.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                >
                  <span className="text-sm truncate text-gray-600 dark:text-gray-300">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    {tCommon('delete')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <BaseButton type="button" variant="outline" onClick={onClose} disabled={loading}>
            {tCommon('cancel')}
          </BaseButton>
          <BaseButton type="submit" variant="default" isLoading={loading}>
            {t('submitReturn')}
          </BaseButton>
        </div>
      </form>
    </BaseModal>
  );
};
