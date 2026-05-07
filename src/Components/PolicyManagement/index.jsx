import { useMemo, useState } from "react";
import PolicyList from "./Components/PolicyList";
import PolicyDetail from "./Components/PolicyDetail";
import PolicyForm from "./Components/PolicyForm";
import { mockPolicies } from "../../data";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function readPolicyIdFromUrl() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("policy");
  return id ? decodeURIComponent(id) : null;
}

function PolicyManagement() {
  const [policies, setPolicies] = useState(mockPolicies);
  const [selectedPolicyId, setSelectedPolicyId] = useState(() => {
    const fromUrl = readPolicyIdFromUrl();
    if (!fromUrl) return null;
    return mockPolicies.some((p) => p.id === fromUrl) ? fromUrl : null;
  });
  const [formState, setFormState] = useState(null);

  const selectedPolicy = useMemo(
    () => policies.find((p) => p.id === selectedPolicyId) ?? null,
    [policies, selectedPolicyId],
  );

  const editingPolicy = useMemo(() => {
    if (!formState || formState.mode !== "edit") return null;
    return policies.find((p) => p.id === formState.policyId) ?? null;
  }, [policies, formState]);

  const existingCodes = useMemo(() => {
    const skipId =
      formState?.mode === "edit" ? formState.policyId : null;
    return policies
      .filter((p) => p.id !== skipId)
      .map((p) => p.code.toUpperCase());
  }, [policies, formState]);

  function openCreate() {
    setFormState({ mode: "create" });
  }

  function openEdit(policyId) {
    setFormState({ mode: "edit", policyId });
  }

  function closeForm() {
    setFormState(null);
  }

  function nextPolicyId() {
    const maxNum = policies.reduce((max, p) => {
      const match = /^pol-(\d+)$/.exec(p.id);
      const num = match ? Number(match[1]) : 0;
      return num > max ? num : max;
    }, 0);
    return `pol-${String(maxNum + 1).padStart(3, "0")}`;
  }

  function handleSave(values) {
    if (formState?.mode === "edit") {
      const id = formState.policyId;
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                ...values,
                lastUpdated: todayIso(),
              }
            : p,
        ),
      );
      setSelectedPolicyId(id);
    } else {
      const id = nextPolicyId();
      const newPolicy = {
        id,
        ...values,
        status: "Draft",
        version: "v1.0",
        lastUpdated: todayIso(),
        accreditationTags: [],
      };
      setPolicies((prev) => [newPolicy, ...prev]);
      setSelectedPolicyId(id);
    }
    closeForm();
  }

  function handleUploadVersion({ file, changeNote, version }) {
    if (!selectedPolicyId) return;
    const fileUrl =
      typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
        ? URL.createObjectURL(file)
        : null;
    const entry = {
      id: `${selectedPolicyId}-${version}-${Date.now()}`,
      version,
      uploadedAt: todayIso(),
      uploadedBy: "You",
      changeNote,
      fileName: file.name,
      fileSize: file.size,
      fileUrl,
    };

    setPolicies((prev) =>
      prev.map((p) =>
        p.id === selectedPolicyId
          ? {
              ...p,
              version,
              lastUpdated: todayIso(),
              uploadedVersions: [entry, ...(p.uploadedVersions ?? [])],
            }
          : p,
      ),
    );
  }

  return (
    <>
      {selectedPolicy ? (
        <PolicyDetail
          key={selectedPolicy.id}
          policy={selectedPolicy}
          onBack={() => setSelectedPolicyId(null)}
          onEdit={() => openEdit(selectedPolicy.id)}
          onUploadVersion={handleUploadVersion}
        />
      ) : (
        <PolicyList
          policies={policies}
          onSelect={setSelectedPolicyId}
          onCreate={openCreate}
          onEdit={openEdit}
        />
      )}

      {formState && (
        <PolicyForm
          mode={formState.mode}
          policy={editingPolicy}
          existingCodes={existingCodes}
          onClose={closeForm}
          onSave={handleSave}
        />
      )}
    </>
  );
}

export default PolicyManagement;
