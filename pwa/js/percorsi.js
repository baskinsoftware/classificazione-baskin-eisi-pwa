/* percorsi.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b19 - 2026-11-24 18-10-10 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - Percorsi A, B e C
   Nelle sessioni "Percorsi" ogni giocatore della pulsantiera ha i propri
   percorsi (l'ultimo è quello corrente):
     Pulsantiera → giocatore → Scelta del percorso → Menu prove
       → Prova (cronometro + criteri, Conferma) → Menu prove
       → Conferma finale (richiesta di conferma) → stampa scheda attiva
       → eventuale percorso successivo per lo stesso giocatore (A→B, A→C)
   Usa le funzioni comuni di app.js ($, esc, store, toast, S, salvaSess...)
   e il display a 7 segmenti di seg.js (dal Tabellone Baskin EISI).
   ===================================================================== */
'use strict';

const KEY_PERC_ARCH = 'classificazione-baskin-eisi-percorsi-archivio-v1';

let T = null;                            // percorso corrente del giocatore aperto
let provaIdx = -1;                       // prova aperta
let PP = null;                           // copia di lavoro della prova aperta

const salvaT = () => salvaSess();
const percArchivio = () => store.get(KEY_PERC_ARCH, []);
const salvaPercArchivio = a => store.set(KEY_PERC_ARCH, a);
const percTutti = () => percArchivio().concat(S && S.tipo === 'percorsi' ? S.giocatori.flatMap(g => g.percorsi || []) : []);

function nuovoPercorso(tipo, g, variante){
  const dati = { squadra:'', numero:'', nome:'', nascita:'', sesso:'', sezione:'', data:'', valutatore:'', note:'' };
  ['squadra','numero','nome','nascita','sesso','sezione'].forEach(k => dati[k] = g.dati[k] || '');
  dati.data = S.data; dati.valutatore = S.valutatore;
  return {
    id: uid('p'), tipo, variante: tipo === 'C' ? (variante || '34') : null, stato: 'bozza',
    creata: new Date().toISOString(), confermata: null, stampata: false, dati,
    prove: Array.from({length: NUM_PROVE}, () => ({ tempo: null, crit: {}, confermata: false }))
  };
}
/* allinea i dati del percorso a quelli del giocatore e della sessione (finché non è confermato) */
function sincronizzaT(){
  const g = cur(); if(!T || !g || T.stato === 'confermata') return;
  ['squadra','numero','nome','nascita','sesso','sezione'].forEach(k => T.dati[k] = g.dati[k] || '');
  T.dati.data = S.data; T.dati.valutatore = S.valutatore;
}

const fmtSec = ms => ms == null ? '–' : (ms / 1000).toFixed(2).replace('.', ',');
function fmtCrono(ms){
  ms = Math.max(0, Math.min(ms || 0, 599990));
  const cs = Math.floor(ms / 10), m = Math.floor(cs / 6000), s = Math.floor(cs / 100) % 60, c = cs % 100;
  return `${m}:${String(s).padStart(2,'0')}.${String(c).padStart(2,'0')}`;
}
const etichettaAtleta = d => [d.squadra, d.numero && 'n° ' + d.numero, d.nome].filter(Boolean).join(' · ') || '?';

/* =====================================================================
   PUNTEGGI E DECISIONI
   ===================================================================== */
function fascePer(t){ return t.tipo === 'A' ? FASCE_A : t.tipo === 'B' ? FASCE_B[t.dati.sesso || 'M'] : null; }

function puntiProva(t, pr){
  const P = PERCORSI[t.tipo];
  if(t.tipo === 'C') return { completa: pr.tempo != null, totale: null, dett: {} };
  const dett = {}; let tot = 0, completa = true;
  for(const c of P.criteri){
    let p = null;
    if(c.tipo === 'tempo') p = pr.tempo != null ? puntiTempo(fascePer(t), pr.tempo / 1000) : null;
    else if(c.tipo === 'scelta'){ const o = c.opzioni.find(o => o.id === pr.crit[c.id]); p = o ? o.p : null; }
    else if(c.tipo === 'difficolta'){ const v = pr.crit[c.id]; p = Array.isArray(v) ? c.punti[v.length] : null; }
    dett[c.id] = p;
    if(p == null) completa = false; else tot += p;
  }
  return { completa, totale: completa ? tot : null, parziale: tot, dett };
}

