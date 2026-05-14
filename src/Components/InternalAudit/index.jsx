import { useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuditList from "./Components/AuditList";
import AuditDetail from "./Components/AuditDetail";
import FindingEditor from "./Components/FindingEditor";
import {
  clearSelectedAudit,
  clearSelectedFinding,
  selectAudit,
  selectFinding,
} from "../../store/auditsSlice";

function readUrlParam(name) {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const v = params.get(name);
  return v ? decodeURIComponent(v) : null;
}

function InternalAudit() {
  const dispatch = useDispatch();
  const audits = useSelector((state) => state.audits.audits);
  const selectedAuditId = useSelector((state) => state.audits.selectedAuditId);
  const selectedFindingId = useSelector(
    (state) => state.audits.selectedFindingId,
  );

  // One-shot URL hydration — ?audit=<id>&finding=<id> deep-links into detail
  // or finding editor.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    const auditFromUrl = readUrlParam("audit");
    const findingFromUrl = readUrlParam("finding");
    if (auditFromUrl && audits.some((a) => a.id === auditFromUrl)) {
      dispatch(selectAudit(auditFromUrl));
      if (findingFromUrl) dispatch(selectFinding(findingFromUrl));
    }
    hydratedRef.current = true;
  }, [audits, dispatch]);

  const selectedAudit = useMemo(
    () => audits.find((a) => a.id === selectedAuditId) ?? null,
    [audits, selectedAuditId],
  );

  const selectedFinding = useMemo(() => {
    if (!selectedAudit || !selectedFindingId) return null;
    return selectedAudit.findings.find((f) => f.id === selectedFindingId) ?? null;
  }, [selectedAudit, selectedFindingId]);

  function handleSelectAudit(id) {
    dispatch(selectAudit(id));
  }
  function handleBackToList() {
    dispatch(clearSelectedAudit());
  }
  function handleSelectFinding(id) {
    dispatch(selectFinding(id));
  }
  function handleBackToAudit() {
    dispatch(clearSelectedFinding());
  }

  if (selectedAudit && selectedFinding) {
    return (
      <FindingEditor
        key={selectedFinding.id}
        audit={selectedAudit}
        finding={selectedFinding}
        onBack={handleBackToAudit}
      />
    );
  }

  if (selectedAudit) {
    return (
      <AuditDetail
        key={selectedAudit.id}
        audit={selectedAudit}
        onBack={handleBackToList}
        onSelectFinding={handleSelectFinding}
      />
    );
  }

  return <AuditList audits={audits} onSelect={handleSelectAudit} />;
}

export default InternalAudit;
