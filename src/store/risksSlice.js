import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import riskAPI from "../services/riskAPI";

// The API returns enum *values* (lowercase, e.g. "operational",
// "process_level"). The existing UI hardcodes display strings like
// "Operational" / "Process-Level" / "Strategic" — so we normalize on the way
// in and de-normalize on the way out so the rest of the components don't
// need to know.
const TIER_FROM_API = {
  operational: "Operational",
  process_level: "Process-Level",
  strategic: "Strategic",
};
const TIER_TO_API = {
  Operational: "operational",
  "Process-Level": "process_level",
  Strategic: "strategic",
};

function normalizeRisk(risk) {
  if (!risk) return risk;
  return {
    ...risk,
    tier: TIER_FROM_API[risk.tier] ?? risk.tier,
  };
}

function denormalizePatch(patch) {
  const out = { ...patch };
  if (out.tier && TIER_TO_API[out.tier]) out.tier = TIER_TO_API[out.tier];
  return out;
}

// ---------- Async thunks (real backend) ----------

export const fetchRisks = createAsyncThunk(
  "risks/fetchRisks",
  async (params = {}, { rejectWithValue }) => {
    try {
      // Pull a large page so the existing client-side filtering / sorting
      // / pagination in <RiskList /> keeps working unchanged.
      const res = await riskAPI.listRisks({ limit: 500, offset: 0, ...params });
      return (res.data.items ?? []).map(normalizeRisk);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

export const fetchDepartments = createAsyncThunk(
  "risks/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const res = await riskAPI.listDepartments();
      return res.data.items ?? [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

export const createRiskThunk = createAsyncThunk(
  "risks/createRisk",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await riskAPI.createRisk(denormalizePatch(payload));
      return normalizeRisk(res.data);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

export const updateRiskThunk = createAsyncThunk(
  "risks/updateRisk",
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      const res = await riskAPI.updateRisk(id, denormalizePatch(patch));
      return normalizeRisk(res.data);
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

export const deleteRiskThunk = createAsyncThunk(
  "risks/deleteRisk",
  async (id, { rejectWithValue }) => {
    try {
      await riskAPI.deleteRisk(id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

export const searchRisksThunk = createAsyncThunk(
  "risks/searchRisks",
  async ({ q, limit = 10, minScore = 0.5 } = {}, { rejectWithValue }) => {
    try {
      const res = await riskAPI.searchRisks(q, { limit, minScore });
      // Items already include matchScore + matchedChunk. Normalize tier so
      // the same display strings as the rest of the UI work here too.
      const items = (res.data.items ?? []).map(normalizeRisk);
      return { query: res.data.query, items, total: res.data.total };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

// GET /v1/risks/{id}/policies — policies that control this risk.
export const fetchControllingPolicies = createAsyncThunk(
  "risks/fetchControllingPolicies",
  async (riskId, { rejectWithValue }) => {
    try {
      const res = await riskAPI.getControllingPolicies(riskId);
      return { riskId, items: res.data.items ?? [] };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.detail ?? err.message);
    }
  },
);

// ---------- Slice ----------

const initialState = {
  items: [],
  departments: [],
  // Start true: RiskRegister always dispatches fetchRisks() on mount, so
  // the first render is a load — not an empty register. Prevents a flash
  // of "No risks to display" before the thunk's pending action fires.
  loading: true,
  error: null,
  mutating: false, // true while create / update / delete is in flight
  filters: {
    macroCategory: null,
    department: null,
    tier: null,
    residualMin: null,
    residualMax: null,
    owner: null,
    search: "",
  },
  view: "table", // "table" | "heatmap"
  heatmapMode: "residual", // "inherent" | "residual"
  selectedRiskId: null,
  // Semantic search state — separate from `items` so submitting a query
  // doesn't clobber the unfiltered register the user can return to.
  searchQuery: "",
  searchResults: [],
  searchLoading: false,
  searchError: null,
  // Policies controlling the currently-open risk (Risk Detail tile).
  controllingPolicies: [],
  controllingPoliciesRiskId: null,
  controllingPoliciesLoading: false,
  controllingPoliciesError: null,
};

const risksSlice = createSlice({
  name: "risks",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    setView: (state, action) => {
      state.view = action.payload;
    },
    setHeatmapMode: (state, action) => {
      state.heatmapMode = action.payload;
    },
    selectRisk: (state, action) => {
      state.selectedRiskId = action.payload;
    },
    clearSelectedRisk: (state) => {
      state.selectedRiskId = null;
    },
    clearSearch: (state) => {
      state.searchQuery = "";
      state.searchResults = [];
      state.searchLoading = false;
      state.searchError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRisks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRisks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRisks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load risks";
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.departments = action.payload;
      })
      .addCase(createRiskThunk.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(createRiskThunk.fulfilled, (state, action) => {
        state.mutating = false;
        state.items.unshift(action.payload);
      })
      .addCase(createRiskThunk.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to create risk";
      })
      .addCase(updateRiskThunk.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(updateRiskThunk.fulfilled, (state, action) => {
        state.mutating = false;
        const updated = action.payload;
        const idx = state.items.findIndex((r) => r.id === updated.id);
        if (idx !== -1) state.items[idx] = updated;
      })
      .addCase(updateRiskThunk.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to update risk";
      })
      .addCase(deleteRiskThunk.pending, (state) => {
        state.mutating = true;
        state.error = null;
      })
      .addCase(deleteRiskThunk.fulfilled, (state, action) => {
        state.mutating = false;
        state.items = state.items.filter((r) => r.id !== action.payload);
        if (state.selectedRiskId === action.payload) {
          state.selectedRiskId = null;
        }
      })
      .addCase(deleteRiskThunk.rejected, (state, action) => {
        state.mutating = false;
        state.error = action.payload ?? "Failed to delete risk";
      })
      .addCase(searchRisksThunk.pending, (state, action) => {
        state.searchLoading = true;
        state.searchError = null;
        // Track the query the user submitted (not the API response one) so
        // the UI can render "searching for X…" even before results return.
        state.searchQuery = action.meta.arg?.q ?? "";
      })
      .addCase(searchRisksThunk.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.items;
        state.searchQuery = action.payload.query;
      })
      .addCase(searchRisksThunk.rejected, (state, action) => {
        state.searchLoading = false;
        state.searchError = action.payload ?? "Search failed";
        state.searchResults = [];
      })
      .addCase(fetchControllingPolicies.pending, (state, action) => {
        const incomingId = action.meta.arg;
        if (
          state.controllingPoliciesRiskId != null &&
          state.controllingPoliciesRiskId !== incomingId
        ) {
          state.controllingPolicies = [];
        }
        state.controllingPoliciesRiskId = incomingId;
        state.controllingPoliciesLoading = true;
        state.controllingPoliciesError = null;
      })
      .addCase(fetchControllingPolicies.fulfilled, (state, action) => {
        state.controllingPoliciesLoading = false;
        state.controllingPoliciesRiskId = action.payload.riskId;
        state.controllingPolicies = action.payload.items;
      })
      .addCase(fetchControllingPolicies.rejected, (state, action) => {
        state.controllingPoliciesLoading = false;
        state.controllingPoliciesError =
          action.payload ?? "Failed to load linked policies";
      });
  },
});

export const {
  setFilter,
  clearFilters,
  setView,
  setHeatmapMode,
  selectRisk,
  clearSelectedRisk,
  clearSearch,
} = risksSlice.actions;

export default risksSlice.reducer;
