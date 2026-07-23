import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Printer, 
  Settings as SettingsIcon, 
  Users, 
  ShieldAlert, 
  LogOut, 
  Calendar, 
  User as UserIcon, 
  Info, 
  Unlock, 
  Lock,
  Plus,
  RefreshCw,
  Eye,
  Check,
  AlertOctagon,
  AlertTriangle,
  Download,
  Cloud,
  ExternalLink,
  Loader2,
  QrCode,
  Copy,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  CartesianGrid 
} from 'recharts';
import { ConsentForm, StudioSettings } from '../types';

function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

import { db } from '../utils/db';

interface DashboardProps {
  forms: ConsentForm[];
  settings: StudioSettings;
  onUpdateSettings: (newSettings: StudioSettings) => void;
  onDeleteForm: (id: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  forms,
  settings,
  onUpdateSettings,
  onDeleteForm,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'forms' | 'settings'>('forms');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtistFilter, setSelectedArtistFilter] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState(''); // '', 'today', 'yesterday', '7days', '30days', 'custom'
  const [customDateFilter, setCustomDateFilter] = useState(''); // 'YYYY-MM-DD'
  const [hasRiskFilter, setHasRiskFilter] = useState(false);
  const [selectedForm, setSelectedForm] = useState<ConsentForm | null>(null);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  // Generate a client form URL that professionally avoids cookie blocking in the AI Studio container development environment
  const getClientFormUrl = () => {
    let origin = window.location.origin;
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return `${origin}?token=siyah-client-form`;
  };
  
  // Reactively update selectedForm when forms list (with cloud links) changes
  React.useEffect(() => {
    if (selectedForm) {
      const current = forms.find(f => f.id === selectedForm.id);
      if (current) {
        setSelectedForm(current);
      }
    }
  }, [forms, selectedForm?.id]);
  
