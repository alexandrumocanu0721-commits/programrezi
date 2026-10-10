export type Book = 'L' | 'K' | 'S';

export interface Topic {
  id: string;   // identificator stabil, nu se schimbă între versiuni
  b: Book;      // cartea
  t: string;    // titlul temei
  c: string;    // capitolul
  p: string;    // paginile
  n: number;    // număr de pagini
  d: number;    // dificultate: 1 ușor, 2 mediu, 3 greu
  days: number; // zile alocate implicit
  tip: string;  // „Atenție la ...”
  k: string;    // cuvinte cheie pentru reordonarea din text (fără diacritice)
  sys: string;  // sistemul, pentru ordinea „pe sisteme”
}

export const BOOKS: Record<Book, { name: string; full: string; k: string }> = {
  L: { name: 'Lawrence', full: 'Chirurgie generală și specialități chirurgicale, ed. a 6-a', k: 'lawrence chirurgie chirurgicala' },
  K: { name: 'Kumar și Clark', full: 'Medicină clinică, ed. a 10-a', k: 'kumar medicala interne' },
  S: { name: 'Sinopsis de medicină', full: 'Ganti, Lebowitz, Rosario, Vera, ed. a 5-a', k: 'sinopsis' },
};

// Ordinea sistemelor pentru presetul „pe sisteme”.
export const SYSTEMS = ['cardio', 'pneumo', 'gastro', 'nefro', 'endo', 'neuro', 'hemato', 'infectio', 'ati', 'chir', 'derm', 'ped', 'gin', 'psih'];

