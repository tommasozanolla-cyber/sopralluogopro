import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Camera,
  FileUp,
  Trash2,
  AlertCircle,
  Check,
  Copy,
  Image,
  FileText,
  X,
  Home,
  Plus,
  Save,
  Loader2,
  FileDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { generateId } from '../hooks/useLocalStorage.js';
import Header from '../components/ui/Header.jsx';
import { generateWordReport } from '../utils/generateWord.js';

const PHOTO_CATEGORIES = [
  { key: 'libretto_caldaia', label: 'Libretto Caldaia' },
  { key: 'serramenti', label: 'Serramenti' },
  { key: 'facciata', label: 'Facciata' },
  { key: 'targhetta_generatore', label: 'Targhetta Generatore' },
  { key: 'altro', label: 'Altro' },
];

const MAX_IMAGE_DIMENSION = 1200;
const JPEG_QUALITY = 0.7;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          if (width > height) {
            height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
            width = MAX_IMAGE_DIMENSION;
          } else {
            width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
            height = MAX_IMAGE_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MediaAttachments() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const { getSurvey, addMediaItem, removeMediaItem } = useApp();
  const { user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copied, setCopied] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [multiShotOpen, setMultiShotOpen] = useState(false);
  const [tempPhotos, setTempPhotos] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const fileInputRef = useRef(null);
  const docInputRef = useRef(null);

  const { survey, client } = getSurvey(surveyId);

  // Open multi-shot modal for a category
  const handlePhotoCapture = useCallback((categoryKey) => {
    setActiveCategory(categoryKey);
    setTempPhotos([]);
    setMultiShotOpen(true);
    // Trigger the first capture immediately
    setTimeout(() => fileInputRef.current?.click(), 100);
  }, []);

  // Add captured photo to tempPhotos (does NOT save to Supabase yet)
  const handleFileSelected = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeCategory) return;

    try {
      const dataUrl = await compressImage(file);
      setTempPhotos((prev) => [
        ...prev,
        {
          id: generateId(),
          category: activeCategory,
          name: file.name,
          data: dataUrl,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Error processing photo:', err);
    }

    e.target.value = '';
  }, [activeCategory]);

  // Take another photo without closing the modal
  const handleTakeAnother = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Remove a temp photo before saving
  const handleRemoveTemp = useCallback((photoId) => {
    setTempPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }, []);

  // Save all temp photos to the survey and close modal
  const handleSaveAllPhotos = useCallback(async () => {
    if (tempPhotos.length === 0) return;
    setIsSaving(true);
    for (const photo of tempPhotos) {
      addMediaItem(surveyId, 'photos', photo);
    }
    setIsSaving(false);
    setTempPhotos([]);
    setMultiShotOpen(false);
    setActiveCategory(null);
  }, [tempPhotos, surveyId, addMediaItem]);

  // Close modal discarding unsaved photos
  const handleCloseMultiShot = useCallback(() => {
    setMultiShotOpen(false);
    setTempPhotos([]);
    setActiveCategory(null);
  }, []);

  const handleDocUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await fileToBase64(file);
      addMediaItem(surveyId, 'documents', {
        id: generateId(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: dataUrl,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error processing document:', err);
    }

    e.target.value = '';
  }, [surveyId, addMediaItem]);

  const handleDelete = useCallback((type, itemId) => {
    if (deleteConfirm === itemId) {
      removeMediaItem(surveyId, type, itemId);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(itemId);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }, [surveyId, deleteConfirm, removeMediaItem]);

  const handleCopyJSON = async () => {
    if (!survey) return;
    const exportData = {
      cliente: client?.name,
      tipo: survey.type,
      dataCreazione: survey.createdAt,
      ultimoSalvataggio: survey.lastSaved,
      dati: survey.data,
      media: {
        photos: (survey.data.media?.photos || []).map(({ id, category, name, createdAt }) => ({ id, category, name, createdAt })),
        documents: (survey.data.media?.documents || []).map(({ id, name, type, size, createdAt }) => ({ id, name, type, size, createdAt })),
      },
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
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

  const handleGenerateWord = useCallback(async () => {
    if (!survey || !client) return;
    setGeneratingWord(true);
    try {
      // Always fetch latest profile before generating
      let prof = { nome: '', cognome: '', titolo_professionale: '', albo: '', numero_iscrizione: '' };
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('nome, cognome, titolo_professionale, albo, numero_iscrizione')
          .eq('id', user.id)
          .single();
        if (data) prof = data;
      }
      await generateWordReport(prof, client.name, survey.data);
    } catch (err) {
      console.error('Error generating Word:', err);
    }
    setGeneratingWord(false);
  }, [survey, client, user]);

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

  const media = survey.data.media || { photos: [], documents: [] };
  const photos = media.photos || [];
  const documents = media.documents || [];

  const getCategoryLabel = (key) =>
    PHOTO_CATEGORIES.find((c) => c.key === key)?.label || key;

  const photosGrouped = PHOTO_CATEGORIES.reduce((acc, cat) => {
    const items = photos.filter((p) => p.category === cat.key);
    if (items.length > 0) acc.push({ ...cat, items });
    return acc;
  }, []);

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex-1 flex flex-col min-h-[100dvh] bg-gray-50">
      <Header
        title="Foto e Documenti"
        subtitle={client.name}
        backTo={`/survey/${surveyId}`}
        actions={
          <>
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/80 transition-colors"
              aria-label="Torna al Menu Principale"
              id="btn-home"
            >
              <Home size={20} />
            </button>
            <button
              onClick={handleCopyJSON}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'hover:bg-white/10 text-white/80'
              }`}
              aria-label="Esporta JSON"
            >
              {copied ? <Check size={20} /> : <Copy size={20} />}
            </button>
          </>
        }
      />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelected}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.dwg,.dxf"
        className="hidden"
        onChange={handleDocUpload}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-8">
        {/* Photo Capture Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={20} className="text-navy-700" />
            <h2 className="text-base font-bold text-navy-800">Scatta Foto</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Seleziona una categoria per avviare una sessione di scatto multiplo
          </p>

          <div className="grid grid-cols-2 gap-3">
            {PHOTO_CATEGORIES.map((cat) => {
              const count = photos.filter((p) => p.category === cat.key).length;
              return (
                <button
                  key={cat.key}
                  onClick={() => handlePhotoCapture(cat.key)}
                  className="photo-capture-btn group"
                  id={`btn-photo-${cat.key}`}
                >
                  <div className="w-12 h-12 rounded-xl bg-navy-100 flex items-center justify-center mb-2 group-active:bg-navy-200 transition-colors">
                    <Camera size={24} className="text-navy-600" />
                  </div>
                  <span className="text-sm font-semibold text-navy-800 leading-tight">
                    {cat.label}
                  </span>
                  {count > 0 && (
                    <span className="mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {count} foto
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Photo Gallery */}
        {photos.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Image size={20} className="text-navy-700" />
              <h2 className="text-base font-bold text-navy-800">
                Galleria ({photos.length})
              </h2>
            </div>

            {photosGrouped.map((group) => (
              <div key={group.key} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
                  {group.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group cursor-pointer"
                      onClick={() => setPreviewImage(photo)}
                    >
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('photos', photo.id);
                        }}
                        className={`absolute top-1.5 right-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          deleteConfirm === photo.id
                            ? 'bg-red-500 text-white'
                            : 'bg-black/50 text-white/80 opacity-0 group-hover:opacity-100 group-active:opacity-100'
                        }`}
                        aria-label="Elimina foto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Documents Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={20} className="text-navy-700" />
            <h2 className="text-base font-bold text-navy-800">Documenti</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Carica planimetrie, PDF o altri documenti
          </p>

          <button
            onClick={() => docInputRef.current?.click()}
            className="w-full min-h-[56px] rounded-xl border-2 border-dashed border-navy-200 bg-white text-navy-700 font-semibold flex items-center justify-center gap-3 transition-all hover:border-navy-300 active:bg-navy-50 active:scale-[0.98]"
            id="btn-upload-doc"
          >
            <FileUp size={22} />
            Carica Documento
          </button>

          {documents.length > 0 && (
            <div className="mt-3 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={18} className="text-navy-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-800 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatSize(doc.size)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete('documents', doc.id)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
                      deleteConfirm === doc.id
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    aria-label="Elimina documento"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Final Export Buttons */}
        <div className="mt-8 space-y-3">
          <button
            onClick={handleGenerateWord}
            disabled={generatingWord}
            className={`w-full min-h-[56px] rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
              generatingWord
                ? 'bg-navy-400 text-white cursor-wait'
                : 'bg-navy-700 text-white shadow-lg shadow-navy-700/25 hover:bg-navy-800 active:bg-navy-900 active:scale-[0.98]'
            }`}
            id="btn-generate-word"
          >
            {generatingWord ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                Generazione in corso...
              </>
            ) : (
              <>
                <FileDown size={22} />
                Genera Relazione Word
              </>
            )}
          </button>

          <button
            onClick={handleCopyJSON}
            className={`w-full min-h-[48px] rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-white text-navy-700 border-2 border-navy-200 hover:border-navy-300 active:bg-navy-50'
            }`}
            id="btn-export-json-final"
          >
            {copied ? (
              <>
                <Check size={20} />
                JSON Copiato!
              </>
            ) : (
              <>
                <Copy size={20} />
                Copia Riepilogo JSON
              </>
            )}
          </button>
        </div>
      </main>

      {/* Multi-Shot Camera Modal */}
      {multiShotOpen && (
        <div className="glass-overlay" onClick={handleCloseMultiShot}>
          <div
            className="relative max-w-lg w-full mx-4 animate-scale-in max-h-[90dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-navy-700 to-navy-800 rounded-t-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">Sessione di Scatto</h3>
                <p className="text-white/70 text-sm">
                  {getCategoryLabel(activeCategory)} — {tempPhotos.length} foto
                </p>
              </div>
              <button
                onClick={handleCloseMultiShot}
                className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
                aria-label="Chiudi sessione"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="bg-white flex-1 overflow-y-auto px-5 py-4">
              {/* Thumbnail Grid */}
              {tempPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {tempPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 group"
                    >
                      <img
                        src={photo.data}
                        alt={photo.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveTemp(photo.id)}
                        className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                        aria-label="Rimuovi foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Camera size={40} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nessuna foto scattata ancora</p>
                  <p className="text-xs mt-1">Premi il pulsante qui sotto per iniziare</p>
                </div>
              )}

              {/* Take Another Photo Button */}
              <button
                onClick={handleTakeAnother}
                className="w-full min-h-[56px] rounded-xl border-2 border-dashed border-navy-300 bg-navy-50 text-navy-700 font-bold flex items-center justify-center gap-3 transition-all hover:border-navy-400 active:bg-navy-100 active:scale-[0.98] text-base"
              >
                <Plus size={24} />
                Scatta un&apos;altra foto
              </button>
            </div>

            {/* Modal Footer — Save Button */}
            <div className="bg-white rounded-b-2xl px-5 py-4 border-t border-gray-100">
              <button
                onClick={handleSaveAllPhotos}
                disabled={tempPhotos.length === 0 || isSaving}
                className={`w-full min-h-[52px] rounded-xl font-bold flex items-center justify-center gap-2 text-base transition-all ${
                  tempPhotos.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isSaving
                    ? 'bg-emerald-400 text-white cursor-wait'
                    : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 active:bg-emerald-600 active:scale-[0.98]'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Salva {tempPhotos.length} Foto e Continua
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="glass-overlay"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-lg w-full mx-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white"
              aria-label="Chiudi anteprima"
            >
              <X size={22} />
            </button>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={previewImage.data}
                alt={previewImage.name}
                className="w-full max-h-[70vh] object-contain bg-gray-900"
              />
              <div className="p-4">
                <p className="font-semibold text-navy-800">{previewImage.name}</p>
                <p className="text-sm text-gray-500">
                  {getCategoryLabel(previewImage.category)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
