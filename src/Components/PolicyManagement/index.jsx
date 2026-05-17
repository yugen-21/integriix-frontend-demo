import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PolicyList from "./Components/PolicyList";
import PolicyDetail from "./Components/PolicyDetail";
import PolicyForm from "./Components/PolicyForm";
import GeneratePolicyWizard from "./Components/GeneratePolicyWizard";
import { audienceRules, mockPolicies } from "../../data";
import {
  createPolicy,
  deletePolicy,
  fetchPolicies,
  fetchPolicyById,
  clearCurrentPolicy,
  updatePolicy,
  uploadVersion,
} from "../../store/policiesSlice";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

const STATUS_API_TO_UI = {
  draft: "Draft",
  in_review: "In Review",
  published: "Active",
  archived: "Archived",
};

function adaptApiPolicy(p) {
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    category: p.category ?? "—",
    owner: p.owner ?? "—",
    department: p.department ?? p.audience_rule ?? "—",
    status: STATUS_API_TO_UI[p.status] ?? p.status,
    nextReview: p.next_review_at ?? null,
    version: p.version ? `v${p.version}` : "—",
    accreditationTags: ["JCI"],
  };
}

function basename(path) {
  if (!path) return null;
  const parts = String(path).split(/[\\/]/);
  return parts[parts.length - 1] || null;
}

function describeActivity(entry) {
  const p = entry.payload ?? {};
  switch (entry.event_type) {
    case "uploaded":
      return `Uploaded version ${p.version ?? ""}`.trim();
    case "version_uploaded":
      return p.change_note
        ? `Uploaded version ${p.version} — ${p.change_note}`
        : `Uploaded version ${p.version}`;
    case "metadata_updated": {
      const fields = Object.keys(p.changes ?? {});
      return fields.length
        ? `Updated ${fields.join(", ")}`
        : "Updated metadata";
    }
    case "status_changed":
      return `Moved status from ${p.from} to ${p.to}${
        p.reason ? ` — ${p.reason}` : ""
      }`;
    case "deleted":
      return p.reason ? `Deleted — ${p.reason}` : "Deleted policy";
    case "restored":
      return p.reason ? `Restored — ${p.reason}` : "Restored policy";
    case "audited":
      return `Ran JCI audit (${p.covered ?? 0}/${p.total ?? 0} covered, ${
        p.gaps ?? 0
      } gaps)`;
    default:
      return entry.event_type;
  }
}

