import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RiskList from "./Components/RiskList";
import RiskDetail from "./Components/RiskDetail";
import GenerateWizard from "./Components/GenerateWizard";
import {
  addRisks,
  clearSelectedRisk,
  selectRisk,
  updateRisk,
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
  const selectedRiskId = useSelector((state) => state.risks.selectedRiskId);
  const [mode, setMode] = useState("list"); // "list" | "generate"

  // One-shot URL hydration. ?risk=<id> opens the detail view directly.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    const fromUrl = readRiskIdFromUrl();
    if (fromUrl && risks.some((r) => r.id === fromUrl)) {
      dispatch(selectRisk(fromUrl));
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

  function handleUpdate(updated) {
    dispatch(updateRisk(updated));
  }

  function handleAcceptProposals(accepted) {
    dispatch(addRisks(accepted));
    setMode("list");
  }

  if (selectedRisk) {
    return (
      <RiskDetail
        key={selectedRisk.id}
        risk={selectedRisk}
        onBack={handleBack}
        onUpdate={handleUpdate}
      />
    );
  }

  if (mode === "generate") {
    return (
      <GenerateWizard
        existingRiskCount={risks.length}
        onCancel={() => setMode("list")}
        onAccept={handleAcceptProposals}
      />
    );
  }

  return (
    <RiskList
      risks={risks}
      onSelect={handleSelect}
      onGenerate={() => setMode("generate")}
    />
  );
}

export default RiskRegister;
