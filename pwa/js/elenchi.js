/* elenchi.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - elenchi di SQUADRE, CTL e SEZIONI
   - Squadre: nome + due colori di maglia (facoltativi).
   - CTL: nome, e-mail (facoltativa: senza e-mail non si può inviare) e
     Sezione Territoriale; al primo uso parte da CTL_DESTINATARI (ctl.js),
     una CTL per Sezione.
   - Sezioni Territoriali: tendina nel modulo del giocatore (con «Altra…»);
     al primo uso parte da SEZIONI_TERRITORIALI (ctl.js).
   - Se un elenco ha una sola voce, viene proposta in automatico (modificabile).
   - Una CTL e una Sezione possono essere «predefinite» (stellina nell'elenco,
     casella nella scheda, colonna «predefinita» in Excel): la Sezione è
     proposta nel modulo del giocatore, la CTL all'invio.
   - Import/export XLSX (primo foglio, intestazione facoltativa; in import
     si accettano anche i CSV):
     Squadre: nome | colore1 | colore2   (colori #rrggbb, #rgb o nome: rosso, blu…)
     CTL:     nome | email | sezione | predefinita
     Sezioni: nome | predefinita          (predefinita: sì / x / 1 / vero)
   ===================================================================== */
const KEY_SQUADRE = 'classificazione-baskin-eisi-squadre';
const KEY_CTL_ELENCO = 'classificazione-baskin-eisi-ctl-elenco-v2';   // v2: CTL per Sezione, e-mail facoltativa
const KEY_SEZIONI = 'classificazione-baskin-eisi-sezioni';
const KEY_SEZIONE_DEF = 'classificazione-baskin-eisi-sezione-predefinita';
const vero = v => /^(s[iì]|x|1|vero|true|yes|y|\*|predefinita)$/i.test(String(v ?? '').trim());

