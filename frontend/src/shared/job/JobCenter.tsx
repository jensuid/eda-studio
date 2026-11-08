/**
 * JobCenter.tsx — P2-2 panel kanan: daftar job lintas fitur dari
 * `useJobPoller` (proyeksi event backend). Badge selalu teks + warna
 * (DS-CORE-001). Progress INDETERMINATE (B6/D-F5): `JobEvent` belum
 * membawa angka progress, jadi frontend tidak mengarang persentase;
 * `aria-valuenow` hanya pada state terminal (100%).
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
 * Progressbar jujur: non-terminal = indeterminate (tanpa `aria-valuenow`,
 * `aria-valuetext` menyebut state), terminal = complete 100%.
 */
function JobProgressBar({ jobId, state }: { jobId: string; state: JobState }) {
  const label = `Job ${jobId.slice(0, 8)} ${state}`;
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
            {job.message && <span> — {job.message}</span>}
            <JobProgressBar jobId={job.jobId} state={job.state} />
          </li>
        ))}
      </ul>
    </section>
  );
}