/* Esito secondo le tabelle "PERCORSO A/B - IN SINTESI" e il riquadro sul Percorso C */
function esito(t){
  const fatte = t.prove.filter(p => p.confermata);
  const n = fatte.length;
  const out = { n, completo: n === NUM_PROVE, ruolo: null, titolo: '', testo: '', seguito: null, classe: '' };
  if(t.tipo === 'A' || t.tipo === 'B'){
    const tot = fatte.map(p => puntiProva(t, p).totale);
    if(t.tipo === 'A'){
      const almeno16 = tot.filter(x => x >= 16).length;
      const sotto14  = tot.filter(x => x < 14).length;
      if(almeno16 >= 1){
        Object.assign(out, { ruolo:'4', classe:'r4', titolo:'Ruolo 4',
          testo:'In almeno 1 delle tre prove l’atleta ha totalizzato almeno 16 punti: è da considerarsi Ruolo 4.',
          seguito:{ tipo:'B', label:'Verifica il Ruolo 5 con il Percorso B' } });
        if(!out.completo) out.testo += ' (Esito già determinato: le prove previste sono comunque tre.)';
      } else if(sotto14 >= 2){
        Object.assign(out, { ruolo:'3', classe:'r3', titolo:'Ruolo 3',
          testo:'In 2 delle tre prove l’atleta ha acquisito un punteggio inferiore a 14 punti: è da considerarsi Ruolo 3.' });
      } else if(out.completo && tot.every(x => x === 14 || x === 15)){
        Object.assign(out, { ruolo:'C', classe:'rc', titolo:'Percorso C',
          testo:'In tutte e 3 le prove l’atleta ha totalizzato 14/15 punti: deve essere sottoposto al Percorso C (navetta andata e ritorno di 60 metri in palleggio) per meglio individuare il ruolo.',
          seguito:{ tipo:'C', variante:'34', label:'Esegui il Percorso C (verifica 3/4)' } });
      } else if(out.completo){
        Object.assign(out, { ruolo:'?', classe:'rq', titolo:'Caso non previsto',
          testo:`Punteggi ${tot.join(', ')}: la combinazione non rientra nei casi previsti dalla tabella “In sintesi” del Percorso A. Valutare come caso dubbio (eventualmente con il Percorso C) e, se necessario, consultare la Commissione Tecnica.`,
          seguito:{ tipo:'C', variante:'34', label:'Esegui il Percorso C (verifica 3/4)' } });
      }
    } else {
      const alti  = tot.filter(x => x >= 14).length;
      const bassi = tot.filter(x => x <= 13).length;
      if(out.completo && alti === 3){
        Object.assign(out, { ruolo:'5', classe:'r5', titolo:'Ruolo 5',
          testo:'L’atleta ha totalizzato 14/15 punti in tutte e tre le prove: è da considerarsi Ruolo 5.' });
      } else if(bassi === 3){
        Object.assign(out, { ruolo:'4', classe:'r4', titolo:'Ruolo 4',
          testo:'L’atleta è rimasto sotto i 14 punti in tutte e tre le prove: è da considerarsi Ruolo 4.' });
      } else if(out.completo && bassi === 2 && alti === 1){
        Object.assign(out, { ruolo:'4M', classe:'r4', titolo:'Ruolo 4 da monitorare',
          testo:'In due prove su tre l’atleta rimane al di sotto dei 14 punti mentre la terza è di 14/15 punti: è Ruolo 4 da monitorare (per esempio durante le partite) e, arrivato a 14/15 punti, dovrà passare al ruolo superiore. In questo caso il tempo (la velocità) è una discriminante importante.' });
      } else if(!out.completo && bassi >= 2){
        Object.assign(out, { ruolo:'4', classe:'r4', titolo:'Ruolo 4 (provvisorio)',
          testo:'In due prove l’atleta è rimasto sotto i 14 punti: non potrà essere Ruolo 5. Completa la terza prova per sapere se è da monitorare.' });
      } else if(out.completo){
        Object.assign(out, { ruolo:'?', classe:'rq', titolo:'Caso non previsto',
          testo:`Punteggi ${tot.join(', ')}: la combinazione (due prove da 14/15 punti e una sotto i 14) non rientra nei casi previsti dalla tabella “In sintesi” del Percorso B. Valutare come caso dubbio e, se necessario, consultare la Commissione Tecnica.` });
      }
    }
    out.punteggi = tot;
  } else {
    const V = PERCORSI.C.varianti[t.variante || '34'];
    const tempi = fatte.map(p => p.tempo / 1000);
    const sotto = tempi.filter(x => x < V.soglia).length;
    const sopra = tempi.length - sotto;
    if(sotto >= 2){
      Object.assign(out, { ruolo:V.sotto, classe:'r' + V.sotto.toLowerCase(), titolo:'Ruolo ' + V.sotto,
        testo:`In ${sotto} prove su ${tempi.length} il tempo è inferiore a ${V.soglia} secondi: l’atleta è da considerarsi Ruolo ${V.sotto}.` });
    } else if(sopra >= 2){
      Object.assign(out, { ruolo:V.sopra, classe:'r' + V.sopra.toLowerCase(), titolo:'Ruolo ' + V.sopra,
        testo:`In ${sopra} prove su ${tempi.length} il tempo non è inferiore a ${V.soglia} secondi: l’atleta è da considerarsi Ruolo ${V.sopra}.` });
    }
    out.tempi = tempi;
    if(out.ruolo && !out.completo) out.testo += ' (Esito già determinato da due prove su tre.)';
  }
  return out;
}

/* =====================================================================
   APERTURA DEL GIOCATORE E SCELTA DEL PERCORSO
   ===================================================================== */
