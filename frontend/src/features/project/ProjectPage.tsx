import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { DatasetRecord } from "../../shared/ipc/generated";

interface ProjectForm { name: string; sourcePath: string; datasetName: string }

export function ProjectPage() {
  const { register, handleSubmit } = useForm<ProjectForm>();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetRecord | null>(null);

  const create = useMutation({
    mutationFn: (name: string) => ipcClient.createProject(name),
    onSuccess: (p) => setProjectId(p.project_id),
  });
  const doImport = useMutation({
    mutationFn: (v: ProjectForm) => ipcClient.importDataset(projectId!, v.sourcePath, v.datasetName),
    onSuccess: setDataset,
  });

  const preview = useQuery({
    queryKey: ["preview", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getPreview(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });

  const queryClient = useQueryClient();
  // G6: single canonical profiling action — JobManager-wrapped command.
  // (The legacy sync `dataset.profile` query stays registered for compat,
  // but the UI no longer offers two competing buttons.)
  const [savedProfile, setSavedProfile] = useState<import("../../shared/ipc/generated").ProfileRecord | null>(null);

  // Feedback is driven by mutation state, NOT query isPending — a disabled
  // query without data is 'pending' forever, so isPending shows a stuck
  // "Profiling sedang berjalan…" next to a finished table.
  const runProfile = useMutation({
    mutationFn: () => ipcClient.runProfile(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setSavedProfile(r);
      void queryClient.invalidateQueries({ queryKey: ["profiles", projectId, dataset?.dataset_id] });
    },
  });
  const profiles = useQuery({
    queryKey: ["profiles", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.listProfiles(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });
  const snapshots = useQuery({
    queryKey: ["snapshots", projectId],
    queryFn: () => ipcClient.listSnapshots(projectId!),
    enabled: !!projectId && !!dataset,
  });
  const openSaved = useMutation({
    mutationFn: (profileId: string) => ipcClient.getProfileById(projectId!, profileId),
    onSuccess: (r) => { setSavedProfile(r); },
  });

  return (
    <main>
      <h1>EDA Workbench — M1</h1>
      <section>
        <h2>Buat Project</h2>
        <form onSubmit={handleSubmit((v) => create.mutate(v.name))}>
          <input {...register("name", { required: true })} placeholder="Nama project" />
          <button disabled={create.isPending}>Buat</button>
        </form>
        {create.isError && <p role="alert">Gagal membuat project: {create.error.message}</p>}
        {projectId && <p>Project: {projectId}</p>}
      </section>
      {projectId && (
        <section>
          <h2>Import Dataset (CSV)</h2>
          <form onSubmit={handleSubmit((v) => doImport.mutate(v))}>
            <input {...register("sourcePath", { required: true })} placeholder="Path file .csv" />
            <input {...register("datasetName", { required: true })} placeholder="Nama dataset" />
            <button disabled={doImport.isPending}>Import</button>
          </form>
          {doImport.isError && <p role="alert">Gagal import: {doImport.error.message}</p>}
          {dataset && <p>Snapshot {dataset.snapshot_id} · {dataset.row_count} rows · sha256 {dataset.fingerprint.slice(0, 12)}…</p>}
        </section>
      )}
      {dataset && (
        <section>
          <h2>Profiling</h2>
          <button disabled={runProfile.isPending} onClick={() => runProfile.mutate()}>Jalankan Profiling</button>
          {runProfile.isPending && <p role="status">Profiling sedang berjalan…</p>}
          {runProfile.isError && <p role="alert">Profiling gagal: {runProfile.error.message}</p>}
          {openSaved.isPending && <p role="status">Membuka profil tersimpan…</p>}
          {openSaved.isError && <p role="alert">Membuka profil tersimpan gagal: {openSaved.error.message}</p>}
          {savedProfile && (
            <>
              <p>{savedProfile.row_count} baris · {savedProfile.column_count} kolom · fingerprint {savedProfile.fingerprint.slice(0, 12)}…{savedProfile.profile_id ? ` · profil ${String(savedProfile.profile_id).slice(0, 8)}` : ""}</p>
              <table>
                <thead><tr><th>Kolom</th><th>Tipe</th><th>Missing %</th><th>Min</th><th>Max</th><th>Mean</th><th>Top</th><th>Status</th></tr></thead>
                <tbody>
                  {savedProfile.columns.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td><td>{c.inferred_type}</td><td>{c.missing_pct}</td>
                      <td>{String(c.min_value ?? "")}</td><td>{String(c.max_value ?? "")}</td>
                      <td>{String(c.mean_value ?? "")}</td><td>{String(c.top_value ?? "")}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {profiles.isPending && <p role="status">Memuat riwayat profiling…</p>}
          {profiles.isError && <p role="alert">Riwayat profiling gagal dimuat: {profiles.error.message}</p>}
          {profiles.data && profiles.data.profiles.length === 0 && !runProfile.isPending && (
            <p>Belum ada profil tersimpan. Jalankan profiling untuk membuat profil pertama.</p>
          )}
          {profiles.data && profiles.data.profiles.length > 0 && (
            <>
              <h3>Riwayat Profiling ({profiles.data.profiles.length})</h3>
              <ul>
                {profiles.data.profiles.map((p) => (
                  <li key={p.profile_id}>
                    {p.profile_id.slice(0, 8)} · {p.row_count} rows · {p.column_count} cols · {p.fingerprint.slice(0, 12)}…{" "}
                    <button onClick={() => openSaved.mutate(p.profile_id)}>Buka</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {snapshots.data && snapshots.data.snapshots.length > 0 && (
            <>
              <h3>Snapshots ({snapshots.data.snapshots.length})</h3>
              <ul>
                {snapshots.data.snapshots.map((s) => (
                  <li key={s.snapshot_id}>{s.dataset_name} · {s.snapshot_id.slice(0, 8)} · {s.row_count} rows · {s.fingerprint.slice(0, 12)}…</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
      {preview.data && (
        <section>
          <h2>Preview ({preview.data.total_rows} rows{preview.data.truncated ? ", truncated" : ""})</h2>
          <table>
            <thead><tr>{preview.data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {preview.data.rows.map((r, i) => (
                <tr key={i}>{preview.data.columns.map((c) => <td key={c}>{String(r[c] ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
