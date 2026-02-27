import { useEffect, useState, useCallback } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { AuthContext, type User } from "../lib/auth";
import * as api from "../lib/api";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync("token");
      const stored = await SecureStore.getItemAsync("user");
      if (token && stored) {
        setUser(JSON.parse(stored));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuth = segments[0] === "login" || segments[0] === "register";
    if (!user && !inAuth) {
      router.replace("/login");
    } else if (user && inAuth) {
      router.replace("/(tabs)/forms");
    }
  }, [user, segments, loading]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    await SecureStore.setItemAsync("token", res.token);
    await SecureStore.setItemAsync("user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const res = await api.register(email, password);
    await SecureStore.setItemAsync("token", res.token);
    await SecureStore.setItemAsync("user", JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthContext.Provider>
  );
}
