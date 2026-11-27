/* app.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - logica applicativa
   Autore: Daniele Lolli (UncleDan)

   Flusso:
     Home → Nuova sessione: Griglia oppure Percorsi
          → Identificazione del giocatore (squadra e n° obbligatori;
            colore della maglia per la griglia, sesso per i percorsi)
          → "Aggiungere un altro giocatore?" fino al No o al numero consigliato
            (4 per la griglia, 20 per i percorsi; oltre si aggiunge dalla
            pulsantiera, con richiesta di conferma)
          → Pulsantiera giocatori (pulsanti nel colore della maglia)
          → Griglia: menu abilità → abilità → Conferma → ... → Conferma finale
            Percorsi: scelta percorso → menu prove → prova → Conferma → ...
          → Stampa; all'uscita si chiede di stampare i giocatori rimanenti
   ===================================================================== */
'use strict';

const APP_VERSION = '26.0b20';
/* app nativa Android/iOS (Capacitor): stesso codice della PWA, vedi js/nativo.js */
const NATIVO = !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const PIATTAFORMA = NATIVO ? window.Capacitor.getPlatform() : 'web';
const APP_NAME = 'Classificazione Baskin EISI (PWA)';
/* numero di giocatori consigliato per sessione: oltre non si propone più
   l'aggiunta automatica, ma si può aggiungere dalla pulsantiera confermando */
const SOGLIA_GIOCATORI = { griglia: 4, percorsi: 20 };
const soglia = () => SOGLIA_GIOCATORI[(S && S.tipo) || 'griglia'];
const KEY_SESS = 'classificazione-baskin-eisi-sessione-v2';
const KEY_ARCH = 'classificazione-baskin-eisi-archivio-v1';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- storage sicuro ---------- */
const store = {
  get(k, def){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; }catch(_){ return def; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }catch(_){ return false; } },
  del(k){ try{ localStorage.removeItem(k); }catch(_){ /* niente */ } }
};

/* =====================================================================
   COLORI DELLA MAGLIA (selettore ripreso dal Tabellone Baskin EISI)
   bianco, nero, rosso, blu, giallo, viola, verde, azzurro + personalizzato
   ===================================================================== */
const TEAM_COLORS = ['#ffffff','#000000','#ff2b2b','#2962ff','#ffe000','#9b30ff','#1ee63a','#29b6f6'];
function luminance(hex){
  const c = String(hex||'#ffffff').replace('#','');
  if(c.length < 6) return 1;
  const r = parseInt(c.substr(0,2),16)/255, g = parseInt(c.substr(2,2),16)/255, b = parseInt(c.substr(4,2),16)/255;
  const lin = x => (x <= 0.03928) ? x/12.92 : Math.pow((x+0.055)/1.055, 2.4);
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
}
/* colori dei pulsanti nelle sessioni Percorsi, secondo il sesso */
const COLORI_SESSO = { M: '#3f63e0', F: '#d6248f' };   // bluette, fucsia
/* stile del "numero" del giocatore nel colore della maglia */
function stileMaglia(col){
  if(!col) return '';
  const chiaro = luminance(col) > 0.45;
  return `background:${col};color:${chiaro ? '#1f262d' : '#fff'};${chiaro ? 'box-shadow:inset 0 0 0 2px #b9c1ca;' : ''}`;
}

/* =====================================================================
   MODELLO DATI
   ===================================================================== */
function oggiISO(){
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2,6);

function nuovaSessione(tipo){
  return { id: uid('s'), tipo, creata: new Date().toISOString(), data: oggiISO(), valutatore: '', gara: '', giocatori: [] };
}
function nuovoGiocatore(){
  const livelli = {}; ABILITA.forEach(a => livelli[a.id] = null);
  const malusA = {}; MALUS_AAII.forEach(m => malusA[m.id] = false);
  return {
    id: uid('g'), creata: new Date().toISOString(), stato: 'bozza', confermata: null, malusVisto: false, stampata: false,
    dati: { squadra:'', numero:'', nome:'', nascita:'', ruolo:'', sezione:'', colore:'', sesso:'', note:'',
            data:'', valutatore:'', gara:'' },
    livelli, malusH: false, malusA, protesiAAII: false,
    percorsi: []     // usato solo nelle sessioni "percorsi"
  };
}

let S = store.get(KEY_SESS, null);           // sessione in corso (o null)
let curIdx = -1;                             // giocatore aperto
let curAb = null;                            // abilità aperta
let pendingLv = null;                        // livello scelto non ancora confermato
let editIdx = -1;                            // giocatore in modifica dati (-1 = nuovo)
let colScelto = '';                          // colore maglia nel modulo
let identOrigine = 'nuova';                  // da dove si è arrivati all'identificazione

const cur = () => (S && S.giocatori[curIdx]) || null;
const isGriglia = () => !!S && S.tipo === 'griglia';
function salvaSess(){ if(S) store.set(KEY_SESS, S); else store.del(KEY_SESS); }

/* Descrizione dei malus selezionabili per il punteggio (anche parziale) */
function statoMalusTesto(r){
  if(r.completa) return r.hApplicabile
    ? `Punteggio ${r.base} (tra 5 e 20): si applica solo il Malus H.`
    : `Punteggio ${r.base} (tra 21 e 25): si applica solo il Malus A.A.I.I.`;
  const range = `Punteggio raggiungibile ${r.minimo}–${r.massimo} (${r.fatti}/5 abilità valutate)`;
  if(r.hPossibile && r.aPossibile) return `${range}: entrambi i malus sono ancora possibili; quello non pertinente si disattiva man mano che valuti le abilità.`;
  return r.hPossibile ? `${range}: è possibile solo il Malus H.` : `${range}: è possibile solo il Malus A.A.I.I.`;
}

/* Dopo un cambio di livello: toglie i malus diventati impossibili e
   richiede una nuova verifica se ne diventa possibile uno nuovo. */
function allineaMalus(g, prima){
  const r = calcola(g); const tolti = [];
  if(!r.hPossibile && g.malusH){ g.malusH = false; tolti.push('Malus H'); }
  if(!r.aPossibile && MALUS_AAII.some(m => g.malusA[m.id])){ MALUS_AAII.forEach(m => g.malusA[m.id] = false); tolti.push('Malus A.A.I.I.'); }
  if((r.hPossibile && !prima.hPossibile) || (r.aPossibile && !prima.aPossibile)) g.malusVisto = false;
  if(tolti.length) toast(`${tolti.join(' e ')} non più applicabile: rimosso`);
}

/* Protesi o menomazione fisica agli arti inferiori: requisito del Malus A.A.I.I.
   (le valutazioni salvate prima del flag lo ricavano dai malus selezionati) */
const haProtesi = g => g.protesiAAII ?? MALUS_AAII.some(m => g.malusA[m.id]);

function calcola(g){
  const vals = ABILITA.map(a => g.livelli[a.id]).filter(v => v != null);
  const fatti = vals.length;
  const somma = vals.reduce((s,v)=>s+v, 0);
  const completa = fatti === ABILITA.length;
  const base = completa ? somma : null;
  const hApplicabile = completa && base >= 5 && base <= 20;
  const aApplicabile = completa && base >= 21 && base <= 25;
  /* Punteggio ancora raggiungibile con le abilità mancanti (min 1, max 5 ciascuna):
     un malus resta selezionabile finché il suo intervallo è raggiungibile. */
  const mancanti = ABILITA.length - fatti;
  const minimo = somma + mancanti, massimo = somma + mancanti * 5;
  const hPossibile = minimo <= 20;
  const aPossibile = massimo >= 21;
  let malus = 0;
  if(hApplicabile && g.malusH) malus += MALUS_H.punti;
  if(aApplicabile && haProtesi(g)) MALUS_AAII.forEach(m => { if(g.malusA[m.id]) malus += m.punti; });
  const finale = completa ? base - malus : null;
  const ruolo = ruoloDaPunteggio(finale);
  return { fatti, somma, completa, base, minimo, massimo, hPossibile, aPossibile, hApplicabile, aApplicabile, malus, finale, ruolo };
}

/* Nei percorsi il n° di maglia è facoltativo: senza numero si usa il nome */
const iniziali = nome => String(nome || '').trim().split(/\s+/).map(p => (p.match(/\p{L}|\p{N}/u) || [''])[0]).join('').toUpperCase();
const sigla = d => String(d.numero || '').trim() || iniziali(d.nome) || '?';
const chi = d => d.numero ? `n° ${d.numero}` : (d.nome || '?');
/* contenuto del riquadro del giocatore: numero o iniziali (più piccole se lunghe) */
function htmlSigla(d){ const s = sigla(d); return `<span class="${s.length > 3 ? 'sig-l' : s.length > 2 ? 'sig-m' : ''}">${esc(s)}</span>`; }
const etichetta = g => [g.dati.squadra, chi(g.dati)].filter(Boolean).join(' · ') || '?';

/* Elementi confermati e non ancora stampati della sessione:
   griglie (giocatori confermati) o percorsi confermati dei giocatori */
function daStampare(){
  if(!S) return [];
  if(S.tipo === 'griglia') return S.giocatori.filter(g => g.stato === 'confermata' && !g.stampata).map(g => ({ tipo:'griglia', g, item:g }));
  const out = [];
  S.giocatori.forEach(g => (g.percorsi || []).forEach(t => { if(t.stato === 'confermata' && !t.stampata) out.push({ tipo:'percorso', g, item:t }); }));
  return out;
}

/* =====================================================================
   NAVIGAZIONE
   ===================================================================== */
const SCREENS = ['home','nuova','sessione','giocatore','abilita','livello','malus','archivio','percorsi','perc-menu','perc-prova','documento','guida','elenchi','info'];
const NEED_SESS = ['sessione','giocatore','abilita','livello','malus','percorsi','perc-menu','perc-prova'];

function show(name){
  if(name === 'esci') return;                 // gestito dalla guardia di uscita
  if(!SCREENS.includes(name)) name = 'home';
  if(NEED_SESS.includes(name) && !S) name = 'home';
  if(['abilita','livello','malus'].includes(name) && (!cur() || !isGriglia())) name = 'sessione';
  if(name === 'livello' && !curAb) name = 'abilita';
  if(name.startsWith('perc') && typeof percGuard === 'function') name = percGuard(name);
  document.body.dataset.screen = name;
  document.body.dataset.tipo = S ? S.tipo : '';
  $$('.screen').forEach(s => s.classList.toggle('active', s.id === 'scr-' + name));
  const scr = $('#scr-' + name);
  $('#appbarTitle').textContent = scr ? scr.dataset.title : '';
  ({ home: renderHome, sessione: renderSessione, giocatore: renderIdent, abilita: renderMenuAbilita,
     livello: renderLivello, malus: renderMalus, archivio: renderArchivio, elenchi: () => typeof renderElenchi === 'function' && renderElenchi(),
     percorsi: () => renderSelettorePercorsi(), 'perc-menu': () => renderPercMenu(), 'perc-prova': () => renderPercProva() })[name]?.();
}
function go(name){
  if(location.hash !== '#' + name) location.hash = name; else show(name);
}
/* "replace": sostituisce la voce di cronologia (es. dopo una conferma) */
function goReplace(name){ history.replaceState(null, '', '#' + name); show(name); window.scrollTo(0,0); }