function adaptApiDetail(api) {
  const versions = (api.versions ?? []).slice();
  // Detail endpoint doesn't promise an order; sort newest-first.
  versions.sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    if (tb !== ta) return tb - ta;
    return (b.id ?? 0) - (a.id ?? 0);
  });
  const currentVersion = versions[0];

  const apiBase = import.meta.env.VITE_API_URL;

  const activityItems = (api.activity ?? []).map((entry) => ({
    id: entry.id,
    eventType: entry.event_type,
    at: entry.event_at,
    actor: entry.actor ?? null,
    action: describeActivity(entry),
  }));

  // Computed before versionItems / fileLink so it can serve as the
  // cache-buster on the PDF URL. Bumps every time activity ticks (new
  // version upload, status change, etc.) so caches don't serve stale PDFs.
  const lastActivityAt =
    activityItems[0]?.at ?? currentVersion?.created_at ?? api.uploaded_at;

  const versionItems = versions.map((v) => ({
    id: v.id,
    version: v.version ? `v${v.version}` : "—",
    isCurrent: currentVersion ? v.id === currentVersion.id : false,
    changeNote: v.change_note ?? `Version ${v.version} uploaded`,
    uploadedBy: v.uploaded_by ?? "—",
    uploadedAt: v.created_at,
    fileName: basename(v.file_path),
    // api.file_link is a path like "/v1/policies/2/file" — prepend the
    // backend host so download links don't resolve against the Vercel origin.
    // Same cache-buster as fileLink so the versions-tab "View PDF" link
    // also bypasses stale caches after a new version is uploaded.
    fileUrl:
      currentVersion && v.id === currentVersion.id && api.file_link
        ? `${apiBase}${api.file_link}?v=${encodeURIComponent(lastActivityAt ?? "")}`
        : null,
  }));

  // PolicyForm wants `audienceRule` as a known rule id ("all-staff") to
  // preselect the radio. Match the API's free-text audience_rule by label
  // (case-insensitive) — fall back to undefined so the form's
  // `inferAudienceFromPolicy` heuristic kicks in.
  const matchedRule = api.audience_rule
    ? audienceRules.find(
        (r) =>
          r.label.toLowerCase() === String(api.audience_rule).toLowerCase(),
      )
    : null;

  // PolicyForm's <input type="date"> wants YYYY-MM-DD, but next_review_date
  // is an ISO timestamp. Slice safely.
  const nextReviewDateOnly = api.next_review_date
    ? String(api.next_review_date).slice(0, 10)
    : null;

  return {
    id: api.id,
    code: api.code,
    title: api.name,
    category: api.category ?? "—",
    owner: api.owner ?? "—",
    department: api.department ?? api.audience_rule ?? "—",
    status: STATUS_API_TO_UI[api.status] ?? api.status,
    version: currentVersion ? `v${currentVersion.version}` : "—",
    lastUpdated: lastActivityAt,
    nextReview: nextReviewDateOnly,
    audienceRule: matchedRule?.id,
    accreditationTags: ["JCI"],
    // Backend returns a path like "/v1/policies/2/file"; prepend the API
    // base so iframes/downloads hit the tunnel host, not the Vercel origin.
    // Append a cache-buster keyed to the latest activity timestamp so that
    // uploading a new version forces every cache layer (browser, service
    // worker, Vercel edge, tunnel) to fetch fresh PDF bytes. The backend
    // ignores the unknown query param.
    fileLink: api.file_link
      ? `${apiBase}${api.file_link}?v=${encodeURIComponent(lastActivityAt ?? "")}`
      : null,
    detail: {
      summary: api.summary ?? "Summary not available yet.",
      appliesTo: api.audience_rule ? [api.audience_rule] : [],
      keyClauses: api.key_clauses ?? [],
      versions: versionItems,
      activity: activityItems,
      acknowledgements: {
        overallPercent: 0,
        targetPercent: 0,
        deadline: null,
        totalRequired: 0,
        byDepartment: [],
      },
      jciTags: [],
      aiInsights: {
        summary: { citations: [] },
        gapAnalysis: {},
      },
    },
  };
}

function readPolicyIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("policy");
  return id ? decodeURIComponent(id) : null;
}