function apriGiocatorePercorsi(i){
  const g = S.giocatori[i];
  T = (g.percorsi || []).slice(-1)[0] || null;
  if(T) go('perc-menu'); else go('percorsi');
}

function percGuard(name){
  if(!S || S.tipo !== 'percorsi' || !cur()) return S ? 'sessione' : 'home';
  if((name === 'perc-menu' || name === 'perc-prova') && !T) return 'percorsi';
  if(name === 'perc-prova' && (provaIdx < 0 || !PP)) return 'perc-menu';
  return name;
}

function renderSelettorePercorsi(){
  const g = cur();
  $('#psNum').innerHTML = htmlSigla(g.dati);
  $('#psNum').style.cssText = stileMaglia(COLORI_SESSO[g.dati.sesso]);
  $('#psSquadra').textContent = g.dati.squadra || g.dati.nome;
  $('#psNome').textContent = [g.dati.squadra ? g.dati.nome : '', g.dati.sesso].filter(Boolean).join(' · ');
  $('#percList').innerHTML = ['A','B','C'].map(k => {
    const P = PERCORSI[k];
    return `<div class="perc-card">
      <button class="perc-main" type="button" data-perc-new="${k}">
        <span class="perc-badge big">${k}</span>
        <span class="perc-txt"><b>${esc(P.nome)}</b><small class="perc-scopo">${esc(P.scopo)}</small><small>${esc(P.descr)}</small></span>
      </button>
      <div class="perc-act">
        <button class="btn sm" type="button" data-perc-schema="${k}">Schema</button>
        <button class="btn sm" type="button" data-doc="${P.docTab}">Tabella</button>
        <button class="btn sm btn-pri" type="button" data-perc-new="${k}">Inizia &#8250;</button>
      </div>
    </div>`;
  }).join('');
}

function mostraSchema(k){
  const P = PERCORSI[k];
  apriSheet(`${P.nome} · schema`, [{ nome:'Schema', html:
    `<img class="sheet-img" src="${P.img}" alt="Schema ${esc(P.nome)}" />
     <p class="small muted">${esc(P.descr)}</p>
     <div class="sheet-links"><button class="btn" type="button" data-doc="sez-vi">Allegati nel testo integrale</button>
     <button class="btn" type="button" data-doc="${P.docTab}">Tabella di valutazione</button></div>` }]);
}

/* Avvia un percorso per il giocatore aperto. Chiede quanto serve:
   lo scopo per il C (verifica 3/4 o 2/2R) e il sesso per il B. */
function avviaPercorso(tipo, variante, dopo){
  const g = cur();
  if(tipo === 'C' && !variante){
    const V = PERCORSI.C.varianti;
    apriSheet('Percorso C · scopo della prova', [{ nome:'Scopo', html: `
      <p>Per quale verifica si esegue il Percorso C?</p>
      <div class="sheet-links col">
        <button class="btn btn-pri" type="button" data-var="34"><b>${esc(V['34'].nome)}</b>&nbsp;· soglia 20 secondi</button>
        <button class="btn" type="button" data-var="2R"><b>${esc(V['2R'].nome)}</b>&nbsp;· soglia 40 secondi</button>
      </div>
      <p class="small muted">${esc(V['34'].testo)}</p>` }]);
    $$('#sheetBody [data-var]').forEach(b => b.onclick = () => { chiudiSheet(); avviaPercorso('C', b.dataset.var, dopo); });
    return;
  }
  if(tipo === 'B' && !g.dati.sesso){
    apriSheet('Percorso B · sesso', [{ nome:'Sesso', html: `
      <p>Le fasce di tempo del Percorso B sono diverse per maschi e femmine. Indica il sesso di <b>${esc(etichetta(g))}</b>:</p>
      <div class="sheet-links two">
        <button class="btn btn-pri" type="button" data-sesso="M">Maschio</button>
        <button class="btn btn-pri" type="button" data-sesso="F">Femmina</button>
      </div>` }]);
    $$('#sheetBody [data-sesso]').forEach(b => b.onclick = () => { g.dati.sesso = b.dataset.sesso; salvaSess(); chiudiSheet(); avviaPercorso('B', variante, dopo); });
    return;
  }
  T = nuovoPercorso(tipo, g, variante);
  g.percorsi = g.percorsi || [];
  g.percorsi.push(T); salvaSess();
  dopo();
}

/* =====================================================================
   MENU PROVE
   ===================================================================== */
