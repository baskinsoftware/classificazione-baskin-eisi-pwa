/* xlsx.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - lettura e scrittura XLSX minimale,
   senza librerie e offline.
   - leggiXlsx(ArrayBuffer) -> righe (array di array di stringhe) del
     primo foglio. I file di Excel sono compressi (deflate): si usa
     DecompressionStream('deflate-raw') del browser.
   - scriviXlsx(nomeFoglio, righe) -> Blob .xlsx (zip non compresso),
     prima riga in grassetto e bloccata come intestazione.
   ===================================================================== */
(function(global){
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8');

  /* ---------- CRC32 e ZIP (scrittura, metodo «stored») ---------- */
  const TAB = (() => { const t = new Uint32Array(256); for(let n = 0; n < 256; n++){ let c = n; for(let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = b => { let c = 0xFFFFFFFF; for(let i = 0; i < b.length; i++) c = TAB[(c ^ b[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  function zip(files){   // files: [{nome, dati:Uint8Array}]
    const parti = [], centrale = []; let off = 0;
    for(const f of files){
      const n = enc.encode(f.nome), d = f.dati, crc = crc32(d);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint32(14, crc, true); h.setUint32(18, d.length, true); h.setUint32(22, d.length, true); h.setUint16(26, n.length, true);
      parti.push(new Uint8Array(h.buffer), n, d);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, d.length, true); c.setUint32(24, d.length, true); c.setUint16(28, n.length, true);
      c.setUint32(42, off, true);
      centrale.push(new Uint8Array(c.buffer), n);
      off += 30 + n.length + d.length;
    }
    const lenC = centrale.reduce((s, x) => s + x.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, lenC, true); e.setUint32(16, off, true);
    return new Blob([...parti, ...centrale, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  const xmlEsc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  const colonna = i => { let s = ''; i++; while(i){ const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };

  function scriviXlsx(nomeFoglio, righe){
    const foglio = xmlEsc(String(nomeFoglio || 'Foglio1').replace(/[\\/?*[\]:]/g, ' ').slice(0, 31));
    const larg = []; righe.forEach(r => r.forEach((v, j) => { larg[j] = Math.min(60, Math.max(larg[j] || 8, String(v ?? '').length + 2)); }));
    const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${larg.map((w, j) => `<col min="${j+1}" max="${j+1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${
      righe.map((r, i) => `<row r="${i+1}">${r.map((v, j) => `<c r="${colonna(j)}${i+1}" t="inlineStr"${i === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEsc(v)}</t></is></c>`).join('')}</row>`).join('')
    }</sheetData></worksheet>`;
    const file = {
      '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${foglio}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
      'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      'xl/worksheets/sheet1.xml': sheet
    };
    return zip(Object.entries(file).map(([nome, testo]) => ({ nome, dati: enc.encode(testo) })));
  }

  /* ---------- lettura ---------- */
  async function inflate(dati){
    if(typeof DecompressionStream === 'undefined') throw new Error('Questo browser non sa leggere i file XLSX compressi: aggiornalo.');
    const s = new Blob([dati]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  async function unzip(buf){
    const u = new Uint8Array(buf), v = new DataView(buf);
    let eocd = -1;
    for(let i = u.length - 22; i >= Math.max(0, u.length - 65557); i--) if(v.getUint32(i, true) === 0x06054b50){ eocd = i; break; }
    if(eocd < 0) throw new Error('Il file non è un XLSX valido.');
    const n = v.getUint16(eocd + 10, true); let p = v.getUint32(eocd + 16, true);
    const voci = {};
    for(let k = 0; k < n; k++){
      if(v.getUint32(p, true) !== 0x02014b50) break;
      const metodo = v.getUint16(p + 10, true), comp = v.getUint32(p + 20, true);
      const ln = v.getUint16(p + 28, true), le = v.getUint16(p + 30, true), lc = v.getUint16(p + 32, true), off = v.getUint32(p + 42, true);
      const nome = dec.decode(u.subarray(p + 46, p + 46 + ln));
      voci[nome] = { metodo, comp, off };
      p += 46 + ln + le + lc;
    }
    return async nome => {
      const e = voci[nome]; if(!e) return null;
      const inizio = e.off + 30 + v.getUint16(e.off + 26, true) + v.getUint16(e.off + 28, true);
      const raw = u.subarray(inizio, inizio + e.comp);
      return dec.decode(e.metodo === 0 ? raw : e.metodo === 8 ? await inflate(raw) : (() => { throw new Error('Compressione XLSX non supportata.'); })());
    };
  }
  const xml = s => new DOMParser().parseFromString(s, 'application/xml');
  const perNome = (el, nome) => Array.from(el.getElementsByTagNameNS('*', nome));

  async function leggiXlsx(buf){
    const leggi = await unzip(buf);
    let percorso = 'xl/worksheets/sheet1.xml';
    const wb = await leggi('xl/workbook.xml'), rels = await leggi('xl/_rels/workbook.xml.rels');
    if(wb && rels){
      const s = perNome(xml(wb), 'sheet')[0];
      const rid = s && (s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || s.getAttribute('r:id'));
      const rel = perNome(xml(rels), 'Relationship').find(r => r.getAttribute('Id') === rid);
      if(rel){ const t = rel.getAttribute('Target'); percorso = t.startsWith('/') ? t.slice(1) : 'xl/' + t.replace(/^\.\//, ''); }
    }
    const ss = await leggi('xl/sharedStrings.xml');
    const condivise = ss ? perNome(xml(ss), 'si').map(si => perNome(si, 't').filter(t => !t.closest || !t.parentNode || t.parentNode.localName !== 'rPh').map(t => t.textContent).join('')) : [];
    const sh = await leggi(percorso); if(!sh) throw new Error('Foglio non trovato nel file XLSX.');
    const righe = [];
    perNome(xml(sh), 'row').forEach(r => {
      const riga = [];
      perNome(r, 'c').forEach((c, k) => {
        const ref = c.getAttribute('r'); let j = k;
        if(ref){ const m = ref.match(/^[A-Z]+/); if(m){ j = 0; for(const ch of m[0]) j = j * 26 + ch.charCodeAt(0) - 64; j--; } }
        const t = c.getAttribute('t'), vEl = perNome(c, 'v')[0];
        let val = '';
        if(t === 's') val = condivise[+(vEl && vEl.textContent)] ?? '';
        else if(t === 'inlineStr') val = perNome(c, 't').map(x => x.textContent).join('');
        else if(t === 'b') val = vEl && vEl.textContent === '1' ? 'VERO' : 'FALSO';
        else val = vEl ? vEl.textContent : '';
        riga[j] = String(val).trim();
      });
      for(let j = 0; j < riga.length; j++) if(riga[j] === undefined) riga[j] = '';
      if(riga.some(x => x)) righe.push(riga);
    });
    return righe;
  }

  global.scriviXlsx = scriviXlsx;
  global.leggiXlsx = leggiXlsx;
})(window);
