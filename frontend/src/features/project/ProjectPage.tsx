import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
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

  const [profiling, setProfiling] = useState(false);
  const profile = useQuery({
    queryKey: ["profile", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getProfile(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset && profiling,
  });

  // G6: job-wrapped profiling run + persisted history + snapshots list
  const runProfile = useMutation({
    mutationFn: () => ipcClient.runProfile(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setSavedProfile(r);
      setProfiling(false);
    },
  });
  const [savedProfile, setSavedProfile] = useState<import("../../shared/ipc/generated").ProfileRecord | null>(null);
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
    onSuccess: (r) => { setSavedProfile(r); setProfiling(false); },
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
          {!profiling && <button onClick={() => setProfiling(true)}>Jalankan Profiling</button>}
          <button disabled={runProfile.isPending} onClick={() => runProfile.mutate()}>Jalankan Profiling (Job)</button>
          {runProfile.isError && <p role="alert">Profiling job gagal: {runProfile.error.message}</p>}
          {openSaved.isError && <p role="alert">Membuka profil tersimpan gagal: {openSaved.error.message}</p>}
          {profile.isPending && <p role="status">Profiling sedang berjalan…</p>}
          {profile.isError && <p role="alert">Profiling gagal. Silakan coba lagi.</p>}
          {(savedProfile ?? profile.data) && (
            <>
              <p>{(savedProfile ?? profile.data)!.row_count} baris · {(savedProfile ?? profile.data)!.column_count} kolom · fingerprint {(savedProfile ?? profile.data)!.fingerprint.slice(0, 12)}…</p>
              <table>
                <thead><tr><th>Kolom</th><th>Tipe</th><th>Missing %</th><th>Min</th><th>Max</th><th>Mean</th><th>Top</th><th>Status</th></tr></thead>
                <tbody>
                  {(savedProfile ?? profile.data)!.columns.map((c) => (
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
