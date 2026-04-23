(function () {
    'use strict';

    // ── Image map ─────────────────────────────────────────────────────────────
    const PROTOCOL_IMG_MAP = {
        'Espíritu': { en: 'spirit',       ed: 1 },
        'Muerte':   { en: 'death',        ed: 1 },
        'Fuego':    { en: 'fire',         ed: 1 },
        'Gravedad': { en: 'gravity',      ed: 1 },
        'Vida':     { en: 'life',         ed: 1 },
        'Luz':      { en: 'light',        ed: 1 },
        'Metal':    { en: 'metal',        ed: 1 },
        'Plaga':    { en: 'plague',       ed: 1 },
        'Psique':   { en: 'psychic',      ed: 1 },
        'Velocidad':{ en: 'speed',        ed: 1 },
        'Agua':     { en: 'water',        ed: 1 },
        'Oscuridad':{ en: 'darkness',     ed: 1 },
        'Apatía':   { en: 'apathy',       ed: 1 },
        'Odio':     { en: 'hate',         ed: 1 },
        'Amor':     { en: 'love',         ed: 1 },
        'Asimilación': { en: 'assimilation', ed: 2 },
        'Caos':        { en: 'chaos',     ed: 2 },
        'Claridad':    { en: 'clarity',   ed: 2 },
        'Corrupción':  { en: 'corruption',ed: 2 },
        'Valor':       { en: 'courage',   ed: 2 },
        'Diversidad':  { en: 'diversity', ed: 2 },
        'Miedo':       { en: 'fear',      ed: 2 },
        'Hielo':       { en: 'ice',       ed: 2 },
        'Suerte':      { en: 'luck',      ed: 2 },
        'Espejo':      { en: 'mirror',    ed: 2 },
        'Paz':         { en: 'peace',     ed: 2 },
        'Humo':        { en: 'smoke',     ed: 2 },
        'Tiempo':      { en: 'time',      ed: 2 },
        'Unidad':      { en: 'unity',     ed: 2 },
        'Guerra':      { en: 'war',       ed: 2 },
    };

    function getCardImageUrl(protocol, valor) {
        const info = PROTOCOL_IMG_MAP[protocol];
        if (!info) return '';
        const folder = info.ed === 1 ? 'Main_1' : 'Main_2';
        return `../images/cards/${folder}/${info.en}_${valor}.jpg`;
    }

    // ── State ──────────────────────────────────────────────────────────────────
    let ALL_PROTOCOLS = [];
    let PROTOCOL_DEFS = {};

    let _draftGridFirstRender   = true;
    let _draftInitialScrambleDone = false;
    let _draftEnterReadyAt      = 0;
    let _draftLoadingDone       = false;

    let draftState = {
        available: [], playerSelected: [], aiSelected: [],
        round: 0, firstPlayer: null,
        isComplete: false, isPlayerTurn: false, selectionsNeeded: 0,
    };

    const DRAFT_ROUNDS = [
        { player: 'first',  selections: 1 },
        { player: 'second', selections: 2 },
        { player: 'first',  selections: 2 },
        { player: 'second', selections: 1 },
    ];

    // ── Layout ─────────────────────────────────────────────────────────────────
    function applyDraftScale() {
        const container = document.getElementById('draft-container');
        if (!container) return;
        container.style.transform = 'none';
        const viewH = window.innerHeight - 20;
        const viewW = window.innerWidth  - 40;
        const scale = Math.min(viewH / container.offsetHeight, viewW / container.offsetWidth);
        if (Math.abs(scale - 1) > 0.01) container.style.transform = `scale(${scale.toFixed(4)})`;
    }

    // ── Draft logic ────────────────────────────────────────────────────────────
    function initDraft() {
        draftState.firstPlayer = Math.random() > 0.5 ? 'player' : 'ai';
        startRound();
    }

    function startRound() {
        const roundInfo = DRAFT_ROUNDS[draftState.round];
        if (!roundInfo) { completeDraft(); return; }

        const isFirstPlayer    = roundInfo.player === 'first';
        draftState.isPlayerTurn    = (draftState.firstPlayer === 'player') === isFirstPlayer;
        draftState.selectionsNeeded = roundInfo.selections;
        updateDraftDisplay();

        if (!draftState.isPlayerTurn) setTimeout(() => aiSelectProtocols(draftState.selectionsNeeded), 800);
    }

    function _animPickProtocol(cardEl, onDone) {
        if (!cardEl) { onDone(); return; }
        cardEl.onclick = null;
        cardEl.classList.add('card-leaving');
        setTimeout(onDone, 850);
    }

    function playerSelectProtocol(protocol) {
        if (!draftState.isPlayerTurn || draftState.isComplete) return;
        if (draftState.selectionsNeeded <= 0) return;
        if (!draftState.available.includes(protocol)) return;

        const cardEl = document.querySelector(`.protocol-card[data-proto="${protocol}"]`);
        if (cardEl) cardEl.onclick = null;

        _animPickProtocol(cardEl, () => {
            draftState.playerSelected.push(protocol);
            draftState.available.splice(draftState.available.indexOf(protocol), 1);
            draftState.selectionsNeeded--;
            updateDraftDisplay();
            if (draftState.selectionsNeeded === 0) {
                draftState.isPlayerTurn = false;
                draftState.round++;
                setTimeout(() => startRound(), 500);
            }
        });
    }

    // ── AI evaluation ──────────────────────────────────────────────────────────
    const PROTOCOL_STRENGTH = {
        'Espíritu': 8, 'Muerte': 8, 'Fuego': 6, 'Gravedad': 7, 'Vida': 7,
        'Luz': 6, 'Metal': 7, 'Plaga': 6, 'Psique': 7, 'Velocidad': 6,
        'Agua': 7, 'Oscuridad': 7, 'Apatía': 5, 'Odio': 7, 'Amor': 6,
        'Asimilación': 8, 'Caos': 7, 'Claridad': 6, 'Corrupción': 7, 'Valor': 7,
        'Diversidad': 6, 'Miedo': 8, 'Hielo': 7, 'Suerte': 5, 'Espejo': 7,
        'Paz': 6, 'Humo': 6, 'Tiempo': 7, 'Unidad': 8, 'Guerra': 8,
    };

    const PROTOCOL_SYNERGY = {
        'Espíritu':    { 'Vida': 8, 'Psique': 7, 'Agua': 7, 'Amor': 6 },
        'Muerte':      { 'Odio': 9, 'Fuego': 6, 'Plaga': 5, 'Guerra': 7 },
        'Fuego':       { 'Plaga': 8, 'Odio': 7, 'Muerte': 6, 'Tiempo': 7 },
        'Gravedad':    { 'Velocidad': 8, 'Metal': 6, 'Apatía': 6, 'Humo': 7 },
        'Vida':        { 'Espíritu': 8, 'Agua': 7, 'Amor': 6, 'Luz': 6, 'Claridad': 7 },
        'Luz':         { 'Metal': 7, 'Vida': 6, 'Espíritu': 5, 'Claridad': 8 },
        'Metal':       { 'Luz': 7, 'Gravedad': 6, 'Espejo': 7 },
        'Plaga':       { 'Psique': 8, 'Fuego': 8, 'Odio': 6, 'Corrupción': 7 },
        'Psique':      { 'Plaga': 8, 'Espíritu': 7, 'Oscuridad': 7, 'Miedo': 8 },
        'Velocidad':   { 'Gravedad': 8, 'Oscuridad': 6, 'Tiempo': 7 },
        'Agua':        { 'Espíritu': 7, 'Vida': 7, 'Oscuridad': 6, 'Asimilación': 7 },
        'Oscuridad':   { 'Psique': 7, 'Velocidad': 6, 'Agua': 6, 'Apatía': 7, 'Humo': 8 },
        'Apatía':      { 'Oscuridad': 7, 'Gravedad': 6, 'Humo': 7 },
        'Odio':        { 'Muerte': 9, 'Fuego': 7, 'Plaga': 6, 'Guerra': 8 },
        'Amor':        { 'Vida': 6, 'Espíritu': 6, 'Paz': 7 },
        'Asimilación': { 'Agua': 7, 'Miedo': 7, 'Corrupción': 6 },
        'Caos':        { 'Suerte': 8, 'Humo': 7, 'Diversidad': 6 },
        'Claridad':    { 'Vida': 7, 'Luz': 8, 'Tiempo': 6 },
        'Corrupción':  { 'Plaga': 7, 'Asimilación': 6, 'Guerra': 7 },
        'Valor':       { 'Unidad': 7, 'Espejo': 6 },
        'Diversidad':  { 'Caos': 6, 'Unidad': 7 },
        'Miedo':       { 'Psique': 8, 'Asimilación': 7, 'Muerte': 7 },
        'Hielo':       { 'Metal': 6, 'Paz': 7 },
        'Suerte':      { 'Caos': 8, 'Claridad': 6 },
        'Espejo':      { 'Metal': 7, 'Valor': 6, 'Hielo': 6 },
        'Paz':         { 'Amor': 7, 'Hielo': 7 },
        'Humo':        { 'Oscuridad': 8, 'Apatía': 7, 'Gravedad': 7 },
        'Tiempo':      { 'Fuego': 7, 'Velocidad': 7, 'Claridad': 6 },
        'Unidad':      { 'Diversidad': 7, 'Valor': 7 },
        'Guerra':      { 'Muerte': 7, 'Odio': 8, 'Corrupción': 7 },
    };

    const PROTOCOL_COUNTER = {
        'Metal':   ['Muerte', 'Odio', 'Guerra'],
        'Vida':    ['Plaga', 'Psique', 'Corrupción'],
        'Muerte':  ['Vida', 'Gravedad', 'Unidad'],
        'Odio':    ['Espíritu', 'Luz', 'Valor'],
        'Psique':  ['Amor', 'Vida', 'Paz'],
        'Espejo':  ['Diversidad', 'Suerte'],
        'Miedo':   ['Velocidad', 'Fuego', 'Caos'],
        'Hielo':   ['Velocidad', 'Asimilación'],
    };

    function getDraftSynergy(a, b) {
        return (PROTOCOL_SYNERGY[a] && PROTOCOL_SYNERGY[a][b]) ||
               (PROTOCOL_SYNERGY[b] && PROTOCOL_SYNERGY[b][a]) || 0;
    }

    function scoreProtocolForDraft(protocol, aiAlready, playerPicked) {
        let score = PROTOCOL_STRENGTH[protocol] || 5;
        aiAlready.forEach(p  => { score += getDraftSynergy(protocol, p) * 1.8; });
        playerPicked.forEach(p => { if ((PROTOCOL_COUNTER[protocol] || []).includes(p)) score += 3; });
        return score;
    }

    function aiBestPick(available, aiAlready, playerPicked) {
        return available.slice().sort((a, b) =>
            scoreProtocolForDraft(b, aiAlready, playerPicked) -
            scoreProtocolForDraft(a, aiAlready, playerPicked)
        )[0];
    }

    function aiBestPair(available, aiAlready, playerPicked) {
        let bestPair = null, bestScore = -Infinity;
        for (let i = 0; i < available.length; i++) {
            for (let j = i + 1; j < available.length; j++) {
                const a = available[i], b = available[j];
                const score = scoreProtocolForDraft(a, aiAlready, playerPicked) +
                              scoreProtocolForDraft(b, [...aiAlready, a], playerPicked) +
                              getDraftSynergy(a, b) * 2;
                if (score > bestScore) { bestScore = score; bestPair = [a, b]; }
            }
        }
        return bestPair || available.slice(0, 2);
    }

    function aiSelectProtocols(count) {
        const waitMs = Math.max(0, _draftEnterReadyAt - Date.now());
        if (waitMs > 0) { setTimeout(() => aiSelectProtocols(count), waitMs); return; }

        const picks = count === 2
            ? aiBestPair(draftState.available, draftState.aiSelected, draftState.playerSelected)
            : [aiBestPick(draftState.available, draftState.aiSelected, draftState.playerSelected)];

        let done = 0;
        const doSelect = () => {
            picks.forEach(p => {
                draftState.aiSelected.push(p);
                draftState.available.splice(draftState.available.indexOf(p), 1);
            });
            draftState.round++;
            updateDraftDisplay();
            if (draftState.round < DRAFT_ROUNDS.length) setTimeout(() => startRound(), 800);
            else completeDraft();
        };

        picks.forEach((protocol, i) => {
            const cardEl = document.querySelector(`.protocol-card[data-proto="${protocol}"]`);
            setTimeout(() => {
                _animPickProtocol(cardEl, () => { if (++done === picks.length) doSelect(); });
            }, i * 400);
        });
    }

    function completeDraft() {
        draftState.isComplete  = true;
        draftState.isPlayerTurn = false;
        draftState.playerSelected = draftState.playerSelected.slice(0, 3);
        draftState.aiSelected     = draftState.aiSelected.slice(0, 3);
        updateDraftDisplay();
        const btn = document.getElementById('start-game-btn');
        btn.disabled = false;
        btn.classList.add('ui-btn--pulse');
    }

    // ── UI updates ─────────────────────────────────────────────────────────────
    function updateDraftDisplay() {
        const roundInfo     = DRAFT_ROUNDS[draftState.round] || DRAFT_ROUNDS[DRAFT_ROUNDS.length - 1];
        const isFirstPlayer = roundInfo && roundInfo.player === 'first';
        const currentPlayer = (draftState.firstPlayer === 'player') === isFirstPlayer ? 'JUGADOR' : 'IA';
        const roundDesc     = DRAFT_ROUNDS[draftState.round]
            ? `Ronda ${draftState.round + 1}/4 — ${currentPlayer} elige ${DRAFT_ROUNDS[draftState.round].selections}`
            : 'Draft Completado';

        const currentTurnEl = document.getElementById('current-turn');
        currentTurnEl.textContent = roundDesc;
        if (window.scrTxt && typeof gsap !== 'undefined') {
            setTimeout(() => window.scrTxt(currentTurnEl, roundDesc, { duration: 1.0, chars: 'upperAndLowerCase' }), 50);
        }

        updateProtocolsGrid();
        updateSelections();
        requestAnimationFrame(() => requestAnimationFrame(applyDraftScale));
    }

    function updateProtocolsGrid() {
        const grid = document.getElementById('protocols-grid');
        grid.classList.toggle('player-turn', draftState.isPlayerTurn && !draftState.isComplete);
        grid.classList.toggle('loading', !_draftLoadingDone);
        grid.innerHTML = '';

        ALL_PROTOCOLS.forEach(protocol => {
            const isAvailable      = draftState.available.includes(protocol);
            const isPlayerSelected = draftState.playerSelected.includes(protocol);
            const isAiSelected     = draftState.aiSelected.includes(protocol);

            const card = document.createElement('div');
            card.className   = 'protocol-card';
            card.dataset.proto = protocol;
            if (!isAvailable)     card.classList.add('unavailable');
            if (isPlayerSelected) card.classList.add('selected-player');
            if (isAiSelected)     card.classList.add('selected-ai');

            card.style.borderColor = PROTOCOL_DEFS[protocol].color;
            const imgUrl = getCardImageUrl(protocol, 1);
            card.innerHTML = `
                <img class="protocol-card-img" src="${imgUrl}" alt="${protocol}" loading="lazy">
                <div class="slot-title"><span class="slot-title-text">${protocol}</span></div>
                <div class="protocol-card-overlay">
                    <div class="protocol-card-logo-box">
                        <img class="protocol-card-logo" src="../images/Background/Logo.png" alt="COMPILE">
                    </div>
                    <div class="protocol-card-abilities-box">
                        <div class="protocol-card-abilities">${PROTOCOL_DEFS[protocol].abilities}</div>
                    </div>
                </div>
            `;

            if (isAvailable && draftState.isPlayerTurn && !draftState.isComplete) {
                card.onclick = () => playerSelectProtocol(protocol);
            } else {
                card.style.cursor = 'default';
            }

            if (_draftGridFirstRender) card.style.clipPath = 'inset(0 0 100% 0)';
            grid.appendChild(card);
        });

        if (_draftGridFirstRender) {
            _draftGridFirstRender = false;
            const cards    = Array.from(grid.querySelectorAll('.protocol-card'));
            const COLS     = 5;
            const colDelay = 350;
            const totalMs  = (COLS - 1) * colDelay + 800 + 150;
            _draftEnterReadyAt = Date.now() + totalMs + 1400;
            cards.forEach((el, i) => {
                setTimeout(() => {
                    el.style.clipPath = '';
                    el.classList.add('card-entering');
                    el.addEventListener('animationend', () => el.classList.remove('card-entering'), { once: true });
                }, (i % COLS) * colDelay);
            });
            setTimeout(() => { _draftLoadingDone = true; grid.classList.remove('loading'); }, totalMs);
        }

        if (window.scrTxt && typeof gsap !== 'undefined' && !_draftInitialScrambleDone) {
            _draftInitialScrambleDone = true;
            setTimeout(() => {
                grid.querySelectorAll('.slot-title-text').forEach(el => {
                    const txt = el.textContent.trim();
                    if (txt) window.scrTxt(el, txt, { duration: 1.0, chars: 'upperAndLowerCase' });
                });
                grid.querySelectorAll('.protocol-card-abilities').forEach(el => {
                    const txt = el.textContent.trim();
                    if (txt) window.scrTxt(el, txt, { duration: 1.0, chars: 'upperAndLowerCase' });
                });
            }, 500);
        }
    }

    function updateSelections() {
        const playerBox = document.getElementById('player-selection');
        const aiBox     = document.getElementById('ai-selection');

        const renderSlots = (selected, isAi) => {
            const slots = [];
            for (let i = 0; i < 3; i++) {
                if (selected[i]) {
                    const p     = selected[i];
                    const color = (PROTOCOL_DEFS[p] && PROTOCOL_DEFS[p].color) ||
                                  (isAi ? 'var(--ai-primary)' : 'var(--player-primary)');
                    slots.push(`
                        <div class="selection-card-thumb" style="border-color:${color}">
                            <img src="${getCardImageUrl(p, 1)}" alt="${p}">
                            <div class="slot-title" data-text="${p}"></div>
                            <div class="thumb-logo-box">
                                <img class="thumb-logo" src="../images/Background/Logo.png" alt="">
                            </div>
                        </div>
                    `);
                } else {
                    slots.push('<div class="slot-empty"></div>');
                }
            }
            return slots.join('');
        };

        playerBox.innerHTML = renderSlots(draftState.playerSelected, false);
        aiBox.innerHTML     = renderSlots(draftState.aiSelected, true);
    }

    // ── Module export ──────────────────────────────────────────────────────────
    function _onStartGame() {
        if (!draftState.isComplete) return;
        sessionStorage.setItem('playerProtocols', JSON.stringify(draftState.playerSelected));
        sessionStorage.setItem('aiProtocols',     JSON.stringify(draftState.aiSelected));
        if (window.router) router.navigate('game');
        else window.location.href = '/src/game.html';
    }

    const draftModule = {
        init() {
            _draftGridFirstRender     = true;
            _draftInitialScrambleDone = false;
            _draftLoadingDone         = false;
            _draftEnterReadyAt        = 0;
            draftState = {
                available: [], playerSelected: [], aiSelected: [],
                round: 0, firstPlayer: null,
                isComplete: false, isPlayerTurn: false, selectionsNeeded: 0,
            };

            const selectedProtocols = sessionStorage.getItem('selectedProtocols');
            try {
                const meta = (typeof CARDS_DATA !== 'undefined' ? CARDS_DATA._protocolMeta : null) || {};
                ALL_PROTOCOLS = Object.keys(meta).filter(key => {
                    const { edicion } = meta[key];
                    if (selectedProtocols === '1') return edicion === 1;
                    if (selectedProtocols === '2') return edicion === 2;
                    return true;
                });
                PROTOCOL_DEFS         = meta;
                draftState.available  = [...ALL_PROTOCOLS];
                initDraft();
                requestAnimationFrame(() => requestAnimationFrame(applyDraftScale));
            } catch (e) {
                console.error('Error iniciando draft:', e);
                const el = document.getElementById('current-turn');
                if (el) el.textContent = 'Error: ' + e.message;
            }

            window.addEventListener('resize', applyDraftScale);
            document.getElementById('start-game-btn').addEventListener('click', _onStartGame);

            if (window.scrTxt && typeof gsap !== 'undefined') {
                setTimeout(() => window.scrTxt('draft-subtitle', 'Selecciona Tus Protocolos',
                    { duration: 1.0, chars: 'upperCase' }), 500);
            }
        },

        teardown() {
            window.removeEventListener('resize', applyDraftScale);
            const btn = document.getElementById('start-game-btn');
            if (btn) btn.removeEventListener('click', _onStartGame);
        },
    };

    window.draftModule = draftModule;
})();
