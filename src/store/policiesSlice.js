import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import policyAPI from "../services/policyAPI";

// GET /v1/policies — paginated list with filters / sort / search
export const fetchPolicies = createAsyncThunk(
  "policies/fetchPolicies",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await policyAPI.listPolicies(params);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// GET /v1/policies/{id} — full detail for one policy
export const fetchPolicyById = createAsyncThunk(
  "policies/fetchPolicyById",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await policyAPI.getPolicy(policyId);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// GET /v1/policies/{id}/versions — version history for one policy
export const fetchPolicyVersions = createAsyncThunk(
  "policies/fetchPolicyVersions",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await policyAPI.listVersions(policyId);
      return { policyId, data: res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// GET /v1/policies/{id}/audit — most recent audit
// 404 means "audit hasn't landed yet" (background pipeline still running, or
// never run). We treat it as a `pending` state so the UI can poll, not a hard
// failure. Other errors → rejected.
export const fetchAudit = createAsyncThunk(
  "policies/fetchAudit",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await policyAPI.getAudit(policyId);
      return { policyId, data: res.data, pending: false };
    } catch (err) {
      if (err.response?.status === 404) {
        return { policyId, data: null, pending: true };
      }
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// GET /v1/policies/{id}/risks — risks this policy controls.
// `pending: true` from the backend means the background linker hasn't
// finished for a freshly-uploaded policy — the UI shows a spinner and
// polls, exactly like the audit pattern above.
export const fetchControlledRisks = createAsyncThunk(
  "policies/fetchControlledRisks",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await policyAPI.getControlledRisks(policyId);
      return {
        policyId,
        items: res.data.items ?? [],
        pending: Boolean(res.data.pending),
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// DELETE /v1/policies/{id} — soft-delete. Idempotent (200 with
// `was_already_deleted: true` on a second call). Optional actor/reason go
// as query params.
export const deletePolicy = createAsyncThunk(
  "policies/deletePolicy",
  async ({ policyId, actor, reason }, { rejectWithValue }) => {
    try {
      const res = await policyAPI.deletePolicy(policyId, { actor, reason });
      return { policyId, data: res.data };
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Delete failed" },
      );
    }
  },
);

// POST /v1/policies/upload — stage a new-policy upload (multipart).
// Returns { temp_file_id, code, title, category, next_review_date, ... }
// for the create form to pre-fill from. No DB writes yet — the user can
// still cancel.
export const stagePolicyUpload = createAsyncThunk(
  "policies/stagePolicyUpload",
  async (file, { rejectWithValue }) => {
    try {
      const res = await policyAPI.stageUpload(file);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Upload failed" },
      );
    }
  },
);

// POST /v1/policies — confirm a staged upload, persists policy + v1 + activity.
export const createPolicy = createAsyncThunk(
  "policies/createPolicy",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await policyAPI.createPolicy(payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Create failed" },
      );
    }
  },
);

// DELETE /v1/policies/upload/{temp_file_id} — fire-and-forget cleanup of a
// staged upload the user abandoned (closed the form before confirming).
export const cancelStagedPolicyUpload = createAsyncThunk(
  "policies/cancelStagedPolicyUpload",
  async (tempFileId) => {
    try {
      await policyAPI.cancelStagedUpload(tempFileId);
    } catch (_) {
      // best-effort, ignore failure
    }
    return tempFileId;
  },
);

// Upload a new version: stage (multipart) → confirm (JSON). Two API calls
// behind one thunk — if the confirm fails, we best-effort cancel the staged
// temp file so it doesn't pollute uploads/temp/.
export const uploadVersion = createAsyncThunk(
  "policies/uploadVersion",
  async (
    { policyId, file, changeNote, version, uploadedBy, nextReviewDate },
    { rejectWithValue },
  ) => {
    let tempFileId = null;
    try {
      const stageRes = await policyAPI.stageVersionUpload(policyId, file);
      tempFileId = stageRes.data.temp_file_id;

      const payload = { temp_file_id: tempFileId };
      if (version) payload.version = version;
      if (changeNote) payload.change_note = changeNote;
      if (uploadedBy) payload.uploaded_by = uploadedBy;
      if (nextReviewDate) payload.next_review_date = nextReviewDate;

      const confirmRes = await policyAPI.createVersion(policyId, payload);
      return { policyId, data: confirmRes.data };
    } catch (err) {
      if (tempFileId) {
        try {
          await policyAPI.cancelStagedUpload(tempFileId);
        } catch (_) {
          // best-effort cleanup
        }
      }
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Upload failed" },
      );
    }
  },
);

// PATCH /v1/policies/{id}/status — move through the lifecycle.
// Backend validates the transition; 409 on illegal moves.
export const changeStatus = createAsyncThunk(
  "policies/changeStatus",
  async ({ policyId, payload }, { rejectWithValue }) => {
    try {
      const res = await policyAPI.changeStatus(policyId, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// PATCH /v1/policies/{id} — partial metadata update.
// Returns a PolicyListItem; we use it to refresh both the list row and the
// `current` detail object so the UI reflects the change immediately.
export const updatePolicy = createAsyncThunk(
  "policies/updatePolicy",
  async ({ policyId, patch }, { rejectWithValue }) => {
    try {
      const res = await policyAPI.updatePolicy(policyId, patch);
      return res.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

// POST /v1/policies/{id}/audit — manually re-run the audit
// 409 means "chunks not yet written" (embed step still running). Same as 404
// on GET — switch to polling mode rather than fail.
export const runAudit = createAsyncThunk(
  "policies/runAudit",
  async (policyId, { rejectWithValue }) => {
    try {
      const res = await policyAPI.runAudit(policyId);
      return { policyId, data: res.data, pending: false };
    } catch (err) {
      if (err.response?.status === 409) {
        return { policyId, data: null, pending: true };
      }
      return rejectWithValue(
        err.response?.data ?? { message: err.message ?? "Request failed" }
      );
    }
  }
);

const initialState = {
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,

  current: null,
  currentStatus: "idle",
  currentError: null,

  versions: [],
  versionsPolicyId: null,
  versionsStatus: "idle",
  versionsError: null,

  audit: null,
  auditPolicyId: null,
  // 'idle' | 'loading' | 'pending' | 'succeeded' | 'failed'
  // 'pending' = audit not yet written (or chunks not ready) — caller polls.
  auditStatus: "idle",
  auditError: null,

  controlledRisks: [],
  controlledRisksPolicyId: null,
  // 'idle' | 'loading' | 'pending' | 'succeeded' | 'failed'
  // 'pending' = background linker still computing for this policy — poll.
  controlledRisksStatus: "idle",
  controlledRisksError: null,

  editStatus: "idle",
  editError: null,

  statusChangeStatus: "idle",
  statusChangeError: null,

  versionUploadStatus: "idle",
  versionUploadError: null,

  createStatus: "idle",
  createError: null,

  deleteStatus: "idle",
  deleteError: null,

  // Tick on every server-side mutation that writes a new activity row
  // (audit re-run, metadata edit, status change, etc.). Components watch
  // this so they can refetch the detail and surface the new event.
  mutationCount: 0,
};

const policiesSlice = createSlice({
  name: "policies",
  initialState,
  reducers: {
    clearPolicies(state) {
      state.items = [];
      state.total = 0;
      state.status = "idle";
      state.error = null;
    },
    clearCurrentPolicy(state) {
      state.current = null;
      state.currentStatus = "idle";
      state.currentError = null;
      state.versions = [];
      state.versionsPolicyId = null;
      state.versionsStatus = "idle";
      state.versionsError = null;
      state.audit = null;
      state.auditPolicyId = null;
      state.auditStatus = "idle";
      state.auditError = null;
      state.controlledRisks = [];
      state.controlledRisksPolicyId = null;
      state.controlledRisksStatus = "idle";
      state.controlledRisksError = null;
      state.editStatus = "idle";
      state.editError = null;
      state.statusChangeStatus = "idle";
      state.statusChangeError = null;
      state.versionUploadStatus = "idle";
      state.versionUploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolicies.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPolicies.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items ?? [];
        state.total = action.payload.total ?? 0;
        state.limit = action.payload.limit ?? state.limit;
        state.offset = action.payload.offset ?? 0;
      })
      .addCase(fetchPolicies.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? { message: "Request failed" };
      })
      .addCase(fetchPolicyById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
      })
      .addCase(fetchPolicyById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchPolicyById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload ?? { message: "Request failed" };
      })
      .addCase(fetchPolicyVersions.pending, (state, action) => {
        state.versionsStatus = "loading";
        state.versionsError = null;
        state.versionsPolicyId = action.meta.arg;
      })
      .addCase(fetchPolicyVersions.fulfilled, (state, action) => {
        state.versionsStatus = "succeeded";
        state.versions = action.payload.data.items ?? [];
        state.versionsPolicyId = action.payload.policyId;
      })
      .addCase(fetchPolicyVersions.rejected, (state, action) => {
        state.versionsStatus = "failed";
        state.versionsError = action.payload ?? { message: "Request failed" };
      })
      .addCase(fetchAudit.pending, (state, action) => {
        const incomingId = action.meta.arg;
        // Switching policy → wipe stale data so we don't briefly show
        // another policy's audit.
        if (state.auditPolicyId != null && state.auditPolicyId !== incomingId) {
          state.audit = null;
        }
        state.auditPolicyId = incomingId;
        state.auditError = null;
        // Don't flicker to 'loading' on background polls when we're already
        // pending or have data — only show the spinner on first load.
        if (
          state.auditStatus !== "pending" &&
          state.auditStatus !== "succeeded"
        ) {
          state.auditStatus = "loading";
        }
      })
      .addCase(fetchAudit.fulfilled, (state, action) => {
        state.auditPolicyId = action.payload.policyId;
        const auditData = action.payload.data;
        if (action.payload.pending) {
          state.auditStatus = "pending";
          state.audit = null;
        } else if (auditData?.failed) {
          // The background audit run errored server-side. Stop polling and
          // let the UI offer a re-run instead of a forever spinner.
          state.auditStatus = "errored";
          state.audit = null;
          state.auditError = {
            message: auditData.error || "The audit run failed.",
          };
        } else {
          state.auditStatus = "succeeded";
          state.audit = auditData;
        }
      })
      .addCase(fetchAudit.rejected, (state, action) => {
        state.auditStatus = "failed";
        state.auditError = action.payload ?? { message: "Request failed" };
      })
      .addCase(fetchControlledRisks.pending, (state, action) => {
        const incomingId = action.meta.arg;
        if (
          state.controlledRisksPolicyId != null &&
          state.controlledRisksPolicyId !== incomingId
        ) {
          state.controlledRisks = [];
        }
        state.controlledRisksPolicyId = incomingId;
        state.controlledRisksError = null;
        // Don't flicker to 'loading' on background polls once we're
        // already pending or have data — only spinner on first load.
        if (
          state.controlledRisksStatus !== "pending" &&
          state.controlledRisksStatus !== "succeeded"
        ) {
          state.controlledRisksStatus = "loading";
        }
      })
      .addCase(fetchControlledRisks.fulfilled, (state, action) => {
        state.controlledRisksPolicyId = action.payload.policyId;
        if (action.payload.pending) {
          state.controlledRisksStatus = "pending";
          state.controlledRisks = [];
        } else {
          state.controlledRisksStatus = "succeeded";
          state.controlledRisks = action.payload.items;
        }
      })
      .addCase(fetchControlledRisks.rejected, (state, action) => {
        state.controlledRisksStatus = "failed";
        state.controlledRisksError =
          action.payload ?? { message: "Request failed" };
      })
      .addCase(runAudit.pending, (state, action) => {
        state.auditPolicyId = action.meta.arg;
        state.auditStatus = "loading";
        state.auditError = null;
      })
      .addCase(runAudit.fulfilled, (state, action) => {
        state.auditPolicyId = action.payload.policyId;
        if (action.payload.pending) {
          state.auditStatus = "pending";
        } else {
          state.auditStatus = "succeeded";
          state.audit = action.payload.data;
          // A real audit run wrote an `audited` activity row server-side.
          state.mutationCount += 1;
        }
      })
      .addCase(runAudit.rejected, (state, action) => {
        state.auditStatus = "failed";
        state.auditError = action.payload ?? { message: "Request failed" };
      })
      .addCase(updatePolicy.pending, (state) => {
        state.editStatus = "loading";
        state.editError = null;
      })
      .addCase(updatePolicy.fulfilled, (state, action) => {
        state.editStatus = "succeeded";
        state.mutationCount += 1;
        const updated = action.payload;
        // Splice into the list so the row reflects new title/owner/etc.
        const idx = state.items.findIndex((p) => p.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        // Merge the updated fields into `current` so the open detail page
        // updates without a refetch. The PATCH response is a PolicyListItem
        // (no summary/key_clauses/versions/activity) — keep the existing
        // detail-only fields and overlay the rest.
        if (state.current && state.current.id === updated.id) {
          state.current = {
            ...state.current,
            code: updated.code,
            // Detail uses `name` for title; sync from PolicyListItem.title.
            name: updated.title,
            category: updated.category,
            owner: updated.owner,
            department: updated.department,
            audience_rule: updated.audience_rule,
            status: updated.status,
            next_review_date: updated.next_review_at,
            deleted_at: updated.deleted_at,
          };
        }
      })
      .addCase(updatePolicy.rejected, (state, action) => {
        state.editStatus = "failed";
        state.editError = action.payload ?? { message: "Request failed" };
      })
      .addCase(changeStatus.pending, (state) => {
        state.statusChangeStatus = "loading";
        state.statusChangeError = null;
      })
      .addCase(changeStatus.fulfilled, (state, action) => {
        state.statusChangeStatus = "succeeded";
        state.mutationCount += 1;
        const updated = action.payload;
        const idx = state.items.findIndex((p) => p.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
        if (state.current && state.current.id === updated.id) {
          state.current = {
            ...state.current,
            status: updated.status,
          };
        }
      })
      .addCase(changeStatus.rejected, (state, action) => {
        state.statusChangeStatus = "failed";
        state.statusChangeError = action.payload ?? {
          message: "Request failed",
        };
      })
      .addCase(uploadVersion.pending, (state) => {
        state.versionUploadStatus = "loading";
        state.versionUploadError = null;
      })
      .addCase(uploadVersion.fulfilled, (state) => {
        state.versionUploadStatus = "succeeded";
        // Tick mutation count so detail (activity, version pointer, status)
        // and versions tab can refetch.
        state.mutationCount += 1;
      })
      .addCase(uploadVersion.rejected, (state, action) => {
        state.versionUploadStatus = "failed";
        state.versionUploadError = action.payload ?? {
          message: "Upload failed",
        };
      })
      .addCase(createPolicy.pending, (state) => {
        state.createStatus = "loading";
        state.createError = null;
      })
      .addCase(createPolicy.fulfilled, (state) => {
        state.createStatus = "succeeded";
        // Caller refetches the list; we don't splice here because the
        // PolicyCreateResponse shape differs slightly from PolicyListItem
        // (e.g. no `version` enriched on it) and we'd rather show the
        // canonical list view.
      })
      .addCase(createPolicy.rejected, (state, action) => {
        state.createStatus = "failed";
        state.createError = action.payload ?? { message: "Create failed" };
      })
      .addCase(deletePolicy.pending, (state) => {
        state.deleteStatus = "loading";
        state.deleteError = null;
      })
      .addCase(deletePolicy.fulfilled, (state, action) => {
        state.deleteStatus = "succeeded";
        // Drop from the list view; the canonical refetch via fetchPolicies
        // is dispatched by the caller, but trimming here makes the row
        // disappear immediately.
        state.items = state.items.filter(
          (p) => p.id !== action.payload.policyId,
        );
        // If the deleted policy was the one open, mark current as gone so
        // the detail page bails to the list.
        if (state.current && state.current.id === action.payload.policyId) {
          state.current = null;
          state.currentStatus = "idle";
        }
      })
      .addCase(deletePolicy.rejected, (state, action) => {
        state.deleteStatus = "failed";
        state.deleteError = action.payload ?? { message: "Delete failed" };
      });
  },
});

export const { clearPolicies, clearCurrentPolicy } = policiesSlice.actions;
export default policiesSlice.reducer;