const NOMI_COLORI = {
  bianco:'#ffffff', bianca:'#ffffff', nero:'#000000', nera:'#000000', rosso:'#ff2b2b', rossa:'#ff2b2b',
  blu:'#2962ff', giallo:'#ffe000', gialla:'#ffe000', viola:'#9b30ff', verde:'#1ee63a',
  azzurro:'#29b6f6', azzurra:'#29b6f6', celeste:'#29b6f6', arancione:'#ff8c00', arancio:'#ff8c00',
  grigio:'#9e9e9e', grigia:'#9e9e9e', rosa:'#ff6fb5', fucsia:'#d6248f', bordeaux:'#800020', granata:'#7b1e2b',
  oro:'#d4af37', argento:'#c0c0c0', marrone:'#795548', 'blu scuro':'#0d1b5e', navy:'#0d1b5e', bluette:'#3f63e0'
};
function normColore(v){
  const s = String(v || '').trim().toLowerCase();
  if(!s) return '';
  if(/^#?[0-9a-f]{6}$/.test(s)) return '#' + s.replace('#', '');
  if(/^#?[0-9a-f]{3}$/.test(s)){ const h = s.replace('#', ''); return '#' + h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; }
  return NOMI_COLORI[s] || null;   // null = colore non riconosciuto
}

const elencoSquadre = () => store.get(KEY_SQUADRE, []) || [];
const salvaSquadre = l => store.set(KEY_SQUADRE, l.sort((a, b) => a.nome.localeCompare(b.nome, 'it')));
function elencoCTL(){
  const l = store.get(KEY_CTL_ELENCO, null);
  return Array.isArray(l) ? l : (typeof CTL_DESTINATARI !== 'undefined' ? CTL_DESTINATARI.map(c => ({ ...c })) : []);
}
const salvaCTL = l => store.set(KEY_CTL_ELENCO, l);
function elencoSezioni(){
  const l = store.get(KEY_SEZIONI, null);
  return Array.isArray(l) ? l : (typeof SEZIONI_TERRITORIALI !== 'undefined' ? SEZIONI_TERRITORIALI.slice() : []);
}
const salvaSezioni = l => store.set(KEY_SEZIONI, l);
/* Sezione predefinita: quella scelta dall'utente, altrimenti quella standard (ctl.js) */
function sezionePredefinita(){
  const v = store.get(KEY_SEZIONE_DEF, null), l = elencoSezioni();
  const d = v === null ? (typeof SEZIONE_PREDEFINITA !== 'undefined' ? SEZIONE_PREDEFINITA : '') : v;
  return l.includes(d) ? d : '';
}
const impostaSezionePredefinita = nome => store.set(KEY_SEZIONE_DEF, nome || '');
const ctlPredefinita = () => elencoCTL().find(c => c.predefinita) || null;
/* una sola CTL predefinita: imposta i (o nessuna con -1) */
function impostaCtlPredefinita(l, i){ l.forEach((c, k) => { c.predefinita = k === i; }); return l; }
const stella = (on, el, i) => `<button class="btn sm stella ${on ? 'on' : ''}" type="button" data-el="${el}" data-i="${i}" aria-pressed="${on}" title="${on ? 'Predefinita: tocca per toglierla' : 'Imposta come predefinita'}">${on ? '&#9733;' : '&#9734;'}</button>`;
const ctlConEmail = c => !!(c && emailValida(c.email));
const trovaSquadra = nome => { const n = String(nome || '').trim().toLowerCase(); return n ? elencoSquadre().find(s => s.nome.toLowerCase() === n) : null; };
var emailValida = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim());

/* ---------- CSV (solo in lettura, per compatibilità) ---------- */
function leggiCSV(testo){
  testo = String(testo || '').replace(/^﻿/, '');
  const prima = testo.split(/\r?\n/).find(r => r.trim()) || '';
  const sep = [';', '\t', ','].map(c => [c, prima.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
  const righe = []; let riga = [], campo = '', q = false;
  for(let i = 0; i < testo.length; i++){
    const ch = testo[i];
    if(q){
      if(ch === '"'){ if(testo[i+1] === '"'){ campo += '"'; i++; } else q = false; }
      else campo += ch;
    } else if(ch === '"') q = true;
    else if(ch === sep){ riga.push(campo); campo = ''; }
    else if(ch === '\n' || ch === '\r'){
      if(ch === '\r' && testo[i+1] === '\n') i++;
      riga.push(campo); campo = '';
      if(riga.some(c => c.trim())) righe.push(riga.map(c => c.trim()));
      riga = [];
    } else campo += ch;
  }
  riga.push(campo); if(riga.some(c => c.trim())) righe.push(riga.map(c => c.trim()));
  return righe;
}
const eIntestazione = (r, parole) => r.some(c => parole.includes(String(c).toLowerCase().replace(/[^a-z0-9]/g, '')));
/* esporta una tabella in XLSX (prima riga = intestazione) */
function scaricaTabella(nomeFile, foglio, intestazione, righe){
  scarica(scriviXlsx(foglio, [intestazione, ...righe]), nomeFile);
}
/* chiede un file XLSX (o CSV) e passa le righe del primo foglio a fn */
function apriTabella(fn){
  const inp = document.createElement('input'); inp.type = 'file';
  inp.accept = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
  inp.onchange = async () => {
    const f = inp.files[0]; if(!f) return;
    try{
      const righe = /\.csv$/i.test(f.name) ? leggiCSV(await f.text()) : await leggiXlsx(await f.arrayBuffer());
      if(!righe.length) return toast('Il file è vuoto');
      fn(righe);
    }catch(e){ toast('Impossibile leggere il file: ' + (e && e.message || e)); }
  };
  inp.click();
}
const righeConBase = (righe, parole) => eIntestazione(righe[0], parole) ? [righe.slice(1), 2] : [righe, 1];   // base = n° di riga nel file

function importaSquadre(tutte){
  const [righe, base] = righeConBase(tutte, ['nome', 'squadra', 'colore', 'colore1', 'maglia']);
  const l = elencoSquadre(); let nuove = 0, agg = 0; const scarti = [];
  righe.forEach((r, i) => {
    const nome = (r[0] || '').trim(); if(!nome){ scarti.push(i + base); return; }
    const c1 = normColore(r[1]), c2 = normColore(r[2]);
    if(c1 === null || c2 === null) scarti.push(i + base);   // colore non riconosciuto: la squadra entra senza quel colore
    const v = { nome, colore1: c1 || '', colore2: c2 || '' };
    const k = l.findIndex(x => x.nome.toLowerCase() === nome.toLowerCase());
    if(k >= 0){ l[k] = v; agg++; } else { l.push(v); nuove++; }
  });
  salvaSquadre(l); renderElenchi();
  toast(`Squadre aggiunte: ${nuove}, aggiornate: ${agg}` + (scarti.length ? ` · righe da controllare (nome mancante o colore non riconosciuto): ${scarti.join(', ')}` : ''));
}
function importaCtl(tutte){
  const [righe, base] = righeConBase(tutte, ['nome', 'ctl', 'email', 'mail', 'indirizzo', 'sezione']);
  const l = elencoCTL(); let nuove = 0, agg = 0, def = null; const scarti = [];
  righe.forEach((r, i) => {
    let [nome = '', email = '', sezione = '', pred = ''] = r.map(x => String(x || '').trim());
    if(emailValida(nome) && !emailValida(email)){ [nome, email] = [email, nome]; }   // anche «email | nome»
    if(email && !emailValida(email)){ scarti.push(i + base); email = ''; }           // e-mail non valida: la CTL entra senza
    if(!nome) nome = email || (sezione ? 'CTL ' + nomeSezione(sezione) : '');
    if(!nome){ scarti.push(i + base); return; }
    const k0 = l.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());
    const v = { nome, email, sezione: sezione.toUpperCase(), predefinita: k0 >= 0 ? !!l[k0].predefinita : false };
    if(k0 >= 0){ l[k0] = v; agg++; } else { l.push(v); nuove++; }
    if(def === null && vero(pred)) def = nome.toLowerCase();   // la prima marcata vince
  });
  if(def !== null) impostaCtlPredefinita(l, l.findIndex(c => c.nome.toLowerCase() === def));
  salvaCTL(l); renderElenchi();
  toast(`CTL aggiunte: ${nuove}, aggiornate: ${agg}` + (scarti.length ? ` · righe da controllare (nome mancante o e-mail non valida): ${scarti.join(', ')}` : ''));
}
function importaSezioni(tutte){
  const [righe, base] = righeConBase(tutte, ['nome', 'sezione', 'sezioneterritoriale', 'st']);
  const l = elencoSezioni(); let nuove = 0, def = null;
  righe.forEach(r => {
    const nome = String(r[0] || '').trim().toUpperCase(); if(!nome) return;
    if(!l.includes(nome)){ l.push(nome); nuove++; }
    if(def === null && vero(r[1])) def = nome;
  });
  salvaSezioni(l); if(def !== null) impostaSezionePredefinita(def); renderElenchi();
  toast(`Sezioni aggiunte: ${nuove} (quelle già presenti restano)`);
}

/* ---------- schermata ---------- */
function pallino(c){ return c ? `<span class="el-dot" style="background:${esc(c)}"></span>` : `<span class="el-dot vuoto" title="nessun colore"></span>`; }
function renderElenchi(){
  if(!$('#elSquadre')) return;
  const sq = elencoSquadre(), ctl = elencoCTL();
  $('#elSquadreN').textContent = sq.length;
  $('#elSquadre').innerHTML = sq.length ? sq.map((s, i) => `
    <li class="el-row">${pallino(s.colore1)}${pallino(s.colore2)}<span class="el-t"><b>${esc(s.nome)}</b></span>
      <button class="btn sm" type="button" data-el="sq-mod" data-i="${i}">Modifica</button>
      <button class="btn sm" type="button" data-el="sq-del" data-i="${i}" aria-label="Elimina">&#10005;</button></li>`).join('')
    : '<li class="muted small">Nessuna squadra: aggiungile qui o importale da XLSX.</li>';
  $('#elCtlN').textContent = ctl.length;
  $('#elCtl').innerHTML = ctl.length ? ctl.map((c, i) => `
    <li class="el-row">${stella(!!c.predefinita, 'ctl-def', i)}<span class="el-t"><b>${esc(c.nome)}</b><small>${ctlConEmail(c) ? esc(c.email) : '<i>e-mail non impostata</i>'}${c.sezione ? ' · ' + esc(c.sezione) : ''}${c.predefinita ? ' · <b>predefinita</b>' : ''}</small></span>
      <button class="btn sm" type="button" data-el="ctl-mod" data-i="${i}">Modifica</button>
      <button class="btn sm" type="button" data-el="ctl-del" data-i="${i}" aria-label="Elimina">&#10005;</button></li>`).join('')
    : '<li class="muted small">Nessuna CTL: aggiungila qui o importala da XLSX.</li>';
  const st = elencoSezioni(), stDef = sezionePredefinita();
  $('#elStN').textContent = st.length;
  $('#elSt').innerHTML = st.length ? st.map((x, i) => `
    <li class="el-row">${stella(x === stDef, 'st-def', i)}<span class="el-t"><b>${esc(x)}</b>${x === stDef ? '<small><b>predefinita</b></small>' : ''}</span>
      <button class="btn sm" type="button" data-el="st-mod" data-i="${i}">Modifica</button>
      <button class="btn sm" type="button" data-el="st-del" data-i="${i}" aria-label="Elimina">&#10005;</button></li>`).join('')
    : '<li class="muted small">Nessuna Sezione: aggiungile qui o importale da XLSX.</li>';
}
/* opzioni della tendina Sezione Territoriale (con il valore attuale anche se fuori elenco) */
function opzioniSezioni(attuale, vuota = '— nessuna —'){
  const l = elencoSezioni(), a = String(attuale || '');
  return `<option value="">${esc(vuota)}</option>` + l.map(x => `<option ${x === a ? 'selected' : ''}>${esc(x)}</option>`).join('')
    + (a && !l.includes(a) ? `<option selected>${esc(a)}</option>` : '');
}

/* tavolozza per la scheda di modifica: colori del Tabellone + personalizzato + nessuno */
function tavolozza(id, val){
  const personal = val && !TEAM_COLORS.includes(val);
  return `<div class="color-row" data-pal="${id}" data-val="${esc(val || '')}">
    <button class="swatch none ${val ? '' : 'sel'}" type="button" data-color="" aria-label="Nessun colore">&#8856;</button>
    ${TEAM_COLORS.map(c => `<button class="swatch ${c === val ? 'sel' : ''}" type="button" data-color="${c}" style="background:${c}" aria-label="Colore ${c}"></button>`).join('')}
    <input class="swatch custom ${personal ? 'sel' : ''}" type="color" value="${personal ? esc(val) : '#ffffff'}" ${personal ? `style="background:${esc(val)}"` : ''} aria-label="Colore personalizzato" /></div>`;
}
function modificaSquadra(i){
  const s = i >= 0 ? elencoSquadre()[i] : { nome:'', colore1:'', colore2:'' };
  apriSheet(i >= 0 ? 'Modifica squadra' : 'Nuova squadra', [{ nome:'Squadra', html:`
    <label class="fld"><span>Nome della squadra <b class="req">*</b></span><input id="elSqNome" type="text" value="${esc(s.nome)}" /></label>
    <div class="fld"><span>Colore maglia 1</span>${tavolozza('c1', s.colore1)}</div>
    <div class="fld"><span>Colore maglia 2</span>${tavolozza('c2', s.colore2)}</div>
    <div class="actions"><button class="btn btn-pri" type="button" id="elSqSalva">Salva</button></div>` }]);
  const body = $('#sheetBody');
  body.onclick = e => {
    const sw = e.target.closest('[data-pal] .swatch[data-color]'); if(!sw) return;
    const row = sw.closest('[data-pal]'); row.dataset.val = sw.dataset.color;
    $$('.swatch', row).forEach(x => x.classList.toggle('sel', x === sw));
    const cu = $('input.swatch.custom', row); cu.style.background = '';
  };
  body.oninput = e => {
    if(!e.target.matches('input.swatch.custom')) return;
    const row = e.target.closest('[data-pal]'); row.dataset.val = e.target.value;
    $$('.swatch', row).forEach(x => x.classList.toggle('sel', x === e.target)); e.target.style.background = e.target.value;
  };
  $('#elSqSalva').onclick = () => {
    const nome = $('#elSqNome').value.trim(); if(!nome) return toast('Inserisci il nome della squadra');
    const l = elencoSquadre();
    const dup = l.findIndex(x => x.nome.toLowerCase() === nome.toLowerCase());
    if(dup >= 0 && dup !== i) return toast('Questa squadra è già nell’elenco');
    const v = { nome, colore1: $('[data-pal="c1"]').dataset.val, colore2: $('[data-pal="c2"]').dataset.val };
    if(i >= 0) l[i] = v; else l.push(v);
    salvaSquadre(l); chiudiSheet(); renderElenchi(); toast('Squadra salvata');
  };
  setTimeout(() => $('#elSqNome').focus(), 80);
}
function modificaCtl(i){
  const c = i >= 0 ? elencoCTL()[i] : { nome:'CTL ', email:'', sezione:'' };
  apriSheet(i >= 0 ? 'Modifica CTL' : 'Nuova CTL', [{ nome:'CTL', html:`
    <label class="fld"><span>Nome <b class="req">*</b></span><input id="elCtlNome" type="text" value="${esc(c.nome)}" placeholder="CTL Emilia-Romagna" /></label>
    <label class="fld"><span>E-mail</span><input id="elCtlMail" type="email" value="${esc(c.email || '')}" placeholder="ctl.sezione@eisi.it" /></label>
    <label class="fld"><span>Sezione Territoriale</span><select id="elCtlSez">${opzioniSezioni(c.sezione)}</select></label>
    <label class="chk"><input type="checkbox" id="elCtlDef" ${c.predefinita ? 'checked' : ''}/><span>CTL predefinita (proposta per l’invio)</span></label>
    <p class="small muted">L’e-mail è facoltativa: se manca, all’invio l’app avvisa e chiede di aggiungerla o di usare un altro indirizzo.</p>
    <div class="actions"><button class="btn btn-pri" type="button" id="elCtlSalva">Salva</button></div>` }]);
  $('#elCtlSalva').onclick = () => {
    const nome = $('#elCtlNome').value.trim(), email = $('#elCtlMail').value.trim(), sezione = $('#elCtlSez').value;
    if(!nome) return toast('Inserisci il nome della CTL');
    if(email && !emailValida(email)) return toast('L’indirizzo e-mail non è valido (oppure lascialo vuoto)');
    const l = elencoCTL();
    const dup = l.findIndex(x => x.nome.toLowerCase() === nome.toLowerCase());
    if(dup >= 0 && dup !== i) return toast('Una CTL con questo nome è già nell’elenco');
    const def = $('#elCtlDef').checked;
    const v = { nome, email, sezione, predefinita: false };
    if(i >= 0) l[i] = v; else l.push(v);
    const k = i >= 0 ? i : l.length - 1;
    if(def) impostaCtlPredefinita(l, k);
    salvaCTL(l); chiudiSheet(); renderElenchi(); toast('CTL salvata');
  };
  setTimeout(() => $('#elCtlNome').focus(), 80);
}
function modificaSezione(i){
  const v = i >= 0 ? elencoSezioni()[i] : '';
  apriSheet(i >= 0 ? 'Modifica Sezione' : 'Nuova Sezione', [{ nome:'Sezione', html:`
    <label class="fld"><span>Sezione Territoriale <b class="req">*</b></span><input id="elStNome" type="text" value="${esc(v)}" placeholder="EMILIA-ROMAGNA" /></label>
    <label class="chk"><input type="checkbox" id="elStDef" ${v && v === sezionePredefinita() ? 'checked' : ''}/><span>Sezione predefinita (proposta per i nuovi giocatori)</span></label>
    <div class="actions"><button class="btn btn-pri" type="button" id="elStSalva">Salva</button></div>` }]);
  $('#elStSalva').onclick = () => {
    const nome = $('#elStNome').value.trim().toUpperCase(); if(!nome) return toast('Inserisci il nome della Sezione');
    const l = elencoSezioni(), dup = l.indexOf(nome);
    if(dup >= 0 && dup !== i) return toast('Questa Sezione è già nell’elenco');
    const eraDef = v && v === sezionePredefinita();
    if(i >= 0){
      l[i] = nome;
      const ctl = elencoCTL(); ctl.forEach(c => { if(c.sezione === v) c.sezione = nome; }); salvaCTL(ctl);   // segue il nuovo nome
    } else l.push(nome);
    salvaSezioni(l);
    if($('#elStDef').checked) impostaSezionePredefinita(nome); else if(eraDef) impostaSezionePredefinita('');
    chiudiSheet(); renderElenchi(); toast('Sezione salvata');
  };
  setTimeout(() => $('#elStNome').focus(), 80);
}
function elenchiClick(t){
  const b = t.closest('[data-el]'); if(!b) return false;
  const i = Number(b.dataset.i), a = b.dataset.el;
  if(a === 'sq-add') modificaSquadra(-1);
  else if(a === 'sq-mod') modificaSquadra(i);
  else if(a === 'sq-del'){ const l = elencoSquadre(); if(confirm(`Eliminare la squadra ${l[i].nome} dall’elenco?`)){ l.splice(i, 1); salvaSquadre(l); renderElenchi(); } }
  else if(a === 'sq-imp') apriTabella(importaSquadre);
  else if(a === 'sq-exp') scaricaTabella(`Squadre_Baskin_${stamp()}.xlsx`, 'Squadre', ['nome', 'colore1', 'colore2'], elencoSquadre().map(s => [s.nome, s.colore1, s.colore2]));
  else if(a === 'sq-mod-x') scaricaTabella('Modello_squadre.xlsx', 'Squadre', ['nome', 'colore1', 'colore2'], [['Baskin Esempio', 'rosso', 'bianco'], ['Altra Squadra', '#2962ff', '#ffe000']]);
  else if(a === 'sq-svuota'){ if(confirm('Svuotare tutto l’elenco delle squadre?')){ salvaSquadre([]); renderElenchi(); } }
  else if(a === 'ctl-add') modificaCtl(-1);
  else if(a === 'ctl-mod') modificaCtl(i);
  else if(a === 'ctl-del'){ const l = elencoCTL(); if(confirm(`Eliminare ${l[i].nome} dall’elenco?`)){ l.splice(i, 1); salvaCTL(l); renderElenchi(); } }
  else if(a === 'ctl-imp') apriTabella(importaCtl);
  else if(a === 'ctl-exp') scaricaTabella(`CTL_Baskin_${stamp()}.xlsx`, 'CTL', ['nome', 'email', 'sezione', 'predefinita'], elencoCTL().map(c => [c.nome, c.email || '', c.sezione || '', c.predefinita ? 'sì' : '']));
  else if(a === 'ctl-mod-x') scaricaTabella('Modello_CTL.xlsx', 'CTL', ['nome', 'email', 'sezione', 'predefinita'], [['CTL Esempio', 'ctl.esempio@eisi.it', 'EMILIA-ROMAGNA', 'sì'], ['CTL senza e-mail', '', 'TOSCANA', '']]);
  else if(a === 'ctl-def'){ const l = elencoCTL(); impostaCtlPredefinita(l, l[i].predefinita ? -1 : i); salvaCTL(l); renderElenchi(); }
  else if(a === 'ctl-ripr'){ if(confirm('Ripristinare l’elenco CTL predefinito dell’app? Le CTL aggiunte andranno perse.')){ store.set(KEY_CTL_ELENCO, null); renderElenchi(); } }
  else if(a === 'st-add') modificaSezione(-1);
  else if(a === 'st-mod') modificaSezione(i);
  else if(a === 'st-del'){ const l = elencoSezioni(); if(confirm(`Eliminare la Sezione ${l[i]} dall’elenco?`)){ l.splice(i, 1); salvaSezioni(l); renderElenchi(); } }
  else if(a === 'st-imp') apriTabella(importaSezioni);
  else if(a === 'st-exp'){ const d = sezionePredefinita(); scaricaTabella(`Sezioni_Territoriali_${stamp()}.xlsx`, 'Sezioni', ['nome', 'predefinita'], elencoSezioni().map(x => [x, x === d ? 'sì' : ''])); }
  else if(a === 'st-mod-x') scaricaTabella('Modello_sezioni.xlsx', 'Sezioni', ['nome', 'predefinita'], [['EMILIA-ROMAGNA', 'sì'], ['TOSCANA', '']]);
  else if(a === 'st-ripr'){ if(confirm('Ripristinare l’elenco predefinito delle Sezioni Territoriali (e la Sezione predefinita)?')){ store.set(KEY_SEZIONI, null); store.set(KEY_SEZIONE_DEF, null); renderElenchi(); } }
  else if(a === 'st-def'){ const x = elencoSezioni()[i]; impostaSezionePredefinita(x === sezionePredefinita() ? '' : x); renderElenchi(); }
  return true;
}

/* ---------- uso nel modulo giocatore ---------- */
/* mostra i due colori della squadra scelta; con cambiaColore li applica (maglia 1) */
function coloriSquadraIdent(cambiaColore){
  const box = $('#teamColors'); if(!box) return;
  const s = trovaSquadra($('#p_squadra').value);
  const cols = s ? [s.colore1, s.colore2].filter(Boolean) : [];
  box.hidden = !cols.length || !isGriglia();
  box.innerHTML = cols.length ? `<span class="small muted">Maglie di ${esc(s.nome)}:</span>` + cols.map((c, k) =>
    `<button class="swatch" type="button" data-tcolor="${esc(c)}" style="background:${esc(c)}" aria-label="Maglia ${k + 1}"></button>`).join('') : '';
  if(cambiaColore && cols.length && isGriglia() && !cols.includes(colScelto)) setColore(cols[0]);
  $$('[data-tcolor]', box).forEach(b => b.classList.toggle('sel', b.dataset.tcolor === colScelto));
}
/* tendina Sezione Territoriale del modulo giocatore: #p_sezione (testo, letto
   da confermaIdent) resta il campo vero; la tendina lo compila, «Altra…» lo mostra */
function sezioneIdent(){
  const sel = $('#p_sezione_sel'), inp = $('#p_sezione'); if(!sel || !inp) return;
  const v = inp.value.trim(), l = elencoSezioni();
  sel.innerHTML = opzioniSezioni('', '— nessuna —').replace(/ selected/g, '') + '<option value="__altra">Altra (scrivi)…</option>';
  if(!v){ const d = sezionePredefinita() || (l.length === 1 ? l[0] : ''); sel.value = d; inp.value = d; inp.hidden = true; }
  else if(l.includes(v)){ sel.value = v; inp.hidden = true; }
  else { sel.value = '__altra'; inp.hidden = false; }
}
/* chiamata da renderIdent: con una sola squadra in elenco la propone */
function elenchiIdent(nuovo){
  sezioneIdent();
  const sq = elencoSquadre();
  if(nuovo && !$('#p_squadra').value && sq.length === 1){
    $('#p_squadra').value = sq[0].nome;
    coloriSquadraIdent(true);
  } else coloriSquadraIdent(nuovo && !colScelto);
}

document.addEventListener('DOMContentLoaded', () => {
  const sel = $('#p_sezione_sel');
  if(sel) sel.addEventListener('change', () => {
    const inp = $('#p_sezione');
    if(sel.value === '__altra'){ inp.value = ''; inp.hidden = false; inp.focus(); }
    else { inp.value = sel.value; inp.hidden = true; }
  });
  const ps = $('#p_squadra');
  if(ps){ ps.addEventListener('change', () => coloriSquadraIdent(true)); ps.addEventListener('input', () => { if(trovaSquadra(ps.value)) coloriSquadraIdent(true); else coloriSquadraIdent(false); }); }
  document.addEventListener('click', e => {
    const tc = e.target.closest('[data-tcolor]');
    if(tc){ setColore(tc.dataset.tcolor); coloriSquadraIdent(false); return; }
    if(e.target.closest('#scr-elenchi')) elenchiClick(e.target);
  });
});
