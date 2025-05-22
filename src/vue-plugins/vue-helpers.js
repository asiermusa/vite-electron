const getSexLabel = (value) => {

    if (!value) return "";

      const normalized = value.toString().toUpperCase().trim();

      const femaleValues = [
        "F",
        "FEMALE",
        "MUJER",
        "EMAKUMEA",
        "NESKA",
        "E",
        "EMA",
        "EMK",
      ];
      const maleValues = [
        "M",
        "MALE",
        "HOMBRE",
        "GIZONA",
        "G",
        "GZ",
        "GIZ",
        "MUTIL",
      ];

      if (femaleValues.includes(normalized)) return "E"; // Emakumea
      if (maleValues.includes(normalized)) return "G"; // Gizona

      return "—"; // desconocido
}

const validateEditedTime = (newTime, target, startList, readings) => {
  const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2}):(\d{3})$/;
  const match = newTime.match(timeRegex);

  if (!match) {
    return "Formatu okerra. Erabili H:mm:ss:SSS";
  }

  const h = parseInt(match[1]);
  const m = parseInt(match[2]);
  const s = parseInt(match[3]);
  const ms = parseInt(match[4]);

  if (m >= 60 || s >= 60 || ms >= 1000) {
    return "Orduaren formatua okerra da.";
  }

  const newMs = ((h * 3600 + m * 60 + s) * 1000 + ms);

  // Buscar el participante por el mismo dorsal o tag
  const participant = startList.find(p => p.bib == target.bib || p.tag == target.tag);
  if (!participant || !participant.event.splits) return "Ezin da parte-hartzailea aurkitu edo split gabe dago.";

  const allSplits = participant.event.splits;
  const index = allSplits.findIndex(s => s.unique_id === target.split_id);
  if (index === -1) return "Ez da split-a aurkitu.";

  // Verificar con split anterior
  if (index > 0) {
    const prevSplit = allSplits[index - 1];
    const prevReading = readings.find(r => r.tag === target.tag && r.split_id === prevSplit.unique_id);
    if (prevReading) {
      const prevMs = timeToMs(prevReading.pretty_time);
      if (newMs <= prevMs) {
        return `Ezin da sartu aurreko (${prevSplit.name}) baino lehenago (${prevReading.pretty_time})`;
      }
    }
  }

  // Verificar con split siguiente
  if (index < allSplits.length - 1) {
    const nextSplit = allSplits[index + 1];
    const nextReading = readings.find(r => r.tag === target.tag && r.split_id === nextSplit.unique_id);
    if (nextReading) {
      const nextMs = timeToMs(nextReading.pretty_time);
      if (newMs >= nextMs) {
        return `Ezin da sartu hurrengoa (${nextSplit.name}) baino beranduago (${nextReading.pretty_time})`;
      }
    }
  }

  return null; // OK
};

// Función auxiliar para convertir HH:mm:ss:SSS a milisegundos
const timeToMs = (t) => {
  const [h, m, s, ms] = t.split(":").map(n => parseInt(n));
  return ((h * 3600 + m * 60 + s) * 1000 + ms);
};




export {
  getSexLabel,validateEditedTime
} 
