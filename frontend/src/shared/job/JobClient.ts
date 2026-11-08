/**
 * JobClient.ts — P2-2 job polling client.
 *
 * Backend-authoritative job lifecycle (SYS-015): frontend hanya memproyeksikan
 * event dari `ipcClient.getEvents(sinceSeq)` — tidak pernah mengarang status.
 * Polling tiap 1 dtk; sejak P2-2 `getEvents` tidak lagi tak-terpakai.
 *
 * Kontrak event (D-F5, backend-first): `JobEvent` kini membawa `command`,
 * `progress` (0..1 atau null bila tidak tersedia — tidak pernah dikarang),
 * `started_at`, `finished_at`. `progress` null → bar INDETERMINATE di
 * Job Center; angka nyata → bar determinate dengan `aria-valuenow`.
 * `command` ada → state "In Progress" boleh ditampilkan (D-S8).
 *
 * Di luar desktop shell (bridge absen) polling gagal diam-diam dan dicoba lagi
 * pada tick berikutnya — tidak memicu toast/error berulang.
 */
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../ipc/ipcClient";
import type { JobEvent, JobState } from "../ipc/generated";

export const JOB_POLL_INTERVAL_MS = 1000;

export interface JobView {
  jobId: string;
  state: JobState;
  seq: number;
  message: string;
  command: string | null;
  /** Real backend progress 0..1, or null when unknown (never fabricated). */
  progress: number | null;
  startedAt: string | null;
  finishedAt: string | null;
}

const TERMINAL_STATES: ReadonlySet<JobState> = new Set([
  "Completed",
  "Failed",
  "Cancelled",
  "Interrupted",
]);

export function isTerminal(state: JobState): boolean {
  return TERMINAL_STATES.has(state);
}

/** Poll `getEvents` tiap 1 dtk; kembalikan daftar job lintas fitur (terbaru dulu). */
export function useJobPoller(): JobView[] {
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<JobView[]>([]);
  const sinceSeq = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      let events: JobEvent[];
      try {
        events = await ipcClient.getEvents(sinceSeq.current);
      } catch {
        return; // bridge absen / backend belum siap — coba lagi tick berikut
      }
      if (cancelled || events.length === 0) return;

      let sawTerminal = false;
      setJobs((prev) => {
        const byId = new Map(prev.map((j) => [j.jobId, j]));
        for (const e of events) {
          if (e.seq > sinceSeq.current) sinceSeq.current = e.seq;
          if (isTerminal(e.state)) sawTerminal = true;
          byId.set(e.job_id, {
            jobId: e.job_id,
            state: e.state,
            seq: e.seq,
            message: e.message ?? "",
            command: typeof e.command === "string" && e.command ? e.command : null,
            progress: typeof e.progress === "number" ? e.progress : null,
            startedAt: typeof e.started_at === "string" ? e.started_at : null,
            finishedAt: typeof e.finished_at === "string" ? e.finished_at : null,
          });
        }
        return [...byId.values()].sort((a, b) => b.seq - a.seq);
      });

      if (sawTerminal) {
        void queryClient.invalidateQueries();
      }
    };

    void poll();
    const timer = setInterval(() => void poll(), JOB_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [queryClient]);

  return jobs;
}
