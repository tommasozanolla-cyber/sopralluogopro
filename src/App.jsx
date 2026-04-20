import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ClientDetail from './pages/ClientDetail.jsx';
import SurveyForm from './pages/SurveyForm.jsx';
import MediaAttachments from './pages/MediaAttachments.jsx';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-navy-600" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/client/:clientId" element={<ClientDetail />} />
        <Route path="/survey/:surveyId" element={<SurveyForm />} />
        <Route path="/survey/:surveyId/media" element={<MediaAttachments />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
