import { useState, useEffect } from 'react';
import { Save, Loader2, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import Header from '../components/ui/Header.jsx';

const EMPTY_PROFILE = {
  nome: '',
  cognome: '',
  titolo_professionale: '',
  albo: '',
  numero_iscrizione: '',
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setProfile({
            nome: data.nome || '',
            cognome: data.cognome || '',
            titolo_professionale: data.titolo_professionale || '',
            albo: data.albo || '',
            numero_iscrizione: data.numero_iscrizione || '',
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, ...profile, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
    setSaving(false);
    if (!saveError) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(saveError.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-[100dvh]">
        <Header title="Profilo" backTo="/" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-navy-600" />
        </div>
      </div>
    );
  }

  const fields = [
    { key: 'nome', label: 'Nome', placeholder: 'es. Mario' },
    { key: 'cognome', label: 'Cognome', placeholder: 'es. Rossi' },
    { key: 'titolo_professionale', label: 'Titolo Professionale', placeholder: 'es. Ingegnere, Geometra, Architetto...' },
    { key: 'albo', label: 'Albo di Appartenenza', placeholder: 'es. Ordine degli Ingegneri di Roma' },
    { key: 'numero_iscrizione', label: 'Numero Iscrizione', placeholder: 'es. 12345' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] bg-gray-50">
      <Header title="Profilo Professionista" subtitle={user?.email} backTo="/" />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-5">
            Questi dati verranno usati come intestazione nella Relazione di Sopralluogo.
          </p>

          <div className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="form-label" htmlFor={`profile-${f.key}`}>
                  {f.label}
                </label>
                <input
                  id={`profile-${f.key}`}
                  type="text"
                  className="form-input"
                  value={profile[f.key]}
                  onChange={handleChange(f.key)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full min-h-[48px] rounded-xl font-semibold flex items-center justify-center gap-2 mt-6 transition-all ${
              saved
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : saving
                ? 'bg-navy-400 text-white cursor-wait'
                : 'bg-navy-700 text-white shadow-lg shadow-navy-700/25 hover:bg-navy-800 active:bg-navy-900'
            }`}
            id="btn-save-profile"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvataggio...
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                Salvato!
              </>
            ) : (
              <>
                <Save size={18} />
                Salva Profilo
              </>
            )}
          </button>

          {error && (
            <p className="text-sm text-red-500 text-center mt-3">
              Errore nel salvataggio: {error}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
