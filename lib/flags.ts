// lib/flags.ts

export const TEAM_CODES: Record<string, string> = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Canadá": "ca", "Bosnia y Herzegovina": "ba", "Qatar": "qa", "Suiza": "ch",
  "Brasil": "br", "Marruecos": "ma", "Haití": "ht", "Escocia": "gb-sct",
  "USA": "us", "Estados Unidos": "us", "Paraguay": "py", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curazao": "cw", "Países Bajos": "nl", "Holanda": "nl", "Japón": "jp",
  "Costa de Marfil": "ci", "Ecuador": "ec", "Suecia": "se", "Túnez": "tn",
  "España": "es", "Cabo Verde": "cv", "Bélgica": "be", "Egipto": "eg",
  "Arabia Saudita": "sa", "Uruguay": "uy", "Irán": "ir", "Nueva Zelanda": "nz",
  "Francia": "fr", "Senegal": "sn", "Iraq": "iq", "Noruega": "no",
  "Argentina": "ar", "Argelia": "dz", "Austria": "at", "Jordania": "jo",
  "Portugal": "pt", "Congo": "cg", "Uzbekistan": "uz", "Colombia": "co",
  "Inglaterra": "gb-eng", "Croacia": "hr", "Ghana": "gh", "Panama": "pa"
};

/**
 * Retorna la URL de la bandera en formato SVG de alta calidad (vía FlagCDN)
 */
export function getFlag(teamName: string): string {
  const cleanName = teamName?.trim();
  const code = TEAM_CODES[cleanName];
  
  if (!code) return "https://flagcdn.com/un.svg"; // Fallback bandera ONU
  
  return `https://flagcdn.com/${code}.svg`;
}
