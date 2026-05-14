import { createSlice } from "@reduxjs/toolkit";
import {
  effectivenessPolicies,
  mockEvidenceUploads,
} from "../data/mockEvidence";

const initialState = {
  uploads: mockEvidenceUploads,
  policies: effectivenessPolicies,
  selectedUploadId: null,
  filters: {
    search: "",
    department: "All",
    status: "All",
    complianceBand: "All",
    dateRange: "All",
  },
};

// Average compliance across the policyResults of a single upload.
function uploadAverageCompliance(upload) {
  const results = upload?.verdict?.policyResults ?? [];
  if (results.length === 0) return null;
  const sum = results.reduce((acc, r) => acc + (r.compliancePercent ?? 0), 0);
  return Math.round(sum / results.length);
}

const operativeEffectivenessSlice = createSlice({
  name: "operativeEffectiveness",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    selectUpload: (state, action) => {
      state.selectedUploadId = action.payload;
    },
    clearSelectedUpload: (state) => {
      state.selectedUploadId = null;
    },
    // Override a single finding inside one policyResult of one upload.
    // Payload: { uploadId, policyId, findingId, override }
    overrideFinding: (state, action) => {
      const { uploadId, policyId, findingId, override } = action.payload;
      const upload = state.uploads.find((u) => u.id === uploadId);
      if (!upload) return;
      const result = upload.verdict?.policyResults?.find(
        (r) => r.policyId === policyId,
      );
      if (!result) return;
      const finding = result.findings.find((f) => f.id === findingId);
      if (!finding) return;
      finding.override = override;
      // Mark the upload as overridden when the officer has touched any
      // finding but not yet accepted the whole verdict.
      if (upload.status === "pending") {
        upload.status = "overridden";
      }
    },
    // Lock in the entire verdict — flip status to "accepted".
    acceptVerdict: (state, action) => {
      const uploadId = action.payload;
      const upload = state.uploads.find((u) => u.id === uploadId);
      if (!upload) return;
      upload.status = "accepted";
    },
    // Throw away the verdict — flip status to "rejected" (not visible in the
    // dashboard's normal filter set).
    rejectVerdict: (state, action) => {
      const uploadId = action.payload;
      const upload = state.uploads.find((u) => u.id === uploadId);
      if (!upload) return;
      upload.status = "rejected";
    },
    addUpload: (state, action) => {
      state.uploads.unshift(action.payload);
    },
  },
});

export const {
  setFilter,
  clearFilters,
  selectUpload,
  clearSelectedUpload,
  overrideFinding,
  acceptVerdict,
  rejectVerdict,
  addUpload,
} = operativeEffectivenessSlice.actions;

export { uploadAverageCompliance };

export default operativeEffectivenessSlice.reducer;