function renderPercMenu(){
  sincronizzaT();
  const P = PERCORSI[T.tipo], conf = T.stato === 'confermata', g = cur();
  $('#appbarTitle').textContent = `${P.nome} · ${chi(g.dati)}`;
  $('#pmTipo').textContent = T.tipo;
  $('#pmTitolo').textContent = T.tipo === 'C' ? `${P.nome} · ${PERCORSI.C.varianti[T.variante || '34'].nome}` : `${P.nome} · ${P.scopo}`;
  $('#pmAtleta').textContent = etichettaAtleta(T.dati) + (T.tipo === 'B' && T.dati.sesso ? ` · ${T.dati.sesso}` : '');
  $('#pmLocked').hidden = !conf;

  // percorsi precedenti dello stesso giocatore in questa sessione
  const prec = g.percorsi.slice(0, -1);
  const st = $('#pmStoria');
  st.hidden = !prec.length;
  st.innerHTML = prec.length ? `<b>Percorsi precedenti</b>` + prec.map((p, i) => {
    const e = esito(p);
    return `<div class="ps-row"><span class="perc-badge sm">${p.tipo}</span><span>${esc(e.titolo || '–')}${p.stampata ? ' · <span class="pl-printed">&#10004; stampato</span>' : ''}</span>
      <button class="btn sm ${p.stampata ? '' : 'btn-pri'}" type="button" data-prec="${i}">&#128424; ${p.stampata ? 'Ristampa' : 'Stampa'}</button></div>`;
  }).join('') : '';

  const e = esito(T);
  $('#pmProve').innerHTML = T.prove.map((pr, i) => {
    const pt = puntiProva(T, pr);
    const info = pr.confermata
      ? `${fmtSec(pr.tempo)} secondi${T.tipo !== 'C' ? ` · ${pt.totale}/${P.max} punti` : ''}`
      : (pr.tempo != null ? 'in corso' : 'da eseguire');
    const big = pr.confermata ? (T.tipo === 'C' ? fmtSec(pr.tempo) : pt.totale) : '–';
    return `<button class="ab-row ${pr.confermata ? 'set' : ''}" type="button" data-prova="${i}" ${conf ? 'disabled' : ''}>
      <span class="abil-n">${i+1}</span>
      <span class="ab-txt"><b>Prova ${i+1}</b><small>${esc(info)}</small></span>
      <span class="ab-lv ${pr.confermata ? 'on' : ''}">${esc(big)}</span><span class="chev">&#8250;</span></button>`;
  }).join('');

  let html;
  if(!e.n) html = `<p class="muted">Esegui le tre prove: l’esito si calcola dalle prove confermate.</p>`;
  else if(!e.ruolo) html = `<p class="muted">Prove confermate: ${e.n}/3. Esito non ancora determinabile.</p>`;
  else html = `<div class="esito ${e.classe}"><small>${e.completo ? 'Esito' : 'Esito provvisorio'}</small><b>${esc(e.titolo)}</b></div><p>${esc(e.testo)}</p>`;
  if(T.tipo === 'C') html += `<p class="muted small">${esc(PERCORSI.C.varianti[T.variante || '34'].testo)}</p>`;
  if(T.tipo === 'B') html += `<p class="muted small">Fasce di tempo per ${T.dati.sesso === 'F' ? 'femmine' : 'maschi'}.</p>`;
  $('#pmEsito').innerHTML = html;

  const fatte = e.n === NUM_PROVE;
  $('#btnPmConferma').hidden = conf;
  $('#btnPmConferma').disabled = !fatte;
  $('#btnPmStampa').hidden = !conf;
  $('#btnPmStampa').innerHTML = T.stampata ? '&#128424; Ristampa scheda / PDF' : '&#128424; Stampa scheda / PDF';
  $('#btnPmHtml').hidden = !conf;
  $('#btnPmMail').hidden = !conf;
  $('#btnPmRiapri').hidden = !conf;
  $('#btnPmCambia').hidden = conf;
  $('#btnPmDati').hidden = conf;
  const seg = $('#btnPmSeguito');
  seg.hidden = !(conf && e.seguito);
  if(e.seguito) seg.innerHTML = '&#9654; ' + esc(e.seguito.label);
}

function confermaFinalePercorso(){
  const e = esito(T), P = PERCORSI[T.tipo];
  const righe = T.prove.map((pr, i) => {
    const pt = puntiProva(T, pr);
    return `<tr><td>Prova ${i+1}</td><td class="c">${fmtSec(pr.tempo)} secondi</td>${T.tipo !== 'C' ? `<td class="c"><b>${pt.totale}</b></td>` : ''}</tr>`;
  }).join('');
  const html = `
    <p><b>${esc(P.nome)}</b> — ${esc(etichettaAtleta(T.dati))}</p>
    <table class="mini conf-t"><tr><th></th><th>Tempo</th>${T.tipo !== 'C' ? `<th>Punti</th>` : ''}</tr>${righe}
      <tr class="hl"><td colspan="${T.tipo !== 'C' ? 2 : 1}"><b>Esito</b></td><td class="c"><b>${esc(e.titolo || '–')}</b></td></tr></table>
    <label class="fld"><span>Note (facoltative)</span><textarea id="pmNote" rows="2">${esc(T.dati.note || '')}</textarea></label>
    <p>Confermi il percorso? Dopo la conferma sarà attiva la stampa della scheda e il percorso verrà salvato nell’archivio.</p>
    <div class="sheet-links two">
      <button class="btn" type="button" data-close="1">Annulla</button>
      <button class="btn btn-pri" type="button" id="btnPercSiConferma">&#10004; Conferma percorso</button>
    </div>`;
  apriSheet('Conferma finale', [{ nome:'Conferma', html }]);
}
function eseguiConfermaPercorso(){
  sincronizzaT();
  T.dati.note = ($('#pmNote') || {}).value || '';
  T.stato = 'confermata'; T.confermata = new Date().toISOString(); T.stampata = false;
  const a = percArchivio(); const i = a.findIndex(x => x.id === T.id);
  if(i >= 0) a[i] = clone(T); else a.unshift(clone(T));
  salvaPercArchivio(a); salvaSess(); chiudiSheet();
  toast('Percorso confermato: stampa scheda attiva');
  renderPercMenu();
}