function uscitaDallaHome(){
  show('home');
  const msg = () => toast('Premi ancora Indietro per uscire dall’app');
  if(daStampare().length) conStampaRimanenti(msg, 'Esci senza stampare');
  else msg();
}

function apriDoc(id){
  go('documento');
  setTimeout(() => {
    const el = document.getElementById(id);
    if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); el.classList.add('flash'); setTimeout(()=>el.classList.remove('flash'), 1600); }
  }, 60);
}

/* =====================================================================
   HOME
   ===================================================================== */
function renderHome(){
  const attiva = !!S;
  $('#tileSessT').textContent = attiva ? `Riprendi sessione ${S.tipo === 'griglia' ? 'Griglia' : 'Percorsi'}` : 'Nuova sessione';
  $('#tileSessIco').innerHTML = attiva && S.tipo === 'percorsi' ? '&#9201;' : '&#9998;';
  if(attiva){
    const n = S.giocatori.length;
    const c = S.tipo === 'griglia' ? S.giocatori.filter(g => g.stato === 'confermata').length
                                   : S.giocatori.reduce((s,g) => s + (g.percorsi||[]).filter(t => t.stato === 'confermata').length, 0);
    $('#tileSessS').textContent = `${n} giocator${n===1?'e':'i'} · ${c} ${S.tipo === 'griglia' ? 'confermat' + (c===1?'o':'i') : 'percors' + (c===1?'o':'i') + ' confermat' + (c===1?'o':'i')}${S.gara ? ' · ' + S.gara : ''}`;
  } else $('#tileSessS').textContent = `Griglia in partita (fino a ${SOGLIA_GIOCATORI.griglia} giocatori) o percorsi (fino a ${SOGLIA_GIOCATORI.percorsi})`;
  $('#tileNuovaSess').hidden = !attiva;
  const ds = daStampare();
  $('#homeDaStampare').hidden = !ds.length;
  $('#homeDaStampareN').textContent = ds.length === 1 ? 'C’è 1 valutazione confermata non ancora stampata.' : `Ci sono ${ds.length} valutazioni confermate non ancora stampate.`;
}

function iniziaSessione(tipo){
  S = nuovaSessione(tipo); salvaSess();
  editIdx = -1; identOrigine = 'nuova';
  goReplace('giocatore');   // all'inizio della sessione: identificazione del giocatore
}

/* Uscita dalla sessione (chiusura o nuova sessione): chiede di stampare i rimanenti */
function conStampaRimanenti(azione, testoEsci){
  const ds = daStampare();
  if(!ds.length) return azione();
  const elenco = ds.map(x => `<li>${esc(etichetta(x.g))}${x.g.dati.nome ? ' — ' + esc(x.g.dati.nome) : ''}${x.tipo === 'percorso' ? ' · ' + esc(PERCORSI[x.item.tipo].nome) : ''}</li>`).join('');
  apriSheet('Giocatori non stampati', [{ nome:'Stampa', html: `
    <p>${ds.length === 1 ? 'Questa valutazione confermata non è ancora stata stampata' : 'Queste valutazioni confermate non sono ancora state stampate'}:</p>
    <ul class="ds-list">${elenco}</ul>
    <p>Vuoi stamparle ora (un’unica stampa, una scheda per pagina)?</p>
    <div class="sheet-links col">
      <button class="btn btn-pri" type="button" id="btnDsStampa">&#128424; Stampa i rimanenti</button>
      <button class="btn" type="button" id="btnDsEsci">${esc(testoEsci)}</button>
      <button class="btn btn-ghost" type="button" data-close="1">Annulla</button>
    </div>` }]);
  $('#btnDsStampa').onclick = () => { chiudiSheet(); stampaMultipla(ds); };
  $('#btnDsEsci').onclick = () => { chiudiSheet(); azione(); };
}

function chiudiSessione(){
  if(!S) return;
  conStampaRimanenti(() => {
    const aperte = isGriglia() ? S.giocatori.filter(g => g.stato !== 'confermata').length
                               : S.giocatori.filter(g => !(g.percorsi||[]).length || g.percorsi.some(t => t.stato !== 'confermata')).length;
    const msg = aperte
      ? `${aperte} giocator${aperte===1?'e ha':'i hanno'} valutazioni non confermate, che verranno scartate. Chiudere la sessione?`
      : 'Chiudere la sessione? Le valutazioni confermate restano nell’archivio.';
    if(!confirm(msg)) return;
    S = null; salvaSess(); history.back();   // la pulsantiera si apre sempre dalla home
  }, 'Chiudi senza stampare');
}

/* =====================================================================
   SESSIONE: PULSANTIERA GIOCATORI
   ===================================================================== */
function renderSessione(){
  $('#appbarTitle').textContent = isGriglia() ? 'Giocatori · Griglia' : 'Giocatori · Percorsi';
  $('#sessTipo').textContent = isGriglia() ? 'Sessione Griglia' : 'Sessione Percorsi';
  $('#s_data').value = S.data || '';
  $('#s_valutatore').value = S.valutatore || '';
  $('#s_gara').value = S.gara || '';
  $('#sGaraFld').hidden = !isGriglia();
  $('#sHelpGriglia').hidden = !isGriglia();
  $('#sessSummary').textContent = [fmtData(S.data), S.gara, S.valutatore].filter(Boolean).join(' · ') || 'tocca per data e valutatore';

  const card = (g, i) => {
    let stato, score, conf, printBtn = '', stampata = false;
    if(isGriglia()){
      const r = calcola(g);
      conf = g.stato === 'confermata'; stampata = g.stampata;
      stato = conf ? `Confermato · ruolo ${r.ruolo}` : (r.fatti ? `In corso · ${r.fatti}/5 abilità` : 'Da valutare');
      score = r.completa ? `<b>${r.finale}</b><small>punti</small>` : `<small>${r.fatti}/5</small>`;
      if(conf) printBtn = `<button class="btn sm ${stampata ? '' : 'btn-pri'}" type="button" data-print="${i}">&#128424; ${stampata ? 'Ristampa' : 'Stampa griglia'}</button>`;
    } else {
      const t = (g.percorsi || []).slice(-1)[0];
      const confermati = (g.percorsi || []).filter(x => x.stato === 'confermata');
      const nonStampati = confermati.filter(x => !x.stampata);
      conf = !!t && t.stato === 'confermata'; stampata = confermati.length > 0 && !nonStampati.length;
      if(!t){ stato = 'Percorso da scegliere'; score = '<small>–</small>'; }
      else {
        const e = esito(t), n = t.prove.filter(p => p.confermata).length;
        stato = `${PERCORSI[t.tipo].nome} · ${conf ? 'confermato' + (e.titolo ? ' · ' + e.titolo : '') : n + '/3 prove'}`;
        score = `<b>${t.tipo}</b><small>${conf ? 'conf.' : n + '/3'}</small>`;
      }
      if(confermati.length) printBtn = `<button class="btn sm ${stampata ? '' : 'btn-pri'}" type="button" data-print="${i}">&#128424; ${stampata ? 'Ristampa' : (nonStampati.length > 1 ? `Stampa ${nonStampati.length} schede` : 'Stampa scheda')}</button>`;
    }
    const colPl = isGriglia() ? g.dati.colore : COLORI_SESSO[g.dati.sesso];
    const stile = stileMaglia(colPl);
    return `
      <div class="pl ${conf ? 'conf' : ''}" data-idx="${i}" ${colPl ? `style="border-color:${colPl}"` : ''}>
        <button class="pl-btn" type="button" data-open="${i}">
          <span class="pl-num" style="${stile}">${htmlSigla(g.dati)}</span>
          <span class="pl-txt"><b>${esc(g.dati.nome || g.dati.squadra)}</b><small>${esc(g.dati.nome ? g.dati.squadra : '')}</small><small class="pl-st">${esc(stato)}</small></span>
          <span class="pl-score">${score}</span>
        </button>
        <div class="pl-act">
          ${(conf || printBtn) && stampata ? '<span class="pl-printed">&#10004; stampato</span>' : ''}
          ${printBtn || `<button class="btn sm danger" type="button" data-remove="${i}">Rimuovi</button>`}
        </div>
      </div>`;
  };
  let html = S.giocatori.map(card).join('');
  const n = S.giocatori.length, sg = soglia();
  html += `<button class="pl-add ${n >= sg ? 'oltre' : ''}" type="button" id="btnAddGioc"><span>&#10010;</span> Aggiungi giocatore <small>(${n} ${n === 1 ? 'inserito' : 'inseriti'} · consigliati fino a ${sg})</small></button>`;
  $('#players').innerHTML = html;
  $('#players').classList.toggle('compact', S.giocatori.length > 6);
  const ds = daStampare();
  $('#btnStampaTutti').hidden = ds.length < 2;
  $('#btnInviaCTL').hidden = !confermatiSessione().length;
}

/* oltre il numero consigliato l'aggiunta resta possibile, previa conferma */
function confermaOltreSoglia(){
  return confirm(`La sessione ha già ${S.giocatori.length} giocatori: il numero consigliato per una sessione ${isGriglia() ? 'Griglia' : 'Percorsi'} è ${soglia()}. Sei sicuro di voler aggiungere un altro giocatore?`);
}

function apriGiocatore(i){
  curIdx = i;
  if(isGriglia()) go('abilita');
  else apriGiocatorePercorsi(i);
}

/* =====================================================================
   IDENTIFICAZIONE GIOCATORE
   ===================================================================== */
const P_CAMPI = ['squadra','numero','nome','nascita','ruolo','sesso','sezione'];

