'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Scale, Sparkles, ListChecks } from 'lucide-react';

const STORAGE_KEY = 'smartcart-onboarding-completed';

interface TourStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: <ShoppingCart className="h-8 w-8 text-brand-500" />,
    title: 'ברוכים הבאים לסל חכם!',
    description:
      'סל חכם עוזר לכם לבנות סל קניות, להשוות מחירים בין סופרמרקטים ולחסוך כסף בקלות.',
  },
  {
    icon: <Plus className="h-8 w-8 text-brand-500" />,
    title: 'הוסיפו מוצרים לסל',
    description:
      'לחצו על "הוסף מוצר" כדי לבנות את סל הקניות שלכם, או בחרו מפריטים פופולריים.',
  },
  {
    icon: <Scale className="h-8 w-8 text-brand-500" />,
    title: 'השוו מחירים',
    description:
      'לאחר הוספת מוצרים, השוו את העלות הכוללת של הסל בין רשתות שונות ומצאו את האופציה הזולה ביותר.',
  },
  {
    icon: <Sparkles className="h-8 w-8 text-brand-500" />,
    title: 'מטבו את הסל',
    description:
      'קבלו המלצות לתחליפים זולים יותר כדי להוזיל את עלות הסל שלכם.',
  },
  {
    icon: <ListChecks className="h-8 w-8 text-brand-500" />,
    title: 'מצב קניות',
    description:
      'הפעילו מצב קניות כדי לסמן פריטים תוך כדי הקנייה ולעקוב אחרי ההתקדמות.',
  },
];

export default function OnboardingTour() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [fadeClass, setFadeClass] = useState('animate-fade-in');

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable – skip tour
    }
  }, []);

  const complete = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setVisible(false);
  }, []);

  const goToStep = useCallback(
    (next: number) => {
      setFadeClass('opacity-0 scale-95');
      setTimeout(() => {
        if (next >= TOUR_STEPS.length) {
          complete();
        } else {
          setStep(next);
          setFadeClass('animate-fade-in');
        }
      }, 200);
    },
    [complete],
  );

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="סיור היכרות"
    >
      <div
        className={`w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl ring-1 ring-gray-950/5 dark:bg-gray-800 dark:ring-gray-700/40 transition-all duration-200 ${fadeClass}`}
      >
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30">
          {current.icon}
        </div>

        {/* Text */}
        <h2 className="mt-4 text-center text-lg font-bold text-gray-900 dark:text-gray-100">
          {current.title}
        </h2>
        <p className="mt-2 text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {current.description}
        </p>

        {/* Step dots */}
        <div className="mt-5 flex items-center justify-center gap-1.5" aria-label={`שלב ${step + 1} מתוך ${TOUR_STEPS.length}`}>
          {TOUR_STEPS.map((_, i) => (
            <span
              key={i}
              className={
                i === step
                  ? 'step-dot-active'
                  : i < step
                    ? 'step-dot-completed'
                    : 'step-dot-inactive'
              }
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={complete}
            className="btn-ghost text-sm text-gray-500 dark:text-gray-400"
          >
            דלג
          </button>
          <button
            onClick={() => goToStep(step + 1)}
            className="btn-primary text-sm"
          >
            {isLast ? 'סיום' : 'הבא'}
          </button>
        </div>
      </div>
    </div>
  );
}
