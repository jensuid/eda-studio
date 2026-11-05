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

  return (
    <main>
      <h1>EDA Workbench — M1</h1>
      <section>
        <h2>Buat Project</h2>
        <form onSubmit={handleSubmit((v) => create.mutate(v.name))}>
          <input {...register("name", { required: true })} placeholder="Nama project" />
          <button disabled={create.isPending}>Buat</button>
        </form>
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
          {dataset && <p>Snapshot {dataset.snapshot_id} · {dataset.row_count} rows · sha256 {dataset.fingerprint.slice(0, 12)}…</p>}
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
