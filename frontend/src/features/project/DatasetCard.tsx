/**
 * DatasetCard.tsx — UIUX-05: kartu dataset ringkas di halaman Setup.
 *
 * Data dari `DatasetRecord` yang sudah ada di ProjectContext (jujur:
 * hanya field backend — nama, row_count, columns, fingerprint). Fingerprint
 * hanya 12 char pertama untuk display (pola existing `slice(0, 12)`).
 * Aksi cepat adalah link hash nyata (`#explorer`, `#profiling`) yang
 * tersinkron via listener hashchange router.tsx:121-128.
 *
 * Gaya fitur di `shared/controls.css` (.dataset-card*) — selector fitur
 * tidak memakai --shell-font-* (token-ownership); font mewarisi body 14px.
 */
import type { DatasetRecord } from "../../shared/ipc/generated";
import { SETUP_COPY } from "../../shared/copy/featureCopy";

export function DatasetCard({ dataset }: { dataset: DatasetRecord }) {
  return (
    <section className="dataset-card" aria-label={dataset.name}>
      <div className="dataset-card-main">
        <h3 className="dataset-card-name">{dataset.name}</h3>
        <p className="dataset-card-meta">
          {SETUP_COPY.datasetCardRowsCols(dataset.row_count, dataset.columns.length)} ·{" "}
          <code>{SETUP_COPY.datasetCardFingerprint(dataset.fingerprint.slice(0, 12))}</code>
        </p>
      </div>
      <div className="dataset-card-actions">
        <a className="dataset-card-action" href="#/explorer">
          {SETUP_COPY.datasetCardOpenDataset}
        </a>
        <a className="dataset-card-action" href="#/profiling">
          {SETUP_COPY.datasetCardRunProfile}
        </a>
      </div>
    </section>
  );
}
