/**
 * ProfilingPage.tsx — P2-2 route Profiling: run profil, riwayat profil,
 * snapshot + aktivasi, provenance (lineage cleaning), dan insights
 * (finding/hypothesis). Hasil profil disimpan ke konteks agar
 * Quality/Bivariat/Report bisa memakai.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type {
  FindingStatus,
  HypothesisStatus,
} from "../../shared/ipc/generated";
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { useToast } from "../../shared/ui/Toaster";
import { EmptyState, LoadingSkeleton } from "../../shared/ui/LoadingSkeleton";
import { COMMON_COPY, PROFILING_COPY } from "../../shared/copy/featureCopy";
import { StaleRefreshBanner } from "../../shared/ui/StaleRefreshBanner";

const FINDING_NEXT: Record<FindingStatus, FindingStatus> = {
  proposed: "accepted",
  accepted: "archived",
  archived: "proposed",
};

const HYPOTHESIS_NEXT: Record<HypothesisStatus, HypothesisStatus> = {
  proposed: "investigating",
  accepted: "investigating",
  investigating: "inconclusive",
  supported: "archived",
  not_supported: "archived",
  inconclusive: "archived",
  archived: "proposed",
};

export function ProfilingPage() {
  const { projectId, dataset, savedProfile, setSavedProfile } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [showProvenance, setShowProvenance] = useState(false);
  const [findingTitle, setFindingTitle] = useState("");
  const [findingBody, setFindingBody] = useState("");
  const [hypothesisStatement, setHypothesisStatement] = useState("");

  const invalidateInsights = () => {
    void queryClient.invalidateQueries({
      queryKey: ["findings", projectId, dataset?.dataset_id],
    });
    void queryClient.invalidateQueries({
      queryKey: ["hypotheses", projectId, dataset?.dataset_id],
    });
  };

  const runProfile = useMutation({
    mutationFn: () => ipcClient.runProfile(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setSavedProfile(r);
      toast.success(PROFILING_COPY.toastProfileDone);
      void queryClient.invalidateQueries({
        queryKey: ["profiles", projectId, dataset?.dataset_id],
      });
    },
    onError: (e) => toast.error(PROFILING_COPY.toastProfileFail(e.message)),
  });
  const openSaved = useMutation({
    mutationFn: (profileId: string) => ipcClient.getProfileById(projectId!, profileId),
    onSuccess: (r) => setSavedProfile(r),
    onError: (e) => toast.error(PROFILING_COPY.toastOpenFail(e.message)),
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
  const provenance = useQuery({
    queryKey: ["provenance", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getProvenance(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset && showProvenance,
  });

  // M3 P1 insights (Doc03 §4.8): Finding & Hypothesis lifecycle.
  const findings = useQuery({
    queryKey: ["findings", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.listFindings(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });
  const hypotheses = useQuery({
    queryKey: ["hypotheses", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.listHypotheses(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });

  const createFinding = useMutation({
    mutationFn: () =>
      ipcClient.createFinding(
        projectId!,
        dataset!.dataset_id,
        findingTitle,
        findingBody,
        dataset!.snapshot_id,
        dataset!.fingerprint,
      ),
    onSuccess: () => {
      setFindingTitle("");
      setFindingBody("");
      toast.success(PROFILING_COPY.toastFindingAdded);
      invalidateInsights();
    },
    onError: (e) => toast.error(PROFILING_COPY.toastFindingFail(e.message)),
  });
  const transitionFindingMut = useMutation({
    mutationFn: (v: { id: string; status: FindingStatus }) =>
      ipcClient.transitionFinding(projectId!, v.id, v.status),
    onSuccess: () => {
      toast.success(PROFILING_COPY.toastFindingStatus);
      invalidateInsights();
    },
    onError: (e) => toast.error(PROFILING_COPY.toastFindingStatusFail(e.message)),
  });
  const createHypothesis = useMutation({
    mutationFn: () =>
      ipcClient.createHypothesis(projectId!, dataset!.dataset_id, hypothesisStatement),
    onSuccess: () => {
      setHypothesisStatement("");
      toast.success(PROFILING_COPY.toastHypothesisAdded);
      invalidateInsights();
    },
    onError: (e) => toast.error(PROFILING_COPY.toastHypothesisFail(e.message)),
  });
  const transitionHypothesisMut = useMutation({
    mutationFn: (v: { id: string; status: HypothesisStatus }) =>
      ipcClient.transitionHypothesis(projectId!, v.id, v.status),
    onSuccess: () => {
      toast.success(PROFILING_COPY.toastHypothesisStatus);
      invalidateInsights();
    },
    onError: (e) => toast.error(PROFILING_COPY.toastHypothesisStatusFail(e.message)),
  });

  const activateSnapshot = useMutation({
    mutationFn: (snapshotId: string) =>
      ipcClient.activateSnapshot(projectId!, dataset!.dataset_id, snapshotId),
    onSuccess: () => {
      toast.success(PROFILING_COPY.toastSnapshotActivated);
      void queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(PROFILING_COPY.toastSnapshotFail(e.message)),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title={PROFILING_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  // D-F7 follow-up / FLOW §2.4 `stale`: fingerprint artefak vs snapshot aktif.
  const profileStale = !!savedProfile && savedProfile.fingerprint !== dataset.fingerprint;

  return (
    <>
      <section>
        <h2>{PROFILING_COPY.headingRun}</h2>
        <button onClick={() => runProfile.mutate()} disabled={runProfile.isPending}>
          {runProfile.isPending ? PROFILING_COPY.running : PROFILING_COPY.runNow}
        </button>
      </section>

      {profiles.isPending && <LoadingSkeleton label={PROFILING_COPY.loadingHistory} />}
      {profiles.data && (
        <section>
          <h2>{PROFILING_COPY.historyTitle}</h2>
          <ul>
            {profiles.data.profiles.map((p) => (
              <li key={p.profile_id}>
                <button
                  onClick={() => openSaved.mutate(p.profile_id)}
                  className={p.profile_id === savedProfile?.profile_id ? "status-success" : ""}
                  disabled={openSaved.isPending}
                >
                  {p.profile_id.slice(0, 8)} · {p.row_count} rows · {p.column_count} kolom
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {savedProfile && (
        <section>
          <h2>{PROFILING_COPY.profileTitle}</h2>
          {profileStale && (
            <StaleRefreshBanner
              copy={{ ...PROFILING_COPY, staleDependency: PROFILING_COPY.staleDependency(dataset.name) }}
              onRefresh={() => runProfile.mutate()}
              isPending={runProfile.isPending}
              pendingLabel={PROFILING_COPY.running}
            />
          )}
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{PROFILING_COPY.thColumn}</th>
                  <th>{PROFILING_COPY.thNullPct}</th>
                  <th>{PROFILING_COPY.thUnique}</th>
                  <th>{PROFILING_COPY.thType}</th>
                </tr>
              </thead>
              <tbody>
                {savedProfile.columns.map((c) => (
                  <tr key={c.name}>
                    <td>{c.name}</td>
                    <td>{c.missing_pct.toFixed(2)}</td>
                    <td>{c.distinct_count}</td>
                    <td>{c.inferred_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2>{PROFILING_COPY.snapshotsTitle}</h2>
        {(snapshots.data?.snapshots ?? []).map((s) => (
          <p key={s.snapshot_id}>
            {s.snapshot_id.slice(0, 8)} · {s.row_count} rows · {s.fingerprint.slice(0, 12)}…
            <button
              onClick={() => activateSnapshot.mutate(s.snapshot_id)}
              disabled={activateSnapshot.isPending}
            >
              {PROFILING_COPY.activate}
            </button>
          </p>
        ))}
        <button onClick={() => setShowProvenance((v) => !v)}>
          {showProvenance ? PROFILING_COPY.hideProvenance : PROFILING_COPY.showProvenance}
        </button>
        {provenance.data && (
          <ul>
            {provenance.data.lineage.map((edge) => (
              <li key={edge.cleaning_id}>
                {edge.operation}{edge.strategy ? ` (${edge.strategy})` : ""} ·{" "}
                {edge.parent_snapshot_id.slice(0, 8)} → {edge.child_snapshot_id.slice(0, 8)} ·{" "}
                {edge.row_count_before} → {edge.row_count_after} rows ·{" "}
                {edge.affected_rows} terdampak
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{PROFILING_COPY.insightsTitle}</h2>
        <h3>{PROFILING_COPY.findingTitle}</h3>
        {(findings.data?.findings ?? []).map((f) => (
          <p key={f.finding_id}>
            <strong>{f.title}</strong> [{f.status}] {f.body}
            <button
              onClick={() =>
                transitionFindingMut.mutate({ id: f.finding_id, status: FINDING_NEXT[f.status] })
              }
              disabled={transitionFindingMut.isPending}
            >
              {FINDING_NEXT[f.status] === "accepted" ? PROFILING_COPY.acceptFinding : PROFILING_COPY.archiveFinding}
            </button>
          </p>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createFinding.mutate();
          }}
        >
          <input
            value={findingTitle}
            onChange={(e) => setFindingTitle(e.target.value)}
            placeholder={PROFILING_COPY.findingTitlePlaceholder}
            aria-label={PROFILING_COPY.findingTitleLabel}
            required
          />
          <input
            value={findingBody}
            onChange={(e) => setFindingBody(e.target.value)}
            placeholder={PROFILING_COPY.findingDetailPlaceholder}
            aria-label={PROFILING_COPY.findingDetailLabel}
            required
          />
          <button type="submit" disabled={createFinding.isPending}>
            {PROFILING_COPY.addFinding}
          </button>
        </form>
        <h3>{PROFILING_COPY.hypothesisTitle}</h3>
        {(hypotheses.data?.hypotheses ?? []).map((h) => (
          <p key={h.hypothesis_id}>
            <strong>{h.statement}</strong> [{h.status}]
            <button
              onClick={() =>
                transitionHypothesisMut.mutate({
                  id: h.hypothesis_id,
                  status: HYPOTHESIS_NEXT[h.status],
                })
              }
              disabled={transitionHypothesisMut.isPending}
            >
              {h.status === "proposed" || h.status === "accepted" ? PROFILING_COPY.investigate : h.status}
            </button>
          </p>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createHypothesis.mutate();
          }}
        >
          <input
            value={hypothesisStatement}
            onChange={(e) => setHypothesisStatement(e.target.value)}
            placeholder={PROFILING_COPY.hypothesisPlaceholder}
            aria-label={PROFILING_COPY.hypothesisLabel}
            required
          />
          <button type="submit" disabled={createHypothesis.isPending}>
            {PROFILING_COPY.addHypothesis}
          </button>
        </form>
      </section>
    </>
  );
}
