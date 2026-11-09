/**
 * CommandPalette.tsx — Phase 2 (FLOW-SHELL-001 §2.8, D-S6): palet perintah
 * global Cmd+K / Ctrl+K. Pola combobox + listbox:
 * - fokus ke input pencarian saat dibuka; ↑/↓ navigasi roving
 *   (melompati opsi disabled); Enter jalankan; Esc tutup + focus return
 *   ke pemicu (ditangani pemilik state di App).
 * - Tab terjebak di dalam dialog (focus trap sederhana: semua fokus
 *   kembali ke input — listbox dioperasikan via panah, bukan Tab).
 * - error perintah tampil sebagai error fitur INLINE di dalam dialog
 *   (role="alert"), bukan banner protokol dan bukan toast: kanal D-F6
 *   khusus concern palet.
 * - membuka palet TIDAK MENJALANKAN perintah apa pun; perintah hanya
 *   jalan saat Enter/klik pada opsi aktif.
 */
import { useEffect, useRef, useState } from "react";
import { SHELL_COPY } from "../shared/copy/shellCopy";
import { IpcError } from "../shared/ipc/ipcClient";
import {
  buildCommands,
  filterCommands,
  type PaletteCommand,
  type PaletteContext,
} from "./commandRegistry";

interface PaletteError {
  headline: string;
  detail: string;
}

function errorFrom(label: string, e: unknown): PaletteError {
  const code = e instanceof IpcError ? e.code : "UNKNOWN";
  const raw = e instanceof Error ? e.message : String(e);
  return {
    headline: SHELL_COPY.paletteFailed(label),
    detail: `code: ${code}\nmessage: ${raw}`,
  };
}

export function CommandPalette({
  ctx,
  onClose,
}: {
  ctx: PaletteContext;
  /** Navigated=true bila penutupan setelah perintah sukses berpindah route
   * (fokus diserahkan ke main oleh efek route App — R3/R4). */
  onClose: (navigated: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<PaletteError | null>(null);

  // Daftar dihitung dari konteks saat render — disabled selalu terkini.
  const all = buildCommands(ctx);
  const visible = filterCommands(all, query);
  const enabled = visible.filter((c) => !c.disabledReason);

  // Fokus ke input saat dialog dibuka; query kosong + aktif opsi pertama.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveId(enabled[0]?.id ?? null);
    // enabled dihitung dari query; reset aktif tiap query berubah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const active = visible.find((c) => c.id === activeId) ?? null;

  const run = async (cmd: PaletteCommand) => {
    if (cmd.disabledReason || running) return;
    setRunning(true);
    setError(null);
    try {
      await cmd.run(ctx);
      onClose(true);
    } catch (e) {
      setError(errorFrom(cmd.label, e));
    } finally {
      setRunning(false);
    }
  };

  const move = (dir: 1 | -1) => {
    if (enabled.length === 0) return;
    const idx = enabled.findIndex((c) => c.id === activeId);
    const next =
      idx === -1
        ? (dir === 1 ? 0 : enabled.length - 1)
        : (idx + dir + enabled.length) % enabled.length;
    const target = enabled[next];
    if (target) setActiveId(target.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active && !active.disabledReason) void run(active);
    } else if (e.key === "Tab") {
      // Focus trap: dialog modal — fokus tidak boleh keluar.
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="palette-overlay"
      // Klik overlay menutup; klik di dalam dialog tidak.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={SHELL_COPY.paletteTitle}
        onKeyDown={onKeyDown}
        style={{ maxWidth: 520, margin: "10vh auto 0", background: "Canvas", color: "CanvasText" }}
      >
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded="true"
          aria-controls="palette-listbox"
          aria-activedescendant={
            activeId ? `palette-opt-${activeId}` : undefined
          }
          aria-label={SHELL_COPY.paletteSearchLabel}
          placeholder={SHELL_COPY.paletteSearchPlaceholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        {visible.length > 0 ? (
          <ul role="listbox" id="palette-listbox" aria-label={SHELL_COPY.paletteTitle}>
            {visible.map((c) => {
              const isActive = c.id === activeId;
              return (
                <li
                  key={c.id}
                  id={`palette-opt-${c.id}`}
                  role="option"
                  data-command-id={c.id}
                  aria-selected={isActive}
                  aria-disabled={c.disabledReason ? true : undefined}
                  onMouseEnter={() => {
                    if (!c.disabledReason) setActiveId(c.id);
                  }}
                  onClick={() => void run(c)}
                  style={isActive ? { background: "Highlight", color: "HighlightText" } : undefined}
                >
                  <span>{c.label}</span>{" "}
                  <span>{c.category}</span>
                  {c.disabledReason && <span> — {c.disabledReason}</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p role="status">{SHELL_COPY.paletteEmpty}</p>
        )}
        {running && (
          <p role="status" aria-live="polite">
            {SHELL_COPY.paletteRunning}
          </p>
        )}
        {error && (
          <div role="alert">
            <p>{error.headline}</p>
            <pre>{error.detail}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
