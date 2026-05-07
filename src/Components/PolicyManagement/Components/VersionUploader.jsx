import { useEffect, useMemo, useRef, useState } from "react";
import {
  FaCheck,
  FaCircleExclamation,
  FaCloudArrowUp,
  FaFilePdf,
  FaSpinner,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";

const NOTE_MIN = 10;
const MAX_BYTES = 25 * 1024 * 1024;

function bumpVersion(label) {
  const num = parseFloat(String(label ?? "").replace(/^v/i, ""));
  const safe = Number.isFinite(num) ? num : 1.0;
  return `v${(safe + 0.1).toFixed(1)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function VersionUploader({ policy, onClose, onUpload }) {
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [note, setNote] = useState("");
  const [touchedNote, setTouchedNote] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const inputRef = useRef(null);
  const noteRef = useRef(null);

  const recentVersions = policy?.detail?.versions ?? [];
  const currentVersionLabel =
    recentVersions.find((v) => v.isCurrent)?.version ?? policy?.version ?? "v1.0";
  const newVersionLabel = useMemo(
    () => bumpVersion(currentVersionLabel),
    [currentVersionLabel],
  );

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const noteError = useMemo(() => {
    const trimmed = note.trim();
    if (!trimmed) return "Add a short note describing what changed.";
    if (trimmed.length < NOTE_MIN)
      return `Use at least ${NOTE_MIN} characters so reviewers know what changed.`;
    return null;
  }, [note]);

  function pickFile(candidate) {
    if (!candidate) return;
    const isPdf =
      candidate.type === "application/pdf" ||
      /\.pdf$/i.test(candidate.name ?? "");
    if (!isPdf) {
      setFile(null);
      setFileError("Only PDF files are accepted for policy versions.");
      return;
    }
    if (candidate.size > MAX_BYTES) {
      setFile(null);
      setFileError("File is larger than 25 MB.");
      return;
    }
    setFileError(null);
    setFile(candidate);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) pickFile(dropped);
  }

  function handleSelect(event) {
    const chosen = event.target.files?.[0];
    if (chosen) pickFile(chosen);
    event.target.value = "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    setTouchedNote(true);
    if (!file) {
      setFileError("Drop a PDF or choose one to continue.");
      return;
    }
    if (noteError) {
      noteRef.current?.focus();
      return;
    }

    setStatus("uploading");
    window.setTimeout(() => {
      onUpload?.({
        file,
        changeNote: note.trim(),
        version: newVersionLabel,
      });
    }, 700);
  }

  const showNoteError = (touchedNote || submitted) && noteError;
  const uploading = status === "uploading";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-uploader-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose?.();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="grid max-h-full w-full max-w-3xl gap-5 overflow-y-auto rounded-3xl border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.25)] max-[520px]:rounded-2xl max-[520px]:p-4"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700">
              Upload new version
            </p>
            <h2
              id="version-uploader-title"
              className="mt-1 text-lg font-semibold leading-tight text-slate-900"
            >
              {policy?.code}
              <span className="ml-2 font-normal text-slate-500">
                {policy?.title}
              </span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Replaces{" "}
              <span className="font-semibold text-slate-700">
                {currentVersionLabel}
              </span>{" "}
              with{" "}
              <span className="font-semibold text-cyan-700">
                {newVersionLabel}
              </span>{" "}
              once approved.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close uploader"
          >
            <FaXmark className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid gap-4">
            <FileDrop
              file={file}
              fileError={fileError}
              dragging={dragging}
              uploading={uploading}
              onDragEnter={() => !uploading && setDragging(true)}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onPick={() => inputRef.current?.click()}
              onClear={() => {
                setFile(null);
                setFileError(null);
              }}
              inputRef={inputRef}
              onSelect={handleSelect}
            />

            <div className="grid gap-1.5">
              <label
                htmlFor="version-change-note"
                className="text-[11px] font-semibold uppercase tracking-wide text-slate-600"
              >
                What changed in this version{" "}
                <span className="text-red-600">*</span>
              </label>
              <textarea
                id="version-change-note"
                ref={noteRef}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => setTouchedNote(true)}
                rows={4}
                placeholder="e.g. Updated escalation thresholds and added section on weekend cover."
                disabled={uploading}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-xs leading-5 text-slate-900 outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60 ${
                  showNoteError
                    ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                    : "border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                }`}
              />
              {showNoteError ? (
                <p className="flex items-center gap-1 text-[11px] font-medium text-red-700">
                  <FaCircleExclamation
                    className="h-2.5 w-2.5"
                    aria-hidden="true"
                  />
                  {noteError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Reviewers see this note in the version history and the audit
                  log.
                </p>
              )}
            </div>
          </div>

          <aside className="grid gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Recent versions
            </p>
            {recentVersions.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                No previous versions on file.
              </p>
            ) : (
              <ol className="grid gap-2">
                {recentVersions.slice(0, 4).map((version) => (
                  <li
                    key={version.id}
                    className={`grid gap-0.5 rounded-lg border bg-white px-3 py-2 text-[11px] ${
                      version.isCurrent
                        ? "border-cyan-200 ring-1 ring-cyan-200"
                        : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {version.version}
                      </span>
                      {version.isCurrent && (
                        <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 text-slate-600">
                      {version.changeNote}
                    </p>
                    <p className="text-slate-400">
                      {version.uploadedBy} · {formatDate(version.uploadedAt)}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {uploading ? (
              <>
                <FaSpinner className="h-3 w-3 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              <>
                <FaCheck className="h-3 w-3" aria-hidden="true" />
                Upload {newVersionLabel}
              </>
            )}
          </button>
        </footer>
      </form>
    </div>
  );
}

function FileDrop({
  file,
  fileError,
  dragging,
  uploading,
  onDragEnter,
  onDragLeave,
  onDrop,
  onPick,
  onClear,
  inputRef,
  onSelect,
}) {
  if (file) {
    return (
      <div className="grid gap-2 rounded-2xl border-2 border-cyan-200 bg-cyan-50/60 px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-white text-cyan-700 shadow-sm">
            <FaFilePdf className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {file.name}
            </p>
            <p className="text-[11px] text-slate-600">
              {formatSize(file.size)} · ready to upload
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            disabled={uploading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaTrash className="h-3 w-3" aria-hidden="true" />
            Replace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative grid gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
        fileError
          ? "border-red-300 bg-red-50/70"
          : dragging
            ? "border-cyan-500 bg-cyan-50"
            : "border-slate-300 bg-slate-50/70 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onSelect}
        className="hidden"
      />

      <span className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-white text-slate-700 shadow-sm">
        <FaCloudArrowUp className="h-4 w-4" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-800">
        Drop the new PDF here
      </p>
      <p className="text-[11px] text-slate-500">
        PDF only · up to 25 MB
      </p>
      <div className="mt-1 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPick}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <FaFilePdf className="h-3 w-3" aria-hidden="true" />
          Choose file
        </button>
      </div>
      {fileError && (
        <p
          className="mx-auto mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-red-700"
          role="alert"
        >
          <FaCircleExclamation className="h-2.5 w-2.5" aria-hidden="true" />
          {fileError}
        </p>
      )}
    </div>
  );
}

export default VersionUploader;
