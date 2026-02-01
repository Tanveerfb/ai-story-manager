'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Home page - AI-First Authoring Suite
 * Immediately redirects to the Continue Story page (main workspace)
 * This aligns with the AI-first workflow where users start creating from scratch
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Continue Story page on mount
    router.push('/continue');
  }, [router]);

  // Return null as component immediately redirects
  return null;
}
