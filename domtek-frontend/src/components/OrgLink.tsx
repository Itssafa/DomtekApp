'use client';

import NextLink from 'next/link';
import type { ComponentProps } from 'react';
import { useState, useEffect } from 'react';
import { orgPath } from '@/lib/org-path';

/**
 * Remplace <Link href="/dashboard/xxx"> par <Link href="/{slug}/xxx">.
 *
 * Utilise un état `mounted` pour éviter le hydration mismatch :
 * - Serveur + premier rendu client → href="/dashboard/..." (identiques)
 * - Après montage → href="/{slug}/..." (mis à jour côté client uniquement)
 */
export default function OrgLink({
  href,
  ...props
}: ComponentProps<typeof NextLink>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resolved =
    mounted && typeof href === 'string' && href.startsWith('/dashboard')
      ? orgPath(href)
      : href;

  return <NextLink href={resolved} {...props} />;
}
