import http from "../../http_common";

class PolicyAPIService {
  // ---------- 1. Upload + create ----------

  // POST /policies/upload — stage a new-policy upload (multipart)
  stageUpload(file) {
    const form = new FormData();
    form.append("file", file);
    return http.post("/v1/policies/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // DELETE /policies/upload/{temp_file_id} — cancel a staged upload
  cancelStagedUpload(tempFileId) {
    return http.delete(`/v1/policies/upload/${tempFileId}`);
  }

  // POST /policies — confirm staged upload, create policy + v1.0
  createPolicy(payload) {
    return http.post("/v1/policies", payload);
  }

  // ---------- 2. Discovery ----------

  // GET /policies — paginated list with filters / sort / search
  listPolicies(params = {}) {
    return http.get("/v1/policies", { params });
  }

  // GET /policies/search — semantic search
  searchPolicies(q, limit = 10) {
    return http.get("/v1/policies/search", { params: { q, limit } });
  }

  // GET /policies/{policy_id} — full detail
  getPolicy(policyId) {
    return http.get(`/v1/policies/${policyId}`);
  }

  // ---------- 3. Edit ----------

  // PATCH /policies/{policy_id} — edit metadata
  updatePolicy(policyId, patch) {
    return http.patch(`/v1/policies/${policyId}`, patch);
  }

  // ---------- 4. Versioning ----------

  // POST /policies/{policy_id}/versions/upload — stage new version (multipart)
  stageVersionUpload(policyId, file) {
    const form = new FormData();
    form.append("file", file);
    return http.post(`/v1/policies/${policyId}/versions/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  // POST /policies/{policy_id}/versions — confirm staged version
  createVersion(policyId, payload) {
    return http.post(`/v1/policies/${policyId}/versions`, payload);
  }

  // GET /policies/{policy_id}/versions — version history
  listVersions(policyId) {
    return http.get(`/v1/policies/${policyId}/versions`);
  }

  // ---------- 5. Lifecycle ----------

  // PATCH /policies/{policy_id}/status — move through state machine
  changeStatus(policyId, payload) {
    return http.patch(`/v1/policies/${policyId}/status`, payload);
  }

  // DELETE /policies/{policy_id} — soft-delete
  deletePolicy(policyId, { actor, reason } = {}) {
    return http.delete(`/v1/policies/${policyId}`, {
      params: { actor, reason },
    });
  }

  // POST /policies/{policy_id}/restore — undo soft-delete
  restorePolicy(policyId, payload = {}) {
    return http.post(`/v1/policies/${policyId}/restore`, payload);
  }

  // ---------- 6. Audit + AI remediation ----------

  // POST /policies/{policy_id}/audit — re-run JCI audit
  runAudit(policyId) {
    return http.post(`/v1/policies/${policyId}/audit`);
  }

  // GET /policies/{policy_id}/audit — most recent audit
  getAudit(policyId) {
    return http.get(`/v1/policies/${policyId}/audit`);
  }

  // POST /policies/{policy_id}/gaps/{requirement_code}/rewrite-docx —
  // "Fill with AI". Returns the rewritten template as a .docx blob ready
  // to download.
  rewriteGapAsDocx(policyId, requirementCode) {
    return http.post(
      `/v1/policies/${policyId}/gaps/${requirementCode}/rewrite-docx`,
      null,
      { responseType: "blob" },
    );
  }

  // GET /templates/{code}/download — download .docx template referenced by an audit gap
  downloadTemplate(code) {
    return http.get(`/v1/templates/${code}/download`, {
      responseType: "blob",
    });
  }

  // ---------- 7. File access ----------

  // GET /policies/{policy_id}/file — stream original uploaded document (latest version)
  downloadPolicyFile(policyId) {
    return http.get(`/v1/policies/${policyId}/file`, {
      responseType: "blob",
    });
  }
}

export default new PolicyAPIService();
