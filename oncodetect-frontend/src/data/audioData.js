const base = `${import.meta.env.BASE_URL}audio/cuidador/`;

export const CAREGIVER_AUDIO = {
  "c-01": "cansancio.mp3",
  "c-02": "fiebre.mp3",
  "c-03": "sudor_noche.mp3",
  "c-04": "baja_peso.mp3",
  "c-05": "tos_persistente.mp3",
  "c-06": "presion_alta.mp3",
  "c-07": "piel_palida.mp3",
  "c-08": "manchas_moradas.mp3",
  "c-09": "picazon.mp3",
  "c-10": "barriga_crece.mp3",
  "c-11": "bulto_abdomen.mp3",
  "c-12": "dolor_barriga.mp3",
  "c-13": "sangre_orina.mp3",
  "c-14": "barriga_organos.mp3",
  "c-15": "pupila_blanca.mp3",
  "c-16": "ojo_torcido.mp3",
  "c-17": "ojo_rojo.mp3",
  "c-18": "perdida_vision.mp3",
  "c-19": "antecedente_ojo.mp3",
  "c-20": "dolor_huesos.mp3",
  "c-21": "bolita_cuello.mp3",
  "c-22": "bolita_clavicula.mp3",
  "c-23": "hinchazon_cara.mp3",
  "c-24": "dolor_cabeza.mp3",
  "c-25": "vomito_manana.mp3",
  "c-26": "vision_doble.mp3",
  "c-27": "ojos_solos.mp3",
  "c-28": "perdida_equilibrio.mp3",
  "c-29": "convulsiones.mp3",
  "c-30": "cambios_comportamiento.mp3",
};

export const audioUrlFor = (symptomId) =>
  `${base}${CAREGIVER_AUDIO[symptomId] || ""}`;
