'use client';

import { useState } from 'react';
import DonationModal from '@/components/DonationModal';

export default function DonateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 hover:text-green-800 hover:underline transition-colors"
      >
        Donate 💚
      </button>
      {open && <DonationModal onClose={() => setOpen(false)} />}
    </>
  );
}
