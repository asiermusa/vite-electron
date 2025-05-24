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

const validateEditedTime = (
  newTime,
  target,
  startList,
  readings,
  newSplit = null,
  force = false
) => {
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

  // Buscar el participante
  const participant = startList.find(p => p.bib == target.bib || p.tag == target.tag);
  if (!participant || !participant.event.splits) return "Ezin da parte-hartzailea aurkitu edo split gabe dago.";

  const allSplits = participant.event.splits;

  // Detectar cuál es el split seleccionado
  const selectedSplit = newSplit || target.split;
  const currentSplit = allSplits.find(s => s.name === selectedSplit || s.slug === selectedSplit);
  if (!currentSplit) return "Ez da split-a aurkitu.";

  const index = allSplits.findIndex(s => s.unique_id === currentSplit.unique_id);
  if (index === -1) return "Ez da split-a aurkitu.";

  // Verificar que no exista ya otro registro para este tag + split
  const existing = readings.find(r =>
    r.tag === target.tag &&
    r.split_id === currentSplit.unique_id &&
    r.id !== target.id // ignorar el mismo si es edición
  );
  if (existing) {
    return `Split ${currentSplit.name} jada badago parte-hartzaile honentzat.`;
  }

  // Verificar con split anterior
  if (index > 0) {
    const prevSplit = allSplits[index - 1];
    const prevReading = readings.find(r => r.tag === target.tag && r.split_id === prevSplit.unique_id);
    if (prevReading) {
      const prevMs = timeToMs(prevReading.pretty_time);
      // Si hay error por orden de splits...
      if (!force && newMs <= prevMs) {
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
      if (!force && newMs >= nextMs) {
        return `Ezin da sartu hurrengoa (${nextSplit.name}) baino beranduago (${nextReading.pretty_time})`;
      }
    }
  }

  return null; // ✅ Todo correcto
};


// Función auxiliar para convertir HH:mm:ss:SSS a milisegundos
const timeToMs = (t) => {
  const [h, m, s, ms] = t.split(":").map(n => parseInt(n));
  return ((h * 3600 + m * 60 + s) * 1000 + ms);
};




export {
  getSexLabel,validateEditedTime
} 
