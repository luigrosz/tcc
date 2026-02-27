import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as api from "../api";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<api.Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getForms().then(setForms).finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: number) {
    if (!confirm("Tem certeza?")) return;
    await api.deleteForm(id);
    setForms(forms.filter((f) => f.id !== id));
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Meus Formulários</h1>
        <div className="header-actions">
          <span>{user?.email}</span>
          <button onClick={logout} className="btn-secondary">Sair</button>
        </div>
      </header>

      <Link to="/forms/new" className="btn-primary">+ Criar Novo Formulário</Link>

      {loading ? (
        <p>Carregando...</p>
      ) : forms.length === 0 ? (
        <p className="empty-state">Nenhum formulário ainda. Crie o seu primeiro!</p>
      ) : (
        <div className="form-grid">
          {forms.map((form) => (
            <div key={form.id} className="form-card">
              <h3>{form.title}</h3>
              {form.description && <p>{form.description}</p>}
              <div className="form-meta">
                <span className={`badge ${form.is_published ? "published" : "draft"}`}>
                  {form.is_published ? "Publicado" : "Rascunho"}
                </span>
              </div>
              <div className="form-actions">
                <button onClick={() => navigate(`/forms/${form.id}/edit`)} className="btn-secondary">
                  Editar
                </button>
                <button onClick={() => navigate(`/forms/${form.id}/submissions`)} className="btn-secondary">
                  Respostas
                </button>
                <button onClick={() => handleDelete(form.id)} className="btn-danger">
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
