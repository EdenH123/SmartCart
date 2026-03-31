'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, MessageCircle, Download, Share } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ExportMenuProps {
  generateText: () => string;
  filename?: string;
}

export function ExportMenu({ generateText, filename = 'smartcart-export.txt' }: ExportMenuProps) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateText());
      showToast('success', 'הועתק!');
    } catch {
      showToast('error', 'שגיאה בהעתקה');
    }
    setOpen(false);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(generateText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setOpen(false);
  };

  const handleDownload = () => {
    const blob = new Blob([generateText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-ghost text-sm gap-1.5"
        aria-label="אפשרויות שיתוף"
      >
        <Share className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-elevated animate-scale-in dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Copy className="h-4 w-4" />
            העתק לקליפבורד
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <MessageCircle className="h-4 w-4" />
            שתפו בוואטסאפ
          </button>
          <button
            onClick={handleDownload}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            הורידו כקובץ
          </button>
        </div>
      )}
    </div>
  );
}