function costruisciColori(){
  $('#colorRow').innerHTML = TEAM_COLORS.map(c =>
    `<button class="swatch" type="button" data-color="${c}" style="background:${c}" aria-label="Colore ${c}"></button>`).join('') +
    `<input class="swatch custom" type="color" id="colCustom" aria-label="Colore personalizzato" />`;
}
function setColore(c){
  colScelto = c || '';
  $$('#colorRow .swatch[data-color]').forEach(sw => sw.classList.toggle('sel', sw.dataset.color === colScelto.toLowerCase()));
  const cu = $('#colCustom');
  const personal = colScelto && !TEAM_COLORS.includes(colScelto.toLowerCase());
  cu.classList.toggle('sel', !!personal);
  try{ cu.value = /^#[0-9a-f]{6}$/i.test(colScelto) ? colScelto : '#ffffff'; }catch(_){}
  if(personal) cu.style.background = colScelto; else cu.style.background = '';
  $$('#teamColors [data-tcolor]').forEach(b => b.classList.toggle('sel', b.dataset.tcolor === colScelto));
}

function renderIdent(){
  const g = editIdx >= 0 ? S.giocatori[editIdx] : null;
  $('#appbarTitle').textContent = isGriglia() ? 'Giocatore · Griglia' : 'Giocatore · Percorsi';
  $('#idTitle').textContent = g ? 'Dati del giocatore' : `Nuovo giocatore n. ${S.giocatori.length + 1}`;
  P_CAMPI.forEach(c => $('#p_' + c).value = g ? (g.dati[c] || '') : '');
  let col = g ? g.dati.colore : '';
  if(!g && S.giocatori.length){  // propone squadra e colore dell'ultimo giocatore
    const u = S.giocatori[S.giocatori.length - 1];
    $('#p_squadra').value = u.dati.squadra || '';
    col = u.dati.colore || '';
  }
  setColore(col);
  if(typeof elenchiIdent === 'function') elenchiIdent(!g);
  $('#idErr').hidden = true;
  window.scrollTo(0,0);
  setTimeout(() => (g || !$('#p_squadra').value ? $('#p_squadra') : $('#p_numero')).focus(), 80);
}

function confermaIdent(){
  const v = {}; P_CAMPI.forEach(c => v[c] = $('#p_' + c).value.trim());
  if(isGriglia()) v.colore = colScelto; else delete v.ruolo;
  const err = [];
  if(isGriglia()){
    if(!v.squadra) err.push('la squadra');
    if(!v.numero) err.push('il numero');
  } else if(!v.nome && !(v.squadra && v.numero)){
    err.push('cognome e nome, oppure squadra e n° maglia');
  }
  const lc = x => String(x || '').trim().toLowerCase();
  const dup = S.giocatori.findIndex((g, i) => i !== editIdx && lc(g.dati.squadra) === lc(v.squadra) &&
    (v.numero ? String(g.dati.numero) === v.numero : !g.dati.numero && lc(g.dati.nome) === lc(v.nome)));
  const e = $('#idErr');
  if(err.length){ e.textContent = 'Inserisci ' + err.join(' e ') + '.'; e.hidden = false; return; }
  if(dup >= 0){ e.textContent = `Questo giocatore (squadra e ${v.numero ? 'numero' : 'nome'}) è già nella sessione.`; e.hidden = false; return; }
  if(editIdx >= 0){
    const g = S.giocatori[editIdx];
    Object.assign(g.dati, v);
    (g.percorsi || []).forEach(t => { if(t.stato !== 'confermata') Object.assign(t.dati, v); });
    salvaSess(); history.back(); return;
  }
  const g = nuovoGiocatore(); Object.assign(g.dati, v);
  S.giocatori.push(g); salvaSess(); popolaSuggerimenti();
  if(S.giocatori.length >= soglia()){
    toast(`Inseriti ${S.giocatori.length} giocatori: raggiunto il numero consigliato per la sessione`);
    vaiAiGiocatori();
    return;
  }
  chiediAltroGiocatore(g);
}

/* dopo ogni inserimento: aggiungere un altro giocatore? (fino al No o a 4) */
function chiediAltroGiocatore(g){
  const n = S.giocatori.length;
  apriSheet('Giocatore inserito', [{ nome:'Altro', html: `
    <p><span class="pl-num inline" style="${stileMaglia(isGriglia() ? g.dati.colore : COLORI_SESSO[g.dati.sesso])}">${htmlSigla(g.dati)}</span>
       <b>${esc(etichetta(g))}</b>${g.dati.nome ? ' — ' + esc(g.dati.nome) : ''}</p>
    <p>Giocatori nella sessione: <b>${n}</b> (consigliati fino a ${soglia()}). Vuoi aggiungere un altro giocatore?</p>
    <div class="sheet-links two">
      <button class="btn" type="button" id="btnAltroNo">No, vai ai giocatori</button>
      <button class="btn btn-pri" type="button" id="btnAltroSi">&#10010; Sì, aggiungi</button>
    </div>` }]);
  $('#btnAltroSi').onclick = () => { chiudiSheet(); editIdx = -1; renderIdent(); };
  $('#btnAltroNo').onclick = () => { chiudiSheet(); vaiAiGiocatori(); };
}
function vaiAiGiocatori(){
  if(identOrigine === 'sessione') history.back(); else goReplace('sessione');
}
function annullaIdent(){
  if(editIdx >= 0) return history.back();
  if(S && !S.giocatori.length){ S = null; salvaSess(); return history.back(); }   // sessione vuota: si torna alla home
  vaiAiGiocatori();
}

/* =====================================================================
   MENU ABILITÀ
   ===================================================================== */
function renderMenuAbilita(){
  const g = cur(), r = calcola(g), conf = g.stato === 'confermata';
  $('#plNum').innerHTML = htmlSigla(g.dati);
  $('#plNum').style.cssText = stileMaglia(g.dati.colore);
  $('#plSquadra').textContent = g.dati.squadra;
  $('#plNome').textContent = [g.dati.nome, g.dati.ruolo ? 'ruolo attuale ' + g.dati.ruolo : ''].filter(Boolean).join(' · ');
  $('#lockedMsg').hidden = !conf;
  document.body.classList.toggle('locked', conf);

  const righe = ABILITA.map((a, i) => {
    const lv = g.livelli[a.id];
    return `<button class="ab-row ${lv ? 'set' : ''}" type="button" data-ab="${a.id}" ${conf ? 'disabled' : ''}>
      <span class="abil-n">${i+1}</span>
      <span class="ab-txt"><b>${esc(a.nome)}</b><small>${lv ? esc(PROFILI_LIVELLO[lv]) : 'da valutare'}</small></span>
      <span class="ab-lv ${lv ? 'on' : ''}">${lv || '–'}</span><span class="chev">&#8250;</span>
    </button>`;
  }).join('');

  let mStato, mVal = '–';
  if(!r.completa){
    const poss = [r.hPossibile && 'H', r.aPossibile && 'A.A.I.I.'].filter(Boolean).join(' o ');
    const sel = (r.hPossibile && g.malusH) || (r.aPossibile && haProtesi(g) && MALUS_AAII.some(m => g.malusA[m.id]));
    mStato = `possibile: ${poss}${sel ? ' · selezionato' : ''} (definitivo dopo le 5 abilità)`;
  } else {
    const quale = r.hApplicabile ? 'Malus H' : 'Malus A.A.I.I.';
    const senza = r.aApplicabile && g.malusVisto && !haProtesi(g) ? ' (nessuna protesi/menomazione agli arti inferiori)' : '';
    mStato = r.malus ? `${quale} applicato` : `${quale}: nessuno${senza}${g.malusVisto ? '' : ' (da verificare)'}`;
    mVal = r.malus ? '-' + r.malus : '0';
  }
  const rigaMalus = `<button class="ab-row malus ${r.completa && g.malusVisto ? 'set' : ''}" type="button" id="abMalus" ${conf ? 'disabled' : ''}>
      <span class="abil-n">M</span><span class="ab-txt"><b>Malus</b><small>${esc(mStato)}</small></span>
      <span class="ab-lv ${r.completa ? 'on' : ''}">${mVal}</span><span class="chev">&#8250;</span></button>`;

  $('#abMenu').innerHTML = righe + rigaMalus;
  $('#risultato').innerHTML = htmlRisultato(g, r);

  $('#btnConfermaFinale').hidden = conf;
  $('#btnConfermaFinale').disabled = !r.completa;
  $('#btnStampa').hidden = !conf;
  $('#btnHtml').hidden = !conf;
  $('#btnMail').hidden = !conf;
  $('#btnRiapri').hidden = !conf;
}

function htmlRisultato(g, r){
  if(!r.completa){
    return `<p class="muted">Valuta tutte e cinque le abilità (${r.fatti}/5 completate)${r.fatti ? ` · somma parziale ${r.somma}` : ''}.</p>`;
  }
  const attuale = Number(g.dati.ruolo) || null;
  let confr = '';
  if(attuale){
    confr = attuale === r.ruolo
      ? `<p class="ok">&#10004; Il risultato conferma il ruolo attuale (${attuale}).</p>`
      : `<p class="ko">&#9888; Il risultato (ruolo ${r.ruolo}) è differente dall’arruolamento attuale (ruolo ${attuale}). Secondo le istruzioni della griglia l’atleta DEVE cambiare ruolo; le tempistiche del passaggio sono stabilite dalle commissioni locali. <button class="help-link" type="button" data-doc="modalita">Leggi</button></p>`;
  }
  const limite = [10,11,20,21].includes(r.finale)
    ? `<p class="muted small">Punteggio a ridosso di una soglia: per i casi “borderline” vedi <button class="help-link" type="button" data-doc="casi-dubbi">Casi dubbi</button>.</p>` : '';
  return `
    <div class="res-grid">
      <div><small>Punteggio</small><b>${r.base}</b></div>
      <div><small>Malus</small><b>${r.malus ? '-' + r.malus : '0'}</b></div>
      <div><small>Finale</small><b>${r.finale}</b></div>
      <div class="res-role r${r.ruolo}"><small>Ruolo</small><b>${r.ruolo}</b></div>
    </div>${confr}${limite}`;
}

/* =====================================================================
   DETTAGLIO ABILITÀ: scelta del livello con conferma
   ===================================================================== */
function apriAbilita(id){ curAb = id; pendingLv = cur().livelli[id]; go('livello'); }

function renderLivello(){
  const g = cur(), a = ABILITA.find(x => x.id === curAb), i = ABILITA.indexOf(a);
  $('#lvN').textContent = i + 1;
  $('#lvTitle').textContent = a.nome;
  $('#appbarTitle').textContent = `Abilità ${i+1} di 5`;
  $('#lvWho').textContent = `${etichetta(g)}${g.dati.nome ? ' · ' + g.dati.nome : ''} — scegli il livello di espressione e premi Conferma.`;
  $('#lvList').innerHTML = a.livelli.map((t, j) => `
    <button class="lvl ${pendingLv === j+1 ? 'sel' : ''}" type="button" role="radio" aria-checked="${pendingLv === j+1}" data-lv="${j+1}">
      <span class="lvl-n">${j+1}</span>
      <span class="lvl-t">${esc(t)}<small>${esc(PROFILI_LIVELLO[j+1])}</small></span>
    </button>`).join('');
  const prova = { ...g, livelli: { ...g.livelli, [curAb]: pendingLv } };
  $('#lvMalus').textContent = pendingLv == null ? '' : 'Malus · ' + statoMalusTesto(calcola(prova));
  $('#btnLvConferma').disabled = pendingLv == null;
}

function confermaLivello(){
  if(pendingLv == null) return;
  const g = cur();
  const prima = calcola(g);
  g.livelli[curAb] = pendingLv;
  allineaMalus(g, prima);
  if(g.stato !== 'confermata') g.stato = 'bozza';
  salvaSess();
  curAb = null; pendingLv = null;
  history.back();   // torna al menu abilità
}

/* =====================================================================
   MALUS (con conferma)
   ===================================================================== */
let pendingMalus = null;
function apriMalus(){ const g = cur(); pendingMalus = { h: g.malusH, a: clone(g.malusA), p: haProtesi(g), note: g.dati.note || '' }; go('malus'); }

function renderMalus(){
  const g = cur(), r = calcola(g);
  if(!pendingMalus) pendingMalus = { h: g.malusH, a: clone(g.malusA), p: haProtesi(g), note: g.dati.note || '' };
  $('#appbarTitle').textContent = 'Malus · ' + etichetta(g);
  $('#malusAList').innerHTML = MALUS_AAII.map(m => `
    <label class="chk"><input type="checkbox" data-malus="${m.id}" ${pendingMalus.a[m.id] ? 'checked' : ''} ${r.aPossibile && pendingMalus.p ? '' : 'disabled'} />
      <span><b>${esc(m.nome)}</b><small>${esc(m.testo)}</small></span><em>-${m.punti} ${m.punti===1?'punto':'punti'}</em></label>`).join('');
  $('#m_h').checked = r.hPossibile && pendingMalus.h; $('#m_h').disabled = !r.hPossibile;
  $('#m_protesi').checked = r.aPossibile && pendingMalus.p; $('#m_protesi').disabled = !r.aPossibile;
  $('#malusAList').classList.toggle('na', !pendingMalus.p);
  $$('[data-malus]').forEach(c => { if(c.disabled) c.checked = false; });
  $$('[data-malus]').forEach(c => c.onchange = () => pendingMalus.a[c.dataset.malus] = c.checked);
  $('#m_h').onchange = () => pendingMalus.h = $('#m_h').checked;
  $('#p_note').oninput = () => pendingMalus.note = $('#p_note').value;
  $('#m_protesi').onchange = () => { pendingMalus.p = $('#m_protesi').checked; if(!pendingMalus.p) MALUS_AAII.forEach(m => pendingMalus.a[m.id] = false); renderMalus(); };
  $('#malusH').classList.toggle('na', !r.hPossibile);
  $('#malusA').classList.toggle('na', !r.aPossibile);
  $('#malusState').textContent = statoMalusTesto(r);
  $('#p_note').value = pendingMalus.note;
}

function confermaMalus(){
  const g = cur();
  const r = calcola(g);
  g.malusH = r.hPossibile && $('#m_h').checked;
  g.protesiAAII = r.aPossibile && $('#m_protesi').checked;
  $$('[data-malus]').forEach(c => g.malusA[c.dataset.malus] = r.aPossibile && g.protesiAAII && c.checked);
  g.dati.note = $('#p_note').value;
  g.malusVisto = true;
  salvaSess(); pendingMalus = null;
  history.back();
}

/* =====================================================================
   CONFERMA FINALE
   ===================================================================== */
function chiediConfermaFinale(){
  const g = cur(), r = calcola(g);
  if(!r.completa) return;
  if(!S.data){   // nella griglia la data di osservazione è obbligatoria
    toast('Inserisci la data di osservazione nei dati della sessione');
    go('sessione');
    setTimeout(() => { $('#sessInfo').open = true; $('#s_data').focus(); }, 200);
    return;
  }
  const avvisoMalus = !g.malusVisto
    ? `<p class="ko small">I malus non sono stati verificati: ${r.hApplicabile ? 'Malus H (altezza inferiore a 155 cm)' : 'Malus A.A.I.I. (protesi/menomazioni agli arti inferiori)'} — se applicabile, annulla e apri la voce Malus.</p>` : '';
  const html = `
    <p><b>${esc(etichetta(g))}</b>${g.dati.nome ? ' — ' + esc(g.dati.nome) : ''}</p>
    <table class="mini conf-t">
      ${ABILITA.map(a => `<tr><td>${esc(a.nome)}</td><td class="c"><b>${g.livelli[a.id]}</b></td></tr>`).join('')}
      <tr><td>Punteggio ottenuto</td><td class="c"><b>${r.base}</b></td></tr>
      <tr><td>Malus</td><td class="c"><b>${r.malus ? '-' + r.malus : '0'}</b></td></tr>
      <tr class="hl"><td>Punteggio finale → <b>Ruolo</b></td><td class="c"><b>${r.finale} → ${r.ruolo}</b></td></tr>
    </table>
    ${avvisoMalus}
    <p>Confermi la valutazione di questo giocatore? Dopo la conferma sarà attiva la stampa della griglia e la valutazione verrà salvata nell’archivio.</p>
    <div class="sheet-links two">
      <button class="btn" type="button" data-close="1">Annulla</button>
      <button class="btn btn-pri" type="button" id="btnSiConferma">&#10004; Conferma valutazione</button>
    </div>`;
  apriSheet('Conferma finale', [{nome:'Conferma', html}]);
}

function eseguiConfermaFinale(){
  const g = cur();
  g.stato = 'confermata'; g.confermata = new Date().toISOString(); g.stampata = false;
  // i dati della sessione vengono copiati nella griglia del giocatore
  g.dati.data = S.data; g.dati.valutatore = S.valutatore; g.dati.gara = S.gara;
  salvaSess(); archiviaGiocatore(g);
  chiudiSheet();
  toast('Valutazione confermata: stampa griglia attiva');
  history.back();   // torna alla pulsantiera giocatori
}

function riapri(){
  const g = cur();
  if(!confirm('Riaprire la valutazione? La stampa resterà disattivata fino a una nuova conferma finale.')) return;
  g.stato = 'bozza'; g.confermata = null; g.stampata = false; salvaSess(); renderMenuAbilita();
}

/* =====================================================================
   AIUTO CONTESTUALE
   ===================================================================== */
function apriSheet(titolo, tabs){
  $('#sheetTitle').textContent = titolo;
  const tb = $('#sheetTabs');
  tb.innerHTML = tabs.length > 1 ? tabs.map((t,i)=>`<button type="button" class="${i?'':'on'}" data-tab="${i}">${esc(t.nome)}</button>`).join('') : '';
  tb.hidden = tabs.length < 2;
  const body = $('#sheetBody');
  const mostra = i => {
    body.innerHTML = tabs[i].html; body.scrollTop = 0;
    const hl = body.querySelector('.est-col.hl, .help-lvl.sel');
    if(hl && hl.offsetTop > body.clientHeight * 0.6) body.scrollTop = hl.offsetTop - 12;
    $$('button', tb).forEach(b => b.classList.toggle('on', Number(b.dataset.tab) === i));
  };
  tb.onclick = e => { const b = e.target.closest('[data-tab]'); if(b) mostra(Number(b.dataset.tab)); };
  mostra(0);
  $('#sheet').hidden = false;
  document.body.classList.add('sheet-open');
}
function chiudiSheet(){ $('#sheet').hidden = true; document.body.classList.remove('sheet-open'); }

function noteLegenda(testo){ return LEGENDA.filter(n => n.chiavi.some(rx => rx.test(testo))); }

function aiutoAbilita(id){
  const a = ABILITA.find(x => x.id === id);
  const sel = pendingLv;
  const col = sel ? COLONNA_LIVELLO[sel] : null;

  const livelli = `
    <p class="muted small">Tocca un livello per sceglierlo, poi premi Conferma. Ogni livello corrisponde idealmente a un profilo di ruolo.</p>
    ${a.livelli.map((t,i)=>`
      <button type="button" class="help-lvl ${sel===i+1?'sel':''}" data-pick="${i+1}">
        <span class="lvl-n">${i+1}</span><span>${esc(t)}<small>${esc(PROFILI_LIVELLO[i+1])}</small></span>
      </button>`).join('')}`;

  const colonne = [['r3','RUOLO 3','livello 1 & 2'],['r4','RUOLO 4','livello 3 & 4'],['r5','RUOLO 5','livello 5']];
  const estesa = `
    <p class="muted small">Esempi di come l’abilità si manifesta nei diversi ruoli (Tabella delle casistiche in forma estesa).${col ? ' È evidenziata la colonna del livello scelto.' : ''}</p>
    ${colonne.map(([k,t,l]) => `
      <div class="est-col ${k} ${col===k?'hl':''}">
        <h4>${t} <small>(${l})</small></h4>
        <ul>${a.estesa[k].map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      </div>`).join('')}`;

  const testoRif = sel ? a.livelli[sel-1] : a.livelli.join(' ');
  const pert = noteLegenda(testoRif);
  const legenda = `
    ${pert.length ? `<p class="muted small">${sel ? `Note della legenda pertinenti al livello ${sel}:` : 'Note della legenda pertinenti a questa abilità:'}</p>
      ${pert.map(n=>`<div class="leg"><b>${esc(n.segno)}</b> ${esc(n.testo)}</div>`).join('')}` : '<p class="muted">Nessuna nota della legenda riguarda direttamente il livello scelto.</p>'}
    <details><summary>Tutte le note della legenda</summary>${LEGENDA.map(n=>`<div class="leg"><b>${esc(n.segno)}</b> ${esc(n.testo)}</div>`).join('')}</details>`;

  const altro = `
    <p><b>Funzionamento</b>: 5 abilità, 5 livelli ciascuna. Punteggio = somma dei livelli.</p>
    <table class="mini"><tr><th>Somma</th><th>Ruolo</th></tr><tr><td>da 5 a 10</td><td>3</td></tr><tr><td>da 11 a 20</td><td>4</td></tr><tr><td>da 21 a 25</td><td>5</td></tr></table>
    <p class="small">Chiave di lettura: la “funzionalità”, cioè la capacità di comprendere una situazione, elaborare una soluzione ed eseguirla, fino a “creare gioco”.</p>
    <div class="sheet-links">
      <button class="btn" type="button" data-doc="griglia-istruzioni">Istruzioni per l’uso</button>
      <button class="btn" type="button" data-doc="griglia-testo">Griglia nel testo integrale</button>
      <button class="btn" type="button" data-doc="forma-estesa">Forma estesa completa</button>
      <button class="btn" type="button" data-doc="etica">Questione etica</button>
    </div>`;

  apriSheet(a.nome, [
    {nome:'Livelli', html: livelli},
    {nome:'Esempi per ruolo', html: estesa},
    {nome:'Legenda', html: legenda},
    {nome:'Riferimenti', html: altro}
  ]);
}

function aiutoMalus(){
  const g = cur(); const r = g ? calcola(g) : {completa:false};
  const stato = r.completa === false && r.fatti == null ? 'Nessun giocatore in valutazione.' : statoMalusTesto(r);
  const h = `
    <p class="callout">${esc(stato)}</p>
    <p><b>${esc(MALUS_H.nome)}</b> ${esc(MALUS_H.condizione)}:</p>
    <p>${esc(MALUS_H.testo)}</p>
    <p class="muted small">Scopo dei malus: abbassare il punteggio ottenuto per equilibrare una componente fisica non modificabile che influisce in modo svantaggioso nel confronto con i pari ruolo.</p>`;
  const a = `
    <p><b>Malus A.A.I.I. (Arti inferiori)</b> ${esc(MALUS_AAII_CONDIZIONE)}:</p>
    <table class="mini malus-t">${MALUS_AAII.map(m=>`<tr><th>${esc(m.nome)}</th><td>${esc(m.testo)}</td><td class="nw">-${m.punti} ${m.punti===1?'punto':'punti'}</td></tr>`).join('')}</table>
    <p class="muted small">Malus massimo: -6 punti. Esempio: 23 punti con Salto e Cambi di velocità → 23 - 1 - 2 = 20 → ruolo 4.</p>`;
  apriSheet('Malus', [
    {nome:'Malus H', html: h},
    {nome:'Malus A.A.I.I.', html: a + '<div class="sheet-links"><button class="btn" type="button" data-doc="malus-istr">Malus nel testo integrale</button></div>'}
  ]);
}

function aiutoDoc(ids, titolo){
  const html = ids.map(id => {
    const el = document.getElementById(id); if(!el) return '';
    let out = el.outerHTML.replace(/\sid="[^"]*"/g,''); let n = el.nextElementSibling;
    while(n && !/^H[1-3]$/.test(n.tagName)){ out += n.outerHTML.replace(/\sid="[^"]*"/g,''); n = n.nextElementSibling; }
    return out;
  }).join('');
  apriSheet(titolo, [{nome:titolo, html: `<div class="doc">${html}</div>`}]);
}

function onHelp(key){
  if(key === 'malus') return aiutoMalus();
  if(key === 'modalita') return aiutoDoc(['modalita','casi-dubbi','etica'], 'Modalità di valutazione');
}

/* =====================================================================
   ARCHIVIO (valutazioni confermate)
   ===================================================================== */
function archivio(){ return store.get(KEY_ARCH, []); }
function salvaArchivio(a){ return store.set(KEY_ARCH, a); }

function archiviaGiocatore(g){
  const a = archivio();
  const i = a.findIndex(x => x.id === g.id);
  if(i >= 0) a[i] = clone(g); else a.unshift(clone(g));
  if(!salvaArchivio(a)) toast('Attenzione: archivio non disponibile su questo browser');
}

const chiaveGiocatore = g => `${(g.dati.squadra||'').trim().toLowerCase()}#${String(g.dati.numero||'').trim() || (g.dati.nome||'').trim().toLowerCase()}`;

function renderArchivio(){
  const a = archivio();
  const box = $('#archList');
  if(typeof renderArchivioPercorsi === 'function') renderArchivioPercorsi();
  if(!a.length){ box.innerHTML = '<div class="card"><p class="muted">Nessuna griglia confermata.</p></div>'; return; }

  const gruppi = {};
  a.forEach(g => { const r = calcola(g); if(r.completa) (gruppi[chiaveGiocatore(g)] = gruppi[chiaveGiocatore(g)] || []).push(r.finale); });
  const medie = Object.entries(gruppi).filter(([,v]) => v.length > 1).map(([k,v]) => {
    const m = v.reduce((s,x)=>s+x,0) / v.length;
    const g = a.find(x => chiaveGiocatore(x) === k);
    const tra = (m > 10 && m < 11) || (m > 20 && m < 21);
    return `<li><b>${esc(etichetta(g))}</b>${g.dati.nome ? ' ' + esc(g.dati.nome) : ''}: media di ${v.length} valutazioni = <b>${m.toFixed(2).replace('.',',')}</b> → ${tra ? 'tra due soglie (caso dubbio)' : 'ruolo ' + ruoloDaPunteggio(m)}</li>`;
  });

  box.innerHTML = (medie.length ? `<div class="card"><h3>Media delle valutazioni</h3><ul class="medie">${medie.join('')}</ul><p class="muted small">In presenza di più valutazioni dello stesso giocatore (stessa squadra e numero) si procede alla media matematica dei risultati.</p></div>` : '') +
    a.map(g => {
      const r = calcola(g), d = g.dati;
      return `<div class="card arch" data-id="${g.id}">
        <div class="arch-main">
          <div><b>${esc(etichetta(g))}</b><small>${esc(d.nome || '')}</small>
            <small>${esc(fmtData(d.data))}${d.valutatore ? ' · ' + esc(d.valutatore) : ''}${d.ruolo ? ' · attuale ' + esc(d.ruolo) : ''}</small></div>
          <div class="arch-score r${r.ruolo || 0}"><b>${r.finale}</b><small>ruolo ${r.ruolo}</small></div>
        </div>
        <div class="arch-act">
          <button class="btn sm" type="button" data-arch="stampa">Stampa</button>
          <button class="btn sm" type="button" data-arch="html">HTML</button>
          <button class="btn sm" type="button" data-arch="invia">Invia alla CTL</button>
          <button class="btn sm" type="button" data-arch="rivaluta">Nuova valutazione</button>
          <button class="btn sm danger" type="button" data-arch="elimina">Elimina</button>
        </div></div>`;
    }).join('');
}

function onArchivio(azione, id){
  const a = archivio(); const g = a.find(x => x.id === id); if(!g) return;
  if(azione === 'stampa') stampa(g);
  if(azione === 'html') esportaHtml(g);
  if(azione === 'invia') apriInvioCTL([{ tipo:'griglia', item:g }]);
  if(azione === 'rivaluta'){
    if(S && S.tipo !== 'griglia'){ toast('C’è una sessione Percorsi in corso: chiudila per rivalutare con la griglia'); return; }
    if(!S){ S = nuovaSessione('griglia'); }
    if(S.giocatori.length >= soglia() && !confermaOltreSoglia()) return;
    if(S.giocatori.some(x => chiaveGiocatore(x) === chiaveGiocatore(g))){ toast('Giocatore già presente nella sessione'); return; }
    const n = nuovoGiocatore();
    P_CAMPI.concat(['colore']).forEach(k => n.dati[k] = g.dati[k] || '');
    S.giocatori.push(n); salvaSess(); go('sessione'); toast('Giocatore aggiunto alla sessione');
  }
  if(azione === 'elimina'){
    if(!confirm(`Eliminare la valutazione di ${etichetta(g)}?`)) return;
    salvaArchivio(a.filter(x => x.id !== id)); renderArchivio();
  }
}

function esportaArchivio(){
  const blob = new Blob([JSON.stringify({app: APP_NAME, versione: APP_VERSION, esportato: new Date().toISOString(), valutazioni: archivio(), percorsi: (typeof percArchivio === 'function' ? percArchivio() : [])}, null, 2)], {type:'application/json'});
  scarica(blob, `Archivio_Classificazione_Baskin_${stamp()}.json`);
}
function importaArchivio(file){
  const fr = new FileReader();
  fr.onload = () => {
    try{
      const j = JSON.parse(fr.result);
      const nuove = Array.isArray(j) ? j : (j.valutazioni || j.griglie);
      if(!Array.isArray(nuove)) throw new Error('formato');
      const a = archivio(); let n = 0;
      nuove.forEach(g => { if(g && g.id && g.livelli && g.dati && !a.some(x => x.id === g.id)){ a.push(g); n++; } });
      const np = (Array.isArray(j.percorsi) && typeof percImporta === 'function') ? percImporta(j.percorsi) : 0;
      salvaArchivio(a); renderArchivio(); popolaSuggerimenti(); toast(`Importate ${n} griglie e ${np} percorsi`);
    }catch(_){ toast('File non valido'); }
  };
  fr.readAsText(file);
}

function popolaSuggerimenti(){
  const tutti = archivio().concat(S ? S.giocatori : []).concat(typeof percTutti === 'function' ? percTutti() : []);
  const uniq = k => [...new Set(tutti.map(g => g.dati[k]).filter(Boolean))];
  $('#dlSezioni').innerHTML = '';   // la Sezione Territoriale ora è una tendina (elenchi.js)
  const squadre = [...new Set((typeof elencoSquadre === 'function' ? elencoSquadre().map(s => s.nome) : []).concat(uniq('squadra')))];
  $('#dlSquadre').innerHTML = squadre.map(s => `<option value="${esc(s)}">`).join('');
}

/* =====================================================================
   STAMPA / PDF ed EXPORT HTML (solo valutazioni confermate)
   ===================================================================== */
function fmtData(iso){ if(!iso) return ''; const [y,m,d] = iso.split('-'); return d ? `${d}/${m}/${y}` : iso; }
function stamp(){
  const d = new Date(), p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}
function nomeFile(g){
  const pulisci = s => String(s || '').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g,'');
  const parti = [pulisci(g.dati.squadra), 'n' + pulisci(g.dati.numero), pulisci(g.dati.nome)].filter(x => x && x !== 'n');
  return `Griglia_Valutazione_Baskin_${parti.join('_')}_${stamp()}`;
}

function htmlScheda(g, logoB, logoE){
  const r = calcola(g), d = g.dati;
  const cerchio = (a, i) => g.livelli[a.id] === i ? `<td class="lv on"><span>${i}</span></td>` : `<td class="lv">${i}</td>`;
  const box = (on, na) => `<span class="cb ${na?'na':''}">${on && !na ? '&#10005;' : ''}</span>`;
  const righeRuolo = [[3,'10 o inferiore'],[4,'Tra 11 e 20'],[5,'Da 21 a 25']]
    .map(([ru, t]) => `<tr class="${r.ruolo === ru ? 'hit' : ''}"><td>${t}</td><td>${ru}</td></tr>`).join('');
  /* La griglia deve stare in una pagina: le note che non ci entrano (oltre 7 righe
     stimate di 100 caratteri) vanno nella seconda pagina, dopo il dettaglio dei livelli. */
  const noteHtml = `<div class="ps-note"><b>Note:</b> ${esc(d.note).replace(/\n/g,'<br/>')}</div>`;
  const noteLunghe = String(d.note || '').split('\n').reduce((n, riga) => n + Math.max(1, Math.ceil(riga.length / 100)), 0) > 7;
  const dettagli = ABILITA.map(a => {
    const lv = g.livelli[a.id];
    return `<tr><th>${esc(a.nome)}</th><td class="c">${lv || '–'}</td><td>${lv ? esc(a.livelli[lv-1]) : '<i>non valutata</i>'}</td></tr>`;
  }).join('');
  return `
  <div class="ps">
    <header class="ps-head">
      <img class="ps-lb" src="${logoB}" alt="Baskin" />
      <div class="ps-ht">Allegato A al regolamento di gioco<br/><span>La classificazione dei ruoli nel Baskin (rev. 1 settembre 2025)</span></div>
      <span class="ps-le"><img src="${logoE}" alt="EISI" /></span>
    </header>
    <h1>RISULTATI GRIGLIA DI VALUTAZIONE DELLE ABILITÀ IN PARTITA</h1>
    <table class="ps-dati">
      <tr><th>Squadra di appartenenza</th><td>${esc(d.squadra)}</td><th>N° maglia</th><td class="c b">${esc(d.numero)}${d.colore ? ` <span class="ps-col" style="background:${esc(d.colore)}"></span>` : ''}</td></tr>
      <tr><th>Cognome e nome</th><td colspan="3">${esc(d.nome)}</td></tr>
      <tr><th>Data di nascita</th><td>${esc(fmtData(d.nascita))}</td><th>Ruolo attuale</th><td class="c b">${esc(d.ruolo)}</td></tr>
      <tr><th>Sezione Territoriale</th><td>${esc(d.sezione)}</td><th>Sesso</th><td class="c">${esc(d.sesso || '')}</td></tr>
      <tr><th>Data osservazione</th><td>${esc(fmtData(d.data))}</td><th>Valutatore</th><td>${esc(d.valutatore)}</td></tr>
      <tr><th>Gara/e osservata/e</th><td colspan="3">${esc(d.gara)}</td></tr>
    </table>
    <table class="ps-ab">
      <tr><th class="l">ABILITÀ</th><th colspan="5">LIVELLO DI ESPRESSIONE</th><th>PUNTI</th></tr>
      ${ABILITA.map(a => `<tr><th class="l">${esc(a.nome)}</th>${[1,2,3,4,5].map(i=>cerchio(a,i)).join('')}<td class="c b">${g.livelli[a.id] || ''}</td></tr>`).join('')}
      <tr class="tot"><th class="l" colspan="6">PUNTEGGIO OTTENUTO</th><td class="c b">${r.completa ? r.base : ''}</td></tr>
    </table>
    <table class="ps-malus">
      <tr><th class="l">Malus H <small>(per punteggi tra 5 e 20)</small></th><td>${box(g.malusH, !r.hApplicabile)} H &lt; 155 cm</td><td class="c">-3 punti</td></tr>
      ${MALUS_AAII.map((m,i) => `<tr>${i===0?`<th class="l" rowspan="${MALUS_AAII.length}">Malus A.A.I.I. <small>(per punteggi tra 21 e 25)</small><small class="ps-prot">${box(haProtesi(g), !r.aApplicabile)}protesi/menomazione agli arti inferiori</small></th>`:''}<td>${box(g.malusA[m.id], !r.aApplicabile || !haProtesi(g))} ${esc(m.nome)}</td><td class="c">-${m.punti} ${m.punti===1?'punto':'punti'}</td></tr>`).join('')}
      <tr class="tot"><th class="l" colspan="2">PUNTEGGIO OTTENUTO DOPO L’APPLICAZIONE DEI MALUS</th><td class="c b big">${r.completa ? r.finale : ''}</td></tr>
    </table>
    <div class="ps-fin">
      <table class="ps-ruolo"><tr><th>PUNTEGGIO FINALE</th><th>RUOLO</th></tr>${righeRuolo}</table>
      <div class="ps-esito ${r.completa ? 'r' + r.ruolo : ''}"><small>Ruolo risultante</small><b>${r.completa ? r.ruolo : '–'}</b></div>
    </div>
    ${d.note ? (noteLunghe ? '<div class="ps-note"><b>Note:</b> <i>vedi la pagina seguente.</i></div>' : noteHtml) : ''}
    <div class="ps-firma"><span>Data ____________________</span><span>Firma del valutatore ______________________________</span></div>
    <h2 class="ps-brk">DETTAGLIO DEI LIVELLI ASSEGNATI</h2>
    <table class="ps-det"><tr><th>Abilità</th><th>Livello</th><th>Descrizione del livello (Griglia di valutazione delle abilità in partita)</th></tr>${dettagli}</table>
    ${noteLunghe ? '<h2>NOTE</h2>' + noteHtml : ''}
    <footer class="ps-foot">${esc(FONTE)} — compilata con ${esc(APP_NAME)} v${APP_VERSION}${g.confermata ? ', confermata il ' + esc(new Date(g.confermata).toLocaleString('it-IT')) : ''}<br/>
      Il regolamento, i documenti di gara e gli altri documenti si trovano sul sito EISI nel menu Documenti <a href="https://eisi.it/eisi/documenti/">https://eisi.it/eisi/documenti/</a> oppure in Area Download.</footer>
  </div>`;
}

const CSS_SCHEDA = `
.ps{font-family:Arial,Helvetica,sans-serif;color:#222;font-size:10.5pt;max-width:190mm;margin:0 auto}
.ps h1,.ps h2,.ps th{font-family:"Arial Narrow",Arial,sans-serif}
.ps-head{display:flex;align-items:center;gap:4mm;background:#000;color:#fff;padding:2mm 4mm;border-radius:2mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ps-lb{height:17mm;width:17mm}
.ps-ht{flex:1;text-align:center;font-family:"Arial Narrow",Arial,sans-serif;font-size:11pt;font-weight:bold}
.ps-ht span{font-weight:normal;font-size:9.5pt}
.ps-le{display:inline-flex}   /* EISI trasparente su fondo nero, come nel Tabellone */
.ps-le img{height:15mm;width:15mm}
.ps h1{font-size:14pt;text-align:center;margin:3.5mm 0 2.5mm;color:#2f3740}
.ps h2{font-size:12pt;color:#2f3740;margin:6mm 0 2mm}
.ps table{border-collapse:collapse;width:100%;margin:0 0 2.5mm}
.ps th,.ps td{border:0.3mm solid #8a949e;padding:1.1mm 2mm;vertical-align:middle}
.ps th{background:#eef0f2;text-align:center;font-size:10pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ps th.l{text-align:left}
.ps th small{font-weight:normal;display:block}
.ps .c{text-align:center}.ps .b{font-weight:bold}.ps .big{font-size:14pt}
.ps-dati th{text-align:left;width:22%}
.ps-ab td.lv{text-align:center;width:9%;color:#8a949e}
.ps-ab td.lv.on span{display:inline-block;min-width:6mm;line-height:6mm;border:0.6mm solid #f4991b;border-radius:50%;color:#222;font-weight:bold;background:#fde9cf;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ps tr.tot th,.ps tr.tot td{background:#e3e6ea;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ps .cb{display:inline-block;width:3.6mm;height:3.6mm;line-height:3.4mm;border:0.3mm solid #222;text-align:center;font-weight:bold;font-size:9pt;margin-right:1.5mm;vertical-align:-0.6mm}
.ps-prot{margin-top:1mm;font-weight:bold !important}
.ps .cb.na{border-color:#bbb;background:repeating-linear-gradient(45deg,#fff,#fff 0.5mm,#ddd 0.5mm,#ddd 1mm)}
.ps-fin{display:flex;gap:4mm;align-items:stretch}
.ps-ruolo{flex:1}
.ps-ruolo td{text-align:center}
.ps-ruolo tr.hit td{background:#fde9cf;font-weight:bold;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.ps-esito{width:40mm;border:0.6mm solid #2f3740;border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;margin-bottom:3mm}
.ps-esito b{font-size:30pt;line-height:1.1;color:#2f3740}
.ps-esito small{font-size:8.5pt;color:#555}
.ps-note{border:0.3mm solid #8a949e;padding:1.5mm 2mm;margin-bottom:2.5mm;font-size:9.5pt}
.ps-firma{display:flex;justify-content:space-between;margin:6mm 0 0;font-size:10pt}
.ps-brk{page-break-before:always;break-before:page}
.ps-det th{text-align:left}
.ps-det td{font-size:9.5pt}
.ps-foot{margin-top:5mm;font-size:8pt;color:#555;text-align:center;border-top:0.3mm solid #ccc;padding-top:2mm}
.ps-foot a{color:#f4991b}
.ps-col{display:inline-block;width:4mm;height:4mm;border-radius:50%;border:0.3mm solid #666;vertical-align:-0.6mm;margin-left:1.5mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:12mm}
`;

/* Stampa di una o più schede (griglie e/o percorsi) in un'unica stampa,
   una scheda per pagina. Alla chiusura della finestra di stampa le schede
   vengono segnate come stampate. */
function htmlElemento(x, logoB, logoE){
  return x.tipo === 'griglia' ? htmlScheda(x.item, logoB, logoE) : htmlSchedaPercorso(x.item, logoB, logoE);
}
const CSS_MULTI = `.ps + .ps{break-before:page;page-break-before:always}`;
function stampaSchede(lista, titoloFile){
  if(!lista.length) return;
  const area = $('#printArea');
  area.innerHTML = `<style>${CSS_SCHEDA}${typeof CSS_PERC_EXTRA !== 'undefined' ? CSS_PERC_EXTRA : ''}${CSS_MULTI}</style>` +
    lista.map(x => htmlElemento(x, 'icons/logos/logo-baskin.svg', 'icons/logos/logo-eisi.svg')).join('');
  const titolo = document.title;
  document.title = titoloFile;
  document.body.classList.add('printing');
  let fatto = false;
  const fine = () => {
    if(fatto) return; fatto = true;
    document.body.classList.remove('printing'); document.title = titolo;
    window.removeEventListener('afterprint', fine);
    lista.forEach(x => x.item.stampata = true);
    salvaSess();
    const scr = document.body.dataset.screen;
    if(scr === 'sessione') renderSessione(); else if(scr === 'home') renderHome();
    else if(scr === 'perc-menu') renderPercMenu();
  };
  window.addEventListener('afterprint', fine);
  const imgs = $$('img', area);
  Promise.all(imgs.map(i => i.complete ? 1 : new Promise(res => { i.onload = i.onerror = res; })))
    .then(() => setTimeout(() => { window.print(); setTimeout(fine, 1500); }, 50));
}
function stampa(g){
  if(g.stato !== 'confermata'){ toast('La stampa è attiva solo dopo la conferma finale'); return; }
  stampaSchede([{ tipo:'griglia', item:g }], nomeFile(g));
}
function stampaMultipla(ds){
  stampaSchede(ds.map(x => ({ tipo:x.tipo, item:x.item })), `Classificazione_Baskin_${ds.length}_schede_${stamp()}`);
}

function esportaHtml(g){
  if(g.stato !== 'confermata'){ toast('L’export è attivo solo dopo la conferma finale'); return; }
  const nome = nomeFile(g);
  const doc = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(nome)}</title>
<style>body{margin:0;padding:6mm;background:#fff}${CSS_SCHEDA}
.bar{max-width:190mm;margin:0 auto 4mm;text-align:right}.bar button{font:inherit;padding:2mm 4mm;border:0;border-radius:2mm;background:#2f3740;color:#fff}
@media print{.bar{display:none}body{padding:0}}</style></head>
<body><div class="bar"><button onclick="window.print()">Stampa / Salva come PDF</button></div>
${htmlScheda(g, LOGO_BASKIN, LOGO_EISI)}
</body></html>`;
  scarica(new Blob([doc], {type:'text/html'}), nome + '.html');
  g.stampata = true; salvaSess();
}

/* =====================================================================
   INVIO ALLA CTL (e-mail con la scheda HTML in allegato)
   ===================================================================== */
const KEY_CTL = 'classificazione-baskin-eisi-ctl';
let INV = null;   // { lista:[{tipo,item}], sel:Set(id) }

function confermatiSessione(){
  if(!S) return [];
  if(S.tipo === 'griglia') return S.giocatori.filter(g => g.stato === 'confermata').map(g => ({ tipo:'griglia', g, item:g }));
  const out = [];
  S.giocatori.forEach(g => (g.percorsi || []).forEach(t => { if(t.stato === 'confermata') out.push({ tipo:'percorso', g, item:t }); }));
  return out;
}

function descrizioneElemento(x){
  const d = x.item.dati, chi = [d.squadra, d.numero && 'n° ' + d.numero, d.nome].filter(Boolean).join(' · ') || '?';
  if(x.tipo === 'griglia'){ const r = calcola(x.item); return `Griglia — ${chi}: punteggio ${r.finale} → ruolo ${r.ruolo}`; }
  const e = esito(x.item);
  return `${PERCORSI[x.item.tipo].nome} — ${chi}: ${e.titolo}`;
}

function docHtml(lista, titolo){
  return `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(titolo)}</title>
<style>body{margin:0;padding:6mm;background:#fff}${CSS_SCHEDA}${typeof CSS_PERC_EXTRA !== 'undefined' ? CSS_PERC_EXTRA : ''}${CSS_MULTI}
.bar{max-width:190mm;margin:0 auto 4mm;text-align:right}.bar button{font:inherit;padding:2mm 4mm;border:0;border-radius:2mm;background:#2f3740;color:#fff}
@media print{.bar{display:none}body{padding:0}}</style></head>
<body><div class="bar"><button onclick="window.print()">Stampa / Salva come PDF</button></div>
${lista.map(x => htmlElemento(x, LOGO_BASKIN, LOGO_EISI)).join('\n')}
</body></html>`;
}

/* lista: candidati {tipo,item}; preselezione: id da spuntare (default tutti) */
function apriInvioCTL(lista, preselezione){
  if(!lista.length){ toast('Nessuna valutazione confermata da inviare'); return; }
  INV = { lista, sel: new Set(preselezione || lista.map(x => x.item.id)) };
  const elenco = elencoCTL();
  /* preselezione: la CTL predefinita; altrimenti quella della Sezione Territoriale
     delle valutazioni; altrimenti l'ultima usata; altrimenti, se è una sola, quella.
     Le CTL senza e-mail si possono scegliere: l'avviso arriva all'invio. */
  const usata = store.get(KEY_CTL, '');            // «ctl:<nome>» oppure un indirizzo libero
  const sezioni = [...new Set(lista.map(x => x.item.dati.sezione).filter(Boolean))];
  const idx = f => elenco.findIndex(f);
  let scelta = idx(c => c.predefinita);
  if(scelta < 0 && sezioni.length === 1) scelta = idx(c => c.sezione === sezioni[0]);
  if(scelta < 0 && usata.startsWith('ctl:')) scelta = idx(c => 'ctl:' + c.nome === usata);
  if(scelta < 0 && elenco.length === 1) scelta = 0;
  const altro = scelta < 0 && usata && !usata.startsWith('ctl:') ? usata : '';
  const fileOk = !!(navigator.canShare && window.File && navigator.canShare({ files: [new File(['x'], 'x.html', { type:'text/html' })] }));
  const html = `
    <p><b>Destinatario</b></p>
    <div class="ctl-list ctl-scroll">${elenco.map((c, k) => `
      <label class="chk"><input type="radio" name="ctl" value="${k}" ${k === scelta ? 'checked' : ''}/>
        <span><b>${esc(c.nome)}${c.predefinita ? ' &#9733;' : ''}</b><small>${ctlConEmail(c) ? esc(c.email) : '<i>e-mail non impostata</i>'}</small></span></label>`).join('')}
      <label class="chk"><input type="radio" name="ctl" value="__altro" ${altro ? 'checked' : ''}/>
        <span><b>Altro indirizzo</b><input type="email" id="ctlAltro" placeholder="nome@dominio.it" value="${esc(altro)}"/></span></label>
    </div>
    <p class="small" id="ctlAvviso" hidden></p>
    <p class="small"><button class="help-link" type="button" id="btnInvElenco">Gestisci l’elenco delle CTL</button></p>
    ${lista.length > 1 ? `<p><b>Valutazioni da inviare</b></p><div class="ctl-list">${lista.map(x => `
      <label class="chk"><input type="checkbox" data-inv="${x.item.id}" ${INV.sel.has(x.item.id) ? 'checked' : ''}/>
        <span>${esc(descrizioneElemento(x))}</span></label>`).join('')}</div>`
      : `<p class="small">${esc(descrizioneElemento(lista[0]))}</p>`}
    <div class="actions">
      ${fileOk ? `<button class="btn btn-pri" type="button" id="btnInvCondividi">&#9993; Invia con allegato</button>` : ''}
      <button class="btn ${fileOk ? '' : 'btn-pri'}" type="button" id="btnInvMail">&#11015; Scarica il file e scrivi la mail</button>
    </div>
    <p class="muted small">${fileOk
      ? '«Invia con allegato» apre la condivisione del telefono: scegli l’app di posta; l’indirizzo della CTL viene copiato negli appunti e scritto in cima al messaggio, incollalo come destinatario se l’app non lo inserisce.'
      : 'Il file HTML viene scaricato e si apre la mail già indirizzata: allega il file scaricato prima di inviarla.'}
      Il file si apre con qualsiasi browser e si può stampare o salvare in PDF.</p>`;
  apriSheet('Invia alla CTL', [{ nome:'Invio', html }]);
  const body = $('#sheetBody');
  body.onchange = e => {
    const c = e.target.closest('[data-inv]');
    if(c){ c.checked ? INV.sel.add(c.dataset.inv) : INV.sel.delete(c.dataset.inv); }
    if(e.target.id === 'ctlAltro') $('input[name="ctl"][value="__altro"]', body).checked = true;
    if(e.target.name === 'ctl') $('#ctlAvviso', body).hidden = true;
  };
  $('#ctlAltro', body).onfocus = () => { $('input[name="ctl"][value="__altro"]', body).checked = true; };
  if($('#btnInvCondividi', body)) $('#btnInvCondividi', body).onclick = () => eseguiInvioCTL(true);
  $('#btnInvMail', body).onclick = () => eseguiInvioCTL(false);
  $('#btnInvElenco', body).onclick = () => { chiudiSheet(); go('elenchi'); };
}

async function eseguiInvioCTL(condividi){
  const body = $('#sheetBody');
  const r = $('input[name="ctl"]:checked', body);
  if(!r){ toast('Scegli la CTL o scrivi un indirizzo'); return; }
  const scelta = r.value === '__altro' ? null : elencoCTL()[+r.value];
  const email = scelta ? String(scelta.email || '').trim() : $('#ctlAltro', body).value.trim();
  if(scelta && !email){   // avviso: la CTL scelta non ha l'e-mail
    const a = $('#ctlAvviso', body);
    a.innerHTML = `&#9888; <b>${esc(scelta.nome)}</b> non ha un indirizzo e-mail. Aggiungilo in «Gestisci l’elenco delle CTL», oppure scegli «Altro indirizzo» e scrivilo.`;
    a.hidden = false; a.scrollIntoView({ block: 'nearest' });
    toast(`${scelta.nome}: e-mail non impostata`);
    return;
  }
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ toast(scelta ? `L’e-mail di ${scelta.nome} non è valida: correggila nell’elenco CTL` : 'Scrivi un indirizzo e-mail valido'); return; }
  const lista = INV.lista.filter(x => INV.sel.has(x.item.id));
  if(!lista.length){ toast('Seleziona almeno una valutazione'); return; }
  store.set(KEY_CTL, scelta ? 'ctl:' + scelta.nome : email);
  const ctl = scelta;
  const uno = lista.length === 1, x0 = lista[0];
  const nome = uno ? (x0.tipo === 'griglia' ? nomeFile(x0.item) : nomeFilePercorso(x0.item)) : `Classificazione_Baskin_${lista.length}_schede_${stamp()}`;
  const tipi = [...new Set(lista.map(x => x.tipo === 'griglia' ? 'Griglia di valutazione' : 'Percorsi'))].join(' e ');
  const d0 = { ...x0.item.dati, data: x0.item.dati.data || (S && S.data) || '', valutatore: x0.item.dati.valutatore || (S && S.valutatore) || '' };
  const oggetto = `Classificazione Baskin – ${tipi} – ` + (uno ? [d0.squadra, d0.numero && 'n° ' + d0.numero, d0.nome].filter(Boolean).join(' ') : `${lista.length} valutazioni`) + (d0.data ? ` – ${fmtData(d0.data)}` : '');
  const testo = [
    `Alla ${ctl ? ctl.nome : 'Commissione Tecnica Locale'},`,
    '',
    `invio ${uno ? 'la valutazione' : 'le seguenti ' + lista.length + ' valutazioni'} (${tipi}):`,
    ...lista.map(x => '- ' + descrizioneElemento(x)),
    '',
    [d0.data && 'Data: ' + fmtData(d0.data), d0.valutatore && 'Valutatore: ' + d0.valutatore, S && S.gara && 'Gara: ' + S.gara].filter(Boolean).join(' · '),
    '',
    `In allegato il file ${nome}.html: si apre con qualsiasi browser e si può stampare o salvare in PDF.`,
    `Compilato con ${APP_NAME} v${APP_VERSION}.`
  ].join('\n');
  const blob = new Blob([docHtml(lista, nome)], { type:'text/html' });
  const segna = () => { lista.forEach(x => { x.item.stampata = true; x.item.inviata = { email, data: new Date().toISOString() }; }); salvaSess(); };

  if(condividi){
    const file = new File([blob], nome + '.html', { type:'text/html' });
    try{ navigator.clipboard && navigator.clipboard.writeText(email).catch(() => {}); }catch(_){}
    try{
      await navigator.share({ files:[file], title: oggetto, text: `A: ${email}\nOggetto: ${oggetto}\n\n${testo}` });
      segna(); chiudiSheet(); toast(`Inviato tramite condivisione (destinatario ${email})`); dopoInvio();
    }catch(e){ if(e && e.name !== 'AbortError') toast('Condivisione non riuscita: usa «Scarica il file e scrivi la mail»'); }
    return;
  }
  scarica(blob, nome + '.html');
  segna(); chiudiSheet();
  setTimeout(() => { location.href = `mailto:${email}?subject=${encodeURIComponent(oggetto)}&body=${encodeURIComponent(testo)}`; }, 400);
  toast('File scaricato: allegalo alla mail');
  dopoInvio();
}
function dopoInvio(){
  const scr = document.body.dataset.screen;
  if(scr === 'sessione') renderSessione(); else if(scr === 'abilita') renderMenuAbilita();
  else if(scr === 'perc-menu') renderPercMenu();
}

function scarica(blob, nome){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 2000);
}

/* =====================================================================
   TESTO INTEGRALE: parti generate dai dati (unica fonte)
   ===================================================================== */
function costruisciDocGriglia(){
  $('#docGriglia').innerHTML = ABILITA.map(a => `
    <h4>${esc(a.nome.toUpperCase())}</h4>
    <ol>${a.livelli.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`).join('');
  $('#docMalus').innerHTML = `
    <ul>
      <li>MALUS H (Altezza) ${esc(MALUS_H.condizione)}:<ul><li>${esc(MALUS_H.testo)}</li></ul></li>
      <li>MALUS A.A.I.I. (Arti inferiori) da applicare a chi ha ottenuto un punteggio compreso tra 21 e 25:<ul><li>Se il giocatore possiede una o più protesi o menomazione fisica agli arti inferiori riceve un Malus pari alla somma dei seguenti risultati:</li></ul></li>
    </ul>
    <div class="tbl-wrap"><table class="doc-tbl malus-t">${MALUS_AAII.map(m=>`<tr><th>${esc(m.nome)}</th><td>${esc(m.testo)}</td><td class="nw"><b>-${m.punti} ${m.punti===1?'punto':'punti'}</b></td></tr>`).join('')}</table></div>`;
  $('#docLegenda').innerHTML = LEGENDA.map(n => `<p class="leg"><sup>${esc(n.segno)}</sup> ${esc(n.testo)}</p>`).join('');
  $('#docEstesa').innerHTML = `<tr><th></th><th>RUOLO 3<br/><small>(livello 1 &amp; 2)</small></th><th>RUOLO 4<br/><small>(livello 3 &amp; 4)</small></th><th>RUOLO 5<br/><small>(livello 5)</small></th></tr>` +
    ABILITA.map(a => `<tr><th>${esc(a.nome.toUpperCase())}</th>${['r3','r4','r5'].map(k => `<td><ul>${a.estesa[k].map(x=>`<li>${esc(x)}</li>`).join('')}</ul></td>`).join('')}</tr>`).join('');
}

/* =====================================================================
   VARIE
   ===================================================================== */
let toastT;
function toast(msg){
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2600);
}