/* =====================================================================
   PROVA: cronometro + criteri
   ===================================================================== */
const SW = { running:false, t0:0, raf:0, lock:null };

function apriProva(i){
  provaIdx = i;
  const pr = T.prove[i];
  PP = { tempo: pr.tempo, crit: clone(pr.crit) };
  go('perc-prova');
}

function renderPercProva(){
  const P = PERCORSI[T.tipo];
  $('#appbarTitle').textContent = `${P.nome} · Prova ${provaIdx+1} di 3`;
  const crit = P.criteri.filter(c => c.tipo !== 'tempo');
  $('#ppCriteri').innerHTML = crit.map((c, k) => {
    let corpo;
    if(c.tipo === 'scelta'){
      corpo = c.opzioni.map(o => `
        <button class="opt ${PP.crit[c.id] === o.id ? 'sel' : ''}" type="button" data-crit="${c.id}" data-opt="${o.id}">
          <span class="opt-t">${esc(o.t)}</span><span class="opt-p">${o.p}</span></button>`).join('');
    } else {
      const sel = Array.isArray(PP.crit[c.id]) ? PP.crit[c.id] : null;
      corpo = `<button class="opt ${sel && !sel.length ? 'sel' : ''}" type="button" data-crit="${c.id}" data-diff="none">
          <span class="opt-t">${esc(c.ok)}</span><span class="opt-p">${c.punti[0]}</span></button>` +
        c.difficolta.map(d => `
          <label class="chk opt-chk"><input type="checkbox" data-crit="${c.id}" data-diff="${d.id}" ${sel && sel.includes(d.id) ? 'checked' : ''} />
          <span>${esc(d.t)}</span></label>`).join('') +
        `<p class="muted small">${sel ? `${sel.length} difficoltà → <b>${c.punti[sel.length]} punti</b>` : 'Nessuna scelta'}</p>`;
    }
    return `<fieldset class="card"><legend><span class="abil-n">${k+2}</span> ${esc(c.nome)}</legend>
      ${c.nota && c.tipo === 'scelta' ? `<p class="muted small">${esc(c.nota)}</p>` : ''}<div class="opts">${corpo}</div></fieldset>`;
  }).join('');
  if(T.tipo === 'C'){
    const V = PERCORSI.C.varianti[T.variante || '34'];
    $('#ppCriteri').innerHTML = `<div class="card small">${esc(PERCORSI.C.descr)}<br/><b>Soglia: ${V.soglia} secondi</b> — ${esc(V.nome)}</div>`;
  }
  aggiornaCrono(); aggiornaTotProva();
}

function tempoCorrente(){ return SW.running ? (PP.tempo || 0) + (performance.now() - SW.t0) : PP.tempo; }

function aggiornaCrono(){
  const ms = tempoCorrente();
  renderSeg($('#swDisplay'), fmtCrono(ms || 0));
  $('#swDisplay').classList.toggle('run', SW.running);
  const go = $('#swGo');
  go.innerHTML = SW.running ? '&#9632; Ferma' : (PP.tempo ? '&#9654; Riprendi' : '&#9654; Avvia');
  go.classList.toggle('stop', SW.running);
  $('#swReset').disabled = SW.running || !PP.tempo;
  const man = $('#swManual');
  man.disabled = SW.running;
  if(!SW.running && document.activeElement !== man) man.value = PP.tempo != null ? (PP.tempo / 1000).toFixed(2) : '';
  let pts = '';
  if(ms != null && !SW.running){
    if(T.tipo === 'C'){
      const V = PERCORSI.C.varianti[T.variante || '34'];
      pts = ms / 1000 < V.soglia ? `sotto ${V.soglia} secondi → Ruolo ${V.sotto}` : `non sotto ${V.soglia} secondi → Ruolo ${V.sopra}`;
    } else pts = `${puntiTempo(fascePer(T), ms / 1000)} punti tempo`;
  }
  $('#swPts').textContent = pts;
}

function tick(){ aggiornaCrono(); if(SW.running) SW.raf = requestAnimationFrame(tick); }

