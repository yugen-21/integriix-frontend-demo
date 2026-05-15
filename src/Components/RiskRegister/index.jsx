import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RiskList from "./Components/RiskList";
import RiskDetail from "./Components/RiskDetail";
import RiskForm from "./Components/RiskForm";
// NOTE: The Generate wizard is AI-driven and the backend does not expose a
// corresponding endpoint yet. We keep the import commented so it's obvious
// the feature is intentionally disabled, not missing.
// import GenerateWizard from "./Components/GenerateWizard";
import {
  clearSelectedRisk,
  createRiskThunk,
  deleteRiskThunk,
  fetchDepartments,
  fetchRisks,
  selectRisk,
  updateRiskThunk,
} from "../../store/risksSlice";

function readRiskIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("risk");
  return id ? decodeURIComponent(id) : null;
}

function RiskRegister() {
  const dispatch = useDispatch();
  const risks = useSelector((state) => state.risks.items);
  const departments = useSelector((state) => state.risks.departments);
  const loading = useSelector((state) => state.risks.loading);
  const mutating = useSelector((state) => state.risks.mutating);
  const error = useSelector((state) => state.risks.error);
  const selectedRiskId = useSelector((state) => state.risks.selectedRiskId);

  // "list" | "create"  (Generate wizard removed — no backend endpoint)
  const [mode, setMode] = useState("list");

  // Initial fetch — risks + departments (departments power the create form).
  useEffect(() => {
    dispatch(fetchRisks());
    dispatch(fetchDepartments());
  }, [dispatch]);

  // One-shot URL hydration. ?risk=<id> opens the detail view directly.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (risks.length === 0) return; // wait until first load is in
    const fromUrl = readRiskIdFromUrl();
    if (fromUrl) {
      // URL param may be string; backend ids are numeric.
      const asNum = Number(fromUrl);
      const id = Number.isNaN(asNum) ? fromUrl : asNum;
      if (risks.some((r) => r.id === id)) {
        dispatch(selectRisk(id));
      }
    }
    hydratedRef.current = true;
  }, [dispatch, risks]);

  const selectedRisk = useMemo(
    () => risks.find((r) => r.id === selectedRiskId) ?? null,
    [risks, selectedRiskId],
  );

  function handleSelect(id) {
    dispatch(selectRisk(id));
  }

  function handleBack() {
    dispatch(clearSelectedRisk());
  }

  async function handleUpdate(updated) {
    // The detail screen ships the full draft; the backend's PATCH only needs
    // the changed columns, but accepting the full object is fine.
    const { id, ...patch } = updated;
    // Strip server-managed / derived fields so we don't send them back.
    delete patch.inherentRating;
    delete patch.residualRating;
    delete patch.department;
    delete patch.macroCategory;
    delete patch.controlAttributes;
    delete patch.createdAt;
    delete patch.updatedAt;
    await dispatch(updateRiskThunk({ id, patch }));
  }

  async function handleDelete(id) {
    if (typeof window !== "undefined" && !window.confirm("Delete this risk? This action is soft and reversible only via DB.")) {
      return;
    }
    await dispatch(deleteRiskThunk(id));
  }

  async function handleCreate(payload) {
    const result = await dispatch(createRiskThunk(payload));
    if (createRiskThunk.fulfilled.match(result)) {
      setMode("list");
    }
  }

  // ----- Generate wizard handler — disabled, no backend endpoint -----
  // async function handleAcceptProposals(accepted) {
  //   // Would need POST /v1/risks/bulk-generate (NOT IMPLEMENTED in backend).
  //   setMode("list");
  // }

  if (selectedRisk) {
    return (
      <RiskDetail
        key={selectedRisk.id}
        risk={selectedRisk}
        mutating={mutating}
        onBack={handleBack}
        onUpdate={handleUpdate}
        onDelete={() => handleDelete(selectedRisk.id)}
      />
    );
  }

  if (mode === "create") {
    return (
      <RiskForm
        departments={departments}
        submitting={mutating}
        error={error}
        onCancel={() => setMode("list")}
        onSubmit={handleCreate}
      />
    );
  }

  // ----- Generate wizard branch — disabled, no backend endpoint -----
  // if (mode === "generate") {
  //   return (
  //     <GenerateWizard
  //       existingRiskCount={risks.length}
  //       onCancel={() => setMode("list")}
  //       onAccept={handleAcceptProposals}
  //     />
  //   );
  // }

  return (
    <RiskList
      risks={risks}
      loading={loading}
      error={error}
      onSelect={handleSelect}
      onCreate={() => setMode("create")}
      onDelete={handleDelete}
      // onGenerate intentionally omitted — see comment above.
    />
  );
}

export default RiskRegister;
