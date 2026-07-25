import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Paintbrush, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Signature, 
  ArrowRight, 
  ArrowLeft, 
  AlertTriangle, 
  Info,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { ClientData, TattooDetails, HealthQuestions, ConsentForm } from '../types';
import { SignaturePad } from './SignaturePad';
import { LegalWaiverText, CareInstructionsText, GdprPrivacyText } from './WaiverText';

interface ConsentFormWizardProps {
  artists: string[];
  studioName: string;
  onComplete: (form: Omit<ConsentForm, 'id' | 'submittedAt'>) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'client', label: 'Stammdaten', icon: User },
  { id: 'tattoo', label: 'Tattoo & Artist', icon: Paintbrush },
  { id: 'health', label: 'Gesundheit', icon: Activity },
  { id: 'waiver', label: 'Risiken & Haftung', icon: ShieldCheck },
  { id: 'care', label: 'Pflegehinweise', icon: FileText },
  { id: 'gdpr', label: 'DSGVO', icon: ShieldCheck },
  { id: 'signatures', label: 'Unterschriften', icon: Signature },
];

const INITIAL_CLIENT_DATA: ClientData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  street: '',
  zipCode: '',
  city: '',
  phone: '',
  email: '',
  idCardNumber: '',
};

const INITIAL_TATTOO_DETAILS: TattooDetails = {
  serviceType: 'tattoo',
  artistName: '',
  motifDescription: '',
  bodyPlacement: '',
  estimatedPrice: '',
  isCoverUp: false,
};

const INITIAL_HEALTH_QUESTIONS: HealthQuestions = {
  infectiousDiseases: false,
  hemophilia: false,
  bloodThinners: false,
  allergies: false,
  allergyDetails: '',
  skinConditions: false,
  skinConditionsDetails: '',
  pregnancy: false,
  heartConditions: false,
  diabetes: false,
  acuteInfections: false,
  substanceInfluence: false,
  otherMedicalIssues: '',
};

