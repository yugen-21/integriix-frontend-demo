import { useState } from "react";
import PolicyList from "./Components/PolicyList";
import PolicyDetail from "./Components/PolicyDetail";

function PolicyManagement() {
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  if (selectedPolicyId) {
    return (
      <PolicyDetail
        policyId={selectedPolicyId}
        onBack={() => setSelectedPolicyId(null)}
      />
    );
  }

  return <PolicyList onSelect={setSelectedPolicyId} />;
}

export default PolicyManagement;
