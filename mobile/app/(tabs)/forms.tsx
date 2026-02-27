import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import * as api from "../../lib/api";

export default function FormsScreen() {
  const router = useRouter();
  const [forms, setForms] = useState<api.Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchForms = useCallback(async () => {
    try {
      const data = await api.getPublishedForms();
      setForms(data);
    } catch {
      setForms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  function onRefresh() {
    setRefreshing(true);
    fetchForms();
  }

  function renderForm({ item }: { item: api.Form }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/form/${item.id}`)}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDescription}>{item.description}</Text>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Carregando formulários...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={forms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderForm}
        contentContainerStyle={forms.length === 0 ? styles.center : styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum formulário publicado disponível.</Text>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
  empty: { fontSize: 16, color: "#666" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  cardDescription: { fontSize: 14, color: "#666" },
});
