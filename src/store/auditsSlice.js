import { createSlice } from "@reduxjs/toolkit";
import {
  mockAudits,
  mockAuditTriggers,
  SEVERITY_ORDER,
} from "../data/mockAudits";
import { mockRisks } from "../data/mockRisks";
import { effectivenessPolicies } from "../data/mockEvidence";

const initialState = {
  audits: mockAudits,
  triggers: mockAuditTriggers,
  selectedAuditId: null,
  selectedFindingId: null,
  filters: {
    search: "",
    department: "All",
    status: "All",
    period: "All",
  },
};

// ---------- Severity helpers ----------

const RESIDUAL_TO_SEVERITY = (residual) => {
  if (residual == null) return "low";
  if (residual >= 30) return "high";
  if (residual >= 15) return "significant";
  if (residual >= 6) return "medium";
  return "low";
};

function severityFromRiskIds(riskIds) {
  if (!riskIds || riskIds.length === 0) return "medium";
  const sev = riskIds
    .map((rid) => mockRisks.find((r) => r.id === rid))
    .filter(Boolean)
    .map((r) => RESIDUAL_TO_SEVERITY(r.residualRating));
  if (sev.length === 0) return "medium";
  return sev.reduce(
    (acc, s) => (SEVERITY_ORDER[s] > SEVERITY_ORDER[acc] ? s : acc),
    "low",
  );
}

// ---------- WP Ref helpers ----------

function wpRefFromRisks(riskIds, afNumber) {
  if (!riskIds || riskIds.length === 0) return `AF${afNumber}`;
  return riskIds
    .map((rid) => {
      const numeric = rid.replace(/\D/g, "") || rid;
      return `R${numeric}C${numeric}AF${afNumber}`;
    })
    .join(", ");
}

// ---------- AI Assist mock — deterministic but plausible ----------
//
// In production this would call the embedding-funnel + LLM pipeline. Here we
// fake it with simple keyword overlap against the risk register, then build
// recommendations from the picked risks' controls and an action plan from
// their mitigation plans.

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 3);
}

