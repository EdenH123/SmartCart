import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/Toast';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'סל חכם - השוואת מחירי מצרכים',
  description: 'Build your basket, compare totals across supermarkets, and discover cheaper substitutions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="font-sans">
        <ToastProvider>
          <div className="min-h-screen">
            <Header />
            <main>{children}</main>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
