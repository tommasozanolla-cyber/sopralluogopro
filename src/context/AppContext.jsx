import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage, generateId } from '../hooks/useLocalStorage';
import { supabase } from '../supabaseClient';

const AppContext = createContext(null);

/**
 * Get the current authenticated user's ID.
 */
function getUserId() {
  return supabase.auth.getSession().then(({ data }) => data.session?.user?.id ?? null);
}

/**
 * Sync a survey row to Supabase (fire-and-forget).
 * Media base64 blobs are stripped — only metadata is sent.
 * Includes user_id so RLS policies can filter per-user.
 */
function syncToSupabase(client, survey) {
  getUserId().then((userId) => {
    if (!userId) return;

    const mediaMeta = {
      photos: (survey.data.media?.photos || []).map(
        ({ id, category, name, createdAt }) => ({ id, category, name, createdAt })
      ),
      documents: (survey.data.media?.documents || []).map(
        ({ id, name, type, size, createdAt }) => ({ id, name, type, size, createdAt })
      ),
    };

    const row = {
      id: survey.id,
      user_id: userId,
      client_id: client.id,
      client_name: client.name,
      survey_type: survey.type,
      created_at: survey.createdAt,
      last_saved: survey.lastSaved || new Date().toISOString(),
      data: {
        generali: survey.data.generali,
        involucro: survey.data.involucro,
        zonetermiche: survey.data.zonetermiche,
        impianti: survey.data.impianti,
        media: mediaMeta,
      },
    };

    supabase
      .from('sopralluoghi')
      .upsert(row, { onConflict: 'id' })
      .then(({ error }) => {
        if (error) console.warn('[Supabase] sync error:', error.message);
      });
  });
}

const EMPTY_SURVEY_DATA = {
  generali: {
    annoCostruzione: '',
    comune: '',
    piano: '',
    tipologiaEdificio: '',
    datiCatastali: '',
    superficieTotale: '',
  },
  involucro: {
    tipoVetri: '',
    telaio: '',
    spessoreMura: '',
    isolamento: '',
    spessoreIsolante: '',
    tipoTetto: '',
  },
  zonetermiche: {
    confineSuperiore: '',
    confineInferiore: '',
    orientamento: [],
    paretiEsposte: '',
    note: '',
  },
  impianti: {
    generatore: '',
    marcaModello: '',
    annoInstallazione: '',
    emissione: '',
    acs: '',
    energieRinnovabili: [],
    potenzaPV: '',
  },
  media: {
    photos: [],
    documents: [],
  },
};

export function AppProvider({ children }) {
  const [clients, setClients] = useLocalStorage('sopralluogo-ape-clients', []);

  const addClient = useCallback((name) => {
    const newClient = {
      id: generateId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      surveys: [],
    };
    setClients((prev) => [newClient, ...prev]);

    // Sync: insert client row with user_id for RLS
    getUserId().then((userId) => {
      if (!userId) return;
      supabase
        .from('clienti')
        .upsert(
          { id: newClient.id, user_id: userId, name: newClient.name, created_at: newClient.createdAt },
          { onConflict: 'id' }
        )
        .then(({ error }) => {
          if (error) console.warn('[Supabase] addClient error:', error.message);
        });
    });

    return newClient;
  }, [setClients]);

  const deleteClient = useCallback((clientId) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));

    // Sync: remove client's surveys then the client itself
    supabase.from('sopralluoghi').delete().eq('client_id', clientId)
      .then(() => supabase.from('clienti').delete().eq('id', clientId))
      .then(({ error }) => {
        if (error) console.warn('[Supabase] deleteClient error:', error.message);
      });
  }, [setClients]);

  const getClient = useCallback((clientId) => {
    return clients.find((c) => c.id === clientId) || null;
  }, [clients]);

  const addSurvey = useCallback((clientId, type = 'Sopralluogo APE') => {
    const newSurvey = {
      id: generateId(),
      type,
      createdAt: new Date().toISOString(),
      lastSaved: null,
      data: JSON.parse(JSON.stringify(EMPTY_SURVEY_DATA)),
    };
    setClients((prev) => {
      const updated = prev.map((c) =>
        c.id === clientId
          ? { ...c, surveys: [newSurvey, ...c.surveys] }
          : c
      );
      // Sync new survey to Supabase
      const client = updated.find((c) => c.id === clientId);
      if (client) syncToSupabase(client, newSurvey);
      return updated;
    });
    return newSurvey;
  }, [setClients]);

  const getSurvey = useCallback((surveyId) => {
    for (const client of clients) {
      const survey = client.surveys.find((s) => s.id === surveyId);
      if (survey) return { survey, client };
    }
    return { survey: null, client: null };
  }, [clients]);

  const updateSurveyData = useCallback((surveyId, section, fieldData) => {
    setClients((prev) => {
      const updated = prev.map((client) => ({
        ...client,
        surveys: client.surveys.map((survey) =>
          survey.id === surveyId
            ? {
                ...survey,
                lastSaved: new Date().toISOString(),
                data: {
                  ...survey.data,
                  [section]: {
                    ...survey.data[section],
                    ...fieldData,
                  },
                },
              }
            : survey
        ),
      }));
      // Sync updated survey to Supabase
      for (const client of updated) {
        const survey = client.surveys.find((s) => s.id === surveyId);
        if (survey) { syncToSupabase(client, survey); break; }
      }
      return updated;
    });
  }, [setClients]);

  const deleteSurvey = useCallback((clientId, surveyId) => {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId
          ? { ...c, surveys: c.surveys.filter((s) => s.id !== surveyId) }
          : c
      )
    );

    // Sync: remove from Supabase
    supabase
      .from('sopralluoghi')
      .delete()
      .eq('id', surveyId)
      .then(({ error }) => {
        if (error) console.warn('[Supabase] deleteSurvey error:', error.message);
      });
  }, [setClients]);

  const addMediaItem = useCallback((surveyId, type, item) => {
    setClients((prev) => {
      const updated = prev.map((client) => ({
        ...client,
        surveys: client.surveys.map((survey) => {
          if (survey.id !== surveyId) return survey;
          const media = survey.data.media || { photos: [], documents: [] };
          return {
            ...survey,
            lastSaved: new Date().toISOString(),
            data: {
              ...survey.data,
              media: {
                ...media,
                [type]: [...(media[type] || []), item],
              },
            },
          };
        }),
      }));
      for (const client of updated) {
        const survey = client.surveys.find((s) => s.id === surveyId);
        if (survey) { syncToSupabase(client, survey); break; }
      }
      return updated;
    });
  }, [setClients]);

  const removeMediaItem = useCallback((surveyId, type, itemId) => {
    setClients((prev) => {
      const updated = prev.map((client) => ({
        ...client,
        surveys: client.surveys.map((survey) => {
          if (survey.id !== surveyId) return survey;
          const media = survey.data.media || { photos: [], documents: [] };
          return {
            ...survey,
            lastSaved: new Date().toISOString(),
            data: {
              ...survey.data,
              media: {
                ...media,
                [type]: (media[type] || []).filter((i) => i.id !== itemId),
              },
            },
          };
        }),
      }));
      for (const client of updated) {
        const survey = client.surveys.find((s) => s.id === surveyId);
        if (survey) { syncToSupabase(client, survey); break; }
      }
      return updated;
    });
  }, [setClients]);

  const value = {
    clients,
    addClient,
    deleteClient,
    getClient,
    addSurvey,
    getSurvey,
    updateSurveyData,
    deleteSurvey,
    addMediaItem,
    removeMediaItem,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
