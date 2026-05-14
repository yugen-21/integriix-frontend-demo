import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Dashboard from "./Components/Dashboard";
import VerdictView from "./Components/VerdictView";
import UploadFlow from "./Components/UploadFlow";
import {
  addUpload,
  clearSelectedUpload,
  selectUpload,
} from "../../store/operativeEffectivenessSlice";

function readUploadIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("upload");
  return id ? decodeURIComponent(id) : null;
}

function OperativeEffectiveness() {
  const dispatch = useDispatch();
  const uploads = useSelector((state) => state.operativeEffectiveness.uploads);
  const selectedUploadId = useSelector(
    (state) => state.operativeEffectiveness.selectedUploadId,
  );
  const [mode, setMode] = useState("list"); // "list" | "upload"

  // One-shot URL hydration — ?upload=<id> deep-links into the verdict view.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    const fromUrl = readUploadIdFromUrl();
    if (fromUrl && uploads.some((u) => u.id === fromUrl)) {
      dispatch(selectUpload(fromUrl));
    }
    hydratedRef.current = true;
  }, [dispatch, uploads]);

  const selectedUpload = useMemo(
    () => uploads.find((u) => u.id === selectedUploadId) ?? null,
    [uploads, selectedUploadId],
  );

  function handleSelect(id) {
    dispatch(selectUpload(id));
  }

  function handleBack() {
    dispatch(clearSelectedUpload());
  }

  function handleStartUpload() {
    setMode("upload");
  }

  function handleUploadComplete(newUpload) {
    dispatch(addUpload(newUpload));
    dispatch(selectUpload(newUpload.id));
    setMode("list");
  }

  function handleUploadCancel() {
    setMode("list");
  }

  if (selectedUpload) {
    return (
      <VerdictView
        key={selectedUpload.id}
        upload={selectedUpload}
        onBack={handleBack}
      />
    );
  }

  if (mode === "upload") {
    return (
      <UploadFlow
        onCancel={handleUploadCancel}
        onComplete={handleUploadComplete}
      />
    );
  }

  return (
    <Dashboard
      uploads={uploads}
      onSelect={handleSelect}
      onUpload={handleStartUpload}
    />
  );
}

export default OperativeEffectiveness;