async function swToggle(){
  if(SW.running){
    PP.tempo = Math.round(((PP.tempo || 0) + performance.now() - SW.t0) / 10) * 10;   // centesimi
    SW.running = false; cancelAnimationFrame(SW.raf);
    try{ if(SW.lock){ await SW.lock.release(); SW.lock = null; } }catch(_){}
    vibra(60); aggiornaCrono(); aggiornaTotProva();
  } else {
    SW.t0 = performance.now(); SW.running = true; vibra(30);
    try{ if('wakeLock' in navigator) SW.lock = await navigator.wakeLock.request('screen'); }catch(_){}
    tick();
  }
}
function swStopSilenzioso(){
  if(!SW.running) return;
  SW.running = false; cancelAnimationFrame(SW.raf);
  try{ if(SW.lock){ SW.lock.release(); SW.lock = null; } }catch(_){}
}
function vibra(ms){ try{ navigator.vibrate && navigator.vibrate(ms); }catch(_){} }

function aggiornaTotProva(){
  const pr = { tempo: PP.tempo, crit: PP.crit };
  const pt = puntiProva(T, pr);
  let html;
  if(T.tipo === 'C') html = `<b>Tempo:</b> ${PP.tempo != null ? fmtSec(PP.tempo) + ' s' : 'da rilevare'}`;
  else html = `<span>Punteggio della prova</span><b>${pt.completa ? pt.totale : pt.parziale}<small>/${PERCORSI[T.tipo].max}</small></b>${pt.completa ? '' : '<small class="muted">parziale</small>'}`;
  $('#ppTot').innerHTML = html;
  $('#btnPpConferma').disabled = SW.running || !pt.completa;
}

function confermaProva(){
  if(SW.running) return;
  const pr = T.prove[provaIdx];
  pr.tempo = PP.tempo; pr.crit = clone(PP.crit); pr.confermata = true;
  salvaT(); PP = null; provaIdx = -1;
  history.back();
}
function annullaProva(){
  if(SW.running && !confirm('Il cronometro è in funzione. Annullare la prova?')) return;
  swStopSilenzioso(); PP = null; provaIdx = -1; history.back();
}

/* =====================================================================
   SCHEDA STAMPABILE
   ===================================================================== */
function htmlSchedaPercorso(t, logoB, logoE){
  const P = PERCORSI[t.tipo], d = t.dati, e = esito(t);
  let corpo;
  if(t.tipo === 'C'){
    const V = P.varianti[t.variante || '34'];
    corpo = `<p><b>${esc(V.nome)}</b> — soglia ${V.soglia} secondi. ${esc(V.testo)}</p>
      <table class="ps-ab"><tr><th class="l">Prova</th><th>Tempo impiegato</th><th>Rispetto alla soglia</th></tr>
      ${t.prove.map((pr,i) => `<tr><th class="l">${i+1}^ prova</th><td class="c b">${fmtSec(pr.tempo)} secondi</td><td class="c">${pr.tempo != null ? (pr.tempo/1000 < V.soglia ? `inferiore a ${V.soglia} secondi` : `non inferiore a ${V.soglia} secondi`) : ''}</td></tr>`).join('')}</table>`;
  } else {
    const righe = P.criteri.map((c, k) => {
      const celle = t.prove.map(pr => {
        const pt = puntiProva(t, pr).dett[c.id];
        let lab = '';
        if(c.tipo === 'tempo') lab = `${fmtSec(pr.tempo)} secondi`;
        else if(c.tipo === 'scelta'){ const o = c.opzioni.find(o => o.id === pr.crit[c.id]); lab = o ? o.breve : ''; }
        else { const v = pr.crit[c.id]; lab = Array.isArray(v) ? (v.length ? v.join('+') : 'Regolare') : ''; }
        return `<td class="c"><small>${esc(lab)}</small><br/><b>${pt ?? ''}</b></td>`;
      }).join('');
      return `<tr><th class="l">CRITERIO ${k+1}<small>${esc(c.nome)}</small></th>${celle}</tr>`;
    }).join('');
    const totali = t.prove.map(pr => `<td class="c b big">${puntiProva(t, pr).totale ?? ''}</td>`).join('');
    corpo = `<table class="ps-ab"><tr><th class="l">Criterio</th><th>1^ prova</th><th>2^ prova</th><th>3^ prova</th></tr>${righe}
      <tr class="tot"><th class="l">TOTALE (max ${P.max})</th>${totali}</tr></table>
      ${t.tipo === 'B' ? `<p class="small">Fasce di tempo applicate: ${d.sesso === 'F' ? 'femmine' : 'maschi'}.</p>` : ''}`;
  }
  return `
  <div class="ps">
    <header class="ps-head">
      <img class="ps-lb" src="${logoB}" alt="Baskin" />
      <div class="ps-ht">Sistema di classificazione per il Baskin<br/><span>Allegato A al regolamento di gioco (rev. 1 settembre 2025)</span></div>
      <span class="ps-le"><img src="${logoE}" alt="EISI" /></span>
    </header>
    <h1>${esc(P.titoloScheda)}</h1>
    <table class="ps-dati">
      <tr><th>Squadra di appartenenza</th><td>${esc(d.squadra)}</td><th>N° maglia</th><td class="c b">${esc(d.numero)}</td></tr>
      <tr><th>Cognome e nome</th><td colspan="3">${esc(d.nome)}</td></tr>
      <tr><th>Data di nascita</th><td>${esc(fmtData(d.nascita))}</td><th>Sesso</th><td class="c">${esc(d.sesso)}</td></tr>
      <tr><th>Sezione Territoriale</th><td colspan="3">${esc(d.sezione)}</td></tr>
      <tr><th>Data</th><td>${esc(fmtData(d.data))}</td><th>Valutatore</th><td>${esc(d.valutatore)}</td></tr>
    </table>
    ${corpo}
    <div class="ps-fin">
      <div class="ps-note" style="flex:1;margin:0"><b>Esito:</b> ${esc(e.testo || '–')}</div>
      <div class="ps-esito"><small>Esito</small><b class="${(e.titolo||'').length > 8 ? 'sm' : ''}">${esc(e.titolo || '–')}</b></div>
    </div>
    ${d.note ? `<div class="ps-note"><b>Note:</b> ${esc(d.note).replace(/\n/g,'<br/>')}</div>` : ''}
    <div class="ps-firma"><span>Data ____________________</span><span>Firma del valutatore ______________________________</span></div>
    <footer class="ps-foot">${esc(FONTE)} — compilata con ${esc(APP_NAME)} v${APP_VERSION}${t.confermata ? ', confermata il ' + esc(new Date(t.confermata).toLocaleString('it-IT')) : ''}<br/>
      Il regolamento, i documenti di gara e gli altri documenti si trovano sul sito EISI nel menu Documenti <a href="https://eisi.it/eisi/documenti/">https://eisi.it/eisi/documenti/</a> oppure in Area Download.</footer>
  </div>`;
}
const CSS_PERC_EXTRA = `.ps-esito b.sm{font-size:15pt;text-align:center;padding:0 2mm}.ps-ab th small{display:block;font-weight:normal}`;