function rankRisksByOverlap(conditionsText, limit = 5) {
  const condTokens = new Set(tokenize(conditionsText));
  if (condTokens.size === 0) return [];
  const scored = mockRisks.map((r) => {
    const haystack = [
      r.title,
      r.description,
      r.context,
      r.controlDescription,
      r.department,
      r.category,
    ]
      .join(" ")
      .toLowerCase();
    const tokens = new Set(tokenize(haystack));
    let overlap = 0;
    for (const t of condTokens) if (tokens.has(t)) overlap += 1;
    return { risk: r, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter((s) => s.score > 0)
    .slice(0, limit)
    .map((s) => s.risk);
}

function aiAssistFromConditions(conditionsText) {
  const candidates = rankRisksByOverlap(conditionsText, 5);
  const pickedIds = candidates.slice(0, 3).map((r) => r.id);
  const picked = candidates.slice(0, 3);

  // Standard references — pull policies that control any of the picked risks.
  const standardReferences = [];
  const seenPolicy = new Set();
  for (const p of effectivenessPolicies) {
    if (p.controlsRiskIds.some((rid) => pickedIds.includes(rid))) {
      if (seenPolicy.has(p.id)) continue;
      seenPolicy.add(p.id);
      standardReferences.push({
        kind: "policy",
        code: p.code,
        policyId: p.id,
        text: `${p.title} — referenced as the policy controlling ${p.controlsRiskIds.join(", ")}.`,
      });
    }
  }
  // Add a generic JCI reference up top if we got any policy hits.
  if (standardReferences.length > 0) {
    standardReferences.unshift({
      kind: "jci",
      code: "JCI · Governance",
      text: "Relevant JCI accreditation standards inherited from the policies cited below.",
    });
  }

  const rootCauses = picked.length
    ? [
        `Existing control on ${picked[0].id} (${picked[0].controlDescription.split(";")[0]}) is not consistently followed.`,
        ...(picked[1]
          ? [`Process gap suggested by ${picked[1].id}: ${picked[1].context}`]
          : []),
        "Insufficient periodic verification / reconciliation against the documented process.",
      ]
    : [
        "Conditions narrative is too short to infer root causes — please add detail and re-run AI assist.",
      ];

  const recommendations = picked.flatMap((r) => [
    `Reinforce: ${r.controlDescription}`,
  ]);
  if (recommendations.length === 0) {
    recommendations.push(
      "Provide a detailed conditions narrative so AI can draft tailored recommendations.",
    );
  } else {
    recommendations.push(
      "Schedule a follow-up verification audit within 90 days of remediation.",
    );
  }

  const actionPlanLines = picked
    .map((r) => `• ${r.mitigationPlan} (owner: ${r.mitigationOwner}, target: ${r.mitigationTimeline})`)
    .join("\n");
  const actionPlan = actionPlanLines
    ? `We agree with the recommendations. Proposed action plan:\n${actionPlanLines}`
    : "";

  return {
    riskIds: pickedIds,
    standardReferences,
    rootCauses,
    recommendations,
    actionPlan,
  };
}

// ---------- Slice ----------

const auditsSlice = createSlice({
  name: "audits",
  initialState,
  reducers: {
    setFilter: (state, action) => {
      const { key, value } = action.payload;
      state.filters[key] = value;
    },
    clearFilters: (state) => {
      state.filters = { ...initialState.filters };
    },
    selectAudit: (state, action) => {
      state.selectedAuditId = action.payload;
      state.selectedFindingId = null;
    },
    clearSelectedAudit: (state) => {
      state.selectedAuditId = null;
      state.selectedFindingId = null;
    },
    selectFinding: (state, action) => {
      state.selectedFindingId = action.payload;
    },
    clearSelectedFinding: (state) => {
      state.selectedFindingId = null;
    },
    addAudit: (state, action) => {
      state.audits.unshift(action.payload);
    },
    addFinding: (state, action) => {
      const { auditId, finding } = action.payload;
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return;
      audit.findings.push(finding);
      audit.updatedAt = new Date().toISOString();
      if (audit.status === "planning") audit.status = "in_progress";
    },
    updateFinding: (state, action) => {
      const { auditId, findingId, patch } = action.payload;
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return;
      const finding = audit.findings.find((f) => f.id === findingId);
      if (!finding) return;
      Object.assign(finding, patch);
      // Recompute severity + WP Ref if risk picks changed.
      if (patch.riskIds) {
        finding.severity = severityFromRiskIds(patch.riskIds);
        finding.wpRef = wpRefFromRisks(patch.riskIds, finding.afNumber);
      }
      finding.updatedAt = new Date().toISOString();
      audit.updatedAt = finding.updatedAt;
    },
    issueFinding: (state, action) => {
      const { auditId, findingId } = action.payload;
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return;
      const finding = audit.findings.find((f) => f.id === findingId);
      if (!finding) return;
      finding.status = "issued";
      finding.updatedAt = new Date().toISOString();
      audit.updatedAt = finding.updatedAt;
      if (audit.status === "planning") audit.status = "in_progress";
    },
    respondFinding: (state, action) => {
      const { auditId, findingId, managementResponse, actionPlan, targetDate, responsibleOwners } = action.payload;
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return;
      const finding = audit.findings.find((f) => f.id === findingId);
      if (!finding) return;
      finding.managementResponse = managementResponse ?? finding.managementResponse;
      finding.actionPlan = actionPlan ?? finding.actionPlan;
      finding.targetDate = targetDate ?? finding.targetDate;
      if (responsibleOwners) finding.responsibleOwners = responsibleOwners;
      finding.status = "responded";
      finding.updatedAt = new Date().toISOString();
      audit.updatedAt = finding.updatedAt;
    },
    closeFinding: (state, action) => {
      const { auditId, findingId } = action.payload;
      const audit = state.audits.find((a) => a.id === auditId);
      if (!audit) return;
      const finding = audit.findings.find((f) => f.id === findingId);
      if (!finding) return;
      finding.status = "closed";
      finding.updatedAt = new Date().toISOString();
      audit.updatedAt = finding.updatedAt;
      // If every finding is closed and there's at least one, close the audit.
      if (
        audit.findings.length > 0 &&
        audit.findings.every((f) => f.status === "closed")
      ) {
        audit.status = "closed";
      }
    },
    dismissTrigger: (state, action) => {
      const triggerId = action.payload;
      state.triggers = state.triggers.filter((t) => t.id !== triggerId);
    },
  },
});

export const {
  setFilter,
  clearFilters,
  selectAudit,
  clearSelectedAudit,
  selectFinding,
  clearSelectedFinding,
  addAudit,
  addFinding,
  updateFinding,
  issueFinding,
  respondFinding,
  closeFinding,
  dismissTrigger,
} = auditsSlice.actions;

export {
  aiAssistFromConditions,
  severityFromRiskIds,
  wpRefFromRisks,
  rankRisksByOverlap,
};

export default auditsSlice.reducer;
