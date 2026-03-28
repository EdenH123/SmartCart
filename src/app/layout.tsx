import type { Metadata } from 'next';
import './globals.css';

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
        <div className="min-h-screen">
          <header className="border-b bg-white">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-14 items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
                    <span className="text-sm font-bold text-white">ס</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">סל חכם</span>
                </a>
                <nav className="flex items-center gap-4">
                  <a href="/basket" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    הסל שלי
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
