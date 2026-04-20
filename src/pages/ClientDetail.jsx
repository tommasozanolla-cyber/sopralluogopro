import { useParams, useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  FileText,
  Calendar,
  ChevronRight,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/ui/Header.jsx';
import { useState } from 'react';

export default function ClientDetail() {
  const { clientId } = useParams();
  const { getClient, addSurvey, deleteSurvey } = useApp();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const client = getClient(clientId);

  if (!client) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Cliente non trovato" backTo="/" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Il cliente richiesto non esiste.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNewSurvey = () => {
    const survey = addSurvey(clientId, 'Sopralluogo APE');
    navigate(`/survey/${survey.id}`);
  };

  const handleDeleteSurvey = (e, surveyId) => {
    e.stopPropagation();
    if (deleteConfirm === surveyId) {
      deleteSurvey(clientId, surveyId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(surveyId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSurveyCompletionInfo = (survey) => {
    const data = survey.data;
    let filled = 0;
    let total = 0;

    // Check each section's key fields
    const checks = [
      data.generali?.annoCostruzione,
      data.generali?.comune,
      data.generali?.piano,
      data.generali?.tipologiaEdificio,
      data.generali?.superficieTotale,
      data.involucro?.tipoVetri,
      data.involucro?.telaio,
      data.involucro?.spessoreMura,
      data.involucro?.isolamento,
      data.involucro?.tipoTetto,
      data.zonetermiche?.confineSuperiore,
      data.zonetermiche?.confineInferiore,
      data.zonetermiche?.orientamento?.length > 0,
      data.zonetermiche?.paretiEsposte,
      data.impianti?.generatore,
      data.impianti?.annoInstallazione,
      data.impianti?.emissione,
      data.impianti?.acs,
      data.impianti?.energieRinnovabili?.length > 0,
    ];

    total = checks.length;
    filled = checks.filter(Boolean).length;
    return { filled, total, percent: Math.round((filled / total) * 100) };
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      <Header title={client.name} subtitle="Scheda Cliente" backTo="/" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">
        {/* Survey Type Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center">
              <ClipboardList size={24} className="text-navy-600" />
            </div>
            <div>
              <h2 className="font-bold text-navy-800">Sopralluogo per APE</h2>
              <p className="text-sm text-gray-500">Attestato Prestazione Energetica</p>
            </div>
          </div>

          <button
            onClick={handleNewSurvey}
            className="w-full min-h-[48px] rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:bg-emerald-600 active:bg-emerald-700"
            id="btn-new-survey"
          >
            <Plus size={20} />
            Nuovo Sopralluogo
          </button>
        </div>

        {/* Existing Surveys */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider px-1">
            Sopralluoghi ({client.surveys.length})
          </h3>
        </div>

        {client.surveys.length === 0 && (
          <div className="text-center py-12 animate-fade-in">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nessun sopralluogo ancora.</p>
            <p className="text-gray-400 text-sm">Premi "Nuovo Sopralluogo" per iniziare.</p>
          </div>
        )}

        <div className="space-y-3">
          {client.surveys.map((survey, index) => {
            const completion = getSurveyCompletionInfo(survey);
            return (
              <div
                key={survey.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/survey/${survey.id}`)}
                id={`survey-card-${survey.id}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={18} className="text-navy-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-navy-800 truncate">{survey.type}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={12} />
                        {formatDate(survey.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleDeleteSurvey(e, survey.id)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        deleteConfirm === survey.id
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                      aria-label="Elimina sopralluogo"
                    >
                      <Trash2 size={15} />
                    </button>
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="progress-bar h-full"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      completion.percent === 100 ? 'text-emerald-600' : 'text-gray-400'
                    }`}
                  >
                    {completion.percent}%
                  </span>
                </div>

                {survey.lastSaved && (
                  <p className="text-xs text-gray-400 mt-2">
                    Ultimo salvataggio: {formatDate(survey.lastSaved)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