  // Settings edit states
  const [studioName, setStudioName] = useState(settings.studioName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [street, setStreet] = useState(settings.street);
  const [zipCode, setZipCode] = useState(settings.zipCode);
  const [city, setCity] = useState(settings.city);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [artists, setArtists] = useState<string[]>(settings.artists);
  const [newArtistName, setNewArtistName] = useState('');
  
  // User Credentials Change State
  const [currentUsername, setCurrentUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [credentialsMessage, setCredentialsMessage] = useState<{ text: string; isError: boolean } | null>(null);

  React.useEffect(() => {
    try {
      const u = JSON.parse(sessionStorage.getItem('current_user') || '{}');
      if (u.username) {
        setCurrentUsername(u.username);
        setNewUsername(u.username);
      }
    } catch (e) {}
  }, []);

  const handleChangeCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUsername || !currentPassword || !newUsername || !newPassword) {
      setCredentialsMessage({ text: 'Bitte alle Felder ausfüllen.', isError: true });
      return;
    }
    
    try {
      const res = await fetch('/api/change_credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentUsername,
          currentPassword,
          newUsername,
          newPassword
        })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          setCredentialsMessage({ text: 'Die aktuellen Zugangsdaten sind falsch.', isError: true });
        } else if (res.status === 409) {
          setCredentialsMessage({ text: 'Dieser Benutzername ist bereits vergeben.', isError: true });
        } else {
          setCredentialsMessage({ text: 'Ein Fehler ist aufgetreten.', isError: true });
        }
        return;
      }
      
      const updatedUser = await res.json();
      sessionStorage.setItem('current_user', JSON.stringify(updatedUser));
      
      setCurrentUsername(newUsername);
      setCurrentPassword('');
      setNewPassword('');
      setCredentialsMessage({ text: 'Zugangsdaten erfolgreich geändert!', isError: false });
    } catch (err) {
      console.error(err);
      setCredentialsMessage({ text: 'Fehler beim Ändern der Daten.', isError: true });
    }
  };

  // Deletion double check state
  const [formToDelete, setFormToDelete] = useState<string | null>(null);

  // Helper: check if a form has health risks
  const hasRisks = (form: ConsentForm): boolean => {
    const h = form.healthQuestions;
    return (
      h.infectiousDiseases ||
      h.hemophilia ||
      h.bloodThinners ||
      h.allergies ||
      h.skinConditions ||
      h.pregnancy ||
      h.heartConditions ||
      h.diabetes ||
      h.acuteInfections ||
      h.substanceInfluence
    );
  };

  // Filtered Forms list
  const filteredForms = useMemo(() => {
    return forms.filter(form => {
      const matchSearch = 
        `${form.clientData.firstName} ${form.clientData.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.clientData.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.tattooDetails.motifDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.clientData.idCardNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchArtist = selectedArtistFilter === '' || form.tattooDetails.artistName === selectedArtistFilter;
      const matchRisk = !hasRiskFilter || hasRisks(form);

      let matchDate = true;
      if (selectedDateFilter !== '') {
        const submittedDate = new Date(form.submittedAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDateFilter === 'today') {
          const formDate = new Date(form.submittedAt);
          formDate.setHours(0, 0, 0, 0);
          matchDate = formDate.getTime() === today.getTime();
        } else if (selectedDateFilter === 'yesterday') {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const formDate = new Date(form.submittedAt);
          formDate.setHours(0, 0, 0, 0);
          matchDate = formDate.getTime() === yesterday.getTime();
        } else if (selectedDateFilter === '7days') {
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          matchDate = submittedDate >= sevenDaysAgo;
        } else if (selectedDateFilter === '30days') {
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          matchDate = submittedDate >= thirtyDaysAgo;
        } else if (selectedDateFilter === 'custom' && customDateFilter) {
          const formDateStr = new Date(form.submittedAt).toISOString().split('T')[0];
          matchDate = formDateStr === customDateFilter;
        }
      }

      return matchSearch && matchArtist && matchRisk && matchDate;
    });
  }, [forms, searchQuery, selectedArtistFilter, hasRiskFilter, selectedDateFilter, customDateFilter]);

  // Selection memoized variables and helper functions
  const selectedFilteredForms = useMemo(() => {
    return filteredForms.filter(f => selectedFormIds.includes(f.id));
  }, [filteredForms, selectedFormIds]);

  const isAllFilteredSelected = useMemo(() => {
    return filteredForms.length > 0 && filteredForms.every(f => selectedFormIds.includes(f.id));
  }, [filteredForms, selectedFormIds]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered forms
      const filteredIds = filteredForms.map(f => f.id);
      setSelectedFormIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered forms
      const filteredIds = filteredForms.map(f => f.id);
      setSelectedFormIds(prev => {
        const newIds = [...prev];
        filteredIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('de-DE');
    const todayForms = forms.filter(f => {
      const formDate = new Date(f.submittedAt).toLocaleDateString('de-DE');
      return formDate === todayStr;
    });

    const formsWithRisks = forms.filter(hasRisks);

    return {
      total: forms.length,
      today: todayForms.length,
      risks: formsWithRisks.length,
      artistsCount: settings.artists.length
    };
  }, [forms, settings.artists]);

  // Chart Data: count completed forms per artist
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    // Pre-populate with all settings artists to show even artists with 0 completed forms
    settings.artists.forEach(artist => {
      counts[artist] = 0;
    });
    // Add up forms
    forms.forEach(form => {
      const artist = form.tattooDetails.artistName;
      if (artist) {
        counts[artist] = (counts[artist] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  }, [forms, settings.artists]);

  // Settings handlers
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      studioName,
      ownerName,
      street,
      zipCode,
      city,
      phone,
      email,
      taxNumber,
      artists,
    });
    alert('Einstellungen wurden erfolgreich gespeichert.');
  };

  const handleAddArtist = () => {
    if (newArtistName.trim() && !artists.includes(newArtistName.trim())) {
      setArtists([...artists, newArtistName.trim()]);
      setNewArtistName('');
    }
  };

  const handleRemoveArtist = (nameToRemove: string) => {
    setArtists(artists.filter(name => name !== nameToRemove));
  };

  // Secure Delete Form Handler
  const handleDeleteConfirm = () => {
    if (formToDelete) {
      onDeleteForm(formToDelete);
      if (selectedForm?.id === formToDelete) {
        setSelectedForm(null);
      }
      setFormToDelete(null);
      alert('Der Datensatz wurde unwiderruflich gelöscht (DSGVO-konform).');
    }
  };

  // Trigger Print / PDF download of specific form
  const handlePrint = async (form: ConsentForm) => {
    try {
      const pdfDoc = await db.pdfs.get(form.id);
      if (pdfDoc && pdfDoc.blob) {
        const url = URL.createObjectURL(pdfDoc.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Einverstaendnis_${form.clientData.lastName}_${form.clientData.firstName}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('PDF nicht gefunden. Möglicherweise wurde es noch nicht generiert oder gelöscht.');
      }
    } catch (e) {
      console.error(e);
      alert('Fehler beim Abrufen des PDFs.');
    }
  };

  // Trigger Print / PDF download of multiple selected forms
  const handleBulkPrint = async (selectedForms: ConsentForm[]) => {
    if (selectedForms.length === 0) {
      alert('Bitte wählen Sie mindestens ein Formular für den Download aus.');
      return;
    }
    for (const form of selectedForms) {
      await handlePrint(form);
      await new Promise(r => setTimeout(r, 500));
    }
  };

  return (
    <div className="w-full text-zinc-100 font-sans" id="dashboard-wrapper">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-900 mb-6" id="dashboard-header-row">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-medium font-mono text-zinc-500 tracking-wider uppercase flex items-center gap-1.5">
              <span>Studio-Verwaltung</span>
              <span className="text-zinc-600 text-[9px] font-mono tracking-wider">
                • LOKAL GESPEICHERT
              </span>
            </span>
          </div>
          <h2 className="text-2xl font-light text-white tracking-tight mt-1">{settings.studioName}</h2>
        </div>
        
        <div className="flex items-center space-x-3" id="dashboard-actions">
          <button
            onClick={() => setIsQrModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-[10px] font-medium uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded border border-zinc-800 transition-all cursor-pointer"
            id="show-qr-btn"
          >
            <QrCode className="w-3.5 h-3.5 text-zinc-400" />
            <span>Kunden-QR-Code</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'forms' ? 'settings' : 'forms')}
            className={`flex items-center space-x-1.5 px-4 py-2 text-[10px] font-medium uppercase tracking-widest rounded border transition-all cursor-pointer ${
              activeTab === 'settings' 
                ? 'bg-zinc-100 border-zinc-100 text-zinc-950 hover:bg-zinc-200' 
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            id="tab-settings-btn"
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>{activeTab === 'settings' ? 'Zurück' : 'Einstellungen'}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 px-4 py-2 text-[10px] font-medium uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-all cursor-pointer"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Abmelden</span>
          </button>
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="stats-grid">
        <div className="bg-zinc-950/40 border border-zinc-900/60 p-5 rounded-lg flex flex-col justify-between" id="stat-total">
          <span className="text-[10px] font-medium font-mono text-zinc-500 uppercase tracking-widest">Waiver Gesamt</span>
          <p className="text-3xl font-light text-white tracking-tight mt-1">{stats.total}</p>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-900/60 p-5 rounded-lg flex flex-col justify-between" id="stat-today">
          <span className="text-[10px] font-medium font-mono text-zinc-500 uppercase tracking-widest">Heute ausgefüllt</span>
          <p className="text-3xl font-light text-white tracking-tight mt-1">{stats.today}</p>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-900/60 p-5 rounded-lg flex flex-col justify-between" id="stat-risks">
          <span className="text-[10px] font-medium font-mono text-zinc-500 uppercase tracking-widest">Risikofaktoren</span>
          <p className={`text-3xl font-light tracking-tight mt-1 ${stats.risks > 0 ? 'text-zinc-200 font-normal' : 'text-zinc-500'}`}>{stats.risks}</p>
        </div>

        <div className="bg-zinc-950/40 border border-zinc-900/60 p-5 rounded-lg flex flex-col justify-between" id="stat-artists">
          <span className="text-[10px] font-medium font-mono text-zinc-500 uppercase tracking-widest">Künstler Roster</span>
          <p className="text-3xl font-light text-white tracking-tight mt-1">{stats.artistsCount}</p>
        </div>
      </div>

      {/* Recharts Artist Activity Chart */}
      {activeTab === 'forms' && (
        <div className="bg-zinc-950/40 border border-zinc-900/60 p-6 rounded-lg mb-6 animate-fade-in" id="dashboard-recharts-artist-activity">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-900/50">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                Auslastung pro Künstler
              </h3>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
              Einwilligungen Gesamt
            </span>
          </div>

          <div className="h-48 w-full" id="recharts-chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1e" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#52525b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#1c1c1e', opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded shadow-xl font-mono text-[10px] text-zinc-200">
                          <p className="font-semibold text-zinc-400 mb-0.5">{payload[0].name}</p>
                          <p>
                            Einwilligungen: <span className="text-white font-bold">{payload[0].value}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 0 ? '#ffffff' : '#1c1c1e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Panel Content */}
      <div id="main-panel-view">
        {activeTab === 'forms' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="panel-forms">
            
            {/* LEFT: Forms List with search */}
            <div className="lg:col-span-7 space-y-4" id="forms-list-col">
              <div className="bg-[#111113]/40 border border-zinc-800 p-4 rounded space-y-3" id="filters-container">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Suche nach Name, E-Mail, Ausweisnummer, Motiv..."
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded pl-9 pr-4 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-colors placeholder-zinc-700"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[130px]">
                    <select
                      id="filter-artist"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white transition-all"
                      value={selectedArtistFilter}
                      onChange={e => setSelectedArtistFilter(e.target.value)}
                    >
                      <option value="">Alle Tätowierer</option>
                      {settings.artists.map(art => (
                        <option key={art} value={art}>{art}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[130px]">
                    <select
                      id="filter-date"
                      className="w-full bg-zinc-950/60 border border-zinc-800 rounded px-2.5 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white transition-all"
                      value={selectedDateFilter}
                      onChange={e => setSelectedDateFilter(e.target.value)}
                    >
                      <option value="">Alle Termine (Datum)</option>
                      <option value="today">Heute</option>
                      <option value="yesterday">Gestern</option>
                      <option value="7days">Letzte 7 Tage</option>
                      <option value="30days">Letzte 30 Tage</option>
                      <option value="custom">Spezifisches Datum...</option>
                    </select>
                  </div>

                  {selectedDateFilter === 'custom' && (
                    <div className="flex-1 min-w-[130px] animate-fade-in">
                      <input
                        type="date"
                        className="w-full bg-zinc-950/60 border border-zinc-800 rounded px-2 py-1 text-[11px] text-zinc-300 focus:outline-none focus:border-white transition-all"
                        value={customDateFilter}
                        onChange={e => setCustomDateFilter(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    onClick={() => setHasRiskFilter(!hasRiskFilter)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border rounded transition-all cursor-pointer ${
                      hasRiskFilter 
                        ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    id="filter-risk-btn"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Nur Risiken zeigen</span>
                  </button>
                </div>
              </div>

              {/* Bulk Selection Actions */}
              {filteredForms.length > 0 && (
                <div className="flex items-center justify-between px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-900 rounded-lg mb-3 text-xs text-zinc-400 font-mono" id="bulk-selection-bar">
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="checkbox"
                      id="select-all-checkbox"
                      checked={isAllFilteredSelected}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-800 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-white"
                    />
                    <label htmlFor="select-all-checkbox" className="cursor-pointer select-none text-[10px] uppercase tracking-wider text-zinc-500 font-medium hover:text-zinc-350 transition-colors">
                      Alle auswählen
                    </label>
                  </div>
                  
                  {selectedFormIds.length > 0 && (
                    <div className="flex items-center space-x-3 animate-fade-in">
                      <span className="text-[10px] text-zinc-500">
                        <strong className="text-zinc-200 font-semibold">{selectedFilteredForms.length}</strong> von <strong className="text-zinc-200 font-semibold">{selectedFormIds.length}</strong> ausgewählt
                      </span>
                      <button
                        onClick={() => handleBulkPrint(selectedFilteredForms)}
                        disabled={selectedFilteredForms.length === 0}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded transition-all border cursor-pointer ${
                          selectedFilteredForms.length > 0
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100 hover:bg-zinc-200'
                            : 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
                        }`}
                        id="bulk-print-btn"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Sammeldruck</span>
                      </button>
                      <button
                        onClick={() => setSelectedFormIds([])}
                        className="text-[9px] uppercase tracking-wider text-zinc-650 hover:text-rose-400 transition-colors font-medium cursor-pointer"
                      >
                        Aufheben
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Forms Scroll Area */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2" id="forms-scroll-list">
                {filteredForms.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-zinc-800 rounded text-zinc-500">
                    <Info className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                    <p className="text-xs font-mono uppercase tracking-wider">Keine Einverständniserklärungen gefunden.</p>
                  </div>
                ) : (
                  filteredForms.map(form => {
                    const hasAlert = hasRisks(form);
                    const formDate = new Date(form.submittedAt).toLocaleDateString('de-DE');
                    const formTime = new Date(form.submittedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedForm?.id === form.id;
                    const isChecked = selectedFormIds.includes(form.id);
                    const age = calculateAge(form.clientData.dateOfBirth);

                    return (
                      <div
                        key={form.id}
                        onClick={() => setSelectedForm(form)}
                        className={`p-4 rounded border transition-all cursor-pointer text-left flex items-center justify-between group gap-3 ${
                          isSelected
                            ? 'bg-zinc-900 border-white shadow-sm'
                            : 'bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-900/40'
                        }`}
                        id={`form-item-${form.id}`}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {/* Checkbox for Bulk Selection */}
                          <div 
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent opening details view on click
                            }}
                            className="flex items-center justify-center p-1 -ml-1 flex-shrink-0"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedFormIds(prev => {
                                  if (prev.includes(form.id)) {
                                    return prev.filter(id => id !== form.id);
                                  } else {
                                    return [...prev, form.id];
                                  }
                                });
                              }}
                              className="rounded border-zinc-800 bg-zinc-950 text-white focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-white"
                            />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors truncate">
                                {form.clientData.lastName}, {form.clientData.firstName}
                              </h4>
                              <span className="text-[9px] font-mono text-zinc-500 flex-shrink-0">({age} J.)</span>
                              {hasAlert && (
                                <span className="flex items-center text-[9px] bg-rose-500/5 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider flex-shrink-0">
                                  <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> RISIKO
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-zinc-400 font-mono">
                              <span className="flex items-center truncate">
                                <UserIcon className="w-3 h-3 mr-1 text-zinc-600 flex-shrink-0" /> Artist: {form.tattooDetails.artistName}
                              </span>
                              <span className="text-zinc-750">|</span>
                              <span className="truncate">Motiv: {form.tattooDetails.motifDescription.slice(0, 30)}{form.tattooDetails.motifDescription.length > 30 ? '...' : ''}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center space-x-4 flex-shrink-0">
                          <div className="text-[9px] font-mono text-zinc-500">
                            <p>{formDate}</p>
                            <p>{formTime} Uhr</p>
                          </div>
                          <Eye className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT: Selected Form Detailed Contract View */}
            <div className="lg:col-span-5" id="forms-detail-col">
              {selectedForm ? (
                <div className="bg-[#111113]/80 border border-zinc-800 rounded p-5 space-y-5 text-left sticky top-4" id="form-details-card">
                  
                  {/* Detailed Card Title Actions */}
                  <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Einverständniserklärung</h3>
                      <p className="text-[10px] font-mono text-zinc-500">ID: {selectedForm.id.slice(0, 10)}...</p>
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        onClick={() => handlePrint(selectedForm)}
                        className="p-1.5 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-800 rounded transition-all cursor-pointer"
                        title="Drucken / PDF erzeugen"
                        id="btn-print-doc"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setFormToDelete(selectedForm.id);
                        }}
                        className="p-1.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded transition-all cursor-pointer"
                        title="Unwiderruflich Löschen (DSGVO)"
                        id="btn-delete-doc"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Complete details table style */}
                  <div className="space-y-4 text-xs overflow-y-auto max-h-[460px] pr-2 scrollbar-thin">
                    
                    {/* General Info */}
                    <div className="bg-zinc-950/40 p-3 rounded border border-zinc-800/80 space-y-1.5">
                      <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest block mb-1">Kunden-Identifikationsdaten</span>
                      <p><strong className="text-zinc-500">Vollständiger Name:</strong> {selectedForm.clientData.lastName}, {selectedForm.clientData.firstName}</p>
                      <p><strong className="text-zinc-500">Geburtsdatum:</strong> {selectedForm.clientData.dateOfBirth} ({calculateAge(selectedForm.clientData.dateOfBirth)} J.)</p>
                      <p><strong className="text-zinc-500">Personalausweisnummer:</strong> <span className="font-mono tracking-wider text-zinc-200">{selectedForm.clientData.idCardNumber}</span></p>
                      <p><strong className="text-zinc-500">Adresse:</strong> {selectedForm.clientData.street}, {selectedForm.clientData.zipCode} {selectedForm.clientData.city}</p>
                      <p><strong className="text-zinc-500">E-Mail / Tel:</strong> {selectedForm.clientData.email} / {selectedForm.clientData.phone}</p>
                    </div>

                    {/* Tattoo Details */}
                    <div className="bg-zinc-950/40 p-3 rounded border border-zinc-800/80 space-y-1.5">
                      <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest block mb-1">Tattoo Spezifikationen</span>
                      <p><strong className="text-zinc-500">Tätowierer:</strong> {selectedForm.tattooDetails.artistName}</p>
                      <p><strong className="text-zinc-500">Körperstelle:</strong> {selectedForm.tattooDetails.bodyPlacement}</p>
                      <p><strong className="text-zinc-500">Cover-Up:</strong> {selectedForm.tattooDetails.isCoverUp ? 'JA' : 'Nein'}</p>
                      <p><strong className="text-zinc-500">Motiv:</strong> {selectedForm.tattooDetails.motifDescription}</p>
                    </div>

                    {/* Medical details with highlights on TRUE answers */}
                    <div className="bg-zinc-950/40 p-3 rounded border border-zinc-800/80 space-y-2">
                      <span className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest block mb-1">Gesundheitsfragebogen</span>
                      
                      <div className="grid grid-cols-1 gap-1.5">
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Infektionskrankheiten (HIV/Hepatitis):</span>
                          <span className={selectedForm.healthQuestions.infectiousDiseases ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.infectiousDiseases ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Bluterkrankheit (Hämophilie):</span>
                          <span className={selectedForm.healthQuestions.hemophilia ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.hemophilia ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Blutverdünner-Einnahme:</span>
                          <span className={selectedForm.healthQuestions.bloodThinners ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.bloodThinners ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="border-b border-zinc-900 pb-1 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Allergien (Nickel, Latex etc.):</span>
                            <span className={selectedForm.healthQuestions.allergies ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                              {selectedForm.healthQuestions.allergies ? 'JA' : 'Nein'}
                            </span>
                          </div>
                          {selectedForm.healthQuestions.allergies && (
                            <p className="text-[10px] text-zinc-300 pl-2 border-l border-zinc-500">Details: {selectedForm.healthQuestions.allergyDetails}</p>
                          )}
                        </div>
                        <div className="border-b border-zinc-900 pb-1 space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Hauterkrankungen (Neurodermitis etc.):</span>
                            <span className={selectedForm.healthQuestions.skinConditions ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                              {selectedForm.healthQuestions.skinConditions ? 'JA' : 'Nein'}
                            </span>
                          </div>
                          {selectedForm.healthQuestions.skinConditions && (
                            <p className="text-[10px] text-zinc-300 pl-2 border-l border-zinc-500">Details: {selectedForm.healthQuestions.skinConditionsDetails}</p>
                          )}
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Schwangerschaft / Stillzeit:</span>
                          <span className={selectedForm.healthQuestions.pregnancy ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.pregnancy ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Herzkrankheiten / Herzschrittmacher:</span>
                          <span className={selectedForm.healthQuestions.heartConditions ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.heartConditions ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Diabetes mellitus:</span>
                          <span className={selectedForm.healthQuestions.diabetes ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.diabetes ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-1">
                          <span className="text-zinc-400">Akute Infekte / Fieber:</span>
                          <span className={selectedForm.healthQuestions.acuteInfections ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.acuteInfections ? 'JA' : 'Nein'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-400">Rauschmittel-Konsum (letzte 24h):</span>
                          <span className={selectedForm.healthQuestions.substanceInfluence ? 'text-rose-400 font-bold' : 'text-zinc-500'}>
                            {selectedForm.healthQuestions.substanceInfluence ? 'JA' : 'Nein'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures visual boxes */}
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="p-3 border border-zinc-800 bg-zinc-950 rounded flex flex-col justify-between h-28">
                        <img src={selectedForm.clientSignature} className="max-h-16 mx-auto object-contain invert brightness-150 contrast-125" alt="Kunden Unterschrift" />
                        <span className="text-[9px] font-bold font-mono text-zinc-500 text-center uppercase tracking-wider mt-1 block">Unterschrift Kunde</span>
                      </div>
                      <div className="p-3 border border-zinc-800 bg-zinc-950 rounded flex flex-col justify-between h-28">
                        <img src={selectedForm.artistSignature} className="max-h-16 mx-auto object-contain invert brightness-150 contrast-125" alt="Artist Unterschrift" />
                        <span className="text-[9px] font-bold font-mono text-zinc-500 text-center uppercase tracking-wider mt-1 block">Unterschrift Artist</span>
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-zinc-950/20 border border-dashed border-zinc-800 rounded p-12 text-center text-zinc-500 h-[500px] flex flex-col justify-center items-center" id="no-form-selected-placeholder">
                  <Printer className="w-8 h-8 mb-3 text-zinc-700" />
                  <p className="text-[10px] font-mono uppercase tracking-wider leading-relaxed text-zinc-500">Wählen Sie einen Eintrag aus der linken Tabelle, um die rechtliche Einverständniserklärung anzuzeigen, zu drucken oder DSGVO-konform zu löschen.</p>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* TAB 2: Settings Panel */
          <div className="bg-[#111113]/40 border border-zinc-800 rounded p-6 text-left" id="panel-settings">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-6 flex items-center">
              <SettingsIcon className="w-3.5 h-3.5 mr-2" /> Studio & Admin-Konfiguration
            </h3>
 
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="settings-columns">
              
              {/* Form 1: Studio core parameters */}
              <form onSubmit={handleSaveSettings} className="space-y-4" id="form-studio-parameters">
                <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest block mb-2 border-b border-zinc-800 pb-1.5">Studiostammdaten</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Studio-Name</label>
                    <input
                      id="set-studioName"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={studioName}
                      onChange={e => setStudioName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Inhaber Name</label>
                    <input
                      id="set-ownerName"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={ownerName}
                      onChange={e => setOwnerName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Straße & Hausnummer</label>
                    <input
                      id="set-street"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Postleitzahl</label>
                    <input
                      id="set-zipCode"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stadt / Ort</label>
                    <input
                      id="set-city"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">E-Mail</label>
                    <input
                      id="set-email"
                      type="email"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Telefon</label>
                    <input
                      id="set-phone"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">USt-IdNr. / Steuernummer</label>
                    <input
                      id="set-taxNumber"
                      type="text"
                      className="bg-zinc-950/60 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      value={taxNumber}
                      placeholder="DE123456789"
                      onChange={e => setTaxNumber(e.target.value)}
                    />
                  </div>
                </div>
 
                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-[10px] uppercase tracking-widest rounded transition-all cursor-pointer"
                  >
                    Studioangaben speichern
                  </button>
                </div>
              </form>
 
              {/* Form 2: Artists & Admin PIN Management */}
              <div className="space-y-6" id="settings-security-artists-col">
                {/* Artists Management */}
                <div className="space-y-3" id="artists-management">
                  <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase tracking-widest block border-b border-zinc-800 pb-1.5">Tätowierer (Roster)</span>
                  
                  <div className="flex space-x-2">
                    <input
                      id="input-new-artist"
                      type="text"
                      placeholder="Name des Tätowierers"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white placeholder-zinc-700"
                      value={newArtistName}
                      onChange={e => setNewArtistName(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddArtist}
                      className="px-3 bg-zinc-900 hover:bg-white hover:text-black text-zinc-300 border border-zinc-800 rounded text-[10px] font-bold uppercase tracking-widest flex items-center cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Hinzufügen
                    </button>
                  </div>
 
                  <div className="flex flex-wrap gap-2 pt-2">
                    {artists.map(art => (
                      <span 
                        key={art} 
                        className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 text-zinc-400 px-3 py-1 rounded text-[11px] font-mono tracking-wide"
                      >
                        <span>{art}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveArtist(art)}
                          className="text-zinc-600 hover:text-white text-xs cursor-pointer font-bold transition-colors ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Change Credentials Box */}
                <form onSubmit={handleChangeCredentials} className="space-y-4 p-4 bg-zinc-950/40 border border-zinc-800 rounded mt-6">
                  <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest block border-b border-zinc-800 pb-2 mb-2">Account-Zugangsdaten ändern</span>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Aktueller Benutzer</label>
                        <input
                          type="text"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white tracking-widest"
                          value={currentUsername}
                          readOnly
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Aktuelles Passwort</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white tracking-widest"
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col space-y-3 border-l border-zinc-800/50 pl-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Neuer Benutzer</label>
                        <input
                          type="text"
                          className="w-full bg-zinc-950 border border-amber-500/20 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 tracking-widest"
                          value={newUsername}
                          onChange={e => setNewUsername(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-amber-500/80">Neues Passwort</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          className="w-full bg-zinc-950 border border-amber-500/20 rounded px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 tracking-widest"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {credentialsMessage && (
                    <p className={`text-[10px] ${credentialsMessage.isError ? 'text-rose-400' : 'text-emerald-400'} font-medium`}>
                      {credentialsMessage.text}
                    </p>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 border border-zinc-800 hover:border-amber-500 rounded text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md"
                    >
                      Zugangsdaten aktualisieren
                    </button>
                  </div>
                </form>

              </div>
 
            </div>
          </div>
        )}
      </div>
 
      {/* MODAL: DSGVO double confirmation for deletion */}
      {formToDelete && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm" id="deletion-modal-container">
          <div className="bg-zinc-950 border border-zinc-800 rounded p-6 max-w-md w-full text-left space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertOctagon className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-xs uppercase tracking-widest font-black">Permanente Löschung bestätigen</h3>
            </div>
            
            <p className="text-xs text-zinc-400 leading-normal">
              <strong>Achtung DSGVO-Löschung:</strong> Hiermit wird diese Einverständniserklärung vollständig und unwiderruflich vom lokalen Speicher dieses Endgeräts entfernt. Dieser Vorgang kann nicht rückgängig gemacht werden.
            </p>
 

 
            <div className="flex justify-end space-x-3 text-xs pt-2">
              <button
                id="btn-cancel-deletion"
                onClick={() => {
                  setFormToDelete(null);
                }}
                className="px-4 py-2 border border-zinc-800 rounded bg-zinc-950 text-zinc-500 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest cursor-pointer"
              >
                Abbrechen
              </button>
              
              <button
                id="btn-confirm-deletion"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded font-bold uppercase tracking-widest text-[10px] transition-all cursor-pointer"
              >
                Endgültig Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: QR Code for clients */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in" id="qr-modal-container">
          <div className="bg-[#111113] border border-zinc-800 rounded-xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setIsQrModalOpen(false);
                setIsCopied(false);
              }}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer text-xl font-bold"
              id="close-qr-modal-btn"
            >
              &times;
            </button>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-mono tracking-[0.2em] text-amber-500 uppercase">Kunden-Registrierung</span>
              <h3 className="text-base font-black text-white tracking-tight uppercase">QR-Code Scannen</h3>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Lassen Sie den Kunden diesen Code mit dem Smartphone scannen, um das Formular direkt auf dem eigenen Gerät auszufüllen.
              </p>
            </div>

            {/* QR Image Container */}
            <div className="p-4 bg-white rounded-lg inline-block mx-auto shadow-inner border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  getClientFormUrl()
                )}`}
                alt="Client Registration QR Code"
                className="w-48 h-48 block"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-2">
              {/* Copy URL button */}
              <button
                type="button"
                onClick={() => {
                  const clientUrl = getClientFormUrl();
                  navigator.clipboard.writeText(clientUrl);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 rounded text-xs font-bold text-zinc-300 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Link kopiert!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Registrierungs-Link kopieren</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQrModalOpen(false);
                  window.open(getClientFormUrl(), '_blank');
                }}
                className="w-full py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-bold rounded text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Auf diesem Gerät ausfüllen
              </button>
            </div>

            <div className="text-[10px] text-zinc-500 font-mono">
              Offline-Safe DSGVO Link-Token aktiv
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
