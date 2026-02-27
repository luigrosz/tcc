import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import FormBuilder from './pages/FormBuilder'
import FormSubmissions from './pages/FormSubmissions'
import './App.css'

function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <RegisterPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/new"
          element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/:id/edit"
          element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forms/:id/submissions"
          element={
            <ProtectedRoute>
              <FormSubmissions />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
