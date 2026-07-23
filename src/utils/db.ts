import { firestore, storage } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useState, useEffect } from 'react';
import { ConsentForm, PdfDocument, StudioSettings, User } from '../types';

const FORMS_COLLECTION = 'forms';
const USERS_COLLECTION = 'users';
const SETTINGS_COLLECTION = 'settings';

export const useLiveForms = () => {
  const [forms, setForms] = useState<ConsentForm[]>([]);
  useEffect(() => {
    const q = query(collection(firestore, FORMS_COLLECTION), orderBy('submittedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as ConsentForm);
      setForms(data);
    });
    return () => unsubscribe();
  }, []);
  return forms;
};

export const useLiveSettings = () => {
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(firestore, SETTINGS_COLLECTION, 'studio_settings'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StudioSettings);
      }
    });
    return () => unsubscribe();
  }, []);
  return settings;
};

export const db = {
  forms: {
    add: async (form: ConsentForm) => {
      await setDoc(doc(firestore, FORMS_COLLECTION, form.id), form);
    },
    delete: async (id: string) => {
      await deleteDoc(doc(firestore, FORMS_COLLECTION, id));
    }
  },
  pdfs: {
    add: async (pdf: PdfDocument) => {
      const storageRef = ref(storage, `pdfs/${pdf.id}.pdf`);
      await uploadBytes(storageRef, pdf.blob);
    },
    delete: async (id: string) => {
      const storageRef = ref(storage, `pdfs/${id}.pdf`);
      try {
        await deleteObject(storageRef);
      } catch(e) {
        console.error('Failed to delete PDF from storage', e);
      }
    },
    get: async (id: string): Promise<PdfDocument | null> => {
      const storageRef = ref(storage, `pdfs/${id}.pdf`);
      try {
        const url = await getDownloadURL(storageRef);
        // Fetch the blob from the URL
        const response = await fetch(url);
        const blob = await response.blob();
        return { id, blob, createdAt: new Date().toISOString() };
      } catch (e) {
        console.error('Error fetching PDF', e);
        return null;
      }
    }
  },
  users: {
    where: (field: string) => ({
      equals: (value: string) => ({
        first: async (): Promise<User | undefined> => {
          const q = query(collection(firestore, USERS_COLLECTION), where(field, '==', value));
          const snap = await getDocs(q);
          if (!snap.empty) {
            return snap.docs[0].data() as User;
          }
          return undefined;
        }
      })
    }),
    update: async (id: string, data: Partial<User>) => {
      await updateDoc(doc(firestore, USERS_COLLECTION, id), data);
    }
  },
  settings: {
    put: async (data: StudioSettings & { id: string }) => {
      await setDoc(doc(firestore, SETTINGS_COLLECTION, data.id), data);
    }
  }
};

// Seed initial admin user if none exists (in Firebase, we check first)
const initializeDatabase = async () => {
  const adminDoc = await getDoc(doc(firestore, USERS_COLLECTION, 'admin_user'));
  if (!adminDoc.exists()) {
    await setDoc(doc(firestore, USERS_COLLECTION, 'admin_user'), {
      id: 'admin_user',
      username: 'admin',
      passwordHash: 'admin123', 
      role: 'ADMIN',
      fullName: 'Studio Administrator'
    });
  }
  
  const settingsDoc = await getDoc(doc(firestore, SETTINGS_COLLECTION, 'studio_settings'));
  if (!settingsDoc.exists()) {
    await setDoc(doc(firestore, SETTINGS_COLLECTION, 'studio_settings'), {
      id: 'studio_settings',
      studioName: 'Siyah Tattoos',
      street: 'Torstraße 104',
      zipCode: '10119',
      city: 'Berlin',
      ownerName: 'Can Siyah',
      email: 'hello@siyahtattoos.com',
      phone: '030 2489370',
      taxNumber: 'DE987654321',
      artists: ['Can Siyah', 'Elif Demir (Dark Art)', 'Marek Weber (Blackwork)', 'Guest Artist']
    });
  }
};

initializeDatabase().catch(console.error);
