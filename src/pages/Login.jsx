import { useState } from 'react';
import { ClipboardList, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isRegister) {
        const data = await signUp(email, password);
        if (data.user && !data.session) {
          setSuccess('Controlla la tua email per confermare la registrazione.');
        }
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-lg mx-auto px-5 pt-12 pb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Sopralluogo APE</h1>
          <p className="text-navy-300 text-sm font-medium mt-1">
            Gestione Sopralluoghi Energetici
          </p>
        </div>
        <div className="h-6 bg-gray-50 rounded-t-3xl" />
      </header>

      {/* Form */}
      <main className="flex-1 max-w-lg mx-auto w-full px-5 -mt-2">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-navy-800 mb-1">
            {isRegister ? 'Crea un Account' : 'Accedi'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isRegister
              ? 'Registrati per iniziare a gestire i sopralluoghi'
              : 'Inserisci le tue credenziali per continuare'}
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl p-3 mb-4 animate-fade-in">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 bg-emerald-50 text-emerald-700 text-sm rounded-xl p-3 mb-4 animate-fade-in">
              <Mail size={18} className="flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label" htmlFor="input-email">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="input-email"
                  type="email"
                  className="form-input pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@esempio.it"
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="form-label" htmlFor="input-password">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  id="input-password"
                  type="password"
                  className="form-input pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="La tua password"
                  required
                  minLength={6}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[52px] rounded-xl bg-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all hover:bg-emerald-600 active:bg-emerald-700 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus size={20} />
                  Registrati
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Accedi
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm text-navy-600 font-semibold hover:text-navy-800 transition-colors"
            >
              {isRegister
                ? 'Hai gia un account? Accedi'
                : 'Non hai un account? Registrati'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
