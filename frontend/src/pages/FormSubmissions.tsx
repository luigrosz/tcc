import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import * as api from "../api";

// Fix default marker icon (leaflet assets don't resolve correctly with vite)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function FormSubmissions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<api.Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getSubmissions(Number(id))
      .then(setSubmissions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Carregando...</p>;

  return (
    <div className="submissions-page">
      <div className="submissions-header">
        <h1>Respostas</h1>
        <button onClick={() => navigate("/")} className="btn-secondary">
          Voltar ao Painel
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {submissions.length === 0 ? (
        <p className="empty-state">Nenhuma resposta ainda.</p>
      ) : (
        <div className="submissions-list">
          {submissions.map((sub, index) => (
            <div key={sub.id} className="submission-card">
              <h3>Resposta #{index + 1}</h3>
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
      )}
    </div>
  );
}
