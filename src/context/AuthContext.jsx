import { useCallback, useEffect, useMemo, useState } from "react";
import {
  authMode,
  fetchPrivacyMap,
  fetchProfile,
  getInitialSession,
  onAuthStateChange,
  savePrivacy,
  signInWithMagicLink,
  signInWithPassword,
  signOut,
  signUp,
  ensureMockDemoAccounts,
} from "../lib/auth.js";
import { canViewStudentData } from "../lib/privacy.js";
import { getStudentById } from "../data/index.js";
import { AuthContext } from "./auth-context.js";

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [privacyMap, setPrivacyMap] = useState({});
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [privacyStatus, setPrivacyStatus] = useState("idle");

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      ensureMockDemoAccounts();
      const s = await getInitialSession();
      if (cancelled) return;
      setSession(s);
      const p = s ? await fetchProfile(s) : null;
      if (cancelled) return;
      setProfile(p);
      const map = await fetchPrivacyMap();
      if (cancelled) return;
      setPrivacyMap(map);
      setReady(true);
    };
    hydrate();

    const onSessionChanged = async () => {
      const s = await getInitialSession();
      if (s) {
        const p = await fetchProfile(s);
        if (cancelled) return;
        setSession(s);
        setProfile(p);
      } else {
        if (cancelled) return;
        setSession(null);
        setProfile(null);
      }
    };
    window.addEventListener("ife:auth-changed", onSessionChanged);

    const unsubscribe = onAuthStateChange(async (next) => {
      setSession(next);
      const p = next ? await fetchProfile(next) : null;
      if (cancelled) return;
      setProfile(p);
    });
    return () => {
      cancelled = true;
      window.removeEventListener("ife:auth-changed", onSessionChanged);
      unsubscribe();
    };
  }, []);

  const attempt = useCallback(async (fn) => {
    setAuthError(null);
    const { error } = await fn();
    if (error) setAuthError(error.message || "Something went wrong.");
    return { error };
  }, []);

  const signInPassword = useCallback(
    ({ email, password }) => attempt(() => signInWithPassword({ email, password })),
    [attempt]
  );

  const sendMagicLink = useCallback(
    ({ email }) => attempt(() => signInWithMagicLink({ email })),
    [attempt]
  );

  const signUpUser = useCallback(
    ({ email, password, role, studentId }) =>
      attempt(() => signUp({ email, password, role, studentId })),
    [attempt]
  );

  const logout = useCallback(() => attempt(() => signOut()), [attempt]);

  const refreshPrivacy = useCallback(async () => {
    const map = await fetchPrivacyMap();
    setPrivacyMap(map);
    return map;
  }, []);

  const updatePrivacy = useCallback(
    async (studentId, settings) => {
      setPrivacyStatus("saving");
      const { error } = await savePrivacy(studentId, settings);
      if (error) {
        setPrivacyStatus("error");
        return { error };
      }
      await refreshPrivacy();
      setPrivacyStatus("saved");
      return { error: null };
    },
    [refreshPrivacy]
  );

  const canView = useCallback(
    (studentId) =>
      canViewStudentData({
        viewer: profile
          ? { role: profile.role, student_id: profile.student_id, email: profile.email }
          : null,
        student: getStudentById(studentId),
        privacyMap,
      }),
    [profile, privacyMap]
  );

  const value = useMemo(
    () => ({
      ready,
      mode: authMode,
      isSupabase: authMode === "supabase",
      session,
      profile,
      role: profile?.role || null,
      isAuthenticated: Boolean(session),
      authError,
      clearAuthError: () => setAuthError(null),
      signInWithPassword: signInPassword,
      signInWithMagicLink: sendMagicLink,
      signUp: signUpUser,
      signOut: logout,
      privacyMap,
      privacyStatus,
      canView,
      refreshPrivacy,
      updatePrivacy,
    }),
    [
      ready,
      session,
      profile,
      authError,
      signInPassword,
      sendMagicLink,
      signUpUser,
      logout,
      privacyMap,
      privacyStatus,
      canView,
      refreshPrivacy,
      updatePrivacy,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}