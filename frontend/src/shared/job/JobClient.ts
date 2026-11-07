/**
 * JobClient.ts — P2-2 job polling client.
 *
 * Backend-authoritative job lifecycle (SYS-015): frontend hanya memproyeksikan
 * event dari `ipcClient.getEvents(sinceSeq)` — tidak pernah mengarang status.
 * Polling tiap 1 dtk; sejak P2-2 `getEvents` tidak lagi tak-terpakai.
 *
 * Catatan jujur dua keterbatasan kontrak event saat ini:
 *  1. `JobEvent` tidak membawa nama command, jadi invalidasi saat job terminal
 *     dilakukan ke SEMUA query aktif (bukan per-query). Saat kontrak event
 *     membawa command, persempit ke query key terkait.
 *  2. `JobEvent` tidak membawa angka progress; bar determinate di Job Center
 *     dipetakan dari state (lihat `jobProgress`) — bukan angka dari backend.
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
}

const TERMINAL_STATES: ReadonlySet<JobState> = new Set([
  "Completed",
  "Failed",
  "Cancelled",
  "Interrupted",
]);

/** Progress determinate (0–100) per state — proyeksi visual, bukan data backend. */
export function jobProgress(state: JobState): number {
  switch (state) {
    case "Created":
      return 5;
    case "Queued":
      return 15;
    case "Preparing":
      return 35;
    case "Running":
      return 70;
    case "Cancelling":
      return 85;
    case "Completed":
    case "Failed":
    case "Cancelled":
    case "Interrupted":
      return 100;
    default:
      return 0;
  }
}

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
