import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { BuildsList } from './pages/BuildsList';
import { BuildDetailPage } from './pages/BuildDetail';
import { BuildEditPage } from './pages/BuildEditPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/builds"
            element={
              <ProtectedRoute>
                <BuildsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builds/:id/edit"
            element={
              <ProtectedRoute>
                <BuildEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builds/:id"
            element={<BuildDetailPage />}
          />
          <Route path="/" element={<Navigate to="/builds" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
