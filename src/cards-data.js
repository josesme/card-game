// Datos de cartas y protocolos integrados para evitar errores de fetch/CORS
const CARDS_DATA = {
  // edicion: 1 = Compile Main 1 | 2 = Compile Main 2
  "_protocolMeta": {
    "Espíritu":   { "edicion": 1, "color": "#8b5cf6", "abilities": "VOLTEAR. CAMBIAR. ROBAR" },
    "Muerte":     { "edicion": 1, "color": "#ef4444", "abilities": "ELIMINAR. ROBAR" },
    "Fuego":      { "edicion": 1, "color": "#f97316", "abilities": "DESCARTAR PARA RESOLVER EFECTO" },
    "Gravedad":   { "edicion": 1, "color": "#6366f1", "abilities": "CAMBIAR. VOLTEAR. ROBAR" },
    "Vida":       { "edicion": 1, "color": "#10b981", "abilities": "VOLTEAR. JUGAR CARTA SUPERIOR DEL MAZO. ROBAR" },
    "Luz":        { "edicion": 1, "color": "#facc15", "abilities": "ROBAR. VOLTEAR. CAMBIAR" },
    "Metal":      { "edicion": 1, "color": "#94a3b8", "abilities": "PREVENIR. ROBAR. VOLTEAR" },
    "Plaga":      { "edicion": 1, "color": "#a855f7", "abilities": "FORZAR DESCARTAR. VOLTEAR" },
    "Psique":     { "edicion": 1, "color": "#ec4899", "abilities": "ROBAR. MANIPULAR. CAMBIAR" },
    "Velocidad":  { "edicion": 1, "color": "#06b6d4", "abilities": "ROBAR. JUGAR. CAMBIAR" },
    "Agua":       { "edicion": 1, "color": "#3b82f6", "abilities": "DEVOLVER. ROBAR. VOLTEAR" },
    "Oscuridad":  { "edicion": 1, "color": "#64748b", "abilities": "ROBAR. CAMBIAR. MANIPULAR" },
    "Apatía":     { "edicion": 1, "color": "#6b7280", "abilities": "VOLTEAR CARTAS BOCABAJO" },
    "Odio":       { "edicion": 1, "color": "#b91c1c", "abilities": "ELIMINAR. DESCARTAR" },
    "Amor":       { "edicion": 1, "color": "#f43f5e", "abilities": "ROBAR. DAR. INTERCAMBIAR" },
    // ── Main 2 ──────────────────────────────────────────────────────────────
    "Asimilación":  { "edicion": 2, "color": "#4338ca", "abilities": "DEVOLVER. ROBAR. BOCABAJO" },
    "Caos":         { "edicion": 2, "color": "#a855f7", "abilities": "VOLTEAR. REORGANIZAR. CAMBIAR" },
    "Claridad":     { "edicion": 2, "color": "#e879f9", "abilities": "REVELAR. ROBAR. BARAJAR" },
    "Corrupción":   { "edicion": 2, "color": "#16a34a", "abilities": "VOLTEAR. DEVOLVER. DESCARTAR" },
    "Valor":        { "edicion": 2, "color": "#f97316", "abilities": "ELIMINAR. ROBAR. CAMBIAR" },
    "Diversidad":   { "edicion": 2, "color": "#0d9488", "abilities": "CAMBIAR. VOLTEAR. CONTAR PROTOCOLOS" },
    "Miedo":        { "edicion": 2, "color": "#7c3aed", "abilities": "RESTRINGIR. DEVOLVER. DESCARTAR FORZADO" },
    "Hielo":        { "edicion": 2, "color": "#93c5fd", "abilities": "CAMBIAR. REACCIONAR. CONGELAR" },
    "Suerte":       { "edicion": 2, "color": "#eab308", "abilities": "AZAR. ROBAR. ELIMINAR" },
    "Espejo":       { "edicion": 2, "color": "#94a3b8", "abilities": "COPIAR. REFLEJAR. ROBAR" },
    "Paz":          { "edicion": 2, "color": "#86efac", "abilities": "DESCARTAR. ROBAR. MANO VACÍA" },
    "Humo":         { "edicion": 2, "color": "#2dd4bf", "abilities": "BOCABAJO. CAMBIAR. VOLTEAR" },
    "Tiempo":       { "edicion": 2, "color": "#ef4444", "abilities": "DESCARTE. BARAJAR. RECUPERAR" },
    "Unidad":       { "edicion": 2, "color": "#a855f7", "abilities": "UNITY. COMPILAR. SINERGIA" },
    "Guerra":       { "edicion": 2, "color": "#b91c1c", "abilities": "REACCIONAR. VOLTEAR. DESCARTAR" }
  },
  "Espíritu": [
    {"valor": 0, "nombre": "Espíritu 0", "fase": "Action", "h_inicio": "", "h_accion": "Actualiza. Roba 1 carta.", "h_final": "Sáltate tu Fase de Comprobar Caché."},
    {"valor": 1, "nombre": "Espíritu 1", "fase": "Start",  "h_inicio": "Cada vez que juegues una carta bocarriba, puedes colocarla sin que coincida con los protocolos.", "h_accion": "Roba 2 cartas.", "h_final": "Inicial: Descarta 1 carta o bien voltea esta carta."},
    {"valor": 2, "nombre": "Espíritu 2", "fase": "Action", "h_inicio": "", "h_accion": "Puedes voltear 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Espíritu 3", "fase": "Action", "h_inicio": "Después de robar cartas: Puedes cambiar esta carta, incluso si está cubierta.", "h_accion": "", "h_final": ""},
    {"valor": 4, "nombre": "Espíritu 4", "fase": "Action", "h_inicio": "", "h_accion": "Reorganiza 2 de tus Protocolos.", "h_final": ""},
    {"valor": 5, "nombre": "Espíritu 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Muerte": [
    {"valor": 0, "nombre": "Muerte 0", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta de cada una de las otras líneas.", "h_final": ""},
    {"valor": 1, "nombre": "Muerte 1", "fase": "Start",  "h_inicio": "Inicial: Puedes robar 1 carta. Si lo haces, elimina otra carta y, luego, elimina esta carta.", "h_accion": "", "h_final": ""},
    {"valor": 2, "nombre": "Muerte 2", "fase": "Action", "h_inicio": "", "h_accion": "Elimina todas las cartas con Valor 1 o 2 de una línea.", "h_final": ""},
    {"valor": 3, "nombre": "Muerte 3", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta bocabajo.", "h_final": ""},
    {"valor": 4, "nombre": "Muerte 4", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta con Valor 0 o 1.", "h_final": ""},
    {"valor": 5, "nombre": "Muerte 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Fuego": [
    {"valor": 0, "nombre": "Fuego 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea otra carta. Roba 2 cartas.", "h_final": "Si se cubre esta carta: Primero, roba 1 carta y voltea otra carta."},
    {"valor": 1, "nombre": "Fuego 1", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta. Si lo haces, elimina 1 carta.", "h_final": ""},
    {"valor": 2, "nombre": "Fuego 2", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta. Si lo haces, devuelve 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Fuego 3", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes descartar 1 carta. Si lo haces, voltea 1 carta."},
    {"valor": 4, "nombre": "Fuego 4", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 o más cartas. Roba tantas cartas como hayas descartado más 1.", "h_final": ""},
    {"valor": 5, "nombre": "Fuego 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Gravedad": [
    {"valor": 0, "nombre": "Gravedad 0", "fase": "Action", "h_inicio": "", "h_accion": "Por cada 2 cartas en esta línea, juega bocabajo la carta superior de tu mazo debajo de esta carta.", "h_final": ""},
    {"valor": 1, "nombre": "Gravedad 1", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Cambia 1 carta a esta línea. O bien de esta línea.", "h_final": ""},
    {"valor": 2, "nombre": "Gravedad 2", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Cambia esa carta a esta línea.", "h_final": ""},
    {"valor": 4, "nombre": "Gravedad 4", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 carta bocabajo a esta línea.", "h_final": ""},
    {"valor": 5, "nombre": "Gravedad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Gravedad 6", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente juega bocabajo la carta superior de su mazo en esta línea.", "h_final": ""}
  ],
  "Vida": [
    {"valor": 0, "nombre": "Vida 0", "fase": "Action", "h_inicio": "Final: Si esta carta está cubierta, elimina esta carta.", "h_accion": "En cada línea donde tengas al menos 1 carta, juega bocabajo la carta superior de tu mazo.", "h_final": ""},
    {"valor": 1, "nombre": "Vida 1", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Voltea 1 carta.", "h_final": ""},
    {"valor": 2, "nombre": "Vida 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Puedes voltear 1 carta que esté bocabajo.", "h_final": ""},
    {"valor": 3, "nombre": "Vida 3", "fase": "Action", "h_inicio": "", "h_accion": "", "h_final": "Si se cubre esta carta: Primero, juega bocabajo la carta superior de tu mazo en otra línea."},
    {"valor": 4, "nombre": "Vida 4", "fase": "Action", "h_inicio": "", "h_accion": "Si esta carta está cubriendo otra carta, roba 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Vida 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Luz": [
    {"valor": 0, "nombre": "Luz 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta. Roba tantas cartas como el Valor de la carta volteada.", "h_final": ""},
    {"valor": 1, "nombre": "Luz 1", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Roba 1 carta."},
    {"valor": 2, "nombre": "Luz 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Revela 1 carta bocabajo. Puedes cambiar o voltear esa carta.", "h_final": ""},
    {"valor": 3, "nombre": "Luz 3", "fase": "Action", "h_inicio": "", "h_accion": "Cambia todas las cartas bocabajo de esta línea a otra línea.", "h_final": ""},
    {"valor": 4, "nombre": "Luz 4", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente te revela su mano.", "h_final": ""},
    {"valor": 5, "nombre": "Luz 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Metal": [
    {"valor": 0, "nombre": "Metal 0", "fase": "Start",  "h_inicio": "El Valor total de tu oponente en esta línea se reduce en 2.", "h_accion": "Voltea 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Metal 1", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Tu oponente no puede Compilar en el siguiente turno.", "h_final": ""},
    {"valor": 2, "nombre": "Metal 2", "fase": "Start",  "h_inicio": "Tu oponente no puede jugar cartas bocabajo en esta línea.", "h_accion": "", "h_final": ""},
    {"valor": 3, "nombre": "Metal 3", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Elimina todas las cartas de otra línea que tenga 8 o más cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Metal 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Metal 6", "fase": "Start",  "h_inicio": "Si se cubre o se voltea esta carta: Primero, elimina esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Plaga": [
    {"valor": 0, "nombre": "Plaga 0", "fase": "Start",  "h_inicio": "", "h_accion": "Tu oponente descarta 1 carta.", "h_final": "Tu oponente no puede jugar cartas en esta línea."},
    {"valor": 1, "nombre": "Plaga 1", "fase": "Start",  "h_inicio": "Después de que tu oponente descarte cartas: Roba 1 carta.", "h_accion": "Tu oponente descarta 1 carta.", "h_final": ""},
    {"valor": 2, "nombre": "Plaga 2", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 o más cartas. Tu oponente descarta tantas cartas como tú más 1.", "h_final": ""},
    {"valor": 3, "nombre": "Plaga 3", "fase": "Action", "h_inicio": "", "h_accion": "Voltea cada otra carta bocarriba.", "h_final": ""},
    {"valor": 4, "nombre": "Plaga 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Tu oponente elimina 1 de sus cartas bocabajo. Puedes voltear esta carta."},
    {"valor": 5, "nombre": "Plaga 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Psique": [
    {"valor": 0, "nombre": "Psique 0", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Tu oponente descarta 2 cartas y, luego, revela su mano.", "h_final": ""},
    {"valor": 1, "nombre": "Psique 1", "fase": "Start",  "h_inicio": "Tu oponente solo puede jugar cartas bocabajo.", "h_accion": "", "h_final": "Inicial: Voltea esta carta."},
    {"valor": 2, "nombre": "Psique 2", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 2 cartas. Reorganiza sus Protocolos.", "h_final": ""},
    {"valor": 3, "nombre": "Psique 3", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 1 carta. Cambia 1 de sus cartas.", "h_final": ""},
    {"valor": 4, "nombre": "Psique 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes devolver 1 de las cartas de tu oponente. Si lo haces, voltea esta carta."},
    {"valor": 5, "nombre": "Psique 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Velocidad": [
    {"valor": 0, "nombre": "Velocidad 0", "fase": "Action", "h_inicio": "", "h_accion": "Juega 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Velocidad 1", "fase": "Action", "h_inicio": "Después de Borrar la Caché: Roba 1 carta.", "h_accion": "Roba 2 cartas.", "h_final": ""},
    {"valor": 2, "nombre": "Velocidad 2", "fase": "Action", "h_inicio": "Si esta carta se elimina Compilando: En su lugar, cambia esta carta, incluso si está cubierta.", "h_accion": "", "h_final": ""},
    {"valor": 3, "nombre": "Velocidad 3", "fase": "End",    "h_inicio": "", "h_accion": "Cambia 1 de tus otras cartas.", "h_final": "Final: Puedes cambiar 1 de tus cartas. Si lo haces, voltea esta carta."},
    {"valor": 4, "nombre": "Velocidad 4", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de las cartas bocabajo de tu oponente.", "h_final": ""},
    {"valor": 5, "nombre": "Velocidad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Agua": [
    {"valor": 0, "nombre": "Agua 0", "fase": "Action", "h_inicio": "", "h_accion": "Voltea otra carta. Voltea esta carta.", "h_final": ""},
    {"valor": 1, "nombre": "Agua 1", "fase": "Action", "h_inicio": "", "h_accion": "En cada una de tus otras líneas, juega bocabajo la carta superior de tu mazo.", "h_final": ""},
    {"valor": 2, "nombre": "Agua 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Reorganiza tus Protocolos.", "h_final": ""},
    {"valor": 3, "nombre": "Agua 3", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve todas las cartas con Valor 2 de 1 línea.", "h_final": ""},
    {"valor": 4, "nombre": "Agua 4", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve 1 de tus cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Agua 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Oscuridad": [
    {"valor": 0, "nombre": "Oscuridad 0", "fase": "Action", "h_inicio": "", "h_accion": "Roba 3 cartas. Cambia 1 de las cartas cubiertas de tu oponente.", "h_final": ""},
    {"valor": 1, "nombre": "Oscuridad 1", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 de las cartas de tu oponente. Puedes cambiar esa carta.", "h_final": ""},
    {"valor": 2, "nombre": "Oscuridad 2", "fase": "Start",  "h_inicio": "Cada carta bocabajo en esta pila tiene un Valor de 4.", "h_accion": "Puedes voltear 1 carta cubierta de esta línea.", "h_final": ""},
    {"valor": 3, "nombre": "Oscuridad 3", "fase": "Action", "h_inicio": "", "h_accion": "Juega 1 carta bocabajo en otra línea.", "h_final": ""},
    {"valor": 4, "nombre": "Oscuridad 4", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 carta bocabajo.", "h_final": ""},
    {"valor": 5, "nombre": "Oscuridad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Apatía": [
    {"valor": 0, "nombre": "Apatía 0", "fase": "Start",  "h_inicio": "Suma 1 al valor total en esta línea por cada carta bocabajo en ella.", "h_accion": "", "h_final": ""},
    {"valor": 1, "nombre": "Apatía 1", "fase": "Action", "h_inicio": "", "h_accion": "Voltea todas las demás cartas bocarriba en esta línea.", "h_final": ""},
    {"valor": 2, "nombre": "Apatía 2", "fase": "Start",  "h_inicio": "Ignora todos los comandos de acción de las cartas en esta línea.", "h_accion": "", "h_final": "Si se cubre esta carta: Primero, voltea esta carta."},
    {"valor": 3, "nombre": "Apatía 3", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 de las cartas bocarriba de tu oponente.", "h_final": ""},
    {"valor": 4, "nombre": "Apatía 4", "fase": "Action", "h_inicio": "", "h_accion": "Puedes voltear 1 de tus cartas bocarriba cubiertas.", "h_final": ""},
    {"valor": 5, "nombre": "Apatía 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Odio": [
    {"valor": 0, "nombre": "Odio 0", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Odio 1", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 3 cartas. Elimina 1 carta. Elimina 1 carta.", "h_final": ""},
    {"valor": 2, "nombre": "Odio 2", "fase": "Action", "h_inicio": "", "h_accion": "Elimina tu carta de mayor valor. Elimina la carta de mayor valor de tu oponente.", "h_final": ""},
    {"valor": 3, "nombre": "Odio 3", "fase": "Start",  "h_inicio": "Después de que elimines cartas: Roba 1 carta.", "h_accion": "", "h_final": ""},
    {"valor": 4, "nombre": "Odio 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Si se cubre esta carta: Primero, elimina la carta cubierta de menor valor en esta línea."},
    {"valor": 5, "nombre": "Odio 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Amor": [
    {"valor": 1, "nombre": "Amor 1", "fase": "End",    "h_inicio": "", "h_accion": "Roba la carta superior del mazo de tu oponente.", "h_final": "Final: Puedes dar 1 carta de tu mano a tu oponente. Si lo haces, roba 2 cartas."},
    {"valor": 2, "nombre": "Amor 2", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente roba 1 carta. Actualiza.", "h_final": ""},
    {"valor": 3, "nombre": "Amor 3", "fase": "Action", "h_inicio": "", "h_accion": "Toma 1 carta aleatoria de la mano de tu oponente. Da 1 carta de tu mano a tu oponente.", "h_final": ""},
    {"valor": 4, "nombre": "Amor 4", "fase": "Action", "h_inicio": "", "h_accion": "Revela 1 carta de tu mano. Voltea 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Amor 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Amor 6", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente roba 2 cartas.", "h_final": ""}
  ],
  // ── COMPILE MAIN 2 ──────────────────────────────────────────────────────────
  "Asimilación": [
    {"valor": 0, "nombre": "Asimilación 0", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve a tu mano 1 carta bocabajo (cubierta o descubierta) de tu oponente.", "h_final": ""},
    {"valor": 1, "nombre": "Asimilación 1", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta. Actualiza.", "h_final": "Después de que un jugador actualice: Roba la carta superior del mazo de tu oponente. Descarta 1 carta en su descarte."},
    {"valor": 2, "nombre": "Asimilación 2", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Juega bocabajo la carta superior del mazo de tu oponente en esta pila."},
    {"valor": 4, "nombre": "Asimilación 4", "fase": "Action", "h_inicio": "", "h_accion": "Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo.", "h_final": ""},
    {"valor": 5, "nombre": "Asimilación 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Asimilación 6", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Juega bocabajo la carta superior de tu mazo en el lado de tu oponente."}
  ],
  "Caos": [
    {"valor": 0, "nombre": "Caos 0", "fase": "Action", "h_inicio": "", "h_accion": "En cada línea, voltea 1 carta cubierta.", "h_final": "Inicial: Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo."},
    {"valor": 1, "nombre": "Caos 1", "fase": "Action", "h_inicio": "", "h_accion": "Reorganiza tus Protocolos. Reorganiza los Protocolos de tu oponente.", "h_final": ""},
    {"valor": 2, "nombre": "Caos 2", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de tus cartas cubiertas.", "h_final": ""},
    {"valor": 3, "nombre": "Caos 3", "fase": "Action", "h_inicio": "", "h_accion": "", "h_final": "Esta carta puede jugarse sin coincidir con los Protocolos."},
    {"valor": 4, "nombre": "Caos 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Descarta tu mano. Roba tantas cartas como hayas descartado."},
    {"valor": 5, "nombre": "Caos 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Claridad": [
    {"valor": 0, "nombre": "Claridad 0", "fase": "Start",  "h_inicio": "El valor total en esta línea se incrementa en 1 por cada carta en tu mano.", "h_accion": "", "h_final": ""},
    {"valor": 1, "nombre": "Claridad 1", "fase": "Start",  "h_inicio": "Inicial: Revela la carta superior de tu mazo. Puedes descartarla.", "h_accion": "Tu oponente revela su mano.", "h_final": "Si esta carta va a ser cubierta: Primero, roba 3 cartas."},
    {"valor": 2, "nombre": "Claridad 2", "fase": "Action", "h_inicio": "", "h_accion": "Revela tu mazo. Roba 1 carta con Valor 1 revelada así. Baraja tu mazo. Juega 1 carta con Valor 1.", "h_final": ""},
    {"valor": 3, "nombre": "Claridad 3", "fase": "Action", "h_inicio": "", "h_accion": "Revela tu mazo. Roba 1 carta con Valor 5 revelada así. Baraja tu mazo.", "h_final": ""},
    {"valor": 4, "nombre": "Claridad 4", "fase": "Action", "h_inicio": "", "h_accion": "Puedes barajar tu descarte en tu mazo.", "h_final": ""},
    {"valor": 5, "nombre": "Claridad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Corrupción": [
    {"valor": 0, "nombre": "Corrupción 0", "fase": "Start",  "h_inicio": "Inicial: Voltea 1 otra carta bocarriba (cubierta o descubierta) en esta pila.", "h_accion": "", "h_final": "Esta carta puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos."},
    {"valor": 1, "nombre": "Corrupción 1", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve 1 carta.", "h_final": "Cuando una carta vaya a ser devuelta a la mano de tu oponente: En su lugar, colócala bocarriba en lo alto de su mazo."},
    {"valor": 2, "nombre": "Corrupción 2", "fase": "Start",  "h_inicio": "Después de que descartes cartas: Tu oponente descarta 1 carta.", "h_accion": "Roba 1 carta. Descarta 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Corrupción 3", "fase": "Action", "h_inicio": "", "h_accion": "Puedes voltear 1 carta cubierta bocarriba.", "h_final": ""},
    {"valor": 5, "nombre": "Corrupción 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Corrupción 6", "fase": "End",    "h_inicio": "Final: Descarta 1 carta o elimina esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Valor": [
    {"valor": 0, "nombre": "Valor 0", "fase": "Start",  "h_inicio": "Inicial: Si no tienes cartas en mano, roba 1 carta.", "h_accion": "Roba 1 carta.", "h_final": "Final: Puedes descartar 1 carta. Si lo haces, tu oponente descarta 1 carta."},
    {"valor": 1, "nombre": "Valor 1", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta de tu oponente en una línea donde su valor total sea mayor que el tuyo.", "h_final": ""},
    {"valor": 2, "nombre": "Valor 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta.", "h_final": "Final: Si tu oponente tiene un valor total mayor que el tuyo en esta línea, roba 1 carta."},
    {"valor": 3, "nombre": "Valor 3", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes cambiar esta carta a la línea donde tu oponente tenga su valor total más alto."},
    {"valor": 5, "nombre": "Valor 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Valor 6", "fase": "End",    "h_inicio": "Final: Si tu oponente tiene un valor mayor que el tuyo en esta línea, voltea esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Diversidad": [
    {"valor": 0, "nombre": "Diversidad 0", "fase": "Action", "h_inicio": "", "h_accion": "Si hay 6 Protocolos distintos en cartas del campo, voltea el Protocolo Diversidad al lado compilado.", "h_final": "Final: Puedes jugar 1 carta que no sea Diversidad en esta línea."},
    {"valor": 1, "nombre": "Diversidad 1", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 carta. Roba tantas cartas como Protocolos distintos haya en cartas de esta línea.", "h_final": ""},
    {"valor": 3, "nombre": "Diversidad 3", "fase": "Start",  "h_inicio": "El valor total en esta línea se incrementa en 2 si hay alguna carta bocarriba que no sea Diversidad en esta pila.", "h_accion": "", "h_final": ""},
    {"valor": 4, "nombre": "Diversidad 4", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta con Valor menor que el número de Protocolos distintos en cartas del campo.", "h_final": ""},
    {"valor": 5, "nombre": "Diversidad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Diversidad 6", "fase": "End",    "h_inicio": "Final: Si no hay al menos 4 Protocolos distintos en cartas del campo, elimina esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Miedo": [
    {"valor": 0, "nombre": "Miedo 0", "fase": "Start",  "h_inicio": "Durante tu turno, las cartas de tu oponente no tienen comandos centrales.", "h_accion": "Cambia o voltea 1 carta.", "h_final": ""},
    {"valor": 1, "nombre": "Miedo 1", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Tu oponente descarta su mano y roba tantas cartas como haya descartado menos 1.", "h_final": ""},
    {"valor": 2, "nombre": "Miedo 2", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve 1 carta de tu oponente.", "h_final": ""},
    {"valor": 3, "nombre": "Miedo 3", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 carta (cubierta o descubierta) de tu oponente en esta línea.", "h_final": ""},
    {"valor": 4, "nombre": "Miedo 4", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 1 carta aleatoria.", "h_final": ""},
    {"valor": 5, "nombre": "Miedo 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Hielo": [
    {"valor": 1, "nombre": "Hielo 1", "fase": "Action", "h_inicio": "", "h_accion": "Puedes cambiar esta carta.", "h_final": "Después de que tu oponente juegue una carta en esta línea: Tu oponente descarta 1 carta."},
    {"valor": 2, "nombre": "Hielo 2", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 otra carta.", "h_final": ""},
    {"valor": 3, "nombre": "Hielo 3", "fase": "Start",  "h_inicio": "Final: Si esta carta está cubierta, puedes cambiarla.", "h_accion": "", "h_final": ""},
    {"valor": 4, "nombre": "Hielo 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Esta carta no puede ser volteada."},
    {"valor": 5, "nombre": "Hielo 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Hielo 6", "fase": "Start",  "h_inicio": "Si tienes cartas en mano, no puedes robar cartas.", "h_accion": "", "h_final": ""}
  ],
  "Suerte": [
    {"valor": 0, "nombre": "Suerte 0", "fase": "Action", "h_inicio": "", "h_accion": "Di un número. Roba 3 cartas. Revela 1 carta robada con el valor bocarriba de tu número indicado. Puedes jugarla.", "h_final": ""},
    {"valor": 1, "nombre": "Suerte 1", "fase": "Action", "h_inicio": "", "h_accion": "Juega bocabajo la carta superior de tu mazo. Voltea esa carta, ignorando los comandos centrales.", "h_final": ""},
    {"valor": 2, "nombre": "Suerte 2", "fase": "Action", "h_inicio": "", "h_accion": "Descarta la carta superior de tu mazo. Roba tantas cartas como el Valor de la carta descartada.", "h_final": ""},
    {"valor": 3, "nombre": "Suerte 3", "fase": "Action", "h_inicio": "", "h_accion": "Di un Protocolo. Descarta la carta superior del mazo de tu oponente. Si la carta descartada coincide con el Protocolo indicado, elimina 1 carta.", "h_final": ""},
    {"valor": 4, "nombre": "Suerte 4", "fase": "Action", "h_inicio": "", "h_accion": "Descarta la carta superior de tu mazo. Elimina 1 carta (cubierta o descubierta) que comparta Valor con la carta descartada.", "h_final": ""},
    {"valor": 5, "nombre": "Suerte 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Espejo": [
    {"valor": 0, "nombre": "Espejo 0", "fase": "Start",  "h_inicio": "El valor total en esta línea se incrementa en 1 por cada carta de tu oponente en esta línea.", "h_accion": "", "h_final": ""},
    {"valor": 1, "nombre": "Espejo 1", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes resolver el comando central de 1 carta de tu oponente como si estuviera en esta carta."},
    {"valor": 2, "nombre": "Espejo 2", "fase": "Action", "h_inicio": "", "h_accion": "Intercambia todas tus cartas de una de tus pilas con otra de tus pilas.", "h_final": ""},
    {"valor": 3, "nombre": "Espejo 3", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 de tus cartas. Voltea 1 carta de tu oponente en la misma línea.", "h_final": ""},
    {"valor": 4, "nombre": "Espejo 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Después de que tu oponente robe cartas: Roba 1 carta."},
    {"valor": 5, "nombre": "Espejo 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Paz": [
    {"valor": 1, "nombre": "Paz 1", "fase": "Action", "h_inicio": "", "h_accion": "Ambos jugadores descartan su mano.", "h_final": "Final: Si tu mano está vacía, roba 1 carta."},
    {"valor": 2, "nombre": "Paz 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta. Juega 1 carta bocabajo.", "h_final": ""},
    {"valor": 3, "nombre": "Paz 3", "fase": "Action", "h_inicio": "", "h_accion": "Puedes descartar 1 carta. Voltea 1 carta que tenga un valor mayor que el número de cartas en tu mano.", "h_final": ""},
    {"valor": 4, "nombre": "Paz 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Después de que descartes cartas durante el turno de tu oponente: Roba 1 carta."},
    {"valor": 5, "nombre": "Paz 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Paz 6", "fase": "Action", "h_inicio": "", "h_accion": "Si tienes más de 1 carta en mano, voltea esta carta.", "h_final": ""}
  ],
  "Humo": [
    {"valor": 0, "nombre": "Humo 0", "fase": "Action", "h_inicio": "", "h_accion": "Juega la carta superior de tu mazo bocabajo en cada línea con una carta bocabajo.", "h_final": ""},
    {"valor": 1, "nombre": "Humo 1", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 de tus cartas. Puedes cambiarla.", "h_final": ""},
    {"valor": 2, "nombre": "Humo 2", "fase": "Start",  "h_inicio": "Tu valor total en esta línea se incrementa en 1 por cada carta bocabajo en esta línea.", "h_accion": "", "h_final": ""},
    {"valor": 3, "nombre": "Humo 3", "fase": "Action", "h_inicio": "", "h_accion": "Juega 1 carta bocabajo en una línea con una carta bocabajo.", "h_final": ""},
    {"valor": 4, "nombre": "Humo 4", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 carta cubierta bocabajo.", "h_final": ""},
    {"valor": 5, "nombre": "Humo 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Tiempo": [
    {"valor": 0, "nombre": "Tiempo 0", "fase": "Action", "h_inicio": "", "h_accion": "Juega 1 carta de tu descarte. Baraja tu descarte en tu mazo.", "h_final": ""},
    {"valor": 1, "nombre": "Tiempo 1", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta cubierta. Descarta todo tu mazo.", "h_final": ""},
    {"valor": 2, "nombre": "Tiempo 2", "fase": "Start",  "h_inicio": "Después de que barajes tu mazo: Roba 1 carta y puedes cambiar esta carta.", "h_accion": "Si hay cartas en tu descarte, puedes barajar tu descarte en tu mazo.", "h_final": ""},
    {"valor": 3, "nombre": "Tiempo 3", "fase": "Action", "h_inicio": "", "h_accion": "Revela 1 carta de tu descarte. Juégala bocabajo en otra línea.", "h_final": ""},
    {"valor": 4, "nombre": "Tiempo 4", "fase": "Action", "h_inicio": "", "h_accion": "Roba 2 cartas. Descarta 2 cartas.", "h_final": ""},
    {"valor": 5, "nombre": "Tiempo 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Unidad": [
    {"valor": 0, "nombre": "Unidad 0", "fase": "Action", "h_inicio": "", "h_accion": "Si hay otra carta de Unidad en el campo, voltea 1 carta o roba 1 carta.", "h_final": "Cuando esta carta vaya a ser cubierta por una carta Unidad: Primero, voltea 1 carta o roba 1 carta."},
    {"valor": 1, "nombre": "Unidad 1", "fase": "Start",  "h_inicio": "Inicio: Si esta carta está cubierta, puedes cambiarla.", "h_accion": "Si hay 5 o más cartas Unidad en el campo, voltea el protocolo Unidad al lado compilado y elimina todas las cartas de esa línea.", "h_final": "Las cartas Unidad pueden jugarse bocarriba en esta línea."},
    {"valor": 2, "nombre": "Unidad 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba cartas igual al número de cartas Unidad en el campo.", "h_final": ""},
    {"valor": 3, "nombre": "Unidad 3", "fase": "Action", "h_inicio": "", "h_accion": "Si hay otra carta Unidad en el campo, puedes voltear 1 carta bocarriba.", "h_final": ""},
    {"valor": 4, "nombre": "Unidad 4", "fase": "Start",  "h_inicio": "Final: Si tu mano está vacía, revela tu mazo, roba todas las cartas Unidad de él y baraja tu mazo.", "h_accion": "", "h_final": ""},
    {"valor": 5, "nombre": "Unidad 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Guerra": [
    {"valor": 0, "nombre": "Guerra 0", "fase": "Start",  "h_inicio": "Después de que actualices: Puedes voltear esta carta.", "h_accion": "", "h_final": "Después de que tu oponente robe cartas: Puedes eliminar 1 carta."},
    {"valor": 1, "nombre": "Guerra 1", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Después de que tu oponente actualice: Descarta cualquier número de cartas. Actualiza."},
    {"valor": 2, "nombre": "Guerra 2", "fase": "Action", "h_inicio": "", "h_accion": "Voltea 1 carta.", "h_final": "Después de que tu oponente compile: Tu oponente descarta su mano."},
    {"valor": 3, "nombre": "Guerra 3", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta.", "h_final": "Después de que tu oponente descarte cartas: Puedes jugar 1 carta bocabajo."},
    {"valor": 4, "nombre": "Guerra 4", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente descarta 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Guerra 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Amor": [
    {"valor": 1, "nombre": "Amor 1", "fase": "End",    "h_inicio": "", "h_accion": "Roba la carta superior del mazo de tu oponente.", "h_final": "Final: Puedes dar 1 carta de tu mano a tu oponente. Si lo haces, roba 2 cartas."},
    {"valor": 2, "nombre": "Amor 2", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente roba 1 carta. Actualiza.", "h_final": ""},
    {"valor": 3, "nombre": "Amor 3", "fase": "Action", "h_inicio": "", "h_accion": "Toma 1 carta aleatoria de la mano de tu oponente. Da 1 carta de tu mano a tu oponente.", "h_final": ""},
    {"valor": 4, "nombre": "Amor 4", "fase": "Action", "h_inicio": "", "h_accion": "Revela 1 carta de tu mano. Voltea 1 carta.", "h_final": ""},
    {"valor": 5, "nombre": "Amor 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Amor 6", "fase": "Action", "h_inicio": "", "h_accion": "Tu oponente roba 2 cartas.", "h_final": ""}
  ]
};
