import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Layers,
  Thermometer,
  Wrench,
  Save,
  Copy,
  Check,
  AlertCircle,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/ui/Header.jsx';
import AccordionSection from '../components/ui/AccordionSection.jsx';
import GeneralInfo, { isGeneralInfoComplete } from '../components/sections/GeneralInfo.jsx';
import BuildingEnvelope, { isBuildingEnvelopeComplete } from '../components/sections/BuildingEnvelope.jsx';
import ThermalZones, { isThermalZonesComplete } from '../components/sections/ThermalZones.jsx';
import TechnicalSystems, { isTechnicalSystemsComplete } from '../components/sections/TechnicalSystems.jsx';

const SECTIONS = [
  { key: 'generali', title: 'Dati Generali', icon: Building2, dataKey: 'generali' },
  { key: 'involucro', title: 'Involucro Edilizio', icon: Layers, dataKey: 'involucro' },
  { key: 'zonetermiche', title: 'Zone Termiche', icon: Thermometer, dataKey: 'zonetermiche' },
  { key: 'impianti', title: 'Impianti Tecnici', icon: Wrench, dataKey: 'impianti' },
];

export default function SurveyForm() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { getSurvey, updateSurveyData } = useApp();
  const [openSection, setOpenSection] = useState('generali');
  const [copied, setCopied] = useState(false);

  const { survey, client } = getSurvey(surveyId);

  // Debounced update
  const handleUpdate = useCallback(
    (section) => (fieldData) => {
      updateSurveyData(surveyId, section, fieldData);
    },
    [surveyId, updateSurveyData]
  );

  // Completion states
  const completionMap = useMemo(() => {
    if (!survey) return {};
    return {
      generali: isGeneralInfoComplete(survey.data.generali),
      involucro: isBuildingEnvelopeComplete(survey.data.involucro),
      zonetermiche: isThermalZonesComplete(survey.data.zonetermiche),
      impianti: isTechnicalSystemsComplete(survey.data.impianti),
    };
  }, [survey]);

  const completedCount = Object.values(completionMap).filter(Boolean).length;
  const totalSections = SECTIONS.length;
  const overallProgress = Math.round((completedCount / totalSections) * 100);

  // Copy JSON
  const handleCopyJSON = async () => {
    if (!survey) return;
    const exportData = {
      cliente: client?.name,
      tipo: survey.type,
      dataCreazione: survey.createdAt,
      ultimoSalvataggio: survey.lastSaved,
      dati: survey.data,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = JSON.stringify(exportData, null, 2);
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!survey || !client) {
    return (
      <div className="flex-1 flex flex-col">
        <Header title="Sopralluogo non trovato" backTo="/" />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Il sopralluogo richiesto non esiste.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] bg-gray-50">
      <Header
        title={survey.type}
        subtitle={client.name}
        backTo={`/client/${client.id}`}
        actions={
          <button
            onClick={handleCopyJSON}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'hover:bg-white/10 text-white/80'
            }`}
            aria-label="Copia riepilogo JSON"
            id="btn-copy-json"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        }
      />

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-navy-800">
              Completamento
            </span>
            <div className="flex items-center gap-3">
              {/* Save indicator */}
              {survey.lastSaved && (
                <span className="save-indicator bg-emerald-50 text-emerald-600 flex items-center gap-1">
                  <Save size={12} />
                  {formatTime(survey.lastSaved)}
                </span>
              )}
              <span
                className={`text-sm font-bold ${
                  overallProgress === 100 ? 'text-emerald-600' : 'text-navy-600'
                }`}
              >
                {overallProgress}%
              </span>
            </div>
          </div>
          <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="progress-bar h-full"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">
              {completedCount}/{totalSections} sezioni complete
            </span>
            {copied && (
              <span className="text-xs text-emerald-600 font-medium animate-fade-in">
                ✓ JSON copiato negli appunti
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form Sections */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-8">
        <div className="space-y-3">
          {SECTIONS.map((section) => (
            <AccordionSection
              key={section.key}
              id={`section-${section.key}`}
              icon={section.icon}
              title={section.title}
              isComplete={completionMap[section.key]}
              isOpen={openSection === section.key}
              onToggle={() =>
                setOpenSection(openSection === section.key ? null : section.key)
              }
            >
              {section.key === 'generali' && (
                <GeneralInfo
                  data={survey.data.generali}
                  onUpdate={handleUpdate('generali')}
                />
              )}
              {section.key === 'involucro' && (
                <BuildingEnvelope
                  data={survey.data.involucro}
                  onUpdate={handleUpdate('involucro')}
                />
              )}
              {section.key === 'zonetermiche' && (
                <ThermalZones
                  data={survey.data.zonetermiche}
                  onUpdate={handleUpdate('zonetermiche')}
                />
              )}
              {section.key === 'impianti' && (
                <TechnicalSystems
                  data={survey.data.impianti}
                  onUpdate={handleUpdate('impianti')}
                />
              )}
            </AccordionSection>
          ))}
        </div>

        {/* Continue to Media */}
        <div className="mt-8 space-y-3">
          <button
            onClick={() => navigate(`/survey/${surveyId}/media`)}
            className="w-full min-h-[56px] rounded-xl bg-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.98]"
            id="btn-continue-media"
          >
            <Camera size={22} />
            Continua: Foto e Documenti
            <ArrowRight size={20} />
          </button>

          <button
            onClick={handleCopyJSON}
            className={`w-full min-h-[42px] rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 active:bg-gray-300'
            }`}
            id="btn-copy-json-bottom"
          >
            {copied ? (
              <>
                <Check size={16} />
                JSON Copiato!
              </>
            ) : (
              <>
                <Copy size={16} />
                Esporta JSON
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
