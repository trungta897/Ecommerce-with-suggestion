import { useTranslations } from 'next-intl';

export default function AdminDashboardPage() {
  const t = useTranslations('admin.dashboard');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-lg shadow-sm border border-rule">
          <h3 className="font-semibold">{t('overview')}</h3>
        </div>
        
        <div className="p-6 bg-gradient-ai text-white rounded-lg shadow-sm col-span-2">
          <h3 className="font-semibold mb-2">{t('insights')}</h3>
          {/* AI Insights Charts will go here */}
        </div>
      </div>
    </div>
  );
}