function PolicyManagement() {
  const dispatch = useDispatch();
  const apiPolicies = useSelector((state) => state.policies);

  useEffect(() => {
    dispatch(fetchPolicies());
  }, [dispatch]);

  // Mutation watcher is declared after selectedPolicyId below.

  const [policies, setPolicies] = useState(mockPolicies);
  // Lazy initializer reads ?policy=ID from the URL so deep-links from
  // /search land directly on the detail view instead of the list.
  const [selectedPolicyId, setSelectedPolicyId] = useState(() => {
    const fromUrl = readPolicyIdFromUrl();
    if (!fromUrl) return null;
    const asInt = Number.parseInt(fromUrl, 10);
    return Number.isFinite(asInt) ? asInt : fromUrl;
  });
  const [initialDetailTab, setInitialDetailTab] = useState("overview");
  const [formState, setFormState] = useState(null);
  const [generateOpen, setGenerateOpen] = useState(false);

  // Fetch the deep-linked policy on mount. Separate effect so it only fires
  // when an ID was actually provided in the URL.
  useEffect(() => {
    if (selectedPolicyId !== null) {
      dispatch(fetchPolicyById(selectedPolicyId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  function handleSelectPolicy(id, tab = "overview") {
    setSelectedPolicyId(id);
    setInitialDetailTab(tab);
    dispatch(fetchPolicyById(id));
  }

  function handleBackToList() {
    setSelectedPolicyId(null);
    setInitialDetailTab("overview");
    dispatch(clearCurrentPolicy());
  }

  async function handleDeletePolicy(policyId, code) {
    const ok = window.confirm(`Delete ${code ?? "this policy"}? `);
    if (!ok) return;
    try {
      await dispatch(
        deletePolicy({
          policyId,
          actor: "Author",
          reason: "Deleted from list",
        }),
      ).unwrap();
      // Reducer already dropped it from state.items; refetch to pick up
      // any pagination shifts.
      dispatch(fetchPolicies());
    } catch (err) {
      window.alert(
        `Delete failed: ${err?.detail ?? err?.message ?? "unknown error"}`,
      );
    }
  }

  // When any server-side mutation lands (audit re-run, metadata edit, etc.),
  // refetch the open policy's detail so derived fields like `activity[]`
  // reflect the new state. We don't refetch on the very first render.
  const lastSeenMutationCount = useRef(apiPolicies.mutationCount ?? 0);
  useEffect(() => {
    const next = apiPolicies.mutationCount ?? 0;
    if (next !== lastSeenMutationCount.current) {
      lastSeenMutationCount.current = next;
      if (selectedPolicyId != null) {
        dispatch(fetchPolicyById(selectedPolicyId));
      }
    }
  }, [apiPolicies.mutationCount, selectedPolicyId, dispatch]);

  const selectedPolicy = useMemo(() => {
    if (!selectedPolicyId) return null;
    if (
      apiPolicies.current &&
      apiPolicies.current.id === selectedPolicyId &&
      apiPolicies.currentStatus === "succeeded"
    ) {
      return adaptApiDetail(apiPolicies.current);
    }
    return null;
  }, [selectedPolicyId, apiPolicies.current, apiPolicies.currentStatus]);

  const editingPolicy = useMemo(() => {
    if (!formState || formState.mode !== "edit") return null;
    // For edit, the form pre-fills from the API-loaded current policy.
    if (apiPolicies.current && apiPolicies.current.id === formState.policyId) {
      return adaptApiDetail(apiPolicies.current);
    }
    return null;
  }, [apiPolicies.current, formState]);

  const existingCodes = useMemo(() => {
    const skipId = formState?.mode === "edit" ? formState.policyId : null;
    return (apiPolicies.items ?? [])
      .filter((p) => p.id !== skipId)
      .map((p) => (p.code ?? "").toUpperCase());
  }, [apiPolicies.items, formState]);

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(policyId) {
    // Pre-fill needs the full detail (audience_rule, next_review_date, etc.).
    // If the detail isn't already loaded for this policy, kick off the
    // fetch — the form modal stays in a loading state until it arrives.
    if (!apiPolicies.current || apiPolicies.current.id !== policyId) {
      dispatch(fetchPolicyById(policyId));
    }
    setFormState({ mode: "edit", policyId });
  }

  function closeForm() {
    setFormState(null);
  }

  function openGenerate() {
    setGenerateOpen(true);
  }

  function closeGenerate() {
    setGenerateOpen(false);
  }

  // The wizard saved the generated policy (POST /generate/save returns the
  // created policy). Mirror the upload-create flow: close, refresh the
  // list, and drop into the new policy's detail page.
  function handleGenerated(created) {
    setGenerateOpen(false);
    dispatch(fetchPolicies());
    if (created?.id != null) {
      handleSelectPolicy(created.id);
    }
  }

  function nextPolicyId() {
    const maxNum = policies.reduce((max, p) => {
      const match = /^pol-(\d+)$/.exec(p.id);
      const num = match ? Number(match[1]) : 0;
      return num > max ? num : max;
    }, 0);
    return `pol-${String(maxNum + 1).padStart(3, "0")}`;
  }

  async function handleSave(values) {
    if (formState?.mode === "edit") {
      const id = formState.policyId;
      // Map form shape → API patch. API does NOT accept `code` (canonical) or
      // `status` (separate endpoint). audienceRule is a UI id ("all-staff");
      // API stores audience_rule as free text — send the rule's label.
      const audienceRule = audienceRules.find(
        (r) => r.id === values.audienceRule,
      );
      const patch = {
        title: values.title,
        category: values.category,
        owner: values.owner,
        department: values.department,
        audience_rule: audienceRule?.label ?? values.audienceRule ?? null,
        next_review_date: values.nextReview || null,
      };
      // Throws on rejection so the form can surface the error and stay open.
      await dispatch(updatePolicy({ policyId: id, patch })).unwrap();
      // Refresh the list so any sort/filter that depends on edited fields
      // shows the new values.
      dispatch(fetchPolicies());
      closeForm();
      return;
    }

    // Create flow: form has already staged the file (POST /upload) and is
    // passing back the temp_file_id. Confirm via POST /policies, refresh
    // the list, jump into the new policy's detail.
    if (!values.tempFileId) {
      throw new Error(
        "Missing staged upload. Drop the file again before saving.",
      );
    }
    const audienceRule = audienceRules.find(
      (r) => r.id === values.audienceRule,
    );
    const apiPayload = {
      temp_file_id: values.tempFileId,
      code: values.code,
      title: values.title,
      category: values.category || null,
      owner: values.owner || null,
      audience_rule: audienceRule?.label ?? values.audienceRule ?? null,
      next_review_date: values.nextReview || null,
      uploaded_by: "Author",
    };

    const created = await dispatch(createPolicy(apiPayload)).unwrap();
    dispatch(fetchPolicies());
    closeForm();
    if (created?.id != null) {
      // Drop the user straight into the new policy's detail page.
      handleSelectPolicy(created.id);
    }
  }

  async function handleUploadVersion({ file, changeNote, version }) {
    if (!selectedPolicyId) return;
    // Form gives us a "v2.0" label; API wants "2.0".
    const apiVersion = version ? String(version).replace(/^v/i, "") : null;
    // Throws on rejection so the uploader form can catch + surface the error.
    await dispatch(
      uploadVersion({
        policyId: selectedPolicyId,
        file,
        changeNote,
        version: apiVersion,
        // Free-text uploader name; no auth yet. Replace when login lands.
        uploadedBy: "Author",
      }),
    ).unwrap();
  }

  const displayPolicies = useMemo(
    () => (apiPolicies.items ?? []).map(adaptApiPolicy),
    [apiPolicies.items],
  );

  const isLoading = apiPolicies.status === "loading";
  const hasFailed = apiPolicies.status === "failed";

  const detailLoading =
    !!selectedPolicyId &&
    (apiPolicies.currentStatus === "loading" ||
      (apiPolicies.currentStatus !== "failed" && !selectedPolicy));
  const detailFailed =
    !!selectedPolicyId && apiPolicies.currentStatus === "failed";

  return (
    <>
      {hasFailed && (
        <div className="px-4 py-2 text-xs text-red-700 bg-red-50 border-b border-red-200">
          Failed to load policies:{" "}
          {apiPolicies.error?.message ?? "unknown error"}
        </div>
      )}
      {isLoading && displayPolicies.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500">
          Loading policies…
        </div>
      ) : selectedPolicyId ? (
        detailLoading ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Loading policy…
          </div>
        ) : detailFailed ? (
          <div className="grid place-items-center gap-3 px-4 py-12 text-sm">
            <p className="text-red-700">
              Failed to load policy:{" "}
              {apiPolicies.currentError?.message ?? "unknown error"}
            </p>
            <button
              type="button"
              onClick={handleBackToList}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to list
            </button>
          </div>
        ) : selectedPolicy ? (
          <PolicyDetail
            key={selectedPolicy.id}
            policy={selectedPolicy}
            initialTab={initialDetailTab}
            onBack={handleBackToList}
            onEdit={() => openEdit(selectedPolicy.id)}
            onUploadVersion={handleUploadVersion}
          />
        ) : null
      ) : (
        <PolicyList
          policies={displayPolicies}
          onSelect={handleSelectPolicy}
          onCreate={openCreate}
          onGenerate={openGenerate}
          onEdit={openEdit}
          onDelete={handleDeletePolicy}
        />
      )}

      {generateOpen && (
        <GeneratePolicyWizard
          onClose={closeGenerate}
          onGenerated={handleGenerated}
        />
      )}

      {formState &&
        (formState.mode === "edit" && !editingPolicy ? (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
          >
            <div className="rounded-2xl bg-white px-6 py-5 text-sm text-slate-600 shadow-xl">
              {apiPolicies.currentStatus === "failed"
                ? `Couldn't load policy: ${apiPolicies.currentError?.message ?? "unknown error"}`
                : "Loading policy…"}
            </div>
          </div>
        ) : (
          <PolicyForm
            mode={formState.mode}
            policy={editingPolicy}
            existingCodes={existingCodes}
            onClose={closeForm}
            onSave={handleSave}
          />
        ))}
    </>
  );
}

export default PolicyManagement;