// Fiecare sesiune de rezidențiat are catalogul ei, construit din tematica oficială.
// Când apare tematica nouă, adaugi un catalog nou aici; programele vechi rămân valide.
export const CATALOGS: Record<string, { label: string; topics: Topic[] }> = {
  'nov-2026': {
    label: 'Rezidențiat Medicină, noiembrie 2026',
    topics: [
      {"id": "L1", "b": "L", "t": "Evaluarea și managementul perioperator", "c": "cap. 1", "p": "1–12", "n": 12, "d": 2, "days": 1, "tip": "riscul cardiac preoperator, managementul anticoagulantelor și al diabetului în perioperator, evaluarea pulmonară.", "k": "perioperator preoperator", "sys": "chir"},
      {"id": "L2", "b": "L", "t": "Sângerările chirurgicale și infecțiile chirurgicale", "c": "cap. 4 și 8", "p": "39–45, 75–84", "n": 17, "d": 2, "days": 1, "tip": "testele de coagulare și ce înseamnă fiecare modificare, indicațiile produselor sanguine; clasele de plăgi, profilaxia antibiotică, infecțiile necrozante.", "k": "hemostaza coagulare sangerari transfuzie infectii", "sys": "infectio"},
      {"id": "L3", "b": "L", "t": "Traumatologie", "c": "cap. 9", "p": "87–106", "n": 20, "d": 3, "days": 2, "tip": "evaluarea primară ABCDE, clasele de șoc hemoragic, GCS, indicațiile de laparotomie și toracotomie. Multe cifre, fă-ți tabel.", "k": "trauma traumatologie politrauma", "sys": "chir"},
      {"id": "L4", "b": "L", "t": "Arsurile", "c": "cap. 10", "p": "108–123", "n": 16, "d": 2, "days": 1, "tip": "regula lui 9, formula Parkland, clasificarea după profunzime, leziunea de inhalare, arsurile electrice și chimice.", "k": "arsuri", "sys": "chir"},
      {"id": "L5", "b": "L", "t": "Herniile peretelui abdominal", "c": "cap. 11", "p": "125–138", "n": 14, "d": 2, "days": 1, "tip": "anatomia regiunii inghinale, hernia directă vs indirectă vs femurală, încarcerare vs strangulare, tipurile rare.", "k": "hernii perete abdominal", "sys": "chir"},
      {"id": "L6", "b": "L", "t": "Esofagul", "c": "cap. 12", "p": "140–142, 151–164", "n": 17, "d": 2, "days": 1, "tip": "adenocarcinom vs scuamos (localizare, factori de risc), acalazia, perforația esofagiană, ingestia de caustice.", "k": "esofag digestiv gastro", "sys": "gastro"},
      {"id": "L7", "b": "L", "t": "Stomacul, duodenul și chirurgia obezității", "c": "cap. 13", "p": "167–168, 172–174, 179–191", "n": 18, "d": 2, "days": 1, "tip": "vascularizația gastrică, dumping precoce vs tardiv, tipurile de intervenții bariatrice și criteriile de indicație.", "k": "stomac duoden bariatrica obezitate digestiv gastro", "sys": "gastro"},
      {"id": "L8", "b": "L", "t": "Intestinul subțire și apendicele", "c": "cap. 14", "p": "193–199, 204–214", "n": 18, "d": 2, "days": 1, "tip": "ocluzie simplă vs strangulată, ischemia mezenterică acută (embolie vs tromboză), tumorile carcinoide, diverticulul Meckel, apendicita.", "k": "intestin subtire apendice ocluzie digestiv gastro", "sys": "gastro"},
      {"id": "L9", "b": "L", "t": "Colon, rect și anus", "c": "cap. 15", "p": "216–219, 222–225, 228–240", "n": 21, "d": 2, "days": 2, "tip": "diverticulita, volvulusul sigmoidian vs cecal, sindromul Ogilvie, polipii și screeningul colorectal, patologia anală.", "k": "colon rect anus colorectal digestiv gastro", "sys": "gastro"},
      {"id": "L10", "b": "L", "t": "Căile biliare", "c": "cap. 16", "p": "242–255", "n": 14, "d": 2, "days": 1, "tip": "colică biliară vs colecistită vs colangită, triada Charcot, explorările (ecografie, CPRE, colangio-RM).", "k": "biliare biliar colecist digestiv gastro", "sys": "gastro"},
      {"id": "L11", "b": "L", "t": "Pancreasul", "c": "cap. 17", "p": "257–275", "n": 19, "d": 3, "days": 2, "tip": "criteriile de severitate în pancreatita acută, complicațiile locale, tumorile neuroendocrine, adenocarcinomul pancreatic.", "k": "pancreas digestiv gastro", "sys": "gastro"},
      {"id": "L12", "b": "L", "t": "Ficatul și splina", "c": "cap. 20", "p": "317–324, 333–342", "n": 18, "d": 2, "days": 1, "tip": "hemangiom vs HNF vs adenom, abcesul piogen vs amoebian, indicațiile splenectomiei, vaccinarea și infecțiile după splenectomie.", "k": "ficat splina hepatic digestiv gastro", "sys": "gastro"},
      {"id": "L13", "b": "L", "t": "Boala arterială periferică și bolile venelor", "c": "cap. 26", "p": "520–527, 534–541", "n": 16, "d": 2, "days": 1, "tip": "indicele gleznă-braț, claudicație vs ischemie critică, ischemia acută, insuficiența venoasă cronică.", "k": "vascular artere vene cardio", "sys": "cardio"},
      {"id": "L14", "b": "L", "t": "ORL: bolile capului și gâtului", "c": "cap. 27", "p": "548–583", "n": 36, "d": 3, "days": 3, "tip": "capitol lung și cu multe noțiuni noi. Cancerele cap-gât, masele cervicale, epistaxisul, otitele, căile aeriene superioare.", "k": "orl cap gat", "sys": "chir"},
      {"id": "L15", "b": "L", "t": "Chirurgie ortopedică", "c": "cap. 28", "p": "585–633", "n": 49, "d": 3, "days": 4, "tip": "cel mai lung capitol din Lawrence. Fracturile cu nume proprii, sindromul de compartiment, ortopedia pediatrică, tumorile osoase.", "k": "ortopedie fracturi oase", "sys": "chir"},
      {"id": "L16", "b": "L", "t": "Urologie", "c": "cap. 29", "p": "635–674", "n": 40, "d": 3, "days": 3, "tip": "HBP, cancerul de prostată, tumorile testiculare și markerii lor, litiaza urinară, torsiunea testiculară.", "k": "urologie uro prostata rinichi", "sys": "nefro"},
      {"id": "K1", "b": "K", "t": "Sepsisul și tratamentul infecțiilor bacteriene", "c": "cap. 8", "p": "151–168", "n": 18, "d": 2, "days": 2, "tip": "definițiile sepsisului și șocului septic, măsurile din prima oră; clasele de antibiotice cu mecanism, spectru și reacții adverse.", "k": "sepsis infectii antibiotice infectio", "sys": "infectio"},
      {"id": "K2", "b": "K", "t": "Apa și electroliții", "c": "cap. 9", "p": "172–190", "n": 19, "d": 3, "days": 2, "tip": "hipo- și hipernatremia (cu viteza de corecție), hiperkaliemia (ECG, tratament de urgență), calciul și magneziul.", "k": "electroliti apa sodiu potasiu ati", "sys": "ati"},
      {"id": "K3", "b": "K", "t": "Dezechilibrele acido-bazice", "c": "cap. 9", "p": "195–202", "n": 8, "d": 3, "days": 1, "tip": "gaura anionică, compensările așteptate, acidoza cu GA crescută vs normală. Exersează pe gazometrii, nu doar citi.", "k": "acidobazic acido bazic gazometrie ati", "sys": "ati"},
      {"id": "K4", "b": "K", "t": "Insuficiența respiratorie și ARDS", "c": "cap. 10", "p": "224–233", "n": 10, "d": 2, "days": 1, "tip": "tip 1 vs tip 2, oxigenoterapia, ventilația non-invazivă, definiția și managementul ARDS.", "k": "insuficienta respiratorie ards ati terapie intensiva pneumo", "sys": "pneumo"},
      {"id": "K5", "b": "K", "t": "Anemiile și anemia hemolitică dobândită", "c": "cap. 16", "p": "327–336, 351–355", "n": 15, "d": 2, "days": 1, "tip": "feritina și profilul fierului în anemiile microcitare, B12 vs folat, testul Coombs și cauzele de hemoliză dobândită.", "k": "anemii hematologie hemato", "sys": "hemato"},
      {"id": "K6", "b": "K", "t": "Artrita reumatoidă", "c": "cap. 18", "p": "437–447", "n": 11, "d": 2, "days": 1, "tip": "criteriile de clasificare, anticorpii, manifestările extraarticulare, DMARD-urile și monitorizarea lor.", "k": "artrita reumatoida reumato", "sys": "hemato"},
      {"id": "K7", "b": "K", "t": "Spondilartritele și lupusul eritematos sistemic", "c": "cap. 18", "p": "447–454, 457–459", "n": 11, "d": 2, "days": 1, "tip": "HLA-B27, spondilita anchilozantă, artrita psoriazică și reactivă; în LES, autoanticorpii și ce organ afectează.", "k": "spondilartrite lupus reumato", "sys": "hemato"},
      {"id": "K8", "b": "K", "t": "Hipotiroidismul, hipertiroidismul și carcinomul tiroidian", "c": "cap. 21", "p": "611–619, 621–622", "n": 11, "d": 2, "days": 1, "tip": "TSH și FT4 în fiecare situație, cauzele de hipertiroidism, antitiroidienele, tipurile de carcinom tiroidian.", "k": "tiroida endocrino", "sys": "endo"},
      {"id": "K9", "b": "K", "t": "Diabetul zaharat", "c": "cap. 23", "p": "699–736", "n": 38, "d": 3, "days": 4, "tip": "criteriile de diagnostic, clasele de antidiabetice (mecanism și reacții adverse), insulinele, cetoacidoza vs starea hiperosmolară, complicațiile cronice.", "k": "diabet endocrino", "sys": "endo"},
      {"id": "K10", "b": "K", "t": "Coma, AVC, hemoragia intracraniană, meningita și encefalita", "c": "cap. 26", "p": "832–848, 869–872", "n": 21, "d": 3, "days": 2, "tip": "GCS, AVC ischemic și fereastra de tromboliză, hemoragia subarahnoidiană, LCR în meningita bacteriană vs virală, tratamentul empiric.", "k": "neuro neurologie avc coma meningita", "sys": "neuro"},
      {"id": "K11", "b": "K", "t": "Astmul și BPOC", "c": "cap. 28", "p": "949–961", "n": 13, "d": 2, "days": 1, "tip": "treptele de tratament, severitatea crizei de astm, spirometria, clasificarea și tratamentul BPOC.", "k": "astm bpoc pneumo", "sys": "pneumo"},
      {"id": "K12", "b": "K", "t": "Pneumonia și tuberculoza", "c": "cap. 28", "p": "963–972", "n": 10, "d": 2, "days": 1, "tip": "scorul de severitate, agenții tipici vs atipici, tratamentul empiric; în TBC diagnosticul, schema și reacțiile adverse ale tuberculostaticelor.", "k": "pneumonie tuberculoza tbc pneumo", "sys": "pneumo"},
      {"id": "K13", "b": "K", "t": "Tumorile maligne ale tractului respirator", "c": "cap. 28", "p": "975–982", "n": 8, "d": 2, "days": 1, "tip": "tipurile histologice și localizarea lor, sindroamele paraneoplazice, stadializarea.", "k": "cancer pulmonar pneumo", "sys": "pneumo"},
      {"id": "K14", "b": "K", "t": "Boala venoasă tromboembolică", "c": "cap. 29", "p": "1001–1017", "n": 17, "d": 2, "days": 2, "tip": "scorul Wells, D-dimerii, anticoagulantele (heparine, AVK, anticoagulante orale directe), tromboliza în TEP.", "k": "tromboembolism tep tvp bte vascular cardio", "sys": "cardio"},
      {"id": "K15", "b": "K", "t": "Resuscitarea cardiacă și aritmiile", "c": "cap. 30", "p": "1045–1048, 1051–1069", "n": 23, "d": 3, "days": 2, "tip": "algoritmul de resuscitare, fibrilația atrială (scoruri de risc embolic și hemoragic), tahicardiile cu QRS îngust vs larg, blocurile AV.", "k": "aritmii resuscitare cardio", "sys": "cardio"},
      {"id": "K16", "b": "K", "t": "Insuficiența cardiacă", "c": "cap. 30", "p": "1069–1079", "n": 11, "d": 3, "days": 1, "tip": "FE redusă vs păstrată, peptidele natriuretice, medicația care scade mortalitatea, IC acută.", "k": "insuficienta cardiaca cardio", "sys": "cardio"},
      {"id": "K17", "b": "K", "t": "Angina și sindroamele coronariene acute", "c": "cap. 30", "p": "1079–1091", "n": 13, "d": 3, "days": 2, "tip": "angina stabilă vs SCA, ECG pe teritorii, troponina, reperfuzia în STEMI, complicațiile post-infarct.", "k": "coronarian angina infarct sca cardio", "sys": "cardio"},
      {"id": "K18", "b": "K", "t": "Valvulopatiile", "c": "cap. 30", "p": "1091–1103", "n": 13, "d": 3, "days": 1, "tip": "suflurile (focar, iradiere, manevre), semnele de severitate, indicațiile de intervenție.", "k": "valvulopatii cardio", "sys": "cardio"},
      {"id": "K19", "b": "K", "t": "Endocardita, miocardita, cardiomiopatiile, pericardul", "c": "cap. 30", "p": "1103–1107, 1118–1128", "n": 16, "d": 3, "days": 2, "tip": "criteriile Duke și agenții etiologici, cardiomiopatia hipertrofică, pericardita (ECG), tamponada.", "k": "endocardita miocardita cardiomiopatii pericard cardio", "sys": "cardio"},
      {"id": "K20", "b": "K", "t": "Hipertensiunea arterială", "c": "cap. 31", "p": "1133–1145", "n": 13, "d": 2, "days": 1, "tip": "clasificarea, cauzele de HTA secundară și cum le cauți, antihipertensivele și indicațiile preferențiale, urgențele hipertensive.", "k": "hta hipertensiune cardio", "sys": "cardio"},
      {"id": "K21", "b": "K", "t": "Refluxul gastroesofagian, H. pylori și ulcerul peptic", "c": "cap. 32", "p": "1162–1166, 1172–1176", "n": 10, "d": 1, "days": 1, "tip": "esofagul Barrett, testele pentru H. pylori, schemele de eradicare, ulcerul la AINS.", "k": "reflux ulcer pylori gastro", "sys": "gastro"},
      {"id": "K22", "b": "K", "t": "Bolile inflamatorii intestinale", "c": "cap. 32", "p": "1198–1208", "n": 11, "d": 2, "days": 1, "tip": "Crohn vs colita ulcerativă (fă tabelul comparativ), manifestările extraintestinale, tratamentul în trepte.", "k": "bii crohn colita gastro", "sys": "gastro"},
      {"id": "K23", "b": "K", "t": "Hepatita virală", "c": "cap. 34", "p": "1275–1284", "n": 10, "d": 3, "days": 1, "tip": "interpretarea markerilor VHB în toate combinațiile, VHC, VHD, VHA, VHE. Exersează serologia.", "k": "hepatite hepatita virala hepato gastro", "sys": "gastro"},
      {"id": "K24", "b": "K", "t": "Ciroza hepatică", "c": "cap. 34", "p": "1289–1303", "n": 15, "d": 3, "days": 2, "tip": "scorurile de severitate, ascita și peritonita bacteriană spontană, varicele, encefalopatia, sindromul hepatorenal.", "k": "ciroza hepato gastro", "sys": "gastro"},
      {"id": "K25", "b": "K", "t": "Glomerulul și afectarea glomerulară", "c": "cap. 36", "p": "1351–1368", "n": 18, "d": 3, "days": 2, "tip": "sindrom nefritic vs nefrotic, fiecare glomerulopatie cu asocierile ei și complementul. Pentru mulți, cel mai greu subcapitol din Kumar.", "k": "glomerulopatii glomerul nefro renal rinichi", "sys": "nefro"},
      {"id": "K26", "b": "K", "t": "Nefritele tubulointerstițiale și boala cronică de rinichi", "c": "cap. 36", "p": "1385–1387, 1392–1405", "n": 17, "d": 2, "days": 2, "tip": "cauzele NTI, stadializarea BCR, complicațiile (anemie, boală osoasă, hiperkaliemie), indicațiile de dializă.", "k": "bcr nti nefro renal rinichi", "sys": "nefro"},
      {"id": "K27", "b": "K", "t": "Infecția HIV și SIDA", "c": "cap. 37", "p": "1425–1450", "n": 26, "d": 3, "days": 3, "tip": "diagnosticul, infecțiile oportuniste în funcție de CD4, profilaxiile, clasele de antiretrovirale.", "k": "hiv sida infectio", "sys": "infectio"},
      {"id": "S1", "b": "S", "t": "Dermatologie", "c": "cap. 9", "p": "196–209", "n": 14, "d": 1, "days": 1, "tip": "leziunile elementare, melanomul, psoriazisul vs eczemele, infecțiile cutanate.", "k": "dermato dermatologie piele", "sys": "derm"},
      {"id": "S2", "b": "S", "t": "Pediatrie", "c": "cap. 10", "p": "212–243", "n": 32, "d": 3, "days": 3, "tip": "capitol foarte dens: dezvoltarea, vaccinările, eruptivele copilăriei, cardiopatiile congenitale, urgențele pediatrice.", "k": "pediatrie copil", "sys": "ped"},
      {"id": "S3", "b": "S", "t": "Afecțiuni ginecologice și mamare", "c": "cap. 12", "p": "273–292", "n": 20, "d": 2, "days": 2, "tip": "tulburările menstruale, sindromul ovarelor polichistice, endometrioza, screeningul cervical, cancerul mamar.", "k": "ginecologie gineco san", "sys": "gin"},
      {"id": "S4", "b": "S", "t": "Obstetrică", "c": "cap. 13", "p": "295–316", "n": 22, "d": 3, "days": 2, "tip": "preeclampsia, eclampsia și HELLP, sângerările din trimestrul III, diabetul gestațional, travaliul.", "k": "obstetrica sarcina", "sys": "gin"},
      {"id": "S5", "b": "S", "t": "Tulburările psihice, epidemiologie și etică", "c": "cap. 14 și 15", "p": "319–330, 333–338", "n": 18, "d": 2, "days": 1, "tip": "criteriile de durată din psihiatrie și medicația; sensibilitate, specificitate, valorile predictive, tipurile de studii.", "k": "psihiatrie psihic epidemiologie etica", "sys": "psih"}
    ],
  },
};

export const DEFAULT_CATALOG = 'nov-2026';

export function getCatalog(id?: string) {
  return CATALOGS[id && CATALOGS[id] ? id : DEFAULT_CATALOG];
}
