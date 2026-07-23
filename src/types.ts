export interface HealthQuestions {
  infectiousDiseases: boolean; // HIV, Hepatitis, etc.
  hemophilia: boolean; // Bluter
  bloodThinners: boolean; // Marcumar, Aspirin, etc.
  allergies: boolean; // Nickel, Latex, Pflaster, etc.
  allergyDetails: string;
  skinConditions: boolean; // Neurodermitis, Schuppenflechte im Bereich
  skinConditionsDetails: string;
  pregnancy: boolean; // Schwangerschaft / Stillzeit
  heartConditions: boolean; // Herzbeschwerden, Herzschrittmacher
  diabetes: boolean; // Diabetes mellitus
  acuteInfections: boolean; // Fieber, akute Infekte
  substanceInfluence: boolean; // Alkohol, Drogen in letzten 24h
  otherMedicalIssues: string; // Sonstiges
}

export interface ClientData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  zipCode: string;
  city: string;
  phone: string;
  email: string;
  idCardNumber: string; // Personalausweis/Reisepassnummer zur Identitätsprüfung
}

export interface TattooDetails {
  artistName: string;
  motifDescription: string;
  bodyPlacement: string;
  estimatedPrice: string;
  isCoverUp: boolean;
}

export interface ConsentForm {
  id: string;
  submittedAt: string;
  clientData: ClientData;
  tattooDetails: TattooDetails;
  healthQuestions: HealthQuestions;
  // Make signatures optional as they won't be saved in DB
  clientSignature?: string; 
  artistSignature?: string; 
  ipAddress?: string;
  deviceInfo?: string;
  isGdprAccepted: boolean;
  isWaiverAccepted: boolean;
  isCareInstructionsAccepted: boolean;
  pdfBlobId?: string; // Reference to the saved PDF in the DB
}

export interface PdfDocument {
  id: string; // Form ID
  blob: Blob;
  createdAt: string;
}

export interface StudioSettings {
  studioName: string;
  street: string;
  zipCode: string;
  city: string;
  ownerName: string;
  email: string;
  phone: string;
  taxNumber: string;
  artists: string[];
}

export type UserRole = 'ADMIN' | 'ARTIST';

export interface User {
  id: string;
  username: string;
  passwordHash: string; // For local mock auth
  role: UserRole;
  fullName: string;
}

export type ViewState = 'CLIENT_FLOW' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';
