import React, { useState, useEffect } from 'react';
import { db, useLiveForms, useLiveSettings } from './utils/db';
import { 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
} from 'lucide-react';
import { ViewState, ConsentForm, StudioSettings } from './types';
import { ConsentFormWizard } from './components/ConsentFormWizard';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [view, setView] = useState<ViewState>('CLIENT_FLOW');
  const forms = useLiveForms();
  const settings = useLiveSettings() || {
    studioName: 'Siyah Tattoos',
    street: 'Torstraße 104',
    zipCode: '10119',
    city: 'Berlin',
    ownerName: 'Can Siyah',
    email: 'hello@siyahtattoos.com',
    phone: '030 2489370',
    taxNumber: 'DE987654321',
    artists: ['Can Siyah', 'Elif Demir (Dark Art)', 'Marek Weber (Blackwork)', 'Guest Artist']
  };

  const [isTerminalUnlocked, setIsTerminalUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem('terminal_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [recentCompletedForm, setRecentCompletedForm] = useState<ConsentForm | null>(null);

  const [isClientSession] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      return (
        params.get('token') === 'siyah-client-form' || 
        params.get('scan') === 'true' ||
        hash === '#/form' ||
        hash === '#form' ||
        hash.includes('token=siyah-client-form')
      );
    } catch {
      return false;
    }
  });
  const [showThankYouPopup, setShowThankYouPopup] = useState(false);

  // Rate Limiting State
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  React.useEffect(() => {
    let timer: number;
    if (lockoutTimeLeft > 0) {
      timer = window.setInterval(() => {
        setLockoutTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimeLeft]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimeLeft > 0) return;
    
    setLoginError(false);
    
    const user = await db.users.where('username').equals(loginUsername.trim()).first();
    
    if (user && user.passwordHash === loginPassword) {
      setLoginAttempts(0);
      setIsTerminalUnlocked(true);
      try {
        sessionStorage.setItem('terminal_unlocked', 'true');
        sessionStorage.setItem('current_user', JSON.stringify(user));
      } catch (err) {
        console.error(err);
      }
      setLoginUsername('');
      setLoginPassword('');
    } else {
      const newAttempts = loginAttempts + 1;
      if (newAttempts >= 5) {
        setLockoutTimeLeft(60);
        setLoginAttempts(0);
      } else {
        setLoginAttempts(newAttempts);
      }
      setLoginError(true);
      if (navigator.vibrate) navigator.vibrate(100);
    }
  };

  const handleLockTerminal = () => {
    setIsTerminalUnlocked(false);
    try {
      sessionStorage.removeItem('terminal_unlocked');
      sessionStorage.removeItem('current_user');
    } catch (e) {
      console.error(e);
    }
    setView('CLIENT_FLOW');
  };

  const handleUpdateSettings = async (newSettings: StudioSettings) => {
    await db.settings.put({ id: 'studio_settings', ...newSettings });
  };

  const handleCompleteForm = async (formData: Omit<ConsentForm, 'id' | 'submittedAt'>) => {
    const randomId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const submittedAt = new Date().toISOString();
    
    // Create the full form object for PDF generation
    const fullForm: ConsentForm = {
      ...formData,
      id: randomId,
      submittedAt,
      ipAddress: '127.0.0.1 (Lokal)',
      deviceInfo: navigator.userAgent,
    };

    // 1. Generate PDF (which includes the signatures visually)
    const { generateConsentFormPDF } = await import('./utils/pdfGenerator');
    const doc = generateConsentFormPDF(fullForm, settings);
    const pdfBlob = doc.output('blob');

    // 2. Save PDF Blob to Dexie
    await db.pdfs.add({
      id: randomId,
      blob: pdfBlob,
      createdAt: submittedAt
    });

    // 3. Strip signatures from the form payload before saving to DB
    const newForm: ConsentForm = {
      ...fullForm,
      clientSignature: undefined,
      artistSignature: undefined,
      pdfBlobId: randomId // Link to the PDF Blob
    };

    // 4. Insert sanitized form into IndexedDB
    await db.forms.add(newForm);
    
    // Set for success screen (can show sanitized data, client won't see signatures)
    setRecentCompletedForm(newForm);
    setShowThankYouPopup(true);
  };

  const handleDeleteForm = async (id: string) => {
    await db.forms.delete(id);
    await db.pdfs.delete(id);
  };

  if (isClientSession) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col justify-between font-sans relative overflow-x-hidden antialiased">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none" />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center relative z-10" id="main-content-area">
          {!recentCompletedForm ? (
            <div className="space-y-4" id="view-client-wizard">
              <ConsentFormWizard
                artists={settings.artists}
                studioName={settings.studioName}
                onComplete={handleCompleteForm}
                onCancel={() => {
                  window.location.reload();
                }}
                settings={settings}
              />
            </div>
          ) : (
            <div className="w-full max-w-lg mx-auto bg-[#111113]/80 border border-zinc-800 rounded p-8 text-center space-y-6 shadow-2xl relative z-10 animate-fade-in" id="view-success-screen">
              <div className="w-14 h-14 bg-zinc-950 text-white rounded border border-zinc-850 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6 text-zinc-100" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-white">Einwilligung erfolgreich übermittelt!</h2>
                <p className="text-[11px] text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Vielen Dank, <strong>{recentCompletedForm.clientData.firstName}</strong>. Ihre Einverständniserklärung wurde verschlüsselt auf dem lokalen Terminal des Studios gespeichert.
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded border border-zinc-800/60 space-y-2 text-left text-[11px] text-zinc-300 font-mono" id="success-receipt">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Registrierungszeit:</span>
                  <span>{new Date(recentCompletedForm.submittedAt).toLocaleTimeString('de-DE')} Uhr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Kunde:</span>
                  <span>{recentCompletedForm.clientData.lastName}, {recentCompletedForm.clientData.firstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Künstler:</span>
                  <span>{recentCompletedForm.tattooDetails.artistName}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/60 flex flex-col space-y-2">
                <p className="text-[10px] text-zinc-500 font-mono">Sie können diese Seite nun sicher schließen.</p>
                <button
                  onClick={() => {
                    setRecentCompletedForm(null);
                    setShowThankYouPopup(false);
                  }}
                  className="mx-auto flex items-center justify-center space-x-2 px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold transition-all cursor-pointer text-[10px] uppercase tracking-widest rounded shadow"
                >
                  Neues Formular ausfüllen
                </button>
              </div>
            </div>
          )}
        </main>

        {showThankYouPopup && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md animate-fade-in" id="thank-you-popup-client">
            <div className="bg-[#111113] border border-zinc-800 rounded-xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative animate-scale-up">
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-lg font-black text-white tracking-wide uppercase">Herzlichen Dank! 🖤</h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Deine Einverständniserklärung wurde erfolgreich an das Studio übermittelt.
                </p>
                <p className="text-xs text-zinc-400 leading-relaxed italic">
                  Wir wünschen dir ein fantastisches Tattoo-Erlebnis im Studio und ganz viel Freude mit deinem neuen Kunstwerk! Enjoy your new ink! ✨
                </p>
              </div>

              <button
                onClick={() => setShowThankYouPopup(false)}
                className="w-full py-3 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-98"
              >
                Let's enjoy! 🎨
              </button>
            </div>
          </div>
        )}

        <footer className="w-full text-center py-4 border-t border-zinc-900 text-[9px] font-mono text-zinc-600 tracking-wider bg-zinc-950/40">
          SIYAH TATTOOS CLIENT REGISTRATION PORTAL
        </footer>
      </div>
    );
  }

  if (!isTerminalUnlocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col justify-center items-center font-sans relative overflow-x-hidden antialiased p-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        
        <div className="w-full max-w-sm bg-[#111113]/90 border border-zinc-800/80 rounded-lg p-8 text-center space-y-6 shadow-2xl relative z-10 animate-fade-in">
          <div className="w-16 h-16 bg-zinc-950 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold font-mono tracking-[0.2em] text-zinc-500 uppercase">Secure Terminal Portal</span>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">{settings.studioName}</h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Bitte melden Sie sich mit Ihren Benutzerdaten an.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Benutzername</label>
              <input 
                type="text" 
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-700"
                placeholder="z.B. admin"
                value={loginUsername}
                onChange={e => setLoginUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Passwort</label>
              <input 
                type="password" 
                className="w-full bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 transition-all placeholder-zinc-700"
                placeholder="••••••••"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
              />
            </div>
            
            {loginError && (
              <p className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-medium animate-pulse">
                Falsche Zugangsdaten.
              </p>
            )}

            <button 
              type="submit" 
              disabled={lockoutTimeLeft > 0}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded transition-all shadow-md disabled:opacity-50 disabled:bg-zinc-700 disabled:cursor-not-allowed"
            >
              {lockoutTimeLeft > 0 ? `Gesperrt (${lockoutTimeLeft}s)` : 'Anmelden'}
            </button>
          </form>

          <div className="text-[10px] text-zinc-500 font-mono pt-2 border-t border-zinc-900 text-center space-y-1">
            <p>Admin Login: <span className="text-zinc-400 font-bold">admin</span> / <span className="text-zinc-400 font-bold">admin123</span></p>
            <p className="text-[9px] text-zinc-600 font-normal leading-normal mt-2">Kunden scannen bitte den QR-Code im Studio.</p>
          </div>
        </div>
        
        <p className="mt-8 text-[9px] font-mono text-zinc-600 tracking-wider">
          SIYAH TATTOOS TERMINAL CONTROL SYSTEM • VERSION 1.3.0
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-zinc-100 flex flex-col justify-between font-sans relative overflow-x-hidden antialiased">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-zinc-800/10 rounded-full blur-[100px] pointer-events-none" />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col justify-center relative z-10" id="main-content-area">
        <div className="space-y-4 animate-fade-in" id="view-admin-dashboard">
          <Dashboard
            forms={forms}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onDeleteForm={handleDeleteForm}
            onLogout={handleLockTerminal}
          />
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto px-4 py-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-zinc-500 font-mono z-10 relative">
        <p>© 2026 {settings.studioName}. Alle Rechte vorbehalten.</p>
        <div className="flex space-x-4">
          <span className="flex items-center text-emerald-500/80">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> DSGVO Konform (Lokal-Verschlüsselt)
          </span>
          <span>|</span>
          <span>Version 1.3.0 (IndexedDB)</span>
        </div>
      </footer>
    </div>
  );
}
