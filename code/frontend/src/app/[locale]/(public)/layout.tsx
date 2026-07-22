import { HeaderVN } from '@/components/layout/HeaderVN';
import { FooterVN } from '@/components/layout/FooterVN';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HeaderVN />
      <main className="min-h-screen">{children}</main>
      <FooterVN />
    </>
  );
}