function nomeFilePercorso(t){
  const pulisci = s => String(s || '').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g,'');
  const parti = [pulisci(t.dati.squadra), 'n' + pulisci(t.dati.numero), pulisci(t.dati.nome)].filter(x => x && x !== 'n');
  return `Percorso_${t.tipo}_Baskin_${parti.join('_')}_${stamp()}`;
}
function stampaPercorso(t){
  if(!t || t.stato !== 'confermata'){ toast('La stampa è attiva solo dopo la conferma finale'); return; }
  stampaSchede([{ tipo:'percorso', item:t }], nomeFilePercorso(t));
}
function esportaHtmlPercorso(t){
  if(t.stato !== 'confermata'){ toast('L’export è attivo solo dopo la conferma finale'); return; }
  const nome = nomeFilePercorso(t);
  const doc = `<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(nome)}</title>
<style>body{margin:0;padding:6mm;background:#fff}${CSS_SCHEDA}${CSS_PERC_EXTRA}
.bar{max-width:190mm;margin:0 auto 4mm;text-align:right}.bar button{font:inherit;padding:2mm 4mm;border:0;border-radius:2mm;background:#2f3740;color:#fff}
@media print{.bar{display:none}body{padding:0}}</style></head>
<body><div class="bar"><button onclick="window.print()">Stampa / Salva come PDF</button></div>
${htmlSchedaPercorso(t, LOGO_BASKIN, LOGO_EISI)}
</body></html>`;
  scarica(new Blob([doc], {type:'text/html'}), nome + '.html');
  t.stampata = true; salvaSess();
}

/* =====================================================================
   ARCHIVIO PERCORSI
   ===================================================================== */
function renderArchivioPercorsi(){
  const a = percArchivio(), box = $('#archPerc');
  if(!box) return;
  if(!a.length){ box.innerHTML = '<div class="card"><p class="muted">Nessun percorso confermato.</p></div>'; return; }
  box.innerHTML = a.map(t => {
    const e = esito(t), P = PERCORSI[t.tipo];
    return `<div class="card arch" data-pid="${t.id}">
      <div class="arch-main">
        <div><b>${esc([P.nome, t.dati.squadra, t.dati.numero && 'n° ' + t.dati.numero].filter(Boolean).join(' · '))}</b><small>${esc(t.dati.nome || '')}</small>
          <small>${esc(fmtData(t.dati.data))}${t.dati.valutatore ? ' · ' + esc(t.dati.valutatore) : ''}</small></div>
        <div class="arch-score perc ${e.classe}"><b>${esc(e.titolo.replace('Ruolo ','R').replace(' da monitorare','*').replace('Percorso C','→C').replace('Caso non previsto','?'))}</b><small>esito</small></div>
      </div>
      <div class="arch-act">
        <button class="btn sm" type="button" data-parch="stampa">Stampa</button>
        <button class="btn sm" type="button" data-parch="html">HTML</button>
        <button class="btn sm" type="button" data-parch="invia">Invia alla CTL</button>
        <button class="btn sm danger" type="button" data-parch="elimina">Elimina</button>
      </div></div>`;
  }).join('');
}
function percImporta(lista){
  const a = percArchivio(); let n = 0;
  lista.forEach(t => { if(t && t.id && t.tipo && t.prove && !a.some(x => x.id === t.id)){ a.push(t); n++; } });
  salvaPercArchivio(a); return n;
}

