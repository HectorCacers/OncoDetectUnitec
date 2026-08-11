export const CANCERS = [
  { id: "LLA", name: "Leucemia Linfoblástica Aguda", abbr: "LLA" },
  { id: "BKT", name: "Linfoma de Burkitt",           abbr: "BKT" },
  { id: "LH",  name: "Linfoma de Hodgkin",           abbr: "LH"  },
  { id: "TW",  name: "Tumor de Wilms",               abbr: "TW"  },
  { id: "RB",  name: "Retinoblastoma",               abbr: "RB"  },
  { id: "GBG", name: "Glioma de Bajo Grado",         abbr: "GBG" },
];

export const MEDICAL_SYSTEMS = [
  {
    id: "general",
    name: "Síntomas Generales",
    icon: "🌡️",
    description: "Síntomas constitucionales y manifestaciones generales persistentes.",
  },
  {
    id: "hematologico",
    name: "Sistema Hematológico",
    icon: "🩸",
    description: "Palidez, sangrado, petequias y otros hallazgos hematológicos.",
  },
  {
    id: "linfatico",
    name: "Sistema Linfático",
    icon: "🟣",
    description: "Adenopatías y crecimiento anormal de ganglios linfáticos.",
  },
  {
    id: "musculoesqueletico",
    name: "Sistema Musculoesquelético",
    icon: "🦴",
    description: "Dolor óseo, articular y alteraciones relacionadas.",
  },
  {
    id: "abdominal",
    name: "Sistema Abdominal",
    icon: "🫃",
    description: "Masas, distensión, dolor y crecimiento de órganos abdominales.",
  },
  {
    id: "genitourinario",
    name: "Sistema Genitourinario",
    icon: "🩺",
    description: "Alteraciones urinarias, hipertensión y anomalías congénitas asociadas.",
  },
  {
    id: "respiratorio",
    name: "Sistema Respiratorio y Mediastinal",
    icon: "🫁",
    description: "Dificultad respiratoria y hallazgos de la región mediastinal.",
  },
  {
    id: "ocular",
    name: "Sistema Ocular",
    icon: "👁️",
    description: "Cambios visuales, leucocoria, estrabismo y otros hallazgos oculares.",
  },
  {
    id: "neurologico",
    name: "Sistema Neurológico",
    icon: "🧠",
    description: "Cefalea, vómitos matutinos, convulsiones y cambios neurológicos.",
  },
  {
    id: "craneofacial",
    name: "Región Craneofacial",
    icon: "🦷",
    description: "Masas, hinchazón o alteraciones de la cara y mandíbula.",
  },
  {
    id: "antecedentes",
    name: "Antecedentes y Condiciones Asociadas",
    icon: "📋",
    description: "Antecedentes familiares y anomalías congénitas de relevancia clínica.",
  },
];

