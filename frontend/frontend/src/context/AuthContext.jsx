import { createContext, useEffect, useMemo, useState } from "react";

import api, { setAuthToken } from "../api";

export const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem("token");
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persistToken = (nextToken) => {
    try {
      if (nextToken) localStorage.setItem("token", nextToken);
      else localStorage.removeItem("token");
    } catch {}
    setToken(nextToken);
    setAuthToken(nextToken);
  };

  const persistUser = (nextUser) => {
    try {
      if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
      else localStorage.removeItem("user");
    } catch {}
    setUser(nextUser);
  };

  const login = async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    const { access_token, user: userData } = res.data;

    persistToken(access_token);
    persistUser(userData);
    return userData;
  };

  const signup = async ({ name, email, password }) => {
    const res = await api.post("/auth/signup", { name, email, password });
    const userData = res.data?.user;

    // Signup does not log in automatically.
    return userData;
  };

  const logout = () => {
    persistToken(null);
    persistUser(null);
    window.location.href = "/login";
  };

  const fetchMe = async () => {
    if (!token) {
      setLoading(false);
      return null;
    }

    try {
      const res = await api.get("/auth/me");
      persistUser(res.data.user);
      return res.data.user;
    } catch (e) {
      persistToken(null);
      persistUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAuthToken(token);
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      fetchMe,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

