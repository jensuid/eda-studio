/**
 * JobCenter.tsx — panel kanan: daftar job lintas fitur dari
 * `useJobPoller` (proyeksi event backend). Badge selalu teks + warna
 * (DS-CORE-001).
 *
 * D-F5/D-S8: bila `JobEvent.progress` berangka nyata (0..1) bar
 * determinate dengan `aria-valuenow`; bila null bar INDETERMINATE
 * (tanpa `aria-valuenow`) — frontend tidak mengarang persentase.
 * Bila `JobEvent.command` ada, state "In Progress" ditampilkan
 * (D-S8 mensyaratkannya); tanpa command tidak ada label karangan.
 * State terminal selalu complete (100%) bila progress belum 1.
 */
import { isTerminal, useJobPoller } from "./JobClient";
import type { JobState } from "../ipc/generated";

function badgeClass(state: JobState): string {
  if (state === "Completed") return "status-success";
  if (state === "Failed" || state === "Cancelled" || state === "Interrupted") return "status-danger";
  if (state === "Queued" || state === "Created") return "status-warning";
  return "";
}

/**
 * Progressbar jujur: progress nyata = determinate (`aria-valuenow` persen),
 * null = indeterminate (tanpa `aria-valuenow`), terminal = complete 100%.
 */
function JobProgressBar({
  jobId,
  state,
  progress,
}: {
  jobId: string;
  state: JobState;
  progress: number | null;
}) {
  const label = `Job ${jobId.slice(0, 8)} ${state}`;
  if (typeof progress === "number") {
    const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
    return (
      <div
        className="job-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}%`}
      >
        <div className="job-progress-fill" style={{ width: `${pct}%` }} />
      </div>
    );
  }
  if (isTerminal(state)) {
    return (
      <div
        className="job-progress"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={100}
      >
        <div className="job-progress-fill" style={{ width: "100%" }} />
      </div>
    );
  }
  const verb = state === "Cancelling" ? "Membatalkan" : "Sedang berjalan";
  return (
    <div
      className="job-progress"
      role="progressbar"
      aria-label={label}
      aria-valuetext={`${verb}: ${state}`}
    >
      <div className="job-progress-fill" style={{ width: "100%", opacity: 0.45 }} />
    </div>
  );
}

export function JobCenter() {
  const jobs = useJobPoller();

  return (
    <section aria-label="Job Center">
      <h2>Job Center</h2>
      {jobs.length === 0 && <p>Belum ada job. Jalankan analisis dari fitur mana pun.</p>}
      <ul className="job-list">
        {jobs.map((job) => (
          <li key={job.jobId} className="job-item">
            <span className={badgeClass(job.state)}>{job.state}</span>{" "}
            <code>{job.jobId.slice(0, 8)}</code>
            {job.command && !isTerminal(job.state) && (
              <>
                {" "}
                — In Progress: <code>{job.command}</code>
              </>
            )}
            {job.command && isTerminal(job.state) && (
              <>
                {" "}
                — <code>{job.command}</code>
              </>
            )}
            {job.message && <span> — {job.message}</span>}
            <JobProgressBar jobId={job.jobId} state={job.state} progress={job.progress} />
          </li>
        ))}
      </ul>
    </section>
  );
}
