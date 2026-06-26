// scripts/test-pref.ts

interface Team {
  name: string;
  group: string;
}

const bestThirds: Team[] = [
  { name: 'Suecia', group: 'F' },
  { name: 'Ecuador', group: 'E' },
  { name: 'Bosnia', group: 'B' },
  { name: 'Paraguay', group: 'D' },
  { name: 'Croacia', group: 'L' },
  { name: 'Corea del Sur', group: 'A' },
  { name: 'Argelia', group: 'J' },
  { name: 'Escocia', group: 'C' }
];

const slots = [
  { id: "16v_2", name: "1E", allowed: ["D", "C", "B", "A", "F"] }, // D primero
  { id: "16v_5", name: "1I", allowed: ["F", "G", "H", "D", "C"] }, // F primero
  { id: "16v_7", name: "1A", allowed: ["C", "E", "F", "H", "I"] }, // C primero
  { id: "16v_8", name: "1L", allowed: ["E", "H", "I", "J", "K"] }, // E primero
  { id: "16v_9", name: "1D", allowed: ["B", "E", "F", "I", "J"] }, // B primero
  { id: "16v_10", name: "1G", allowed: ["A", "E", "H", "I", "J"] }, // A primero
  { id: "16v_13", name: "1B", allowed: ["J", "E", "F", "G", "I"] }, // J primero
  { id: "16v_15", name: "1K", allowed: ["L", "D", "E", "I", "J"] }  // L primero
];

function assign(thirdsList: Team[]) {
  const assignment = new Array(slots.length).fill(null);
  const used = new Array(thirdsList.length).fill(false);

  function backtrack(slotIdx: number): boolean {
    if (slotIdx === slots.length) return true;

    const slot = slots[slotIdx];
    // Iterar sobre la lista de permitidos del slot para respetar el orden de prioridad
    for (const groupOpt of slot.allowed) {
      for (let i = 0; i < thirdsList.length; i++) {
        if (!used[i] && thirdsList[i].group === groupOpt) {
          used[i] = true;
          assignment[slotIdx] = thirdsList[i];
          if (backtrack(slotIdx + 1)) return true;
          used[i] = false;
          assignment[slotIdx] = null;
        }
      }
    }
    return false;
  }

  const success = backtrack(0);
  if (success) {
    slots.forEach((s, idx) => {
      console.log(`  ${s.name} -> ${assignment[idx].name} (Grupo ${assignment[idx].group})`);
    });
  } else {
    console.log("No se pudo realizar la asignación.");
  }
}

console.log("Ejecutando asignación con prioridades:");
assign(bestThirds);
