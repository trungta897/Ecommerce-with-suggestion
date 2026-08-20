import { AdminLoginForm } from '@/components/features/auth/AdminLoginForm';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block w-1/2 bg-slate-900">
        {/* Placeholder for Left Side Graphic */}
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-6">
          <h1 className="text-2xl font-bold mb-2">Đăng nhập Quản trị viên</h1>
          <p className="text-muted-foreground mb-6">Vui lòng đăng nhập để tiếp tục</p>
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
