/* percorsi-data.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b19 - 2026-11-24 18-10-10 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - dati dei percorsi A, B e C
   Tabelle di valutazione e regole di decisione tratte da: Allegato A al
   regolamento di gioco - La classificazione dei ruoli nel Baskin
   (rev. 1 settembre 2025), sezione V "Sistema assegnazione ruoli 3, 4, 5".
   ===================================================================== */
'use strict';

const NUM_PROVE = 3;

/* fasce di tempo: [limite superiore incluso in secondi, punti]
   "fino a X sec" = t <= X ; "> X fino a Y" = X < t <= Y ; "oltre" = ultimo */
const FASCE_A = [[20,6],[22,5],[24,4],[26,3],[28,2],[Infinity,1]];
const FASCE_B = {
  M: [[19,6],[20,5],[21,4],[22,3],[23,2],[Infinity,1]],
  F: [[20,6],[21,5],[22,4],[23,3],[24,2],[Infinity,1]]
};

const PERCORSI = {
  A: {
    id: 'A', nome: 'Percorso A', scopo: 'Ruolo 3 o 4', max: 20,
    descr: 'Distingue i giocatori di Ruolo 3 e Ruolo 4. Cinque criteri (tempo, corsa, palleggio, percorso, entrata in terzo tempo), massimo 20 punti, tre prove.',
    img: 'img/doc/percorso-a.png', docTab: 'tab-perc-a',
    titoloScheda: 'TABELLA DI VALUTAZIONE PER VERIFICARE I RUOLI N. 3 E 4 NEL PERCORSO A',
    criteri: [
      { id:'tempo', nome:'Tempo impiegato', tipo:'tempo' },
      { id:'corsa', nome:'Corsa', tipo:'scelta', opzioni:[
        { id:'f', breve:'Fluida', t:'Fluida, coordinata e veloce', p:2 },
        { id:'n', breve:'Non fluida', t:'Non fluida e/o impacciata e/o faticosa e/o poco coordinata e/o lenta', p:1 }
      ]},
      { id:'palleggio', nome:'Palleggio', tipo:'scelta',
        nota:'Assegnare un punteggio in base alle situazioni A, B, C, D o in base alle combinazioni indicate.',
        opzioni:[
        { id:'ok', breve:'Regolare', t:'Controllato, continuo e regolare (anche se non perfetto dal punto di vista tecnico-estetico) con giri corretti e cambi di mano', p:6 },
        { id:'A',  breve:'A', t:'A) giri non corretti tecnicamente (es: non effettua cambio di mano)', p:5 },
        { id:'B',  breve:'B', t:'B) palleggia sempre con la stessa mano o non con tutti cambi di mano', p:5 },
        { id:'C',  breve:'C', t:'C) palleggio non continuato (interrotto 2 volte)', p:4 },
        { id:'D',  breve:'D', t:'D) interrotto spesso (più di due volte interrotto)', p:3 },
        { id:'AB', breve:'A+B', t:'A+B', p:4 },
        { id:'AC', breve:'A+C', t:'A+C', p:3 },
        { id:'AD', breve:'A+D', t:'A+D', p:2 },
        { id:'BC', breve:'B+C', t:'B+C', p:3 },
        { id:'BD', breve:'B+D', t:'B+D', p:2 }
      ]},
      { id:'percorso', nome:'Percorso', tipo:'scelta', opzioni:[
        { id:'netto', breve:'Netto', t:'Senza errori nel percorso (netto)', p:4 },
        { id:'e1', breve:'Err. palleggio', t:'Errori fatti nel palleggio (colonna precedente)', p:3 },
        { id:'e2', breve:'Err. pall. + palla persa', t:'Errori fatti sia nel palleggio e palla persa 1 o 2 volte', p:3 },
        { id:'e3', breve:'Err. pall. + birilli', t:'Errori fatti nel palleggio e con 1 o più birilli saltati', p:3 },
        { id:'e4', breve:'Palla persa spesso + birilli', t:'Errori fatti nel palleggio e con palla persa spesso e birilli saltati', p:2 }
      ]},
      { id:'entrata', nome:'Entrata in terzo tempo', tipo:'scelta', opzioni:[
        { id:'e', breve:'Esatta', t:'Esatta o esatta ma scoordinata', p:2 },
        { id:'n', breve:'Non esatta', t:'Non esatta o non esatta e scoordinata', p:1 }
      ]}
    ]
  },
  B: {
    id: 'B', nome: 'Percorso B', scopo: 'Ruolo 4 o 5', max: 15,
    descr: 'Distingue i giocatori di Ruolo 4 e Ruolo 5. Tre criteri (tempo con corsa fluida e coordinata, palleggio, entrata con palla autolanciata), massimo 15 punti, tre prove. Le fasce di tempo sono diverse per maschi e femmine.',
    img: 'img/doc/percorso-b.png', docTab: 'tab-perc-b',
    titoloScheda: 'TABELLA DI VALUTAZIONE PER VERIFICARE I RUOLI N. 4/5 NEL PERCORSO B',
    criteri: [
      { id:'tempo', nome:'Tempo impiegato con corsa fluida e coordinata', tipo:'tempo' },
      { id:'palleggio', nome:'Palleggio', tipo:'difficolta',
        ok:'Controllato, continuo e regolare. Percorso corretto eseguito con ottima tecnica',
        nota:'Seleziona le difficoltà osservate: nessuna = 6 punti, una = 5, due = 4, tre = 3, quattro = 2.',
        difficolta:[
          { id:'A', t:'A) Commette passi di partenza' },
          { id:'B', t:'B) Difficoltà nei cambi di direzione e/o con palla tra le gambe' },
          { id:'C', t:'C) Giri non corretti' },
          { id:'D', t:'D) Errori nei cambi di mano' }
        ],
        punti:[6,5,4,3,2]
      },
      { id:'entrata', nome:'Entrata con palla autolanciata', tipo:'scelta', opzioni:[
        { id:'c', breve:'Coordinata', t:'Coordinata e senza infrazioni', p:3 },
        { id:'s', breve:'Scoordinata', t:'Scoordinata', p:2 },
        { id:'i', breve:'Scoord. + infrazioni', t:'Scoordinata e con infrazioni', p:1 }
      ]}
    ]
  },
  C: {
    id: 'C', nome: 'Percorso C', scopo: 'Velocità (casi dubbi 3/4 · verifica 2/2R)', max: null,
    descr: 'Navetta di 60 metri andata e ritorno da percorrersi alla massima velocità in palleggio (anche non continuato). Si misura solo il tempo, tenendo conto di due prove su tre.',
    img: 'img/doc/percorso-c.png', docTab: 'sez-v',
    titoloScheda: 'PERCORSO C - NAVETTA DI 60 METRI ANDATA E RITORNO IN PALLEGGIO',
    criteri: [ { id:'tempo', nome:'Tempo impiegato', tipo:'tempo' } ],
    varianti: {
      '34': { nome:'Verifica Ruolo 3 / Ruolo 4', soglia:20,
              testo:'Per chi ha totalizzato 14 o 15 punti nel Percorso A: con un riscontro cronometrico inferiore a 20 secondi (tenendo conto delle due prove su tre) è Ruolo 4, altrimenti Ruolo 3.',
              sotto:'4', sopra:'3' },
      '2R': { nome:'Verifica Ruolo 2 / Ruolo 2R', soglia:40,
              testo:'Il Ruolo 2 non possiede la corsa/spostamento veloce: effettua il percorso C in un tempo superiore a 40 secondi. Con meno di 40 secondi l’atleta è Ruolo 2R.',
              sotto:'2R', sopra:'2' }
    }
  }
};

function puntiTempo(fasce, sec){
  for(const [lim, p] of fasce) if(sec <= lim + 1e-9) return p;
  return 1;
}