export const SYMPTOMS_BY_CANCER = {
  LLA: [
    {
      code: "LLA-S01",
      label: "Palidez persistente (> 2 semanas)",
      level: 2,
      system: "hematologico",
    },
    {
      code: "LLA-S02",
      label: "Fiebre prolongada sin foco infeccioso (> 7 días)",
      level: 2,
      system: "general",
    },
    {
      code: "LLA-S03",
      label: "Petequias o equimosis sin traumatismo",
      level: 3,
      system: "hematologico",
    },
    {
      code: "LLA-S04",
      label: "Dolor óseo o articular difuso persistente",
      level: 3,
      system: "musculoesqueletico",
    },
    {
      code: "LLA-S05",
      label: "Adenopatías múltiples (> 1 región, > 2 cm)",
      level: 3,
      system: "linfatico",
    },
    {
      code: "LLA-S06",
      label: "Fatiga extrema / letargia desproporcionada",
      level: 2,
      system: "general",
    },
    {
      code: "LLA-S07",
      label: "Hepatoesplenomegalia palpable",
      level: 3,
      system: "abdominal",
    },
    {
      code: "LLA-S08",
      label: "Tríada cardinal: palidez, fiebre y petequias simultáneas",
      level: 4,
      system: "hematologico",
    },
  ],

  BKT: [
    {
      code: "BKT-S01",
      label: "Masa abdominal de crecimiento rápido (días a semanas)",
      level: 4,
      system: "abdominal",
    },
    {
      code: "BKT-S02",
      label: "Adenopatías cervicales o mandibulares de crecimiento rápido",
      level: 3,
      system: "linfatico",
    },
    {
      code: "BKT-S03",
      label: "Fiebre + pérdida de peso (síntomas B)",
      level: 2,
      system: "general",
    },
    {
      code: "BKT-S04",
      label: "Distensión abdominal progresiva + dolor abdominal difuso",
      level: 3,
      system: "abdominal",
    },
    {
      code: "BKT-S05",
      label: "Masa maxilofacial o tumefacción facial asimétrica",
      level: 4,
      system: "craneofacial",
    },
  ],

  LH: [
    {
      code: "LH-S01",
      label: "Adenopatías cervicales o supraclaviculares indoloras (> 2 cm, > 4 sem)",
      level: 3,
      system: "linfatico",
    },
    {
      code: "LH-S02",
      label: "Fiebre Pel-Ebstein (cíclica, ondulante)",
      level: 3,
      system: "general",
    },
    {
      code: "LH-S03",
      label: "Sudoración nocturna profusa (empapa la ropa)",
      level: 2,
      system: "general",
    },
    {
      code: "LH-S04",
      label: "Pérdida de peso involuntaria > 10% en 6 meses",
      level: 2,
      system: "general",
    },
    {
      code: "LH-S05",
      label: "Masa mediastínica / disnea progresiva sin causa infecciosa",
      level: 4,
      system: "respiratorio",
    },
    {
      code: "LH-S06",
      label: "Prurito generalizado sin causa dermatológica",
      level: 2,
      system: "general",
    },
    {
      code: "LH-S07",
      label: "Tríada B completa con adenopatía supraclavicular indolora",
      level: 4,
      system: "linfatico",
    },
  ],

  TW: [
    {
      code: "TW-S01",
      label: "Masa abdominal unilateral palpable, firme, no dolorosa",
      level: 4,
      system: "abdominal",
    },
    {
      code: "TW-S02",
      label: "Hematuria macroscópica (orina rosada o roja)",
      level: 3,
      system: "genitourinario",
    },
    {
      code: "TW-S03",
      label: "Hipertensión arterial sin causa evidente en menor de 5 años",
      level: 3,
      system: "genitourinario",
    },
    {
      code: "TW-S04",
      label: "Dolor abdominal localizado en flanco",
      level: 2,
      system: "abdominal",
    },
    {
      code: "TW-S05",
      label: "Aniridia / hemihipertrofia / anomalías genitourinarias congénitas",
      level: 4,
      system: "antecedentes",
    },
  ],

  RB: [
    {
      code: "RB-S01",
      label: "Leucocoria (reflejo pupilar blanco / ojo de gato)",
      level: 4,
      system: "ocular",
    },
    {
      code: "RB-S02",
      label: "Estrabismo de nuevo inicio (sin antecedente previo)",
      level: 3,
      system: "ocular",
    },
    {
      code: "RB-S03",
      label: "Ojo rojo persistente sin causa infecciosa documentada",
      level: 2,
      system: "ocular",
    },
    {
      code: "RB-S04",
      label: "Pérdida visible de visión / nistagmo",
      level: 3,
      system: "ocular",
    },
    {
      code: "RB-S05",
      label: "Historia familiar de retinoblastoma (padre o hermano)",
      level: 4,
      system: "antecedentes",
    },
  ],

  GBG: [
    {
      code: "GBG-S01",
      label: "Cefalea persistente > 4 semanas (especialmente matutina)",
      level: 2,
      system: "neurologico",
    },
    {
      code: "GBG-S02",
      label: "Vómitos matutinos en proyectil sin causa gastrointestinal",
      level: 3,
      system: "neurologico",
    },
    {
      code: "GBG-S03",
      label: "Alteraciones visuales progresivas (visión doble, pérdida de campo)",
      level: 3,
      system: "neurologico",
    },
    {
      code: "GBG-S04",
      label: "Cambios en la marcha / ataxia / torpeza motora progresiva",
      level: 3,
      system: "neurologico",
    },
    {
      code: "GBG-S05",
      label: "Convulsiones de novo (sin antecedente de epilepsia)",
      level: 3,
      system: "neurologico",
    },
    {
      code: "GBG-S06",
      label: "Cambios conductuales o de personalidad progresivos inexplicables",
      level: 2,
      system: "neurologico",
    },
    {
      code: "GBG-S07",
      label: "Tríada HTIC: cefalea matutina, vómitos y alt. visual o marcha",
      level: 4,
      system: "neurologico",
    },
  ],
};

export const SYMPTOM_LABEL_MAP = Object.values(SYMPTOMS_BY_CANCER)
  .flat()
  .reduce((acc, s) => { acc[s.code] = s.label; return acc; }, {});

