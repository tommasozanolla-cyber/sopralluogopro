import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, User, Calendar, FileText, ChevronRight, ClipboardList, Trash2, LogOut, UserCog } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Modal from '../components/ui/Modal.jsx';

export default function Dashboard() {
  const { clients, addClient, deleteClient } = useApp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const client = addClient(newName);
    setNewName('');
    setModalOpen(false);
    navigate(`/client/${client.id}`);
  };

  const handleDelete = (e, clientId) => {
    e.stopPropagation();
    if (deleteConfirm === clientId) {
      deleteClient(clientId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(clientId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatDate = (iso) => {
    return new Date(iso).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh]">
      {/* Header */}
      <header className="bg-navy-800 text-white">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ClipboardList size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">Sopralluogo APE</h1>
              <p className="text-navy-300 text-sm font-medium truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:bg-white/20 text-white/70 transition-colors"
              aria-label="Profilo"
              id="btn-profile"
            >
              <UserCog size={20} />
            </button>
            <button
              onClick={signOut}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 active:bg-white/20 text-white/70 transition-colors"
              aria-label="Esci"
              id="btn-logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
        {/* Curved bottom */}
        <div className="h-6 bg-gray-50 rounded-t-3xl" />
      </header>

      {/* Client List */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 -mt-2 pb-24">
        {/* Stats */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-navy-800">{clients.length}</p>
            <p className="text-xs text-gray-500 font-medium">Clienti</p>
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl font-bold text-emerald-600">
              {clients.reduce((sum, c) => sum + c.surveys.length, 0)}
            </p>
            <p className="text-xs text-gray-500 font-medium">Sopralluoghi</p>
          </div>
        </div>

        {/* Empty State */}
        {clients.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-navy-100 flex items-center justify-center mx-auto mb-4">
              <User size={36} className="text-navy-400" />
            </div>
            <h2 className="text-lg font-bold text-navy-800 mb-2">Nessun Cliente</h2>
            <p className="text-gray-500 text-sm max-w-[250px] mx-auto">
              Premi il pulsante <span className="text-emerald-600 font-bold">+</span> per aggiungere
              il primo cliente
            </p>
          </div>
        )}

        {/* Client Cards */}
        <div className="space-y-3">
          {clients.map((client, index) => (
            <div
              key={client.id}
              className="client-card cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => navigate(`/client/${client.id}`)}
              id={`client-card-${client.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <User size={16} />
                    </div>
                    <h3 className="font-bold text-lg truncate text-shadow-sm">
                      {client.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(client.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {client.surveys.length} sopralluogh{client.surveys.length === 1 ? 'io' : 'i'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    onClick={(e) => handleDelete(e, client.id)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      deleteConfirm === client.id
                        ? 'bg-red-500 text-white'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                    aria-label="Elimina cliente"
                    id={`btn-delete-${client.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                    <ChevronRight size={18} className="text-white/60" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FAB */}
      <button
        className="fab"
        onClick={() => setModalOpen(true)}
        aria-label="Nuovo Cliente"
        id="fab-new-client"
      >
        <Plus size={28} className="text-white" />
      </button>

      {/* New Client Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setNewName(''); }} title="Nuovo Cliente">
        <div className="space-y-4">
          <div>
            <label className="form-label" htmlFor="input-client-name">
              Nome Cliente
            </label>
            <input
              id="input-client-name"
              type="text"
              className="form-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder='es. Mario Rossi'
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setModalOpen(false); setNewName(''); }}
              className="flex-1 min-h-[48px] rounded-xl border-2 border-gray-200 text-gray-600 font-semibold transition-colors hover:bg-gray-50 active:bg-gray-100"
              id="btn-modal-cancel"
            >
              Annulla
            </button>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="flex-1 min-h-[48px] rounded-xl bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 disabled:shadow-none"
              id="btn-modal-create"
            >
              Crea Cliente
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
