import { Redirect } from "expo-router";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Redirect href="/(tabs)/forms" />;
  return <Redirect href="/login" />;
}
