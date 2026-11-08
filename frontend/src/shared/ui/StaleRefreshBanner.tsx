/**
 * StaleRefreshBanner — FLOW-SHELL-001 §2.4 cabang `stale` (D-F7).
 *
 * Memenuhi empat elemen wajib sebelum refresh: alasan, dependency yang
 * berubah, dampak, dan rekomendasi refresh — plus persetujuan eksplisit
 * pengguna (CTA hanya berjalan saat diklik, bukan otomatis saat navigasi).
 * Artefak lama tetap dirender oleh pemanggil di bawah banner ini.
 */
export interface StaleRefreshBannerCopy {
  staleTitle: string;
  staleReason: string;
  staleDependency: string;
  staleImpact: string;
  staleOldArtifact: string;
  staleRecommend: string;
  staleCta: string;
}

interface Props {
  copy: StaleRefreshBannerCopy;
  onRefresh: () => void;
  isPending: boolean;
  pendingLabel: string;
}

export function StaleRefreshBanner({ copy, onRefresh, isPending, pendingLabel }: Props) {
  return (
    <div role="status" className="cleaning-stale">
      <p><strong>{copy.staleTitle}</strong></p>
      <p>{copy.staleReason}</p>
      <p>{copy.staleDependency}</p>
      <p>{copy.staleImpact}</p>
      <p>{copy.staleOldArtifact}</p>
      <p>{copy.staleRecommend}</p>
      <p>
        <button type="button" onClick={onRefresh} disabled={isPending}>
          {isPending ? pendingLabel : copy.staleCta}
        </button>
      </p>
    </div>
  );
}
