import { useState, useEffect } from 'react';
import { ConsentForm, PdfDocument, StudioSettings, User } from '../types';

// ---------------------------------------------------------------------------
// API Base URL
// ---------------------------------------------------------------------------
// Both the frontend and backend are served from the same domain on Render.
// ---------------------------------------------------------------------------
export const API_BASE = '/api';


export const useLiveForms = () => {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const res = await fetch(`${API_BASE}/forms`);
        if (res.ok) {
          setForms(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch forms", e);
      }
    };
    fetchForms();
    const interval = setInterval(fetchForms, 10000);
    return () => clearInterval(interval);
  }, []);
  return forms;
};

export const useLiveSettings = () => {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings`);
        if (res.ok) {
          setSettings(await res.json());
        }
      } catch (e) {
        console.error("Failed to fetch settings", e);
      }
    };
    fetchSettings();
  }, []);
  return settings;
};

export const db = {
  forms: {
    add: async (form: ConsentForm) => {
      await fetch(`${API_BASE}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
    },
    delete: async (id: string) => {
      await fetch(`${API_BASE}/forms/${id}`, { method: 'DELETE' });
    }
  },
  pdfs: {
    add: async (pdf: PdfDocument) => {
      const formData = new FormData();
      formData.append('file', pdf.blob, `${pdf.id}.pdf`);
      formData.append('createdAt', pdf.createdAt);
      
      await fetch(`${API_BASE}/pdfs/${pdf.id}`, {
        method: 'POST',
        body: formData
      });
    },
    delete: async (id: string) => {
      await fetch(`${API_BASE}/pdfs/${id}`, { method: 'DELETE' });
    },
    get: async (id: string): Promise<PdfDocument | null> => {
      try {
        const res = await fetch(`${API_BASE}/pdfs/${id}`);
        if (!res.ok) return null;
        const blob = await res.blob();
        return { id, blob, createdAt: new Date().toISOString() };
      } catch (e) {
        console.error('Error fetching PDF', e);
        return null;
      }
    }
  },
  settings: {
    put: async (data: StudioSettings & { id: string }) => {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
  }
};
