import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import * as api from "../../lib/api";

export default function FormFillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<api.FormWithQuestions | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checkboxAnswers, setCheckboxAnswers] = useState<Record<number, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    api.getPublicForm(Number(id)).then(setForm).catch(() => {
      Alert.alert("Erro", "Formulário não encontrado");
      router.back();
    });
  }, [id]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  function setAnswer(questionId: number, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function toggleCheckbox(questionId: number, option: string) {
    setCheckboxAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [questionId]: updated };
    });
  }

  async function handleSubmit() {
    if (!form) return;

    // Validate required fields
    for (const q of form.questions) {
      if (!q.is_required) continue;
      if (q.question_type === "checkbox") {
        if (!(checkboxAnswers[q.id]?.length > 0)) {
          Alert.alert("Obrigatório", `Por favor, responda: ${q.question_text}`);
          return;
        }
      } else {
        if (!answers[q.id]) {
          Alert.alert("Obrigatório", `Por favor, responda: ${q.question_text}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const answerList: api.AnswerInput[] = form.questions.map((q) => ({
        question_id: q.id,
        answer_value:
          q.question_type === "checkbox"
            ? JSON.stringify(checkboxAnswers[q.id] || [])
            : answers[q.id] || "",
      }));

      await api.submitForm(form.id, answerList, location ?? undefined);
      Alert.alert("Sucesso", "Sua resposta foi enviada.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Erro", err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  if (!form) {
    return (
      <View style={styles.center}>
        <Text>Carregando formulário...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{form.title}</Text>
      {form.description && <Text style={styles.description}>{form.description}</Text>}

      {location && (
        <View style={styles.locationBadge}>
          <Text style={styles.locationText}>
            GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {form.questions.map((q) => (
        <View key={q.id} style={styles.question}>
          <Text style={styles.questionText}>
            {q.question_text}
            {q.is_required && <Text style={styles.required}> *</Text>}
          </Text>

          {q.question_type === "text" && (
            <TextInput
              style={styles.textInput}
              value={answers[q.id] || ""}
              onChangeText={(v) => setAnswer(q.id, v)}
              placeholder="Sua resposta"
            />
          )}

          {q.question_type === "multiple_choice" && q.options && (
            <View style={styles.optionsGroup}>
              {q.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionButton,
                    answers[q.id] === opt && styles.optionSelected,
                  ]}
                  onPress={() => setAnswer(q.id, opt)}
                >
                  <View
                    style={[
                      styles.radio,
                      answers[q.id] === opt && styles.radioSelected,
                    ]}
                  />
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {q.question_type === "checkbox" && q.options && (
            <View style={styles.optionsGroup}>
              {q.options.map((opt) => {
                const checked = (checkboxAnswers[q.id] || []).includes(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionButton, checked && styles.optionSelected]}
                    onPress={() => toggleCheckbox(q.id, opt)}
                  >
                    <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
                      {checked && <Text style={styles.checkmark}>&#10003;</Text>}
                    </View>
                    <Text style={styles.optionText}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? "Enviando..." : "Enviar"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  description: { fontSize: 16, color: "#666", marginBottom: 16 },
  locationBadge: {
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  locationText: { fontSize: 13, color: "#0369a1" },
  question: {
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
  questionText: { fontSize: 16, fontWeight: "500", marginBottom: 12 },
  required: { color: "#ef4444" },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  optionsGroup: { gap: 8 },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  optionSelected: { borderColor: "#4f46e5", backgroundColor: "#f0f0ff" },
  optionText: { fontSize: 15, marginLeft: 10 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
  },
  radioSelected: { borderColor: "#4f46e5", backgroundColor: "#4f46e5" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: { borderColor: "#4f46e5", backgroundColor: "#4f46e5" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
