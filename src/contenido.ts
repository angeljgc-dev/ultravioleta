/* Contenido de ULTRAVIOLETA — arcade bar ficticio, Guadalajara. */

export const MARCA = {
  nombre: "ULTRAVIOLETA",
  eslogan: "La noche en modo dos jugadores.",
  bajada:
    "Treinta máquinas originales, cerveza fría y el marcador más disputado de Guadalajara. Inserta una ficha: la partida sigue abierta desde 1991.",
  direccion: "Av. Chapultepec 480 · Col. Americana · Guadalajara",
  horario: "MIÉ–DOM · 18:00 – 02:00",
  cta: "RESERVA TU MÁQUINA",
};

export const MARQUEE = [
  "INSERT COIN",
  "CONTINUE?",
  "HIGH SCORE",
  "2P START",
  "GAME OVER",
  "PRESS START",
];

export type Maquina = {
  id: string;
  nombre: string;
  anio: number;
  decada: "80s" | "90s";
  genero: string;
  record: string;
  dueno: string; // iniciales del récord vigente
  grande?: boolean; // celda doble en el bento
};

export const MAQUINAS: Maquina[] = [
  {
    id: "galaxian",
    nombre: "Galaxian",
    anio: 1979,
    decada: "80s",
    genero: "SHOOTER",
    record: "48,750",
    dueno: "R.M.G.",
    grande: true,
  },
  {
    id: "pacman",
    nombre: "Pac-Man",
    anio: 1980,
    decada: "80s",
    genero: "LABERINTO",
    record: "212,360",
    dueno: "LUP",
  },
  {
    id: "donkeykong",
    nombre: "Donkey Kong",
    anio: 1981,
    decada: "80s",
    genero: "PLATAFORMAS",
    record: "391,200",
    dueno: "CHV",
  },
  {
    id: "sf2",
    nombre: "Street Fighter II",
    anio: 1991,
    decada: "90s",
    genero: "PELEA",
    record: "31 victorias",
    dueno: "KEN.GDL",
    grande: true,
  },
  {
    id: "mk2",
    nombre: "Mortal Kombat II",
    anio: 1993,
    decada: "90s",
    genero: "PELEA",
    record: "17 victorias",
    dueno: "SUB.Z",
  },
  {
    id: "daytona",
    nombre: "Daytona USA",
    anio: 1994,
    decada: "90s",
    genero: "CARRERAS",
    record: "1:38.42",
    dueno: "TURBO",
  },
];

export type Coctel = {
  id: string;
  nombre: string;
  juego: string; // guiño
  precio: number | null; // null cuando aplica una promo en su lugar
  promo?: string;
  desc: string;
  color: "lavanda" | "magenta" | "cian";
};

export const COCTELES: Coctel[] = [
  {
    id: "barril",
    nombre: "Barril Azul",
    juego: "nivel 1-1",
    precio: 145,
    desc: "Mezcal, curazao y limón amarillo. Sube como plataforma, cae como barril.",
    color: "cian",
  },
  {
    id: "fatality",
    nombre: "Fatality",
    juego: "finish him",
    precio: 165,
    desc: "Ron añejo, granadina negra y jengibre. Uno basta; el segundo es flawless.",
    color: "magenta",
  },
  {
    id: "powerpellet",
    nombre: "Power Pellet",
    juego: "modo fantasma",
    precio: 130,
    desc: "Gin, lichi y luz negra. Te vuelve inmune a los fantasmas veinte minutos.",
    color: "lavanda",
  },
  {
    id: "continue",
    nombre: "Continue?",
    juego: "10… 9… 8…",
    precio: null,
    promo: "2×1",
    desc: "El coctel del cierre: 2×1 en el último round, de 01:00 a 02:00.",
    color: "magenta",
  },
];

export type Torneo = {
  dia: string;
  nombre: string;
  maquina: string;
  premio: string;
};

export const TORNEOS: Torneo[] = [
  { dia: "MIÉ", nombre: "Noche de Cuartos", maquina: "Todas las de los 80s", premio: "Barra libre de fichas" },
  { dia: "JUE", nombre: "Combo Breaker", maquina: "Street Fighter II", premio: "Botella + cinturón UV" },
  { dia: "VIE", nombre: "Ghost Run", maquina: "Pac-Man", premio: "Tu nombre en el neón un mes" },
  { dia: "SÁB", nombre: "Pole Position", maquina: "Daytona USA (link 4P)", premio: "Mesa VIP siguiente sábado" },
];

export type Plan = {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  incluye: string[];
  destacado?: boolean;
};

export const PLANES: Plan[] = [
  {
    id: "ficha",
    nombre: "LA FICHA",
    precio: 10,
    unidad: "c/u",
    incluye: ["1 crédito en cualquier máquina", "Válida toda la noche", "Coleccionable troquelada"],
  },
  {
    id: "rollo",
    nombre: "EL ROLLO",
    precio: 80,
    unidad: "10 fichas",
    incluye: ["10 créditos", "1 shot Power Pellet", "Prioridad en torneos"],
    destacado: true,
  },
  {
    id: "freeplay",
    nombre: "FREE PLAY",
    precio: 250,
    unidad: "por persona",
    incluye: ["Juego ilimitado toda la noche", "Máquina reservada 1 hora", "Tu récord grabado en la tabla"],
  },
];

export const FOOTER = {
  legal: "ULTRAVIOLETA es una marca ficticia. Serie páginas-película.",
  extra: "PROHIBIDO DESCONECTAR LAS MÁQUINAS · EL MARCADOR NO SE REINICIA",
};

/* Reserva sin backend: deep link de WhatsApp con mensaje prellenado.
   Número de demostración (marca ficticia) — sustituir por el real al operar. */
export const RESERVA = {
  whatsapp: "5213300000000",
  mensaje:
    "¡Hola ULTRAVIOLETA! Quiero reservar una máquina.\n• Día: \n• Hora: \n• Jugadores: \n• Nombre: ",
};
