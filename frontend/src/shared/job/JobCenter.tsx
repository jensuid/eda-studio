/**
 * JobCenter.tsx — P2-2 panel kanan: daftar job lintas fitur dari
 * `useJobPoller` (proyeksi event backend). Badge selalu teks + warna
 * (DS-CORE-001). Progress determinate dari `jobProgress`.
 */
import { jobProgress, useJobPoller } from "./JobClient";
import type { JobState } from "../ipc/generated";

function badgeClass(state: JobState): string {
  if (state === "Completed") return "status-success";
  if (state === "Failed" || state === "Cancelled" || state === "Interrupted") return "status-danger";
  if (state === "Queued" || state === "Created") return "status-warning";
  return "";
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
            <div
              className="job-progress"
              role="progressbar"
              aria-label={`Job ${job.jobId.slice(0, 8)} ${job.state}`}
              aria-valuenow={jobProgress(job.state)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="job-progress-fill" style={{ width: `${jobProgress(job.state)}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
