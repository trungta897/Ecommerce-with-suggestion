import { useTranslations } from 'next-intl';
import { BaseInput } from '@/components/base';
import { Search } from '@/components/base/icons';

export default function AdminUsersPage() {
  const t = useTranslations('admin.users');

  const mockUsers = [
    {
      id: '1',
      name: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      role: 'customer',
      verified: true,
      orders: 5,
    },
    {
      id: '2',
      name: 'Trần Thị B',
      email: 'b@gmail.com',
      role: 'customer',
      verified: true,
      orders: 12,
    },
    {
      id: '3',
      name: 'Lê Văn C',
      email: 'c@gmail.com',
      role: 'customer',
      verified: false,
      orders: 0,
    },
    { id: '4', name: 'Phạm Thị D', email: 'd@gmail.com', role: 'admin', verified: true, orders: 0 },
    {
      id: '5',
      name: 'Hoàng Văn E',
      email: 'e@gmail.com',
      role: 'customer',
      verified: true,
      orders: 3,
    },
  ];

  const roleColors: Record<string, string> = {
    customer: 'bg-blue-100 text-blue-800',
    admin: 'bg-purple-100 text-purple-800',
    super_admin: 'bg-red-100 text-red-800',
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-ink mb-8">{t('title')}</h1>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
          <BaseInput placeholder={t('searchPlaceholder')} className="pl-10" />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-rule overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-2 border-b border-rule bg-paper-2">
                <th className="px-5 py-3 font-medium">{t('name')}</th>
                <th className="px-5 py-3 font-medium">{t('email')}</th>
                <th className="px-5 py-3 font-medium">{t('role')}</th>
                <th className="px-5 py-3 font-medium">{t('status')}</th>
                <th className="px-5 py-3 font-medium">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {mockUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-rule last:border-0 hover:bg-paper-2 transition-colors"
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-red-400 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-ink">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-2">{user.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColors[user.role] || 'bg-gray-100'}`}
                    >
                      {t(user.role as Parameters<typeof t>[0])}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        user.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.verified ? t('verified') : t('unverified')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-xs text-red-500 hover:underline font-medium">
                      {t('ban')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
