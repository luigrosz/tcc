import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import * as api from "../api";

// Fix default marker icon (leaflet assets don't resolve correctly with vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type BarData = { name: string; count: number };
type QuestionStat =
  | { question: api.Question; type: "bar"; data: BarData[] }
  | { question: api.Question; type: "text"; answers: string[] };

function aggregate(form: api.FormWithQuestions, submissions: api.Submission[]): QuestionStat[] {
  return form.questions.map((q) => {
    const raw = submissions
      .flatMap((s) => s.answers.filter((a) => a.question_id === q.id))
      .map((a) => a.answer_value);

    if (q.question_type === "multiple_choice") {
      const counts: Record<string, number> = {};
      for (const v of raw) counts[v] = (counts[v] || 0) + 1;
      return {
        question: q,
        type: "bar" as const,
        data: Object.entries(counts).map(([name, count]) => ({ name, count })),
      };
    }

    if (q.question_type === "checkbox") {
      const counts: Record<string, number> = {};
      for (const v of raw) {
        try {
          const selected: string[] = JSON.parse(v);
          for (const s of selected) counts[s] = (counts[s] || 0) + 1;
        } catch {
          if (v) counts[v] = (counts[v] || 0) + 1;
        }
      }
      return {
        question: q,
        type: "bar" as const,
        data: Object.entries(counts).map(([name, count]) => ({ name, count })),
      };
    }

    return { question: q, type: "text" as const, answers: raw.filter(Boolean) };
  });
}

const TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  multiple_choice: "Múltipla Escolha",
  checkbox: "Caixa de Seleção",
};

export default function FormSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<api.FormWithQuestions | null>(null);
  const [submissions, setSubmissions] = useState<api.Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"analytics" | "list">("analytics");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    Promise.all([api.getForm(Number(id)), api.getSubmissions(Number(id))])
      .then(([f, s]) => {
        setForm(f);
        setSubmissions(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Carregando...</p>;

  const geoSubs = submissions.filter((s) => s.latitude != null && s.longitude != null);
  const stats = form ? aggregate(form, submissions) : [];
  const avgLat = geoSubs.reduce((sum, s) => sum + s.latitude!, 0) / geoSubs.length;
  const avgLng = geoSubs.reduce((sum, s) => sum + s.longitude!, 0) / geoSubs.length;

  return (
    <div className="submissions-page">
      <div className="submissions-header">
        <div>
          <h1>Respostas</h1>
          {form && <p className="form-subtitle">{form.title}</p>}
        </div>
        <button onClick={() => navigate("/")} className="btn-secondary">
          Voltar ao Painel
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {submissions.length === 0 ? (
        <p className="empty-state">Nenhuma resposta ainda.</p>
      ) : (
        <>
          <div className="tab-bar">
            <button
              className={tab === "analytics" ? "tab active" : "tab"}
              onClick={() => setTab("analytics")}
            >
              Análise
            </button>
            <button
              className={tab === "list" ? "tab active" : "tab"}
              onClick={() => { setTab("list"); setPage(1); }}
            >
              Respostas ({submissions.length})
            </button>
          </div>

          {tab === "analytics" && (
            <div className="analytics-view">

              {stats.map((stat) => (
                <div key={stat.question.id} className="analytics-card">
                  <h3 className="analytics-question">{stat.question.question_text}</h3>
                  <span className="question-type-badge">
                    {TYPE_LABELS[stat.question.question_type] ?? stat.question.question_type}
                  </span>

                  {stat.type === "bar" && stat.data.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={stat.data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                        <Tooltip />
                        <Bar dataKey="count" name="Respostas" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {stat.type === "bar" && stat.data.length === 0 && (
                    <p className="no-answers">Sem respostas para esta pergunta.</p>
                  )}

                  {stat.type === "text" && (
                    <ul className="text-answers">
                      {stat.answers.map((a, i) => (
                        <li key={i} className="text-answer">{a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}

              {geoSubs.length > 0 && (
                <div className="analytics-card">
                  <h3 className="analytics-question">Localização das Respostas</h3>
                  <MapContainer
                    center={[avgLat, avgLng]}
                    zoom={12}
                    style={{ height: 350, width: "100%", borderRadius: 8, marginTop: "1rem" }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {geoSubs.map((sub, i) => (
                      <Marker key={sub.id} position={[sub.latitude!, sub.longitude!]}>
                        <Popup>
                          <strong>Resposta #{i + 1}</strong>
                          <br />
                          {new Date(sub.submitted_at).toLocaleString("pt-BR")}
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}
            </div>
          )}

          {tab === "list" && (
            <>
              <div className="submissions-list">
                {submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((sub, index) => (
                  <div key={sub.id} className="submission-card">
                    <h3>Resposta #{(page - 1) * PAGE_SIZE + index + 1}</h3>
                    <p className="submission-date">
                      {new Date(sub.submitted_at).toLocaleString("pt-BR")}
                    </p>
                    {sub.latitude != null && sub.longitude != null && (
                      <div className="submission-map">
                        <MapContainer
                          center={[sub.latitude, sub.longitude]}
                          zoom={14}
                          style={{ height: 200, width: "100%", borderRadius: 8 }}
                          scrollWheelZoom={false}
                        >
                          <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          />
                          <Marker position={[sub.latitude, sub.longitude]}>
                            <Popup>
                              {sub.latitude.toFixed(6)}, {sub.longitude.toFixed(6)}
                            </Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}
                    <table>
                      <thead>
                        <tr>
                          <th>Pergunta</th>
                          <th>Resposta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sub.answers.map((a, i) => (
                          <tr key={i}>
                            <td>{a.question_text}</td>
                            <td>{a.answer_value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
              {submissions.length > PAGE_SIZE && (
                <div className="pagination">
                  <button
                    className="btn-secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </button>
                  <span className="pagination-info">
                    {page} / {Math.ceil(submissions.length / PAGE_SIZE)}
                  </span>
                  <button
                    className="btn-secondary"
                    onClick={() => setPage((p) => Math.min(Math.ceil(submissions.length / PAGE_SIZE), p + 1))}
                    disabled={page === Math.ceil(submissions.length / PAGE_SIZE)}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
