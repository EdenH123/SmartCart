import Link from 'next/link';
import { ShoppingCart, ArrowRight, TrendingDown, RefreshCw, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-16 sm:py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          השוו את סל הקניות שלכם
          <br />
          <span className="text-brand-600">בין הסופרמרקטים</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
          בנו את הסל, השוו מחירים, וגלו תחליפים זולים יותר. מצאו איפה הקנייה השבועית הכי משתלמת.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/basket" className="btn-primary gap-2 px-6 py-3 text-base">
            <ShoppingCart className="h-5 w-5" />
            התחילו לבנות סל
          </Link>
          <Link href="/basket?demo=true" className="btn-secondary gap-2 px-6 py-3 text-base">
            טענו סל לדוגמה
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16">
        <h2 className="text-center text-2xl font-bold text-gray-900">איך זה עובד</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Search className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">1. בנו את הסל</h3>
            <p className="mt-2 text-sm text-gray-600">
              חפשו מוצרים, בחרו העדפות, והוסיפו פריטים לסל. בחרו מוצר מדויק או השאירו גמישות.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <RefreshCw className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">2. השוו מחירים</h3>
            <p className="mt-2 text-sm text-gray-600">
              אנחנו בודקים מחירים במספר סופרמרקטים ומוצאים את העסקאות הטובות ביותר, כולל תחליפים חכמים.
            </p>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <TrendingDown className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">3. חסכו כסף</h3>
            <p className="mt-2 text-sm text-gray-600">
              ראו דירוג של סופרמרקטים לפי עלות כוללת. דעו בדיוק כמה חוסכים ואיפה.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
