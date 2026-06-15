// lib/flags.ts

export const TEAM_CODES: Record<string, string> = {
  "México": "mx", "Mexico": "mx", "Sudáfrica": "za", "Sudafrica": "za",
  "Corea del Sur": "kr", "Chequia": "cz", "Republica Checa": "cz",
  "Canadá": "ca", "Canada": "ca", "Bosnia y Herzegovina": "ba", "Bosnia y Hersegobina": "ba",
  "Qatar": "qa", "Suiza": "ch",
  "Brasil": "br", "Marruecos": "ma", "Haití": "ht", "Haiti": "ht",
  "Escocia": "gb-sct",
  "USA": "us", "Estados Unidos": "us", "Paraguay": "py", "Australia": "au",
  "Turquía": "tr", "Turquia": "tr",
  "Alemania": "de", "Curazao": "cw",
  "Países Bajos": "nl", "Holanda": "nl",
  "Japón": "jp", "Japon": "jp",
  "Costa de Marfil": "ci", "Costa de marfil": "ci",
  "Ecuador": "ec", "Suecia": "se",
  "Túnez": "tn", "Tunez": "tn",
  "España": "es", "Espana": "es",
  "Cabo Verde": "cv", "Cabo verde": "cv",
  "Bélgica": "be", "Belgica": "be",
  "Egipto": "eg",
  "Arabia Saudita": "sa", "Uruguay": "uy",
  "Irán": "ir", "Iran": "ir",
  "Nueva Zelanda": "nz",
  "Francia": "fr", "Senegal": "sn", "Iraq": "iq", "Noruega": "no",
  "Argentina": "ar", "Argelia": "dz", "Austria": "at", "Jordania": "jo",
  "Portugal": "pt", "Congo": "cg", "RD Congo": "cd",
  "Uzbekistan": "uz", "Colombia": "co",
  "Inglaterra": "gb-eng", "Croacia": "hr", "Ghana": "gh",
  "Panama": "pa", "Panamá": "pa",
  "Sur Africa": "za", "Sur Korea": "kr"
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