const REPO_ISSUES = 'https://github.com/baskinsoftware/classificazione-baskin-eisi-pwa/issues/new';
/* nell'app nativa i link esterni vanno al browser di sistema (Capacitor li intercetta) */
function apriEsterno(url){ if(NATIVO) location.href = url; else window.open(url, '_blank', 'noopener'); }
const REPO_RELEASES = 'https://github.com/baskinsoftware/classificazione-baskin-eisi-pwa/releases';

function segnalaProblema(){
  if(navigator.onLine === false){ toast('Sei offline: riprova quando sei connesso'); return; }
  const standalone = NATIVO ? 'app nativa ' + PIATTAFORMA : (window.matchMedia && matchMedia('(display-mode: standalone)').matches) ? 'app installata' : 'browser';
  const body = '**Cosa è successo / cosa si vorrebbe**\n\n\n\n**Passi per riprodurre**\n1. \n\n---\nVersione app: ' + APP_VERSION +
    '\nModalità: ' + standalone + '\nBrowser: ' + navigator.userAgent + '\n';
  const url = REPO_ISSUES + '?title=' + encodeURIComponent('[' + APP_VERSION + '] ') + '&body=' + encodeURIComponent(body);
  apriEsterno(url);
}

/* =====================================================================
   INSTALLA APP
   Chrome/Edge/Samsung: prompt nativo (beforeinstallprompt).
   iPhone/iPad: nessun prompt, istruzioni per «Aggiungi alla schermata Home».
   Già installata (standalone): pulsanti nascosti.
   ===================================================================== */
