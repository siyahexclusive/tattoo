import React from 'react';

export const LegalWaiverText: React.FC = () => {
  return (
    <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto pr-2 border border-zinc-800 p-4 rounded-lg bg-zinc-950 font-sans">
      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
        1. Einwilligung in die Körperverletzung (§ 228 StGB) & Risikobelehrung
      </h3>
      <p>
        Juristisch gesehen stellt das Tätowieren einen Eingriff in die körperliche Unversehrtheit dar und erfüllt den Tatbestand einer Körperverletzung gemäß § 223 StGB. Dieser Eingriff erfolgt im gegenseitigen Einverständnis und ist durch Ihre ausdrückliche Einwilligung gemäß § 228 StGB gerechtfertigt.
      </p>
      <p>
        <strong>Wichtige Risiken und Nebenwirkungen:</strong>
        <br />
        Das Tätowieren birgt inhärente gesundheitliche Risiken, über die Sie hiermit umfassend aufgeklärt werden:
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Infektionen:</strong> Trotz Einhaltung strengster Hygienevorschriften des Berliner Infektionsschutzgesetzes und der Hygiene-Verordnung können Erreger (Bakterien, Viren) in die offene Wunde gelangen. Dies kann zu Entzündungen, Wundrose oder im Extremfall zu einer Sepsis führen.</li>
        <li><strong>Allergische Reaktionen:</strong> Tätowierfarben enthalten Pigmente und Trägerstoffe. Es können Überempfindlichkeitsreaktionen (Kontaktdermatitis) gegen Farbpigmente (insbesondere rote Farbtöne) oder Pflegeprodukte auftreten, teils erst Jahre später.</li>
        <li><strong>Vernarbung & Wundheilungsstörungen:</strong> Abhängig von der individuellen Veranlagung und der Nachsorge kann es zu Keloidbildungen, hypertrophen Narben, Farbverlusten oder Blowouts (Injektion des Pigments in tiefere Fettschichten) kommen.</li>
        <li><strong>Schmerzen & Kreislaufreaktionen:</strong> Das Schmerzempfinden ist individuell. Es kann während und nach der Sitzung zu Kreislaufschwankungen, Ohnmachtsanfällen oder Schwindel kommen.</li>
      </ul>

      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider mt-4">
        2. REACH-Konformität & Farbmittelsicherheit
      </h3>
      <p>
        Wir bestätigen ausdrücklich, dass in diesem Betrieb ausschließlich Tätowierfarben verwendet werden, die der geltenden europäischen <strong>REACH-Verordnung (EG) Nr. 1907/2006</strong> sowie der deutschen Tätowiermittelverordnung entsprechen. Alle verwendeten Pigmente sind für die intradermale Anwendung zugelassen, laborgeprüft und frei von unzulässigen Schwermetallkonzentrationen oder aromatischen Aminen.
      </p>

      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider mt-4">
        3. Haftungsausschluss und -begrenzung (§ 307 BGB)
      </h3>
      <p>
        Die Haftung des Tätowierers sowie des Studios für vertragliche Pflichtverletzungen sowie aus unerlaubter Handlung ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. 
      </p>
      <p>
        Diese Haftungsbeschränkung gilt ausdrücklich <strong>nicht</strong> für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, sofern diese auf einer fahrlässigen oder vorsätzlichen Pflichtverletzung des Tätowierers oder eines Erfüllungsgehilfen beruhen. Für diese Schäden haften wir im Rahmen der gesetzlichen Bestimmungen.
      </p>
      <p>
        Für unvorhersehbare Komplikationen, die auf eine fehlerhafte oder unvollständige Beantwortung des medizinischen Fragebogens oder auf eine unsachgemäße Nachsorge (Pflegefehler) zurückzuführen sind, ist jegliche Haftung des Studios und des Tätowierers ausgeschlossen.
      </p>

      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider mt-4">
        4. Aufklärung über den permanenten Charakter
      </h3>
      <p>
        Ihnen ist bewusst, dass eine Tätowierung dauerhaft in die Haut eingebracht wird. Eine vollständige und narbenfreie Entfernung (z. B. mittels Lasertherapie) kann nicht garantiert werden und ist mit erheblichen Kosten sowie gesundheitlichen Risiken verbunden.
      </p>
    </div>
  );
};

export const CareInstructionsText: React.FC = () => {
  return (
    <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto pr-2 border border-zinc-800 p-4 rounded-lg bg-zinc-950 font-sans">
      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
        Pflegehinweise und Nachsorgeanleitung (Heilungsprozess)
      </h3>
      <p>
        Die Qualität und Haltbarkeit Ihres Tattoos hängen zu mindestens 50 % von der richtigen Pflege in den ersten Wochen ab. Bitte beachten Sie die folgenden Anweisungen strikt:
      </p>
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Folienschutz:</strong> Entfernen Sie die angebrachte Schutzfolie (Second Skin oder klassische Frischhaltefolie) exakt nach Vorgabe des Tätowierers (Frischhaltefolie nach 2-4 Stunden; Spezialfolien nach 1-3 Tagen).</li>
        <li><strong>Reinigung:</strong> Waschen Sie das Tattoo unmittelbar nach dem Entfernen der Folie vorsichtig mit lauwarmem Wasser und einer milden, parfümfreien, pH-hautneutralen Seife ab. Verwenden Sie nur Ihre sauberen Hände, keinen Waschlappen. Tupfen Sie die Stelle danach vorsichtig mit einem fusselfreien Papiertuch trocken.</li>
        <li><strong>Eincremen:</strong> Tragen Sie ab dem 2. Tag eine spezielle, vom Studio empfohlene Tattoo-Pflegesalbe (z. B. Panthenol-basiert) hauchdünn auf. Wiederholen Sie dies 3-4 Mal täglich. Die Wunde darf weder austrocknen noch durch zu dickes Auftragen aufweichen.</li>
        <li><strong>Kein Kratzen:</strong> Nach einigen Tagen bildet sich ein Schorf oder eine feine Pelle. Dies juckt im Zuge der Heilung. <strong>Niemals kratzen, zupfen oder reiben!</strong> Das vorzeitige Lösen der Kruste führt zu Farbverlusten und Narbenbildung.</li>
        <li><strong>Verbote in den ersten 4 Wochen:</strong>
          <ul className="list-circle pl-5 mt-1 space-y-1">
            <li>Keine direkte Sonneneinstrahlung (Solarium) – danach immer LSF 50+ verwenden!</li>
            <li>Kein Vollbad, Schwimmbadbesuch (Chlorwasser) oder Saunieren (Infektionsgefahr).</li>
            <li>Kein intensiver Sport, der das Tattoo dehnt oder durch starkes Schwitzen aufweicht.</li>
          </ul>
        </li>
      </ul>
      <p className="font-medium text-amber-500 mt-2">
        Wichtiger Hinweis: Bei extremen Rötungen, starker Schwellung, anhaltendem Pochen, Eiteraustritt oder Fieber kontaktieren Sie bitte umgehend einen Arzt und informieren Sie das Studio.
      </p>
    </div>
  );
};

