import { createSlice } from "@reduxjs/toolkit";
import { mockRisks } from "../data/mockRisks";

const initialState = {
  items: mockRisks,
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
    updateRisk: (state, action) => {
      const updated = action.payload;
      const idx = state.items.findIndex((r) => r.id === updated.id);
      if (idx !== -1) {
        const merged = { ...state.items[idx], ...updated };
        merged.inherentRating = merged.likelihood * merged.impact;
        merged.residualRating = merged.inherentRating * merged.controlEffectiveness;
        state.items[idx] = merged;
      }
    },
    addRisks: (state, action) => {
      const incoming = action.payload ?? [];
      for (const risk of incoming) {
        risk.inherentRating = risk.likelihood * risk.impact;
        risk.residualRating = risk.inherentRating * risk.controlEffectiveness;
        state.items.push(risk);
      }
    },
  },
});

export const {
  setFilter,
  clearFilters,
  setView,
  setHeatmapMode,
  selectRisk,
  clearSelectedRisk,
  updateRisk,
  addRisks,
} = risksSlice.actions;

export default risksSlice.reducer;