let promptInstall = null, appenaInstallata = false;
const installata = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = () => /android/i.test(navigator.userAgent);
/* il pulsante c'è su ogni dispositivo finché l'app non è installata */
function aggiornaInstalla(){
  const vedi = !installata() && !appenaInstallata && !NATIVO;
  if($('#homeInstalla')) $('#homeInstalla').hidden = !vedi;
  if($('#btnInfoInstalla')) $('#btnInfoInstalla').hidden = !vedi;
}
const ISTR_INSTALLA = {
  android: { nome:'Android', html:`<p><b>Chrome</b> (e Edge, Opera, Brave):</p><ol>
      <li>Tocca il menu <b>⋮</b> in alto a destra.</li>
      <li>Scegli <b>Installa app</b> o <b>Aggiungi a schermata Home</b> e conferma.</li></ol>
    <p><b>Samsung Internet</b>: menu <b>≡</b> in basso → <b>Aggiungi pagina a</b> → <b>Schermata Home</b>.</p>
    <p><b>Firefox</b>: menu <b>⋮</b> → <b>Installa</b> (o <b>Aggiungi a schermata Home</b>).</p>` },
  ios: { nome:'iPhone / iPad', html:`<ol>
      <li>Apri l’app con <b>Safari</b> (su iOS 16.4 e successivi anche con Chrome o Edge).</li>
      <li>Tocca <b>Condividi</b> (il quadrato con la freccia verso l’alto).</li>
      <li>Scegli <b>Aggiungi alla schermata Home</b> e conferma con <b>Aggiungi</b>.</li></ol>` },
  pc: { nome:'Computer', html:`<p><b>Chrome / Edge</b>: tocca l’icona <b>Installa</b> a destra nella barra degli indirizzi, oppure menu <b>⋮</b> → <b>Trasmetti, salva e condividi</b> → <b>Installa pagina come app</b> (Edge: <b>App</b> → <b>Installa questo sito come app</b>).</p>
    <p><b>Safari su Mac</b>: menu <b>File</b> → <b>Aggiungi al Dock</b>.</p>
    <p><b>Firefox</b> sul computer non installa le app web: si può usare normalmente nel browser.</p>` }
};
async function installaApp(){
  if(promptInstall){   // installazione diretta offerta dal browser
    promptInstall.prompt();
    try{ const c = await promptInstall.userChoice; if(c && c.outcome === 'accepted') appenaInstallata = true; }catch(_){}
    promptInstall = null; aggiornaInstalla(); return;
  }
  const ordine = isIOS() ? ['ios','android','pc'] : isAndroid() ? ['android','ios','pc'] : ['pc','android','ios'];
  const nota = '<p class="small muted">Dopo l’installazione l’app si apre dall’icona come le altre app e funziona anche senza connessione.</p>';
  apriSheet('Installa app', ordine.map(k => ({ nome: ISTR_INSTALLA[k].nome, html: ISTR_INSTALLA[k].html + nota })));
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstall = e; aggiornaInstalla(); });
window.addEventListener('appinstalled', () => { promptInstall = null; appenaInstallata = true; aggiornaInstalla(); toast('App installata'); });

