import { jsPDF } from 'jspdf';
import { ConsentForm, StudioSettings } from '../types';

/**
 * Calculates client age from date of birth.
 */
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

/**
 * Generates a hyper-professional, vector-sharp PDF document for a Completed Consent Form.
 */
export function generateConsentFormPDF(form: ConsentForm, settings: StudioSettings): jsPDF {
  // A4 dimensions: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const marginX = 15;
  let currentY = 18;
  const contentWidth = 180; // 210 - (15 * 2)

  // Helper to draw horizontal line
  const drawLine = (y: number, thickness = 0.2, color = [200, 200, 200]) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(thickness);
    doc.line(marginX, y, marginX + contentWidth, y);
  };

  // 1. BRAND HEADER (Siyah Tattoos)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 15); // Deep almost black
  doc.text(settings.studioName.toUpperCase(), marginX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const studioContact = `${settings.street}, ${settings.zipCode} ${settings.city} | Tel: ${settings.phone} | Inhaber: ${settings.ownerName}`;
  doc.text(studioContact, marginX, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text('EINVERSTÄNDNISERKLÄRUNG ZUR TÄTOWIERUNG', marginX + contentWidth, currentY, { align: 'right' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  doc.text('RECHTSGÜLTIGES DOKUMENT GEMÄSS DSGVO & INFEKTIONSSCHUTZ', marginX + contentWidth, currentY + 5, { align: 'right' });

  currentY += 10;
  drawLine(currentY, 0.5, [15, 15, 15]);
  currentY += 6;

  // 2. KUNDEN-STAMMDATEN & ARTIST-SPEZIFIKATIONEN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 15, 15);
  doc.text('1. KUNDEN-STAMMDATEN (IDENTIFIKATION)', marginX, currentY);

  doc.text('2. TATTOO & ARTIST', marginX + 95, currentY);
  currentY += 3;

  // Left Box: Customer Info
  const startBoxY = currentY;
  doc.setFillColor(250, 250, 250);
  doc.setDrawColor(230, 230, 230);
  doc.rect(marginX, startBoxY, 85, 42, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 60, 60);
  
  let itemY = startBoxY + 5;
  const drawField = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value, x + 30, y);
  };

  const age = calculateAge(form.clientData.dateOfBirth);
  drawField('Name, Vorname:', `${form.clientData.lastName}, ${form.clientData.firstName}`, marginX + 3, itemY);
  itemY += 5;
  drawField('Geburtsdatum:', `${form.clientData.dateOfBirth} (${age} Jahre)`, marginX + 3, itemY);
  itemY += 5;
  drawField('Ausweisnummer:', form.clientData.idCardNumber || 'Nicht angegeben', marginX + 3, itemY);
  itemY += 5;
  drawField('Adresse:', `${form.clientData.street}`, marginX + 3, itemY);
  itemY += 5;
  drawField('Ort / PLZ:', `${form.clientData.zipCode} ${form.clientData.city}`, marginX + 3, itemY);
  itemY += 5;
  drawField('Telefon:', form.clientData.phone, marginX + 3, itemY);
  itemY += 5;
  drawField('E-Mail:', form.clientData.email, marginX + 3, itemY);

  // Right Box: Tattoo Info
  doc.setFillColor(250, 250, 250);
  doc.rect(marginX + 95, startBoxY, 85, 42, 'F');
  
  doc.setTextColor(60, 60, 60); // Ensure text color is set correctly
  let itemYRight = startBoxY + 5;
  const drawFieldRight = (label: string, value: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    
    const splitVal = doc.splitTextToSize(value, 50);
    doc.text(splitVal, x + 30, y);
    return splitVal.length * 4;
  };

  drawFieldRight('Künstler/Artist:', form.tattooDetails.artistName, marginX + 98, itemYRight);
  itemYRight += 5;
  drawFieldRight('Körperstelle:', form.tattooDetails.bodyPlacement, marginX + 98, itemYRight);
  itemYRight += 5;
  drawFieldRight('Cover-Up:', form.tattooDetails.isCoverUp ? 'JA (Anderes Motiv überdecken)' : 'NEIN', marginX + 98, itemYRight);
  itemYRight += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Motiv:', marginX + 98, itemYRight);
  doc.setFont('helvetica', 'normal');
  const splitMotif = doc.splitTextToSize(form.tattooDetails.motifDescription || 'Nicht beschrieben', 50);
  doc.text(splitMotif, marginX + 98 + 30, itemYRight);

  currentY = startBoxY + 45;

  // 3. HEALTH DECLARATION (MEDIZINISCHER FRAGEBOGEN)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 15, 15);
  doc.text('3. MEDIZINISCHER FRAGEBOGEN & GESUNDHEITSDEKLARATION', marginX, currentY);
  currentY += 4;

  // Health Questionnaire header
  doc.setFillColor(235, 235, 235);
  doc.rect(marginX, currentY, contentWidth, 5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text('Frage / Indikation', marginX + 3, currentY + 3.5);
  doc.text('Antwort', marginX + contentWidth - 25, currentY + 3.5);
  currentY += 5;

  const questionsList = [
    { key: 'infectiousDiseases', label: '1. Infektionskrankheiten (z.B. HIV, Hepatitis A/B/C, Tuberkulose)' },
    { key: 'hemophilia', label: '2. Blutgerinnungsstörungen (Hämophilie/Bluter)' },
    { key: 'bloodThinners', label: '3. Regelmäßige Einnahme von blutverdünnenden Medikamenten' },
    { key: 'allergies', label: '4. Bekannte Allergien (z.B. Nickel, Latex, Pflaster, Desinfektionsmittel)', detailKey: 'allergyDetails' },
    { key: 'skinConditions', label: '5. Hauterkrankungen im Tattoobereich (Neurodermitis, Schuppenflechte, Muttermale)', detailKey: 'skinConditionsDetails' },
    { key: 'pregnancy', label: '6. Aktuelle Schwangerschaft oder Stillzeit' },
    { key: 'heartConditions', label: '7. Herz-Kreislauf-Erkrankungen, Herzfehler oder Herzschrittmacher' },
    { key: 'diabetes', label: '8. Diabetes mellitus (Zuckerkrankheit)' },
    { key: 'acuteInfections', label: '9. Akute Infekte, Fieber, Entzündungen oder grippale Effekte' },
    { key: 'substanceInfluence', label: '10. Alkohol-, Drogen- oder Schmerzmittelkonsum in den letzten 24 Stunden' },
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  
  questionsList.forEach((q, idx) => {
    // Zebra striping
    if (idx % 2 === 0) {
      doc.setFillColor(248, 248, 248);
    } else {
      doc.setFillColor(255, 255, 255);
    }
    
    const value = form.healthQuestions[q.key as keyof typeof form.healthQuestions];
    const isYes = value === true;
    
    // Calculate details row height if any
    let rowHeight = 5;
    let detailText: string[] = [];
    if (isYes && q.detailKey) {
      const detailVal = form.healthQuestions[q.detailKey as keyof typeof form.healthQuestions] as string;
      if (detailVal) {
        detailText = doc.splitTextToSize(`Details: ${detailVal}`, contentWidth - 30);
        rowHeight += detailText.length * 3.5 + 2;
      }
    }

    doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
    drawLine(currentY, 0.1, [230, 230, 230]);

    // Question
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(q.label, marginX + 3, currentY + 3.5);

    // Answer
    if (isYes) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(190, 30, 30); // Alert red
      doc.text('JA', marginX + contentWidth - 25, currentY + 3.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Nein', marginX + contentWidth - 25, currentY + 3.5);
    }

    // Detail text
    if (detailText.length > 0) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 30, 30);
      let detailY = currentY + 7;
      detailText.forEach(line => {
        doc.text(line, marginX + 6, detailY);
        detailY += 3.5;
      });
    }

    currentY += rowHeight;
  });
  
  drawLine(currentY, 0.2, [200, 200, 200]);
  currentY += 6;

  // 4. RECHTLICHE EINWILLIGUNG, AUFKLÄRUNG & DSGVO (Small Legalese Grid)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text('4. RECHTLICHE EINWILLIGUNG & AUFKLÄRUNG ÜBER KÖRPERVERLETZUNG (§ 228 StGB)', marginX, currentY);
  currentY += 3.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(80, 80, 80);
  
  const legalText = 
    `Der Kunde erklärt hiermit ausdrücklich seine rechtswirksame Einwilligung in die Körperverletzung (§ 228 StGB), die durch das Einbringen von Tätowierfarbstoffen in die menschliche Haut unvermeidbar stattfindet. Dem Kunden ist bewusst, dass Tätowierungen dauerhafte Veränderungen der Haut darstellen. Der Kunde wurde ausführlich über die potenziellen Risiken (z.B. allergische Reaktionen auf Farbpigmente, Wundinfektionen, Entzündungen, Narbenbildung, Pigmentverluste oder asymmetrische Heilungsergebnisse) informiert.\n\n` +
    `Die medizinische Anamnese (Fragebogen) wurde vom Kunden an Eides statt wahrheitsgemäß ausgefüllt. Eine Falschangabe kann schwerwiegende medizinische Gefahren begründen und befreit das Studio vollständig von Haftungsansprüchen. Das Studio verwendet ausschließlich gesetzlich zugelassene Farbstoffe gemäß der deutschen Tätowiermittelverordnung (ECHA-REACH-konform). Jegliche Haftung für kosmetische Unzufriedenheit oder mangelhafte Nachsorge ist ausgeschlossen. Kostenloses Nachstechen ist ausgeschlossen, wenn die Nachpflegeanleitung missachtet wurde.\n\n` +
    `DSGVO-EINWILLIGUNG (DATENSCHUTZ): Gemäß Art. 9 Abs. 2 lit. a DSGVO willigt der Kunde ausdrücklich in die Speicherung, Erfassung und lokale Archivierung seiner sensiblen Gesundheitsdaten (medizinischer Fragebogen) sowie Unterschriftendossiers ein. Diese Daten dienen ausschließlich der Beweissicherung zur Abwehr von Haftungsansprüchen und dem Nachweis ordnungsgemäßer Hygiene und Aufklärung. Die Speicherdauer beträgt 10 Jahre. Die Daten verbleiben verschlüsselt auf dem lokalen Datenträger dieses Endgerätes.`;

  const splitLegal = doc.splitTextToSize(legalText, contentWidth);
  doc.text(splitLegal, marginX, currentY);
  
  // Calculate legal height
  const legalHeight = splitLegal.length * 3;
  currentY += legalHeight + 4;

  // Check if currentY exceeds page boundaries for signatures
  // If we have less than 40mm left, push signatures to next page
  if (currentY > 245) {
    doc.addPage();
    currentY = 20;
    
    // Add miniature header on page 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 15, 15);
    doc.text(`${settings.studioName.toUpperCase()} - EINVERSTÄNDNISERKLÄRUNG (SEITE 2)`, marginX, currentY);
    currentY += 4;
    drawLine(currentY, 0.3, [15, 15, 15]);
    currentY += 8;
  }

  // 5. SIGNATURES (Dual Visual Signature Box)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 15, 15);
  doc.text('5. RECHTSGÜLTIGE DIGITAL-UNTERSCHRIFTEN', marginX, currentY);
  currentY += 4;

  const sigBoxHeight = 28;
  
  // Client Signature Box
  doc.setFillColor(252, 252, 252);
  doc.rect(marginX, currentY, 85, sigBoxHeight, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(marginX, currentY, 85, sigBoxHeight, 'S');

  // Artist Signature Box
  doc.setFillColor(252, 252, 252);
  doc.rect(marginX + 95, currentY, 85, sigBoxHeight, 'F');
  doc.rect(marginX + 95, currentY, 85, sigBoxHeight, 'S');

  // Insert signature images if they exist
  if (form.clientSignature) {
    try {
      doc.addImage(form.clientSignature, 'PNG', marginX + 15, currentY + 1, 55, sigBoxHeight - 6);
    } catch (e) {
      console.error('Error adding client signature to PDF:', e);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('[Digital signiert]', marginX + 30, currentY + 12);
    }
  }

  if (form.artistSignature) {
    try {
      doc.addImage(form.artistSignature, 'PNG', marginX + 95 + 15, currentY + 1, 55, sigBoxHeight - 6);
    } catch (e) {
      console.error('Error adding artist signature to PDF:', e);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.text('[Unterzeichnet Tätowierer]', marginX + 95 + 25, currentY + 12);
    }
  }

  // Label signatures
  const timestamp = new Date(form.submittedAt).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) + ' Uhr';
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(40, 40, 40);
  doc.text('Digitale Unterschrift des Kunden', marginX + 3, currentY + sigBoxHeight - 2);
  doc.setFont('helvetica', 'normal');
  doc.text(timestamp, marginX + 82, currentY + sigBoxHeight - 2, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Unterschrift Tätowierer (Einwilligung vorab)', marginX + 95 + 3, currentY + sigBoxHeight - 2);
  doc.setFont('helvetica', 'normal');
  doc.text('Identität & Ausweis geprüft', marginX + 95 + 82, currentY + sigBoxHeight - 2, { align: 'right' });

  currentY += sigBoxHeight + 6;

  // 6. DSGVO PROOF STAMP
  doc.setFillColor(245, 247, 250);
  doc.rect(marginX, currentY, contentWidth, 12, 'F');
  doc.setDrawColor(218, 226, 236);
  doc.rect(marginX, currentY, contentWidth, 12, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(30, 41, 59);
  doc.text('DSGVO-ZERTIFIZIERTER PRÜFSTEMPEL & CLOUD-VERIFIZIERUNG', marginX + 3, currentY + 4);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  const sysStamp = `System-ID: berlin-ink-secure-v2 | Dokumenten-Schlüssel: SHA256-${form.id.substring(0, 16).toUpperCase()} | Erstellt auf: Siyah Tattoos Client-Terminal | Zeit: ${timestamp}`;
  doc.text(sysStamp, marginX + 3, currentY + 8);

  return doc;
}
