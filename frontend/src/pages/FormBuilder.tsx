import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as api from "../api";

interface QuestionDraft {
  question_text: string;
  question_type: string;
  options: string[];
  is_required: boolean;
}

function emptyQuestion(): QuestionDraft {
  return { question_text: "", question_type: "text", options: [], is_required: false };
}

export default function FormBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = id !== undefined && id !== "new";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      api.getForm(Number(id)).then((form) => {
        setTitle(form.title);
        setDescription(form.description || "");
        setIsPublished(form.is_published);
        if (form.questions.length > 0) {
          setQuestions(
            form.questions.map((q) => ({
              question_text: q.question_text,
              question_type: q.question_type,
              options: q.options || [],
              is_required: q.is_required,
            }))
          );
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  function updateQuestion(index: number, updates: Partial<QuestionDraft>) {
    setQuestions(questions.map((q, i) => (i === index ? { ...q, ...updates } : q)));
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function addQuestion() {
    setQuestions([...questions, emptyQuestion()]);
  }

  function moveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const updated = [...questions];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setQuestions(updated);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    try {
      let formId: number;

      const validQuestions = questions.filter((q) => q.question_text.trim());
      const questionsPayload = validQuestions.map((q) => {
        const options = q.options.filter((o) => o.trim());
        return {
          question_text: q.question_text,
          question_type: q.question_type,
          options: options.length > 0 ? options : undefined,
          is_required: q.is_required,
        };
      });

      console.log("Form data:", {
        title,
        description: description || "",
        is_published: isEdit ? isPublished : undefined,
        questions: questionsPayload,
      });

      if (isEdit) {
        const form = await api.updateForm(Number(id), {
          title,
          description: description || "",
          is_published: isPublished,
        });
        formId = form.id;
      } else {
        const form = await api.createForm({
          title,
          description: description || "",
        });
        formId = form.id;
      }

      if (validQuestions.length > 0) {
        await api.saveQuestions(formId, questionsPayload);
      }

      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save form");
    }
  }

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="form-builder">
      <h1>{isEdit ? "Editar Formulário" : "Criar Formulário"}</h1>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Título
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label>
          Descrição
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        {isEdit && (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Publicar
          </label>
        )}

        <fieldset>
          <legend>Perguntas</legend>
          {questions.map((q, i) => (
            <div key={i} className="question-editor">
              <div className="question-header">
                <span>Pergunta {i + 1}</span>
                <div className="question-controls">
                  <button type="button" onClick={() => moveQuestion(i, -1)} disabled={i === 0}>
                    Cima
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(i, 1)}
                    disabled={i === questions.length - 1}
                  >
                    Baixo
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    disabled={questions.length <= 1}
                    className="btn-danger"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <label>
                Texto da Pergunta
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(i, { question_text: e.target.value })}
                  required
                />
              </label>

              <label>
                Tipo
                <select
                  value={q.question_type}
                  onChange={(e) => updateQuestion(i, { question_type: e.target.value })}
                >
                  <option value="text">Texto</option>
                  <option value="multiple_choice">Múltipla Escolha</option>
                  <option value="checkbox">Caixa de Seleção</option>
                </select>
              </label>

              {(q.question_type === "multiple_choice" || q.question_type === "checkbox") && (
                <div className="options-editor">
                  <label>Opções (uma por linha)</label>
                  <textarea
                    value={q.options.join("\n")}
                    onChange={(e) =>
                      updateQuestion(i, {
                        options: e.target.value.split("\n"),
                      })
                    }
                    rows={3}
                    placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                  />
                </div>
              )}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={q.is_required}
                  onChange={(e) => updateQuestion(i, { is_required: e.target.checked })}
                />
                Obrigatório
              </label>
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="btn-secondary">
            + Adicionar Pergunta
          </button>
        </fieldset>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isEdit ? "Salvar Alterações" : "Criar Formulário"}
          </button>
          <button type="button" onClick={() => navigate("/")} className="btn-secondary">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