/* =====================================================================
   EVENTI (chiamato dal gestore click di app.js)
   ===================================================================== */
function percClick(t){
  let b;
  if((b = t.closest('[data-perc-new]'))){
    avviaPercorso(b.dataset.percNew, null, () => goReplace('perc-menu'));
    return true;
  }
  if((b = t.closest('[data-perc-schema]'))){ mostraSchema(b.dataset.percSchema); return true; }
  if((b = t.closest('[data-prova]'))){ apriProva(Number(b.dataset.prova)); return true; }
  if((b = t.closest('[data-prec]'))){ stampaPercorso(cur().percorsi[Number(b.dataset.prec)]); return true; }
  if((b = t.closest('.opt[data-opt]'))){ PP.crit[b.dataset.crit] = b.dataset.opt; renderPercProva(); return true; }
  if((b = t.closest('.opt[data-diff="none"]'))){ PP.crit[b.dataset.crit] = []; renderPercProva(); return true; }
  if(t.closest('#btnPercSiConferma')){ eseguiConfermaPercorso(); return true; }
  if((b = t.closest('[data-parch]'))){
    const id = b.closest('.arch').dataset.pid, a = percArchivio(), x = a.find(y => y.id === id);
    if(!x) return true;
    if(b.dataset.parch === 'stampa') stampaPercorso(x);
    if(b.dataset.parch === 'html') esportaHtmlPercorso(x);
    if(b.dataset.parch === 'invia') apriInvioCTL([{ tipo:'percorso', item:x }]);
    if(b.dataset.parch === 'elimina' && confirm(`Eliminare il ${PERCORSI[x.tipo].nome} di ${etichettaAtleta(x.dati)}?`)){
      salvaPercArchivio(a.filter(y => y.id !== id)); renderArchivioPercorsi();
    }
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  $('#pmHelp').onclick = () => mostraSchema(T.tipo);
  $('#btnPmConferma').onclick = confermaFinalePercorso;
  $('#btnPmStampa').onclick = () => stampaPercorso(T);
  $('#btnPmHtml').onclick = () => esportaHtmlPercorso(T);
  $('#btnPmMail').onclick = () => apriInvioCTL([{ tipo:'percorso', item:T }]);
  $('#btnPmRiapri').onclick = () => {
    if(!confirm('Riaprire il percorso? La stampa resterà disattivata fino a una nuova conferma finale.')) return;
    T.stato = 'bozza'; T.confermata = null; T.stampata = false; salvaSess(); renderPercMenu();
  };
  $('#btnPmCambia').onclick = () => {
    const g = cur();
    if(T.prove.some(p => p.confermata) && !confirm(`Le prove già confermate del ${PERCORSI[T.tipo].nome} verranno scartate. Cambiare percorso?`)) return;
    g.percorsi.pop(); T = null; salvaSess();
    goReplace('percorsi');
  };
  $('#btnPmDati').onclick = () => { editIdx = curIdx; identOrigine = 'menu'; go('giocatore'); };
  $('#btnPmChiudi').onclick = () => history.back();
  $('#btnPmSeguito').onclick = () => {
    const e = esito(T); if(!e.seguito) return;
    avviaPercorso(e.seguito.tipo, e.seguito.variante, () => { renderPercMenu(); window.scrollTo(0,0); toast(`${PERCORSI[T.tipo].nome} avviato per lo stesso giocatore`); });
  };

  $('#swGo').onclick = swToggle;
  $('#swDisplay').onclick = swToggle;          // tocco sul display = avvia/ferma
  $('#swReset').onclick = () => { if(SW.running) return; PP.tempo = null; aggiornaCrono(); aggiornaTotProva(); };
  $('#swManual').addEventListener('input', e => {
    const v = parseFloat(String(e.target.value).replace(',', '.'));
    PP.tempo = isFinite(v) && v > 0 ? Math.round(v * 100) * 10 : null;
    aggiornaCrono(); aggiornaTotProva();
  });
  $('#swManual').addEventListener('blur', () => aggiornaCrono());
  $('#ppCriteri').addEventListener('change', e => {
    const c = e.target.closest('input[data-diff]'); if(!c) return;
    const curr = Array.isArray(PP.crit[c.dataset.crit]) ? PP.crit[c.dataset.crit] : [];
    const set = new Set(curr); c.checked ? set.add(c.dataset.diff) : set.delete(c.dataset.diff);
    PP.crit[c.dataset.crit] = ['A','B','C','D'].filter(x => set.has(x));
    renderPercProva();
  });
  $('#btnPpConferma').onclick = confermaProva;
  $('#btnPpAnnulla').onclick = annullaProva;

  // se si lascia la schermata della prova (tasto indietro) il cronometro si ferma
  window.addEventListener('hashchange', () => { if(location.hash !== '#perc-prova') swStopSilenzioso(); });
});