export const GdprPrivacyText: React.FC = () => {
  return (
    <div className="space-y-4 text-xs text-zinc-300 leading-relaxed max-h-96 overflow-y-auto pr-2 border border-zinc-800 p-4 rounded-lg bg-zinc-950 font-sans">
      <h3 className="font-semibold text-sm text-zinc-100 uppercase tracking-wider">
        Datenschutzerklärung gemäß Art. 13 & 14 DSGVO (Datenschutz-Grundverordnung)
      </h3>
      <p>
        Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Da wir im Rahmen dieser Erklärung auch sensible Gesundheitsdaten erheben, verarbeiten wir diese ausschließlich auf Grundlage strenger gesetzlicher Bestimmungen.
      </p>
      
      <p>
        <strong>1. Verantwortlicher für die Datenverarbeitung:</strong>
        <br />
        Die Datenverarbeitung erfolgt lokal durch das von Ihnen ausgewählte Tätowierstudio (siehe Kopfdaten dieses Formulars).
      </p>

      <p>
        <strong>2. Zweck und Rechtsgrundlage der Verarbeitung:</strong>
        <br />
        Die Erfassung Ihrer Identitätsdaten (Name, Anschrift, Geburtsdatum, Ausweisnummer) und Tätowier-Details dient der Erfüllung des Vertrages sowie der rechtlichen Absicherung des Studios im Falle von Streitigkeiten (Rechtsgrundlage: Art. 6 Abs. 1 lit. b und f DSGVO).
        <br />
        Die Erfassung Ihrer Gesundheitsdaten (Allergien, Krankheiten, Medikamente) erfolgt ausschließlich zum Schutz Ihrer Gesundheit vor unvorhersehbaren medizinischen Komplikationen. Da es sich hierbei um Daten der <strong>besonderen Kategorie nach Art. 9 DSGVO</strong> handelt, ist Ihre ausdrückliche, freiwillige Einwilligung gemäß Art. 9 Abs. 2 lit. a DSGVO die zwingende Rechtsgrundlage. Ohne diese Einwilligung kann keine Tätowierung durchgeführt werden.
      </p>

      <p>
        <strong>3. Lokale Datenhaltung (Lokal-Safe-Architektur):</strong>
        <br />
        Um das Risiko von Datenlecks im Internet vollständig auszuschließen, verwendet diese Anwendung eine <strong>dezentrale, lokale Datenhaltung</strong>. Ihre erfassten Daten, Antworten und Unterschriften werden ausschließlich verschlüsselt im lokalen Speicher dieses Endgeräts (Web-Sandbox/IndexedDB) abgelegt. Es erfolgt <strong>keine</strong> automatische Übertragung an externe Cloud-Server, Datenbanken oder sonstige Dritte. Die Daten verbleiben unter der physischen und digitalen Kontrolle des Studios.
      </p>

      <p>
        <strong>4. Aufbewahrungsfrist:</strong>
        <br />
        Gemäß den zivilrechtlichen Verjährungsfristen (§ 195, § 199 BGB) können Schadenersatzansprüche aus Körperverletzung bis zu 30 Jahre geltend gemacht werden. Um sich im Streitfall verteidigen zu können, speichert das Studio diese Einverständniserklärung für die Dauer von <strong>10 Jahren</strong> ab dem Datum der Unterschrift. Nach Ablauf dieser Frist werden die Daten endgültig gelöscht.
      </p>

      <p>
        <strong>5. Ihre Betroffenenrechte:</strong>
        <br />
        Sie haben das Recht auf Auskunft über die zu Ihrer Person gespeicherten Daten (Art. 15 DSGVO), Berichtigung unrichtiger Daten (Art. 16 DSGVO), Löschung Ihrer Daten (Art. 17 DSGVO - soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen), Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie das Recht auf Datenübertragbarkeit (Art. 20 DSGVO).
        <br />
        Zudem haben Sie das Recht, sich bei einer zuständigen Aufsichtsbehörde (z. B. der Berliner Beauftragten für Datenschutz und Informationsfreiheit) zu beschweren.
      </p>
      
      <p className="font-semibold text-zinc-100">
        Mit Ihrer Unterschrift willigen Sie ausdrücklich in die Erhebung und lokale Speicherung Ihrer sensiblen Gesundheitsdaten gemäß Art. 9 Abs. 2 lit. a DSGVO ein.
      </p>
    </div>
  );
};
