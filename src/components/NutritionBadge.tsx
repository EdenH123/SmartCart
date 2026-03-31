'use client';

import { useState } from 'react';
import { Flame } from 'lucide-react';
import type { NutritionInfo } from '@/types';

interface NutritionBadgeProps {
  nutrition: NutritionInfo;
}

export default function NutritionBadge({ nutrition }: NutritionBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setExpanded(!expanded);
      }}
      className="mt-1 inline-flex flex-col items-start text-start"
    >
      {/* Collapsed: pill with calories */}
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer">
        <Flame className="h-3 w-3" />
        {nutrition.calories} קל׳
      </span>

      {/* Expanded: full breakdown */}
      {expanded && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 animate-fade-in">
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:text-orange-400">
            <Flame className="h-3 w-3" />
            {nutrition.calories} קלוריות
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            חלבון {nutrition.protein} גר׳
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 text-[11px] font-medium text-yellow-600 dark:text-yellow-400">
            פחמימות {nutrition.carbs} גר׳
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
            שומן {nutrition.fat} גר׳
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[11px] text-gray-500 dark:text-gray-400">
            מנה: {nutrition.serving}
          </span>
        </div>
      )}
    </button>
  );
}
