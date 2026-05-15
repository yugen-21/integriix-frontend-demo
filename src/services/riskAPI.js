import http from "../../http_common";

// Thin wrapper over the FastAPI risk + department endpoints.
//
// Coverage map (so the UI knows what is real vs. mocked):
//   GET    /v1/risks                 -> listRisks
//   GET    /v1/risks/{id}            -> getRisk
//   POST   /v1/risks                 -> createRisk
//   PATCH  /v1/risks/{id}            -> updateRisk
//   DELETE /v1/risks/{id}            -> deleteRisk (soft delete)
//   GET    /v1/risks/search          -> searchRisks (semantic / natural-language)
//   GET    /v1/departments           -> listDepartments
//
// NOT covered by the backend yet (kept commented in the UI):
//   - AI risk generation (GenerateWizard)
//   - Heatmap-specific aggregation endpoint (we compute client-side from list)
//   - Per-risk activity / audit history (linked-references card is still a stub)
class RiskAPIService {
  listRisks(params = {}) {
    return http.get("/v1/risks", { params });
  }

  getRisk(riskId) {
    return http.get(`/v1/risks/${riskId}`);
  }

  createRisk(payload) {
    return http.post("/v1/risks", payload);
  }

  updateRisk(riskId, patch) {
    return http.patch(`/v1/risks/${riskId}`, patch);
  }

  deleteRisk(riskId) {
    return http.delete(`/v1/risks/${riskId}`);
  }

  listDepartments(params = {}) {
    return http.get("/v1/departments", { params });
  }

  searchRisks(q, { limit = 10, minScore = 0.5 } = {}) {
    return http.get("/v1/risks/search", {
      params: { q, limit, min_score: minScore },
    });
  }

  nextRiskNumber(departmentId, tier) {
    return http.get("/v1/risks/next-number", {
      params: { department_id: departmentId, tier },
    });
  }
}

export default new RiskAPIService();
