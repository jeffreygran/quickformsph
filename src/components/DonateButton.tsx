'use client';

import { useState } from 'react';
import DonationModal from '@/components/DonationModal';

export default function DonateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors"
      >
        💚 Support this project
      </button>
      {open && <DonationModal onClose={() => setOpen(false)} />}
    </>
  );
}
