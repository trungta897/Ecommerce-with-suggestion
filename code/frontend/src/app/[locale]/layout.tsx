import type { Metadata } from 'next';
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { QueryProvider } from '@/providers/query-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const fontDisplay = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});
const fontBody = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'E-Commerce Recommendation System',
  description: 'DATN E-Commerce with AI Recommendation',
};

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  // Đảm bảo locale hợp lệ, nếu không throw 404
  if (!['en', 'vi'].includes(locale)) {
    notFound();
  }

  // Lấy toàn bộ messages từ i18n/request.ts
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${fontDisplay.variable} ${fontBody.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <GoogleOAuthProvider
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-client-id'}
          >
            <QueryProvider>
              <ToastProvider>
                <ClientLayoutWrapper header={<Header />} footer={<Footer />}>
                  {children}
                </ClientLayoutWrapper>
              </ToastProvider>
            </QueryProvider>
          </GoogleOAuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