export const SYMPTOMS_CAREGIVER = [
  { category: "🌡️ Señales generales", symptoms: [
    { id: "c-01", label: "Cansancio extremo sin razón aparente",                          codes: ["LLA-S06"] },
    { id: "c-02", label: "Fiebre frecuente que vuelve o no cede",                         codes: ["LLA-S02","BKT-S03"] },
    { id: "c-03", label: "Sudor excesivo de noche que moja la ropa o las sábanas",        codes: ["LH-S03"] },
    { id: "c-04", label: "Baja de peso sin dieta ni enfermedad conocida",                 codes: ["BKT-S03","LH-S04"] },
    { id: "c-05", label: "Tos seca persistente o dificultad para respirar sin resfriado", codes: ["LH-S05"] },
    { id: "c-06", label: "Presión arterial alta detectada en el niño",                    codes: ["TW-S03"] },
  ]},
  { category: "🩸 Piel y sangre", symptoms: [
    { id: "c-07", label: "Piel o labios que se ven más pálidos de lo normal",             codes: ["LLA-S01"] },
    { id: "c-08", label: "Manchas moradas o puntos rojos en la piel sin golpe",           codes: ["LLA-S03"] },
    { id: "c-09", label: "Picazón en todo el cuerpo sin alergia ni causa conocida",       codes: ["LH-S06"] },
  ]},
  { category: "🫀 Abdomen", symptoms: [
    { id: "c-10", label: "Barriga que crece rápido o se siente abultada",                 codes: ["BKT-S01","BKT-S04"] },
    { id: "c-11", label: "Bulto en un solo lado del abdomen",                             codes: ["TW-S01"] },
    { id: "c-12", label: "Dolor de barriga continuo y leve sin causa clara",              codes: ["TW-S04"] },
    { id: "c-13", label: "Sangre visible en la orina",                                    codes: ["TW-S02"] },
    { id: "c-14", label: "Barriga abultada al palpar (órganos agrandados)",               codes: ["LLA-S07"] },
  ]},
  { category: "👁️ Ojos", symptoms: [
    { id: "c-15", label: "Pupila que brilla blanca en fotos o en la oscuridad",           codes: ["RB-S01"] },
    { id: "c-16", label: "Ojo torcido que apareció de repente",                           codes: ["RB-S02"] },
    { id: "c-17", label: "Ojo rojo sin infección aparente",                               codes: ["RB-S03"] },
    { id: "c-18", label: "Ve mal o está perdiendo la vista de un ojo",                    codes: ["RB-S04"] },
    { id: "c-19", label: "Antecedente familiar de cáncer de ojo (padre o hermano)",       codes: ["RB-S05"] },
  ]},
  { category: "🦴 Huesos y articulaciones", symptoms: [
    { id: "c-20", label: "Dolor en huesos o articulaciones que cambia de lugar",          codes: ["LLA-S04"] },
  ]},
  { category: "🧠 Cabeza y cuello", symptoms: [
    { id: "c-21", label: "Bolita en el cuello, axila o ingle sin dolor",                  codes: ["LLA-S05","BKT-S02","LH-S01"] },
    { id: "c-22", label: "Bolita sobre la clavícula sin dolor",                           codes: ["LH-S01"] },
    { id: "c-23", label: "Hinchazón o bulto en la quijada o cara que creció rápido",     codes: ["BKT-S05"] },
    { id: "c-24", label: "Dolor de cabeza frecuente en las mañanas",                     codes: ["GBG-S01"] },
    { id: "c-25", label: "Vómitos o náuseas en las mañanas sin enfermedad digestiva",    codes: ["GBG-S02"] },
  ]},
  { category: "⚡ Sistema nervioso", symptoms: [
    { id: "c-26", label: "Problemas de visión nuevos o ve doble",                         codes: ["GBG-S03"] },
    { id: "c-27", label: "Ojos que se mueven solos o ojo torcido después de los 2 años", codes: ["GBG-S04"] },
    { id: "c-28", label: "Pierde el equilibrio o camina de forma inestable",              codes: ["GBG-S05"] },
    { id: "c-29", label: "Convulsiones o ataques que nunca había tenido antes",           codes: ["GBG-S05"] },
    { id: "c-30", label: "Cambios de comportamiento o caída en el rendimiento escolar",   codes: ["GBG-S06"] },
  ]},
];

export const LEVEL_LABELS = {
  1: "Sospecha Baja",
  2: "Sospecha Moderada",
  3: "Sospecha Alta",
  4: "Sospecha Muy Alta",
};

export const LEVEL_SIMPLE = {
  1: "Los síntomas ingresados tienen baja relación con este tipo de cáncer. No se identifican patrones de alerta. Se recomienda seguimiento clínico de rutina.",
  2: "Hay una asociación moderada entre los síntomas y este tipo de cáncer. Es recomendable una evaluación médica en los próximos días para descartar o confirmar.",
  3: "Los síntomas muestran alta asociación con este tipo de cáncer. Se recomienda referir al especialista de forma oportuna para evaluación diagnóstica.",
  4: "Asociación muy alta con este tipo de cáncer. Se requiere evaluación oncológica pediátrica urgente. No demore la referencia al especialista.",
};
