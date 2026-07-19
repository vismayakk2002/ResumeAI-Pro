// Simple helper hook for resume CRUD.
// Kept minimal so existing pages can either use it or do inline API calls.

import { useCallback, useState } from "react";

import api from "../api";

export default function useResume() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const _wrap = async (fn) => {
    setLoading(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const createResume = useCallback((payload) =>
    _wrap(() => api.post("/resumes", payload).then((r) => r.data)),
  []);

  const updateResume = useCallback((id, payload) =>
    _wrap(() => api.put(`/resumes/${id}`, payload).then((r) => r.data)),
  []);

  const getResume = useCallback((id) =>
    _wrap(() => api.get(`/resumes/${id}`).then((r) => r.data)),
  []);

  const listResumes = useCallback(() =>
    _wrap(() => api.get("/resumes").then((r) => r.data)),
  []);

  const deleteResume = useCallback((id) =>
    _wrap(() => api.delete(`/resumes/${id}`).then((r) => r.data)),
  []);

  return {
    loading,
    error,
    createResume,
    updateResume,
    getResume,
    listResumes,
    deleteResume,
  };
}

