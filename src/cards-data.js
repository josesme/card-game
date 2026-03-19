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
    "Assimilation": { "edicion": 2, "color": "#4338ca", "abilities": "DEVOLVER. ROBAR. BOCABAJO" },
    "Chaos":        { "edicion": 2, "color": "#a855f7", "abilities": "VOLTEAR. REORGANIZAR. CAMBIAR" },
    "Clarity":      { "edicion": 2, "color": "#e879f9", "abilities": "REVELAR. ROBAR. BARAJAR" },
    "Corruption":   { "edicion": 2, "color": "#16a34a", "abilities": "VOLTEAR. DEVOLVER. DESCARTAR" },
    "Courage":      { "edicion": 2, "color": "#f97316", "abilities": "ELIMINAR. ROBAR. CAMBIAR" }
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
  // ── COMPILE MAIN 2 ──────────────────────────────────────────────────────────
  "Assimilation": [
    {"valor": 0, "nombre": "Assimilation 0", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve a tu mano 1 carta bocabajo (cubierta o descubierta) de tu oponente.", "h_final": ""},
    {"valor": 1, "nombre": "Assimilation 1", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta. Actualiza.", "h_final": "Después de que un jugador actualice: Roba la carta superior del mazo de tu oponente. Descarta 1 carta en su descarte."},
    {"valor": 2, "nombre": "Assimilation 2", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Juega bocabajo la carta superior del mazo de tu oponente en esta pila."},
    {"valor": 4, "nombre": "Assimilation 4", "fase": "Action", "h_inicio": "", "h_accion": "Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo.", "h_final": ""},
    {"valor": 5, "nombre": "Assimilation 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Assimilation 6", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Juega bocabajo la carta superior de tu mazo en el lado de tu oponente."}
  ],
  "Chaos": [
    {"valor": 0, "nombre": "Chaos 0", "fase": "Action", "h_inicio": "", "h_accion": "En cada línea, voltea 1 carta cubierta.", "h_final": "Inicial: Roba la carta superior del mazo de tu oponente. Tu oponente roba la carta superior de tu mazo."},
    {"valor": 1, "nombre": "Chaos 1", "fase": "Action", "h_inicio": "", "h_accion": "Reorganiza tus Protocolos. Reorganiza los Protocolos de tu oponente.", "h_final": ""},
    {"valor": 2, "nombre": "Chaos 2", "fase": "Action", "h_inicio": "", "h_accion": "Cambia 1 de tus cartas cubiertas.", "h_final": ""},
    {"valor": 3, "nombre": "Chaos 3", "fase": "Action", "h_inicio": "", "h_accion": "", "h_final": "Esta carta puede jugarse sin coincidir con los Protocolos."},
    {"valor": 4, "nombre": "Chaos 4", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Descarta tu mano. Roba tantas cartas como hayas descartado."},
    {"valor": 5, "nombre": "Chaos 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Clarity": [
    {"valor": 0, "nombre": "Clarity 0", "fase": "Start",  "h_inicio": "El valor total en esta línea se incrementa en 1 por cada carta en tu mano.", "h_accion": "", "h_final": ""},
    {"valor": 1, "nombre": "Clarity 1", "fase": "Start",  "h_inicio": "Inicial: Revela la carta superior de tu mazo. Puedes descartarla.", "h_accion": "Tu oponente revela su mano.", "h_final": "Si esta carta va a ser cubierta: Primero, roba 3 cartas."},
    {"valor": 2, "nombre": "Clarity 2", "fase": "Action", "h_inicio": "", "h_accion": "Revela tu mazo. Roba 1 carta con Valor 1 revelada así. Baraja tu mazo. Juega 1 carta con Valor 1.", "h_final": ""},
    {"valor": 3, "nombre": "Clarity 3", "fase": "Action", "h_inicio": "", "h_accion": "Revela tu mazo. Roba 1 carta con Valor 5 revelada así. Baraja tu mazo.", "h_final": ""},
    {"valor": 4, "nombre": "Clarity 4", "fase": "Action", "h_inicio": "", "h_accion": "Puedes barajar tu descarte en tu mazo.", "h_final": ""},
    {"valor": 5, "nombre": "Clarity 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""}
  ],
  "Corruption": [
    {"valor": 0, "nombre": "Corruption 0", "fase": "Start",  "h_inicio": "Inicial: Voltea 1 otra carta bocarriba (cubierta o descubierta) en esta pila.", "h_accion": "", "h_final": "Esta carta puede jugarse en el lado de cualquier jugador sin coincidir con los Protocolos."},
    {"valor": 1, "nombre": "Corruption 1", "fase": "Action", "h_inicio": "", "h_accion": "Devuelve 1 carta.", "h_final": "Cuando una carta vaya a ser devuelta a la mano de tu oponente: En su lugar, colócala bocarriba en lo alto de su mazo."},
    {"valor": 2, "nombre": "Corruption 2", "fase": "Start",  "h_inicio": "Después de que descartes cartas: Tu oponente descarta 1 carta.", "h_accion": "Roba 1 carta. Descarta 1 carta.", "h_final": ""},
    {"valor": 3, "nombre": "Corruption 3", "fase": "Action", "h_inicio": "", "h_accion": "Puedes voltear 1 carta cubierta bocarriba.", "h_final": ""},
    {"valor": 5, "nombre": "Corruption 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Corruption 6", "fase": "End",    "h_inicio": "Final: Descarta 1 carta o elimina esta carta.", "h_accion": "", "h_final": ""}
  ],
  "Courage": [
    {"valor": 0, "nombre": "Courage 0", "fase": "Start",  "h_inicio": "Inicial: Si no tienes cartas en mano, roba 1 carta.", "h_accion": "Roba 1 carta.", "h_final": "Final: Puedes descartar 1 carta. Si lo haces, tu oponente descarta 1 carta."},
    {"valor": 1, "nombre": "Courage 1", "fase": "Action", "h_inicio": "", "h_accion": "Elimina 1 carta de tu oponente en una línea donde su valor total sea mayor que el tuyo.", "h_final": ""},
    {"valor": 2, "nombre": "Courage 2", "fase": "Action", "h_inicio": "", "h_accion": "Roba 1 carta.", "h_final": "Final: Si tu oponente tiene un valor total mayor que el tuyo en esta línea, roba 1 carta."},
    {"valor": 3, "nombre": "Courage 3", "fase": "End",    "h_inicio": "", "h_accion": "", "h_final": "Final: Puedes cambiar esta carta a la línea donde tu oponente tenga su valor total más alto."},
    {"valor": 5, "nombre": "Courage 5", "fase": "Action", "h_inicio": "", "h_accion": "Descarta 1 carta.", "h_final": ""},
    {"valor": 6, "nombre": "Courage 6", "fase": "End",    "h_inicio": "Final: Si tu oponente tiene un valor mayor que el tuyo en esta línea, voltea esta carta.", "h_accion": "", "h_final": ""}
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
