import Link from 'next/link';
import { ShoppingCart, ArrowRight, TrendingDown, RefreshCw, Search, Zap, Shield } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="py-10 sm:py-16 md:py-24 text-center">
        <div className="animate-fade-in">
          <div className="mx-auto mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium text-brand-700 ring-1 ring-brand-200/50">
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            השוואת מחירים חכמה לסופרמרקטים בישראל
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            השוו את סל הקניות
            <br />
            <span className="bg-gradient-to-l from-brand-600 to-brand-500 bg-clip-text text-transparent">
              וחסכו בכל קנייה
            </span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg leading-relaxed text-gray-500">
            בנו את הסל, השוו מחירים בין סופרמרקטים, וגלו תחליפים זולים יותר.
            <br className="hidden sm:block" />
            מצאו איפה הקנייה השבועית הכי משתלמת.
          </p>
        </div>
        <div className="mt-6 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-slide-up">
          <Link href="/basket" className="btn-primary gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base shadow-md w-full sm:w-auto">
            <ShoppingCart className="h-5 w-5" />
            התחילו לבנות סל
          </Link>
          <Link href="/basket?demo=true" className="btn-secondary gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base w-full sm:w-auto">
            טענו סל לדוגמה
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-12 sm:pb-20">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">איך זה עובד</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">שלושה צעדים פשוטים לקנייה חכמה יותר</p>
        </div>
        <div className="mt-8 sm:mt-12 grid gap-4 sm:gap-6 sm:grid-cols-3">
          {[
            {
              icon: Search,
              step: '1',
              title: 'בנו את הסל',
              description: 'חפשו מוצרים, בחרו העדפות, והוסיפו פריטים לסל. בחרו מוצר מדויק או השאירו גמישות.',
              gradient: 'from-blue-500 to-blue-600',
              bg: 'bg-blue-50',
            },
            {
              icon: RefreshCw,
              step: '2',
              title: 'השוו מחירים',
              description: 'אנחנו בודקים מחירים במספר סופרמרקטים ומוצאים את העסקאות הטובות ביותר.',
              gradient: 'from-brand-500 to-brand-600',
              bg: 'bg-brand-50',
            },
            {
              icon: TrendingDown,
              step: '3',
              title: 'חסכו כסף',
              description: 'ראו דירוג של סופרמרקטים לפי עלות כוללת. דעו בדיוק כמה חוסכים ואיפה.',
              gradient: 'from-emerald-500 to-emerald-600',
              bg: 'bg-emerald-50',
            },
          ].map((item, index) => (
            <div
              key={item.step}
              className="card-hover p-5 sm:p-6 text-center group animate-slide-up"
              style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'backwards' }}
            >
              <div className={`mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl ${item.bg} transition-transform duration-200 group-hover:scale-110`}>
                <item.icon className={`h-6 w-6 sm:h-7 sm:w-7 bg-gradient-to-br ${item.gradient} bg-clip-text`} style={{ color: item.gradient.includes('blue') ? '#3b82f6' : item.gradient.includes('brand') ? '#25a768' : '#10b981' }} />
              </div>
              <div className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-500">
                {item.step}
              </div>
              <h3 className="mt-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust bar */}
      <section className="pb-12 sm:pb-20">
        <div className="rounded-2xl bg-gradient-to-l from-brand-600 to-brand-700 p-6 sm:p-8 md:p-10 text-center text-white animate-fade-in">
          <Shield className="mx-auto h-7 w-7 sm:h-8 sm:w-8 opacity-80" />
          <h3 className="mt-3 text-lg sm:text-xl font-bold">מחירים מעודכנים, השוואה אמיתית</h3>
          <p className="mx-auto mt-2 max-w-xl text-xs sm:text-sm leading-relaxed text-white/80">
            אנחנו מעדכנים מחירים מסופרמרקטים מובילים בישראל. ההשוואה כוללת מבצעים, תחליפים חכמים, ואפשרות לפצל את הסל בין חנויות.
          </p>
        </div>
      </section>
    </div>
  );
}