async function verificaAggiornamenti(){
  if(NATIVO){   // l'app nativa si aggiorna installando la nuova versione
    toast(`Versione ${APP_VERSION}: le nuove versioni dell’app sono nelle release del progetto`);
    setTimeout(() => apriEsterno(REPO_RELEASES), 800);
    return;
  }
  try{
    const r = await fetch('service-worker.js', {cache:'no-store'});
    const txt = await r.text();
    const m = txt.match(/CACHE_NAME\s*=\s*'classificazione-baskin-eisi-v([^']+)'/);
    const remota = m ? m[1] : null;
    if(remota && remota !== APP_VERSION){
      const reg = await navigator.serviceWorker.getRegistration();
      if(reg){ await reg.update(); }
      toast(`Nuova versione ${remota} disponibile: chiudi e riapri l’app`);
    } else toast(`L’app è aggiornata (v${APP_VERSION})`);
  }catch(_){ toast('Verifica non possibile: sei offline'); }
}

/* =====================================================================
   EVENTI
   ===================================================================== */
function init(){
  costruisciDocGriglia();
  popolaSuggerimenti();
  $('#infoVersion').textContent = APP_VERSION;

  document.addEventListener('click', e => {
    const t = e.target;
    const goB = t.closest('[data-go]');
    if(goB){ go(goB.dataset.go); return; }
    const docB = t.closest('[data-doc]');
    if(docB){ e.preventDefault(); chiudiSheet(); apriDoc(docB.dataset.doc); return; }
    const helpB = t.closest('[data-help]');
    if(helpB){ e.preventDefault(); onHelp(helpB.dataset.help); return; }
    if(t.closest('#btnSiConferma')){ eseguiConfermaFinale(); return; }
    if(t.closest('[data-close]')){ chiudiSheet(); return; }
    if(typeof percClick === 'function' && percClick(t)) return;

    // pulsantiera giocatori
    const op = t.closest('[data-open]');
    if(op){ apriGiocatore(Number(op.dataset.open)); return; }
    const pr = t.closest('[data-print]');
    if(pr){
      const g = S.giocatori[Number(pr.dataset.print)];
      if(isGriglia()) stampa(g);
      else {
        const conf = g.percorsi.filter(x => x.stato === 'confermata');
        const ns = conf.filter(x => !x.stampata);
        if(ns.length) stampaSchede(ns.map(x => ({ tipo:'percorso', item:x })), ns.length === 1 ? nomeFilePercorso(ns[0]) : `Percorsi_Baskin_${etichetta(g).replace(/[^\p{L}\p{N}]+/gu,'_')}_${stamp()}`);
        else stampaPercorso(conf[conf.length - 1]);
      }
      return;
    }
    const tp = t.closest('button[data-tipo]');
    if(tp){ iniziaSessione(tp.dataset.tipo); return; }
    const sw = t.closest('#colorRow .swatch[data-color]');
    if(sw){ setColore(sw.dataset.color); return; }
    const rm = t.closest('[data-remove]');
    if(rm){
      const i = Number(rm.dataset.remove), g = S.giocatori[i];
      if(confirm(`Rimuovere ${etichetta(g)} dalla sessione?`)){ S.giocatori.splice(i, 1); salvaSess(); renderSessione(); }
      return;
    }
    if(t.closest('#btnAddGioc')){
      if(S.giocatori.length >= soglia() && !confermaOltreSoglia()) return;
      editIdx = -1; identOrigine = 'sessione'; go('giocatore'); return;
    }

    // menu abilità
    const ab = t.closest('.ab-row[data-ab]');
    if(ab){ apriAbilita(ab.dataset.ab); return; }
    if(t.closest('#abMalus')){ apriMalus(); return; }

    // scelta livello (schermata e aiuto)
    const lvl = t.closest('#lvList .lvl');
    if(lvl){ pendingLv = Number(lvl.dataset.lv); renderLivello(); return; }
    const pick = t.closest('[data-pick]');
    if(pick){ pendingLv = Number(pick.dataset.pick); renderLivello(); chiudiSheet(); return; }

    const arch = t.closest('[data-arch]');
    if(arch){ onArchivio(arch.dataset.arch, arch.closest('.arch').dataset.id); return; }
  });

  costruisciColori();
  $('#colCustom').addEventListener('input', e => setColore(e.target.value));
  $('#tileSessione').onclick = () => { if(S) go('sessione'); else go('nuova'); };
  $('#tileNuovaSess').onclick = () => conStampaRimanenti(() => {
    if(!confirm('Chiudere la sessione in corso e iniziarne una nuova? Le valutazioni non confermate verranno scartate.')) return;
    S = null; salvaSess(); go('nuova');
  }, 'Continua senza stampare');
  $('#btnChiudiSess').onclick = chiudiSessione;
  $('#btnStampaTutti').onclick = () => stampaMultipla(daStampare());
  $('#btnHomeStampa').onclick = () => stampaMultipla(daStampare());
  ['data','valutatore','gara'].forEach(k => $('#s_' + k).addEventListener('input', e => {
    S[k] = e.target.value; salvaSess();
    $('#sessSummary').textContent = [fmtData(S.data), S.gara, S.valutatore].filter(Boolean).join(' · ');
  }));

  $('#btnIdConferma').onclick = confermaIdent;
  $('#btnIdAnnulla').onclick = annullaIdent;
  $('#frmGiocatore').addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); confermaIdent(); } });

  $('#btnModDati').onclick = () => { editIdx = curIdx; identOrigine = 'menu'; go('giocatore'); };
  $('#btnConfermaFinale').onclick = chiediConfermaFinale;
  $('#btnStampa').onclick = () => stampa(cur());
  $('#btnHtml').onclick = () => esportaHtml(cur());
  $('#btnMail').onclick = () => { const g = cur(); apriInvioCTL([{ tipo:'griglia', item:g }]); };
  $('#btnInviaCTL').onclick = () => apriInvioCTL(confermatiSessione());
  $('#btnRiapri').onclick = riapri;
  $('#btnTornaGioc').onclick = () => history.back();

  $('#lvHelp').onclick = () => aiutoAbilita(curAb);
  $('#btnLvConferma').onclick = confermaLivello;
  $('#btnLvAnnulla').onclick = () => { pendingLv = null; curAb = null; history.back(); };
  $('#btnMaConferma').onclick = confermaMalus;
  $('#btnMaAnnulla').onclick = () => { pendingMalus = null; history.back(); };

  $('#btnBack').onclick = () => {
    const scr = document.body.dataset.screen;
    if(scr === 'livello'){ pendingLv = null; curAb = null; }
    if(scr === 'malus'){ pendingMalus = null; }
    if(scr === 'giocatore') return annullaIdent();
    history.back();
  };
  $('#btnTop').onclick = () => $('#scr-documento').scrollIntoView({behavior:'smooth'});
  $('#btnExport').onclick = esportaArchivio;
  $('#fileImport').onchange = e => { if(e.target.files[0]) importaArchivio(e.target.files[0]); e.target.value = ''; };
  $('#btnUpdate').onclick = verificaAggiornamenti;
  $('#btnSegnala').onclick = segnalaProblema;
  $$('[data-install]').forEach(b => b.onclick = installaApp);
  aggiornaInstalla();
  document.addEventListener('keydown', e => { if(e.key === 'Escape') chiudiSheet(); });

  // all'avvio si parte sempre dalla home (lo stato di navigazione non è persistente).
  // Sotto la home c'è la voce "#esci": premendo Indietro dalla home, se ci sono
  // valutazioni confermate non stampate si chiede di stamparle prima di uscire.
  history.replaceState(null, '', '#esci');
  history.pushState(null, '', '#home');
  show('home');
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if(h === 'esci'){ uscitaDallaHome(); return; }
    show(h); window.scrollTo(0,0);
  });
  window.addEventListener('beforeunload', e => {
    if(daStampare().length){ e.preventDefault(); e.returnValue = ''; }
  });

  if('serviceWorker' in navigator && location.protocol.startsWith('http')){
    if(!NATIVO) navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
}

document.addEventListener('DOMContentLoaded', init);
