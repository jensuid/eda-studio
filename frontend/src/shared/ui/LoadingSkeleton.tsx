/**
 * LoadingSkeleton.tsx — P2-2 skeleton berlabel per DS-CORE-001
 * (jangan "spinner tanpa label"): selalu role="status" + teks label yang
 * bisa dibaca screen reader, blok skeleton aria-hidden.
 * Sekaligus menampung EmptyState untuk route yang butuh konteks proyek.
 */
import type { ReactNode } from "react";

export function LoadingSkeleton({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite">
      <p>{label}</p>
      <div aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton-block" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
