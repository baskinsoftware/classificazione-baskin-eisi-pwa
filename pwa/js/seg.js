/* seg.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Display a 7 segmenti in SVG - ripreso dal Tabellone Baskin EISI (PWA)
   (SEG_MAP, buildSegmentPolygons, digitSVG, colonSVG) con l'aggiunta del
   punto decimale per il cronometro dei percorsi.
   ===================================================================== */
'use strict';

const SEG_MAP = {
  '0':['a','b','c','d','e','f'],
  '1':['b','c'],
  '2':['a','b','g','e','d'],
  '3':['a','b','g','c','d'],
  '4':['f','g','b','c'],
  '5':['a','f','g','c','d'],
  '6':['a','f','g','e','c','d'],
  '7':['a','b','c'],
  '8':['a','b','c','d','e','f','g'],
  '9':['a','b','c','d','f','g'],
  '-':['g'],
  ' ':[]
};

const SEG_POLY = buildSegmentPolygons();
function buildSegmentPolygons(){
  const W=100,H=180,p=11,ht=8,inset=5;
  const xL=p, xR=W-p, yA=p, yG=H/2, yD=H-p;
  const hx1=xL+inset, hx2=xR-inset;
  const horiz = (yc)=>[
    [hx1,yc],[hx1+ht,yc-ht],[hx2-ht,yc-ht],[hx2,yc],[hx2-ht,yc+ht],[hx1+ht,yc+ht]
  ];
  const vert = (xc,y1,y2)=>{
    const a=y1+inset, b=y2-inset;
    return [[xc,a],[xc+ht,a+ht],[xc+ht,b-ht],[xc,b],[xc-ht,b-ht],[xc-ht,a+ht]];
  };
  const toStr = pts => pts.map(p=>p.join(',')).join(' ');
  return {
    a: toStr(horiz(yA)),
    g: toStr(horiz(yG)),
    d: toStr(horiz(yD)),
    f: toStr(vert(xL,yA,yG)),
    b: toStr(vert(xR,yA,yG)),
    e: toStr(vert(xL,yG,yD)),
    c: toStr(vert(xR,yG,yD))
  };
}

function digitSVG(ch){
  const on = new Set(SEG_MAP[ch] || []);
  let polys = '';
  for(const seg of ['a','b','c','d','e','f','g']){
    const cls = on.has(seg) ? 'seg' : 'seg off';
    polys += `<polygon class="${cls}" points="${SEG_POLY[seg]}"/>`;
  }
  return `<svg class="seg-digit" viewBox="0 0 100 180" aria-hidden="true">${polys}</svg>`;
}

function colonSVG(){
  return `<svg class="seg-colon" viewBox="0 0 30 180" aria-hidden="true">`+
         `<circle class="dot" cx="15" cy="64" r="9"/>`+
         `<circle class="dot" cx="15" cy="116" r="9"/></svg>`;
}

/* punto decimale (aggiunto per il cronometro) */
function pointSVG(){
  return `<svg class="seg-colon" viewBox="0 0 30 180" aria-hidden="true">`+
         `<circle class="dot" cx="15" cy="164" r="9"/></svg>`;
}

/* rende una stringa tipo "0:21.37": cifre, ':' e '.' */
function renderSeg(el, str){
  el.innerHTML = [...str].map(ch => ch === ':' ? colonSVG() : ch === '.' ? pointSVG() : digitSVG(ch)).join('');
}
