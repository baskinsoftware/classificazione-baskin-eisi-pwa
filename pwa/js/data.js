/* data.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b19 - 2026-11-24 18-10-10 */
/* =====================================================================
   Classificazione Baskin EISI (PWA) - dati della griglia
   Testi tratti integralmente da: Allegato A al regolamento di gioco -
   La classificazione dei ruoli nel Baskin (rev. 1 settembre 2025),
   "Griglia di valutazione delle abilità in partita" e
   "Tabella delle casistiche in forma estesa".
   ===================================================================== */
'use strict';

const FONTE = 'Allegato A al regolamento di gioco - La classificazione dei ruoli nel Baskin (rev. 1 settembre 2025)';

/* Profilo ideale corrispondente a ciascun livello (sezione "Funzionamento") */
const PROFILI_LIVELLO = {
  1: 'Ruolo 3 profilo basso',
  2: 'Ruolo 3 profilo alto',
  3: 'Ruolo 4 profilo basso',
  4: 'Ruolo 4 profilo alto',
  5: 'Ruolo 5'
};

/* Colonna della forma estesa corrispondente a ciascun livello */
const COLONNA_LIVELLO = { 1: 'r3', 2: 'r3', 3: 'r4', 4: 'r4', 5: 'r5' };

const ABILITA = [
  {
    id: 'difesa',
    nome: 'Difesa',
    livelli: [
      "fatica a stare assieme all'attaccante e/o si dimentica costantemente di difendere. Raramente la sua posizione difensiva è d’ostacolo al percorso dell’attaccante.",
      "riesce a stare assieme all'attaccante, ma si distrae facilmente perdendo l’uomo quando non ha la palla. Poche volte la sua posizione difensiva è d’ostacolo al percorso dell’attaccante.",
      "riesce a seguire con continuità l'attaccante, anche senza palla. A volte prova ad ostacolare anche i ruoli superiori. Cerca di scegliere una posizione difensiva che sia d’ostacolo al percorso dell’attaccante ma fatica molto ad anticipare la ricezione.",
      "riesce a seguire sempre l'attaccante, cercando accorgimenti per impedirgli la ricezione. Può riuscire a ostacolare anche i ruoli superiori. Riesce a scegliere una posizione difensiva che sia d’ostacolo al percorso dell’attaccante ed alla sua ricezione e cerca di modificarla a seconda dei suoi spostamenti.",
      "segue l'attaccante con e senza palla, cercando di anticiparne le decisioni. Sceglie sempre una posizione difensiva che sia d’ostacolo al percorso dell’attaccante e alla sua ricezione e la modifica continuamente per condizionarlo e anticiparlo."
    ],
    estesa: {
      r3: [
        "fatica a stare assieme all'attaccante, sia quando è fermo che soprattutto quando è in movimento",
        "si distrae facilmente dimenticandosi di difendere o perdendo il suo uomo",
        "di solito sceglie una posizione difensiva non ottimale, non proteggendo l'obiettivo e lasciando libero il percorso dell’attaccante",
        "oppone una scarsa resistenza al passare dell'attaccante",
        "per difendere usa soprattutto le mani puntando a rubare la palla",
        "ha grosse difficoltà a prevedere un passaggio e ad anticiparlo"
      ],
      r4: [
        "riesce a seguire il suo avversario quando è senza palla",
        "cerca di non far ricevere il suo avversario",
        "riesce a scegliere una posizione difensiva ottimale",
        "riesce a mettersi con il corpo tra l'attaccante e il suo obiettivo per negarglielo",
        "cerca ma fatica di modificare la sua posizione difensiva a seconda di come si muove l'attacco",
        "oppone una buona resistenza al passare dell'attaccante",
        "può mettere in difficoltà i ruoli superiori",
        "a volte, ma non spesso, riesce a prevedere un passaggio anche se non sempre riesce a coordinarsi per anticiparlo"
      ],
      r5: [
        "riesce a seguire sempre il suo avversario con e senza palla",
        "cerca di anticipare tutte le mosse dell'avversario",
        "anticipa le linee di passaggio",
        "si adegua alle scelte dell'avversario cambiando rapidamente posizione",
        "usa il corpo per chiudere la strada e condizionare la direzione dell'attacco",
        "oppone un'ottima resistenza al passare dell'attaccante"
      ]
    }
  },
  {
    id: 'tiro',
    nome: 'Qualità di scelta di tiro',
    livelli: [
      "tira sempre forzando, indipendentemente dalla situazione in cui si trova e dall'esito del tiro.",
      "fatica a valutare l'esito di un tiro e quindi spesso forza la scelta.",
      "raramente forza il tiro, e quasi sempre riesce a valutare l'esito della scelta che sta per fare.",
      "tira solo se è una situazione che reputa buona, altrimenti ci rinuncia e cerca un'altra soluzione. A volte ma non spesso riesce a crearsi il tiro con una soluzione personale ma raramente affrontando l’avversario in un 1vs1 dal palleggio. Può fare delle finte di tiro per ingannare l’avversario ma raramente riesce ad ottenere un tiro migliore.",
      "sceglie con cura quando tirare creandosi una situazione personale vantaggiosa di 1vs1. Usa delle finte per ingannare l’avversario e ottenere un tiro migliore."
    ],
    estesa: {
      r3: [
        "forza quasi sempre il tiro, anche se è molto distante dal canestro o ha un difensore che lo ostacola.",
        "se ha un ostacolo che non gli permette di tirare può momentaneamente rinunciare/esitare, ma poi insiste a cercare un nuovo tiro",
        "normalmente tira da \"piazzato\" rallentando da una corsa, e se tira in movimento rischia di essere scoordinato e di non calcolare la forza necessaria",
        "non esegue finte di tiro e di passaggio"
      ],
      r4: [
        "riesce a capire se è il caso di tirare o meno, valutando quando è il caso di rinunciarvi e forzando poche volte",
        "può crearsi un tiro con una soluzione personale, ma raramente è in grado di farlo battendo l'uomo in 1vs1 dal palleggio",
        "può usare delle finte di tiro per evitare la stoppata ma fatica a trarne vantaggio",
        "normalmente tira da \"piazzato\" o arrestando il palleggio dopo aver rallentato"
      ],
      r5: [
        "sceglie con cura quando tirare non forzando mai o quasi",
        "Si crea la situazione vantaggiosa per tirare, battendo l'avversario in 1vs1 dal palleggio o spalle a canestro",
        "se c'è un miss match di fisico, altezza o ruolo, approfitta del vantaggio",
        "usa le finte di tiro per ingannare il difensore e crearsi una soluzione migliore",
        "è in grado di tirare proteggendo la palla per non subire stoppate e/o per fare canestro+fallo"
      ]
    }
  },
  {
    id: 'canestri',
    nome: 'Uso dei due canestri',
    livelli: [
      "si dirige sempre verso un solo obiettivo senza cambiare direzione se non su stimolo esterno.",
      "solitamente si dirige verso un solo obiettivo ma può cambiare direzione se si trova in difficoltà, volontariamente o su stimolo esterno.",
      "quando si trova in difficoltà cambia volontariamente obiettivo.",
      "valuta e decide volontariamente, a volte con anticipo, se e quando cambiare obiettivo.",
      "crea appositamente situazioni per trarre vantaggio per sé e per i compagni dal cambio di obiettivo."
    ],
    estesa: {
      r3: [
        "tende ad andare sempre verso lo stesso obiettivo, che è quello preferito o che gli viene indicato",
        "solitamente cambia obiettivo su stimolo esterno",
        "se in difficoltà tende a insistere nella direzione intrapresa e se cambia direzione volontariamente lo fa solo dopo essersi accorto di non poter proseguire"
      ],
      r4: [
        "tende ad andare verso il canestro più vicino e/o più libero",
        "cambia obiettivo volontariamente se è in difficoltà o se nota che l'obiettivo che sta attaccando non è raggiungibile",
        "può fintare di andare verso un canestro e poi cambia per smarcarsi dall'avversario",
        "il suo cambio di canestro può creare un sovrannumero che qualche volta, ma non spesso, riesce a sfruttare positivamente"
      ],
      r5: [
        "cambia continuamente obiettivo per smarcarsi e non essere mai prevedibile",
        "finta di andare verso un canestro e poi cambia obiettivo",
        "utilizza il cambio di canestro come mezzo per sbilanciare la difesa e creare un sovrannumero per la sua squadra"
      ]
    }
  },
  {
    id: 'compagni',
    nome: 'Coinvolgimento compagni',
    livelli: [
      "cerca la soluzione personale senza passare mai la palla, se non occasionalmente e solo su stimolo esterno.",
      "cerca la soluzione personale e solo pochissime volte passa la palla, e solo se in difficoltà o su stimolo esterno.",
      "se si trova in difficoltà può passare la palla ai compagni, ma solitamente cerca la soluzione personale.",
      "passa spesso la palla ai compagni, cercando a volte ma non spesso di creare una situazione vantaggiosa.",
      "costantemente cerca e crea situazioni vantaggiose per passare la palla ai compagni coinvolgendoli nelle manovre offensive."
    ],
    estesa: {
      r3: [
        "passa la palla ai compagni su stimolo esterno o solo se è in grosse difficoltà",
        "Cerca sempre o quasi soluzioni personali che non coinvolgono i compagni",
        "quando è in difficoltà insiste a forzare la situazione e solo poche volte passa la palla",
        "se passa la palla ad un compagno non è per fare un passaggio finalizzante"
      ],
      r4: [
        "passa la palla al compagno libero",
        "passa la palla quando si accorge di essere in difficoltà",
        "di solito è un terminale delle collaborazioni di squadra e raramente è lui a eseguire i passaggi finalizzanti",
        "può sfruttare un sovrannumero",
        "Può dare indicazioni e consigli ai pari ruolo e ai ruoli inferiori"
      ],
      r5: [
        "crea e gioca delle collaborazioni con i compagni (dai e vai, pick & roll, ecc.)",
        "Esegue passaggi finalizzanti",
        "cerca di battere l'avversario 1vs1 con lo scopo di creare un sovrannumero",
        "chiama gli schemi, costruisce il gioco e dà indicazioni ai compagni su come muoversi e difendere"
      ]
    }
  },
  {
    id: 'movimento',
    nome: 'Movimento senza palla',
    livelli: [
      "solitamente si mette solo dove gli viene detto e se deve scegliere di propria iniziativa non occupa mai una posizione vantaggiosa per il gioco.",
      "spesso si mette solo dove gli viene detto e se sceglie una posizione di propria iniziativa poche volte essa è vantaggiosa.",
      "spesso si mette dove gli viene detto e a volte ricerca di propria iniziativa una posizione vantaggiosa per il gioco, anche se fatica a trarne reale vantaggio.",
      "riesce quasi sempre a trovare di propria iniziativa una posizione vantaggiosa dove posizionarsi, riuscendo a volte ma non spesso ad anticipare il gioco.",
      "anticipa il gioco cercando sempre la posizione migliore dove posizionarsi per avvantaggiare sé stesso o la propria squadra."
    ],
    estesa: {
      r3: [
        "di norma va a mettersi in una posizione indicatagli dall'allenatore/compagno e la mantiene",
        "Ha grosse difficoltà ad adattare la sua posizione all'evoluzione del gioco.",
        "in attacco se non è fisso in una posizione tende a muoversi casualmente \"inseguendo\" i suoi compagni con la palla",
        "quando è marcato fa molta fatica a smarcarsi e liberarsi dal difensore"
      ],
      r4: [
        "si mette dove gli viene detto/insegnato, però prova ad adattare la sua posizione al cambiare della situazione seppur non sempre ci riesce",
        "in attacco cerca di farsi trovare in una posizione dove non c'è il difensore",
        "non sempre riesce a occupare efficacemente gli spazi e non sempre li occupa con il timing corretto per non intralciare i compagni",
        "utilizza un grezzo tentativo di smarcamento non sempre efficace"
      ],
      r5: [
        "modifica continuamente la sua posizione adattandosi al cambiare delle situazioni e ricercando la posizione più vantaggiosa in ogni momento",
        "si muove negli spazi cercando il miglior timing possibile",
        "si smarca dal suo avversario con efficaci finte, cambi di direzione, velocità e senso",
        "cerca sempre di prevedere come si evolverà il gioco per occupare lo spazio più vantaggioso"
      ]
    }
  }
];