export const ConsentFormWizard: React.FC<ConsentFormWizardProps> = ({
  artists,
  studioName,
  onComplete,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form States
  const [clientData, setClientData] = useState<ClientData>(INITIAL_CLIENT_DATA);
  const [tattooDetails, setTattooDetails] = useState<TattooDetails>(INITIAL_TATTOO_DETAILS);
  const [healthQuestions, setHealthQuestions] = useState<HealthQuestions>(INITIAL_HEALTH_QUESTIONS);
  
  // Consents Checkboxes
  const [isWaiverAccepted, setIsWaiverAccepted] = useState(false);
  const [isCareInstructionsAccepted, setIsCareInstructionsAccepted] = useState(false);
  const [isGdprAccepted, setIsGdprAccepted] = useState(false);
  
  // Confirmations inside risks
  const [confirmTruth, setConfirmTruth] = useState(false);
  
  // Signatures
  const [clientSignature, setClientSignature] = useState<string | null>(null);
  const [artistSignature, setArtistSignature] = useState<string | null>(null);

  // Parental Consent Checkbox
  const [isParentalConsentProvided, setIsParentalConsentProvided] = useState(false);

  // Error States
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper: calculate age from birthdate
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const clientAge = calculateAge(clientData.dateOfBirth);
  const isMinor = clientData.dateOfBirth ? clientAge < 18 : false;

  const renderYesNoToggle = (field: keyof HealthQuestions) => {
    const value = healthQuestions[field] as boolean;
    const isYesActive = value === true;
    const isNoActive = value === false;

    const activeClass = "px-4 py-1 bg-white text-black border border-white text-[10px] font-bold rounded shadow-md transition-all duration-150 cursor-pointer";
    const inactiveClass = "px-4 py-1 bg-[#222] border border-[#333] text-zinc-400 text-[10px] rounded hover:bg-white hover:text-black hover:border-white transition-all duration-150 cursor-pointer";

    return (
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => {
            if (field === 'allergies') {
              setHealthQuestions(p => ({ ...p, allergies: false, allergyDetails: '' }));
            } else if (field === 'skinConditions') {
              setHealthQuestions(p => ({ ...p, skinConditions: false, skinConditionsDetails: '' }));
            } else {
              setHealthQuestions(p => ({ ...p, [field]: false }));
            }
          }}
          className={isNoActive ? activeClass : inactiveClass}
        >
          NEIN
        </button>
        <button
          type="button"
          onClick={() => setHealthQuestions(p => ({ ...p, [field]: true }))}
          className={isYesActive ? activeClass : inactiveClass}
        >
          JA
        </button>
      </div>
    );
  };

  // Step Validation
  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 0) {
      if (!clientData.firstName.trim()) newErrors.firstName = 'Vorname ist erforderlich';
      if (!clientData.lastName.trim()) newErrors.lastName = 'Nachname ist erforderlich';
      if (!clientData.dateOfBirth) {
        newErrors.dateOfBirth = 'Geburtsdatum ist erforderlich';
      } else {
        const isTattoo = tattooDetails.serviceType === 'tattoo';
        const minAge = isTattoo ? 16 : 14;
        const needsConsent = clientAge < 18;

        if (clientAge < minAge) {
          newErrors.dateOfBirth = `Kunden unter ${minAge} Jahren dürfen gesetzlich nicht ${isTattoo ? 'tätowiert' : 'gepierct'} werden`;
        } else if (needsConsent && !isParentalConsentProvided) {
          newErrors.isParentalConsentProvided = 'Bitte bestätigen Sie das Vorliegen einer Einverständniserklärung der Erziehungsberechtigten.';
        }
      }
      if (!clientData.street.trim()) newErrors.street = 'Straße und Hausnummer sind erforderlich';
      if (!clientData.zipCode.trim()) newErrors.zipCode = 'Postleitzahl ist erforderlich';
      if (!clientData.city.trim()) newErrors.city = 'Ort ist erforderlich';
      if (!clientData.phone.trim()) newErrors.phone = 'Telefonnummer ist erforderlich';
      if (!clientData.email.trim()) {
        newErrors.email = 'E-Mail ist erforderlich';
      } else if (!/\S+@\S+\.\S+/.test(clientData.email)) {
        newErrors.email = 'E-Mail ist ungültig';
      }
    }

    if (currentStep === 1) {
      if (!tattooDetails.artistName) newErrors.artistName = 'Tätowierer muss ausgewählt werden';
      if (!tattooDetails.motifDescription.trim()) newErrors.motifDescription = 'Motivbeschreibung ist erforderlich';
      if (!tattooDetails.bodyPlacement.trim()) newErrors.bodyPlacement = 'Körperstelle ist erforderlich';
    }

    if (currentStep === 2) {
      if (healthQuestions.substanceInfluence) {
        newErrors.substanceInfluence = 'Unter akutem Alkohol- oder Drogeneinfluss darf keine Tätowierung durchgeführt werden!';
      }
      if (healthQuestions.allergies && !healthQuestions.allergyDetails.trim()) {
        newErrors.allergyDetails = 'Bitte geben Sie Details zu Ihren Allergien an';
      }
      if (healthQuestions.skinConditions && !healthQuestions.skinConditionsDetails.trim()) {
        newErrors.skinConditionsDetails = 'Bitte geben Sie Details zu Ihren Hauterkrankungen an';
      }
    }

    if (currentStep === 3) {
      if (!isWaiverAccepted) {
        newErrors.isWaiverAccepted = 'Sie müssen der Einwilligung und der Risikobelehrung zustimmen';
      }
      if (!confirmTruth) {
        newErrors.confirmTruth = 'Sie müssen die Wahrheitsmäßigkeit Ihrer Angaben bestätigen';
      }
    }

    if (currentStep === 4) {
      if (!isCareInstructionsAccepted) {
        newErrors.isCareInstructionsAccepted = 'Sie müssen sich zur Einhaltung der Pflegehinweise verpflichten';
      }
    }

    if (currentStep === 5) {
      if (!isGdprAccepted) {
        newErrors.isGdprAccepted = 'Sie müssen der Datenschutzerklärung zustimmen';
      }
    }

    if (currentStep === 6) {
      if (!clientSignature) newErrors.clientSignature = 'Die Unterschrift des Kunden fehlt';
      if (!artistSignature) newErrors.artistSignature = 'Die Unterschrift des Tätowierers fehlt';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Complete
        onComplete({
          clientData,
          tattooDetails,
          healthQuestions,
          clientSignature: clientSignature!,
          artistSignature: artistSignature!,
          isGdprAccepted,
          isWaiverAccepted,
          isCareInstructionsAccepted,
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleChipClick = (field: keyof TattooDetails, value: string) => {
    setTattooDetails(prev => ({ ...prev, [field]: value }));
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="w-full max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[650px] font-sans" id="wizard-container">
      {/* Sidebar Progress (visible on medium & up) */}
      <div className="md:w-64 bg-zinc-950 border-r border-zinc-800 p-6 flex flex-col justify-between hidden md:flex" id="wizard-sidebar">
        <div>
          <div className="mb-8">
            <span className="text-xs font-mono text-zinc-500 tracking-wider uppercase">Dokumenten-Portal</span>
            <h2 className="text-lg font-bold text-zinc-100 tracking-tight">{studioName}</h2>
          </div>
          <nav className="space-y-4">
            {STEPS.map((step, idx) => {
              const isCompleted = idx < currentStep;
              const isActive = idx === currentStep;
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center space-x-3 transition-all ${
                    isActive 
                      ? 'text-white font-medium' 
                      : isCompleted 
                        ? 'text-zinc-400' 
                        : 'text-zinc-600'
                  }`}
                  id={`step-indicator-${step.id}`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] transition-all ${
                    isActive 
                      ? 'border-white bg-white text-zinc-950 font-black' 
                      : isCompleted 
                        ? 'border-zinc-700 bg-zinc-900 text-zinc-400' 
                        : 'border-zinc-800 text-zinc-600'
                  }`}>
                    {isCompleted ? '✓' : `0${idx + 1}`}
                  </div>
                  <span className="text-xs uppercase tracking-widest truncate">{step.label}</span>
                </div>
              );
            })}
          </nav>
        </div>
        
        <div className="text-[10px] font-mono text-zinc-500">
          <p>Lokal-Safe DSGVO Sandbox</p>
          <p className="text-emerald-500 mt-1 flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
            100% Offline-Safe
          </p>
        </div>
      </div>

      {/* Main Wizard Area */}
      <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between" id="wizard-main">
        {/* Step Header for Mobile */}
        <div className="md:hidden border-b border-zinc-800 pb-4 mb-6" id="wizard-mobile-header">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-500 uppercase tracking-wider">
              Schritt {currentStep + 1} von {STEPS.length}
            </span>
            <span className="text-sm font-semibold text-zinc-100">{STEPS[currentStep].label}</span>
          </div>
          <div className="w-full bg-zinc-800 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 flex flex-col justify-center" id="wizard-step-content-container">
          <div className="flex items-center space-x-3 mb-6" id="step-title-block">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded text-white">
              <StepIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider uppercase">{STEPS[currentStep].label}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Bitte füllen Sie alle erforderlichen Angaben gewissenhaft aus.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
              id={`step-view-${STEPS[currentStep].id}`}
            >
              {/* STEP 0: Stammdaten */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="client-data-form">
                  <div className="flex flex-col space-y-1 sm:col-span-2 mb-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Art der Dienstleistung *</label>
                    <div className="flex space-x-6 pt-1">
                      <label className="flex items-center space-x-2 text-xs text-zinc-100 cursor-pointer">
                        <input
                          type="radio"
                          name="serviceType"
                          value="tattoo"
                          checked={tattooDetails.serviceType === 'tattoo'}
                          onChange={() => setTattooDetails(prev => ({ ...prev, serviceType: 'tattoo' }))}
                          className="accent-amber-500 w-4 h-4"
                        />
                        <span className="uppercase tracking-wider font-semibold">Tattoo</span>
                      </label>
                      <label className="flex items-center space-x-2 text-xs text-zinc-100 cursor-pointer">
                        <input
                          type="radio"
                          name="serviceType"
                          value="piercing"
                          checked={tattooDetails.serviceType === 'piercing'}
                          onChange={() => setTattooDetails(prev => ({ ...prev, serviceType: 'piercing' }))}
                          className="accent-amber-500 w-4 h-4"
                        />
                        <span className="uppercase tracking-wider font-semibold">Piercing</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Vorname *</label>
                    <input
                      id="input-firstName"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="z.B. Max"
                      value={clientData.firstName}
                      onChange={e => setClientData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                    {errors.firstName && <span className="text-[10px] text-rose-400 font-medium">{errors.firstName}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Nachname *</label>
                    <input
                      id="input-lastName"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="z.B. Mustermann"
                      value={clientData.lastName}
                      onChange={e => setClientData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                    {errors.lastName && <span className="text-[10px] text-rose-400 font-medium">{errors.lastName}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Geburtsdatum *</label>
                    <input
                      id="input-dateOfBirth"
                      type="date"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all"
                      value={clientData.dateOfBirth}
                      onChange={e => setClientData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    />
                    {errors.dateOfBirth && <span className="text-[10px] text-rose-400 font-medium">{errors.dateOfBirth}</span>}
                    {isMinor && clientAge >= (tattooDetails.serviceType === 'tattoo' ? 16 : 14) && (
                      <div className="flex flex-col p-4 bg-amber-500/10 border border-amber-500/30 rounded mt-2 space-y-4 sm:col-span-2 shadow-inner" id="minor-warning">
                        <div className="flex items-start">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-amber-200 leading-relaxed tracking-wide">
                            <strong className="text-amber-500 uppercase tracking-widest font-black">Besondere rechtliche Auflagen für Minderjährige ({clientAge} Jahre)</strong>
                            <div className="mt-2 text-[11px]">
                              Gemäß § 107 BGB bedarf es für einen körperlichen Eingriff wie {tattooDetails.serviceType === 'tattoo' ? 'das Tätowieren' : 'das Piercen'} der vorherigen und ausdrücklichen Zustimmung der gesetzlichen Vertreter. Um die Rechtmäßigkeit des Eingriffs nach § 223 StGB (Körperverletzung) sicherzustellen, gelten folgende zwingende Voraussetzungen:
                              <ul className="list-disc ml-5 mt-3 space-y-2 text-amber-100">
                                <li>Eine vollständig ausgefüllte und original unterschriebene Einverständniserklärung <strong>aller</strong> sorgeberechtigten Personen muss vorliegen.</li>
                                <li>Physische Kopien der Personalausweise aller unterschreibenden Erziehungsberechtigten sowie des Kunden/der Kundin sind zwingend mitzubringen.</li>
                                <li>Bei alleinigem Sorgerecht ist ein entsprechender amtlicher Nachweis (z.B. Negativbescheinigung des Jugendamtes oder familiengerichtlicher Beschluss) zwingend vorzulegen.</li>
                                <li>Mindestens ein Erziehungsberechtigter muss beim Termin persönlich anwesend sein oder sich im Vorfeld zur Legitimation persönlich im Studio ausgewiesen haben.</li>
                                <li>Sowohl der/dem Minderjährigen als auch den Erziehungsberechtigten ist bewusst, dass der Dienstleister das Recht hat, die Durchführung des Eingriffs auch bei vorliegenden Dokumenten jederzeit und ohne Angabe von Gründen abzulehnen.</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-amber-500/30">
                          <label className="flex items-start space-x-3 cursor-pointer bg-black/40 p-4 rounded border border-amber-500/20 hover:border-amber-500/50 transition-all">
                            <input
                              type="checkbox"
                              checked={isParentalConsentProvided}
                              onChange={(e) => setIsParentalConsentProvided(e.target.checked)}
                              className="mt-1 w-5 h-5 accent-amber-500 rounded flex-shrink-0 cursor-pointer"
                            />
                            <span className="text-[11px] text-amber-400 leading-snug uppercase tracking-widest font-bold">
                              Ich und meine Erziehungsberechtigten haben die obigen gesetzlichen Voraussetzungen gelesen, vollumfänglich verstanden und bestätigen, dass zum Termin alle geforderten Dokumente rechtsgültig vorliegen werden.
                            </span>
                          </label>
                          {errors.isParentalConsentProvided && (
                            <span className="text-xs text-rose-400 font-bold mt-2 block px-2 animate-pulse">{errors.isParentalConsentProvided}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Personalausweis- / Pass-Nr.</label>
                    <input
                      id="input-idCardNumber"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white uppercase tracking-widest transition-all placeholder-zinc-700"
                      placeholder="z.B. T2200012F"
                      value={clientData.idCardNumber}
                      onChange={e => setClientData(prev => ({ ...prev, idCardNumber: e.target.value }))}
                    />
                    {errors.idCardNumber && <span className="text-[10px] text-rose-400 font-medium">{errors.idCardNumber}</span>}
                  </div>
                  <div className="flex flex-col space-y-1 sm:col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Straße & Hausnummer *</label>
                    <input
                      id="input-street"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="Hauptstraße 12a"
                      value={clientData.street}
                      onChange={e => setClientData(prev => ({ ...prev, street: e.target.value }))}
                    />
                    {errors.street && <span className="text-[10px] text-rose-400 font-medium">{errors.street}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Postleitzahl *</label>
                    <input
                      id="input-zipCode"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="10115"
                      value={clientData.zipCode}
                      onChange={e => setClientData(prev => ({ ...prev, zipCode: e.target.value }))}
                    />
                    {errors.zipCode && <span className="text-[10px] text-rose-400 font-medium">{errors.zipCode}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Stadt / Ort *</label>
                    <input
                      id="input-city"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="Berlin"
                      value={clientData.city}
                      onChange={e => setClientData(prev => ({ ...prev, city: e.target.value }))}
                    />
                    {errors.city && <span className="text-[10px] text-rose-400 font-medium">{errors.city}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Telefon *</label>
                    <input
                      id="input-phone"
                      type="tel"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="0170 1234567"
                      value={clientData.phone}
                      onChange={e => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    {errors.phone && <span className="text-[10px] text-rose-400 font-medium">{errors.phone}</span>}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">E-Mail *</label>
                    <input
                      id="input-email"
                      type="email"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="max@beispiel.de"
                      value={clientData.email}
                      onChange={e => setClientData(prev => ({ ...prev, email: e.target.value }))}
                    />
                    {errors.email && <span className="text-[10px] text-rose-400 font-medium">{errors.email}</span>}
                  </div>
                </div>
              )}

              {/* STEP 1: Tattoo & Artist */}
              {currentStep === 1 && (
                <div className="space-y-4" id="tattoo-details-form">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ausführender Tätowierer *</label>
                    <select
                      id="select-artist"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all"
                      value={tattooDetails.artistName}
                      onChange={e => setTattooDetails(prev => ({ ...prev, artistName: e.target.value }))}
                    >
                      <option value="">-- Bitte wählen --</option>
                      {artists.map(art => (
                        <option key={art} value={art}>{art}</option>
                      ))}
                    </select>
                    {errors.artistName && <span className="text-[10px] text-rose-400 font-medium">{errors.artistName}</span>}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Körperstelle für das Tattoo *</label>
                    <input
                      id="input-placement"
                      type="text"
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all placeholder-zinc-700"
                      placeholder="z.B. Rechter Unterarm (Innenseite)"
                      value={tattooDetails.bodyPlacement}
                      onChange={e => setTattooDetails(prev => ({ ...prev, bodyPlacement: e.target.value }))}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {['Unterarm', 'Oberschenkel', 'Wade', 'Rücken', 'Brust', 'Handgelenk'].map(chip => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => handleChipClick('bodyPlacement', chip)}
                          className="text-[9px] font-bold uppercase tracking-widest bg-zinc-900 hover:bg-white hover:text-black text-zinc-400 px-3 py-1 rounded transition-all border border-zinc-800 cursor-pointer"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                    {errors.bodyPlacement && <span className="text-[10px] text-rose-400 font-medium">{errors.bodyPlacement}</span>}
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Motivbeschreibung & Details *</label>
                    <textarea
                      id="input-motif"
                      rows={3}
                      className="bg-zinc-950/40 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-white transition-all resize-none placeholder-zinc-700"
                      placeholder="z.B. Geometrisches Mandala, ca. 15cm x 15cm, nur schwarze Linien & Dotwork"
                      value={tattooDetails.motifDescription}
                      onChange={e => setTattooDetails(prev => ({ ...prev, motifDescription: e.target.value }))}
                    />
                    {errors.motifDescription && <span className="text-[10px] text-rose-400 font-medium">{errors.motifDescription}</span>}
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-zinc-950 border border-zinc-800 rounded">
                    <input
                      id="checkbox-coverup"
                      type="checkbox"
                      className="w-4 h-4 rounded border-zinc-800 text-white bg-zinc-900 focus:ring-white focus:ring-offset-0"
                      checked={tattooDetails.isCoverUp}
                      onChange={e => setTattooDetails(prev => ({ ...prev, isCoverUp: e.target.checked }))}
                    />
                    <label htmlFor="checkbox-coverup" className="text-xs uppercase tracking-wider font-bold text-zinc-400 cursor-pointer">
                      Es handelt sich um ein <strong className="text-white">Cover-Up</strong> (Überdeckung eines alten Tattoos)
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 2: Medizinischer Fragebogen */}
              {currentStep === 2 && (
                <div className="space-y-4" id="health-questions-form">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 leading-normal mb-1">
                    <span className="font-semibold text-zinc-200">Wichtiger Hinweis:</span> Gemäß Berliner Infektionsschutzgesetz und dem Schutz Ihrer eigenen Gesundheit sind korrekte Angaben zwingend. Bestimmte Vorerkrankungen verlangen Vorsichtsmaßnahmen oder machen ein Tätowieren unmöglich.
                  </div>

                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-2 border border-zinc-800 rounded-lg p-3 bg-zinc-950/40">
                    
                    {/* HIV / Hep */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">1. Infektionskrankheiten</p>
                        <p className="text-[10px] text-zinc-500">Besteht eine chronische Infektionskrankheit (z.B. HIV, Hepatitis A/B/C, Tuberkulose)?</p>
                      </div>
                      {renderYesNoToggle('infectiousDiseases')}
                    </div>

                    {/* Hämophilie */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">2. Blutgerinnungsstörungen (Hämophilie)</p>
                        <p className="text-[10px] text-zinc-500">Leiden Sie unter der Bluterkrankheit oder anderen Gerinnungsdefekten?</p>
                      </div>
                      {renderYesNoToggle('hemophilia')}
                    </div>

                    {/* Blutverdünner */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">3. Blutverdünnende Medikamente</p>
                        <p className="text-[10px] text-zinc-500">Nehmen Sie blutverdünnende Mittel (z.B. Aspirin, Heparin, Marcumar) ein?</p>
                      </div>
                      {renderYesNoToggle('bloodThinners')}
                    </div>

                    {/* Allergien */}
                    <div className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <p className="text-xs font-semibold text-zinc-100">4. Allergien</p>
                          <p className="text-[10px] text-zinc-500">Liegen Allergien vor (z.B. gegen Nickel, Pflaster, Latex, Desinfektionsmittel)?</p>
                        </div>
                        {renderYesNoToggle('allergies')}
                      </div>
                      {healthQuestions.allergies && (
                        <div className="flex flex-col space-y-1 mt-1 pl-2 border-l-2 border-white">
                          <label className="text-[10px] text-zinc-500">Welche Allergien genau? *</label>
                          <input
                            id="input-allergyDetails"
                            type="text"
                            placeholder="z.B. Schwere Nickelallergie, Reaktionen auf herkömmliche Pflaster"
                            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white transition-colors"
                            value={healthQuestions.allergyDetails}
                            onChange={e => setHealthQuestions(p => ({ ...p, allergyDetails: e.target.value }))}
                          />
                          {errors.allergyDetails && <span className="text-[9px] text-rose-400 font-medium">{errors.allergyDetails}</span>}
                        </div>
                      )}
                    </div>

                    {/* Hauterkrankungen */}
                    <div className="p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <p className="text-xs font-semibold text-zinc-100">5. Hauterkrankungen</p>
                          <p className="text-[10px] text-zinc-500">Liegen Hautprobleme im Tattoo-Bereich vor (z.B. Neurodermitis, Schuppenflechte, Ekzeme, Muttermale)?</p>
                        </div>
                        {renderYesNoToggle('skinConditions')}
                      </div>
                      {healthQuestions.skinConditions && (
                        <div className="flex flex-col space-y-1 mt-1 pl-2 border-l-2 border-white">
                          <label className="text-[10px] text-zinc-500">Details / betroffene Hautstellen *</label>
                          <input
                            id="input-skinConditionsDetails"
                            type="text"
                            placeholder="z.B. Neurodermitisschub am Ellbogen"
                            className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-white transition-colors"
                            value={healthQuestions.skinConditionsDetails}
                            onChange={e => setHealthQuestions(p => ({ ...p, skinConditionsDetails: e.target.value }))}
                          />
                          {errors.skinConditionsDetails && <span className="text-[9px] text-rose-400 font-medium">{errors.skinConditionsDetails}</span>}
                        </div>
                      )}
                    </div>

                    {/* Schwangerschaft */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">6. Schwangerschaft / Stillzeit</p>
                        <p className="text-[10px] text-zinc-500">Besteht aktuell eine Schwangerschaft oder stillen Sie Ihr Kind?</p>
                      </div>
                      {renderYesNoToggle('pregnancy')}
                    </div>

                    {/* Herz-Kreislauf */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">7. Herz-Kreislauf-Erkrankungen</p>
                        <p className="text-[10px] text-zinc-500">Liegen Herzbeschwerden, Herzfehler oder ein Herzschrittmacher vor?</p>
                      </div>
                      {renderYesNoToggle('heartConditions')}
                    </div>

                    {/* Diabetes */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">8. Diabetes mellitus</p>
                        <p className="text-[10px] text-zinc-500">Leiden Sie unter Diabetes?</p>
                      </div>
                      {renderYesNoToggle('diabetes')}
                    </div>

                    {/* Akute Infekte */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">9. Akute Infekte / Fieber</p>
                        <p className="text-[10px] text-zinc-500">Fühlen Sie sich krank, haben Sie Fieber, Gliederschmerzen oder einen akuten Infekt?</p>
                      </div>
                      {renderYesNoToggle('acuteInfections')}
                    </div>

                    {/* Alkohol & Drogen */}
                    <div className="flex items-start justify-between p-3 rounded bg-zinc-900 border border-zinc-800 hover:bg-zinc-850/50 transition-colors">
                      <div className="flex-1 pr-4">
                        <p className="text-xs font-semibold text-zinc-100">10. Alkohol- oder Drogenkonsum</p>
                        <p className="text-[10px] text-zinc-500">Haben Sie in den letzten 24 Stunden Alkohol, Drogen, Schmerzmittel oder sonstige Rauschmittel konsumiert? *</p>
                      </div>
                      {renderYesNoToggle('substanceInfluence')}
                    </div>
                  </div>

                  {/* Red Alert on substance influence */}
                  {healthQuestions.substanceInfluence && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start" id="substance-block-alert">
                      <AlertTriangle className="w-5 h-5 text-rose-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-400 leading-normal">
                        <strong>Gesetzliches Verbot:</strong>
                        <br />
                        Tätowieren unter Alkohol-, Drogen- oder akutem Schmerzmitteleinfluss ist gesetzlich untersagt und schließt eine rechtsgültige Einwilligung vollständig aus. Die Sitzung kann nicht fortgesetzt werden.
                      </div>
                    </div>
                  )}

                  {/* General Warning if other items are true */}
                  {(healthQuestions.infectiousDiseases || healthQuestions.hemophilia || healthQuestions.bloodThinners || healthQuestions.pregnancy || healthQuestions.heartConditions) && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start" id="health-risks-notice">
                      <AlertTriangle className="w-5 h-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-400 leading-normal">
                        <strong>Erhöhtes Risiko identifiziert:</strong>
                        <br />
                        Ihre Angaben zeigen gesundheitliche Bedingungen, die zu Komplikationen (z.B. erhöhte Blutung, Entzündung oder Wechselwirkungen) führen können. Bitte stellen Sie sicher, dass Sie dies mit Ihrem behandelnden Arzt abgesprochen haben.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Risikobelehrung & Haftungsausschluss */}
              {currentStep === 3 && (
                <div className="space-y-4" id="waiver-form">
                  <LegalWaiverText />

                  <div className="space-y-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input
                        id="checkbox-waiver"
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-800 text-amber-500 bg-zinc-900 focus:ring-amber-500 mt-0.5"
                        checked={isWaiverAccepted}
                        onChange={e => setIsWaiverAccepted(e.target.checked)}
                      />
                      <label htmlFor="checkbox-waiver" className="text-xs text-zinc-300 leading-normal cursor-pointer">
                        Ich willige hiermit ausdrücklich in den Eingriff (das Tätowieren) ein und bestätige, die Risikobelehrung und die Haftungsregelungen vollständig gelesen und verstanden zu haben.
                      </label>
                    </div>
                    {errors.isWaiverAccepted && <p className="text-[10px] text-rose-400 font-medium pl-7">{errors.isWaiverAccepted}</p>}

                    <div className="flex items-start space-x-3 pt-2 border-t border-zinc-900">
                      <input
                        id="checkbox-truth"
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-800 text-amber-500 bg-zinc-900 focus:ring-amber-500 mt-0.5"
                        checked={confirmTruth}
                        onChange={e => setConfirmTruth(e.target.checked)}
                      />
                      <label htmlFor="checkbox-truth" className="text-xs text-zinc-300 leading-normal cursor-pointer">
                        Ich versichere an Eides statt, dass ich alle medizinischen Fragen im vorherigen Schritt wahrheitsgemäß, vollständig und nach bestem Wissen beantwortet habe.
                      </label>
                    </div>
                    {errors.confirmTruth && <p className="text-[10px] text-rose-400 font-medium pl-7">{errors.confirmTruth}</p>}
                  </div>
                </div>
              )}

              {/* STEP 4: Pflegehinweise */}
              {currentStep === 4 && (
                <div className="space-y-4" id="care-instructions-form">
                  <CareInstructionsText />

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <input
                        id="checkbox-care"
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-800 text-amber-500 bg-zinc-900 focus:ring-amber-500 mt-0.5"
                        checked={isCareInstructionsAccepted}
                        onChange={e => setIsCareInstructionsAccepted(e.target.checked)}
                      />
                      <label htmlFor="checkbox-care" className="text-xs text-zinc-300 leading-normal cursor-pointer">
                        Ich bestätige den Erhalt der Pflegeanleitung und verpflichte mich, diese gewissenhaft einzuhalten. Mir ist bewusst, dass unsachgemäße Pflege den Heilungsprozess stört und jegliche Mängelansprüche (z.B. kostenloses Nachstechen) ausschließt.
                      </label>
                    </div>
                    {errors.isCareInstructionsAccepted && <p className="text-[10px] text-rose-400 font-medium pl-7">{errors.isCareInstructionsAccepted}</p>}
                  </div>
                </div>
              )}

              {/* STEP 5: DSGVO & Datenschutz */}
              {currentStep === 5 && (
                <div className="space-y-4" id="gdpr-form">
                  <GdprPrivacyText />

                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        id="checkbox-gdpr"
                        type="checkbox"
                        className="w-4 h-4 rounded border-zinc-800 text-amber-500 bg-zinc-900 focus:ring-amber-500 mt-0.5"
                        checked={isGdprAccepted}
                        onChange={e => setIsGdprAccepted(e.target.checked)}
                      />
                      <label htmlFor="checkbox-gdpr" className="text-xs text-zinc-300 leading-normal cursor-pointer font-medium">
                        Ja, ich willige in die Erfassung und lokale Verarbeitung meiner sensiblen Gesundheitsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO ausdrücklich ein. Ich habe das Recht auf jederzeitigen Widerruf mit Wirkung für die Zukunft.
                      </label>
                    </div>
                    {errors.isGdprAccepted && <p className="text-[10px] text-rose-400 font-medium pl-7">{errors.isGdprAccepted}</p>}

                    <div className="flex items-center space-x-2 text-[10px] text-emerald-400 bg-emerald-500/5 p-2 rounded border border-emerald-500/10" id="offline-safe-badge">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span><strong>DSGVO-Datenminimierung:</strong> Keine Datenübertragung ins Internet. Ihre Eingaben werden ausschließlich auf der Sandbox dieses Tablets abgelegt.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Unterschriften */}
              {currentStep === 6 && (
                <div className="space-y-6" id="signatures-form">
                  <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400 leading-relaxed mb-1">
                    <p className="font-semibold text-zinc-200">Bitte leisten Sie nun Ihre digitale Unterschrift.</p>
                    <p>Beide Parteien müssen unterzeichnen. Die Unterschrift wird digital mit diesem Einverständnisdokument dauerhaft zusammengeführt.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dual-signature-pads">
                    <SignaturePad
                      label="Unterschrift des Kunden"
                      placeholder="Bitte mit dem Finger oder Stift hier unterschreiben"
                      onChange={setClientSignature}
                      savedValue={clientSignature}
                    />
                    
                    <SignaturePad
                      label="Unterschrift des Tätowierers"
                      placeholder="Unterschrift des Artists (Bestätigung Aufklärung)"
                      onChange={setArtistSignature}
                      savedValue={artistSignature}
                    />
                  </div>

                  {(errors.clientSignature || errors.artistSignature) && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 font-medium" id="signature-error-alert">
                      {errors.clientSignature && <p>• {errors.clientSignature}</p>}
                      {errors.artistSignature && <p>• {errors.artistSignature}</p>}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-zinc-800/60" id="wizard-footer">
          <button
            id="btn-back"
            type="button"
            onClick={currentStep === 0 ? onCancel : handleBack}
            className="flex items-center justify-center px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded transition-all duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            {currentStep === 0 ? 'Abbrechen' : 'Zurück'}
          </button>

          <button
            id="btn-next"
            type="button"
            onClick={handleNext}
            className="flex items-center justify-center px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-white text-zinc-950 hover:bg-zinc-200 rounded transition-all duration-150 cursor-pointer active:scale-[0.98] shadow-sm"
          >
            {currentStep === STEPS.length - 1 ? 'Abschließen & Speichern' : 'Weiter'}
            {currentStep < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5 ml-2" />}
          </button>
        </div>
      </div>
    </div>
  );
};
