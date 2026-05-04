"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Renders children into document.body via React portal.
 * This ensures modals escape any CSS stacking context created by
 * transforms, filters, or overflow on ancestor elements.
 */
export default function ModalPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // SSR guard — portals require a DOM
  if (!mounted) return null;

  return createPortal(children, document.body);
}