/* Legenda della griglia. "chiavi" serve all'app per mostrare, come aiuto
   contestuale, solo le note pertinenti al testo del livello selezionato. */
const LEGENDA = [
  { segno: '*', chiavi: [/forza/i],
    testo: 'Con “forzare il tiro” si intende una situazione in cui la scelta non garantisce alte probabilità di successo.' },
  { segno: '**', chiavi: [/situazion\w* (personale )?vantaggios/i],
    testo: 'Con “situazione vantaggiosa” si intende una situazione in cui la scelta garantisce alte probabilità di successo. I criteri valutativi delle probabilità di successo possono essere: distanza dall’obiettivo; angolo di tiro rispetto al canestro; possibile interferenza della difesa; ecc.' },
  { segno: '***', chiavi: [/stimolo esterno/i, /gli viene detto/i],
    testo: 'Con “stimolo esterno” si intende suggerimento/ordine da parte dell’allenatore o compagno di squadra.' },
  { segno: '****', chiavi: [/in difficoltà/i],
    testo: 'Con “trovarsi in difficoltà” si intende quando la soluzione che si sta intraprendendo non è più percorribile o lo è con un alto rischio di fallimento.' },
  { segno: '*****', chiavi: [/volontari/i, /cambi\w* (di )?obiettivo/i],
    testo: 'A volte alcuni giocatori (spesso di ruolo 3) possono eseguire continui cambi di obiettivo che sembrano letture di ciò che sta accadendo, ma che spesso sono movimenti automatizzati durante gli allenamenti e quindi non dipendenti dalla situazione di gioco. In questo caso queste abilità non vengono contate come “volontarie”.' },
  { segno: '******', chiavi: [/posizione (difensiva|vantaggiosa|migliore)/i],
    testo: 'Con “posizione vantaggiosa” si intende occupare una posizione nel campo che faciliti lo svolgimento delle manovre offensive/difensive della propria squadra. I criteri valutativi possono essere: cercare una posizione in cui si possa ricevere la palla senza il rischio che venga intercettata dalla difesa; cercare una posizione libera vicino a uno dei due canestri; cercare una posizione che non sia d’intralcio al movimento dei miei compagni specialmente se con la palla; cercare una posizione che mi permetta di rendere difficoltoso il raggiungimento dei canestri ai miei avversari; ecc.' }
];

