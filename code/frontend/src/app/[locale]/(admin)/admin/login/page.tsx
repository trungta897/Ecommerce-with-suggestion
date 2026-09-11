'use client';

import { useTranslations } from 'next-intl';
import { AdminLoginForm } from '@/components/features/auth/AdminLoginForm';
import { Sparkles, ShieldCheck } from '@/components/base/icons';

export default function AdminLoginPage() {
  const t = useTranslations('auth');

  return (
    <div className="flex min-h-screen">
      {/* Left Side Graphic / Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">DATN Admin Portal</span>
        </div>

        <div className="space-y-4 max-w-md relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hệ thống Quản trị & Phân quyền Bảo mật</span>
          </div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Quản lý vận hành E-Commerce toàn diện & tập trung
          </h2>
          <p className="text-sm text-slate-300">
            Duyệt đơn hàng, kiểm duyệt nội dung, quản lý danh mục và theo dõi các chỉ số hoạt động
            kinh doanh theo thời gian thực.
          </p>
        </div>

        <div className="text-xs text-slate-400">
          © 2026 DATN E-Commerce Platform. All rights reserved.
        </div>
      </div>

      {/* Right Side Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-paper-1 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-rule shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-ink mb-1">{t('admin_title')}</h1>
            <p className="text-sm text-ink-2">{t('admin_subtitle')}</p>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