const MALUS_H = {
  id: 'h', nome: 'Malus H (Altezza)', punti: 3,
  condizione: 'da applicare a chi ha ottenuto un punteggio compreso tra 5 e 20',
  testo: 'Se il giocatore possiede un’altezza inferiore a 155 cm (con una tolleranza di 2 cm) riceve un Malus di -3 punti.'
};

const MALUS_AAII = [
  { id: 'salto', nome: 'Salto', punti: 1,
    testo: 'Non riesce a esprimere, o esprime in modo inefficace, almeno uno tra i fondamentali: Stoppata, Rimbalzo e Tiro in salto.' },
  { id: 'corsa', nome: 'Corsa', punti: 1,
    testo: 'Una volta che la corsa è cominciata (non considerare la fase di accelerazione) presenta una corsa non continua con oscillazioni e/o interruzioni, e il tempo degli appoggi e la lunghezza dei passi sono asimmetrici tra loro.' },
  { id: 'velocita', nome: 'Cambi di velocità', punti: 2,
    testo: 'Non riesce ad accelerare e decelerare in tempi brevi senza evitare perdite di equilibrio e/o coordinazione.' },
  { id: 'direzione', nome: 'Cambi di direzione in spazi brevi', punti: 2,
    testo: 'Se presenta almeno uno dei due casi: In difesa ha difficoltà a seguire i cambi di direzione dell’attaccante in modo reattivo ed efficace senza perdita di equilibrio e/o coordinazione. In attacco ha difficoltà a eseguire dei cambi di direzione efficaci per smarcarsi e battere il suo difensore senza evitare perdite di equilibrio e/o coordinazione.' }
];
const MALUS_AAII_CONDIZIONE = 'da applicare a chi ha ottenuto un punteggio compreso tra 21 e 25: se il giocatore possiede una o più protesi o menomazione fisica agli arti inferiori riceve un Malus pari alla somma dei seguenti risultati';

/* Soglie (sezione "Funzionamento" e tabella finale della scheda risultati) */
function ruoloDaPunteggio(p){
  if(p == null) return null;
  if(p <= 10) return 3;
  if(p <= 20) return 4;
  return 5;
}
