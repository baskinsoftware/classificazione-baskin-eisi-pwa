# 📋 Guida all'uso — Classificazione Baskin EISI (PWA)

Questa guida spiega come usare l'app per compilare la **Griglia di valutazione delle abilità in partita** e i **Percorsi A, B, C** previsti dall'Allegato A al regolamento di gioco (*La classificazione dei ruoli nel Baskin*, rev. 1 settembre 2025). Per l'installazione, la pubblicazione e i dettagli tecnici vedi il [README](../README.md).

La stessa guida è integrata nell'app (**Guida all'uso** nella schermata iniziale) e funziona anche offline.

---

## 📲 Installazione e uso offline

- Apri l'indirizzo dell'app con il browser e tocca **Installa app** nella schermata iniziale (o in **Informazioni**): se il browser lo permette l'installazione parte subito, altrimenti si aprono le istruzioni per **Android**, **iPhone/iPad** e **computer**, con prima quella del tuo dispositivo. Il pulsante sparisce quando l'app è installata.
- Dopo la prima apertura l'app funziona **anche senza connessione**: serve la rete solo per inviare le valutazioni alla CTL, segnalare un problema o verificare gli aggiornamenti.
- I dati restano **solo sul dispositivo**, nella memoria del browser.

### App Android e iOS (in prova)

Esiste anche una versione **app** per Android e iOS, con le stesse funzioni. Nell'app la **stampa** apre la stampa del telefono (stampante o *Salva come PDF*) e i file (HTML, XLSX, archivio) e l'invio alla CTL passano dalla **condivisione** del telefono, da cui si salvano o si inviano con l'app di posta. Le versioni di prova sono nelle pre-release del repository (es. *v26.0b19*).

## 🏠 Schermata iniziale

- **Nuova sessione** (o **Riprendi sessione** se ce n'è una in corso): avvia una sessione di Griglia o di Percorsi.
- **Archivio valutazioni**: le griglie e i percorsi confermati.
- **Testo integrale**: il testo completo dell'Allegato A, con indice.
- **Squadre, CTL e Sezioni**: gli elenchi delle squadre (con i colori di maglia), delle CTL e delle Sezioni Territoriali, con import/export XLSX.
- **Guida all'uso**: questa guida.
- **Informazioni**: versione, aggiornamenti, segnalazioni, privacy.
- Se ci sono valutazioni confermate **non ancora stampate**, in alto compare un avviso con **Stampa i rimanenti**.

## ✏️ Nuova sessione

Scegli che cosa valutare:

- **Griglia di valutazione**: abilità in partita, ruoli 3, 4 e 5. Consigliati **fino a 4 giocatori** per sessione.
- **Percorsi**: percorsi A, B e C con cronometro. Consigliati **fino a 20 giocatori** per sessione.

Toccando la riga della sessione in cima al pannello giocatori si inseriscono **data**, **valutatore** e, per la griglia, la **gara osservata**. Nella griglia la **data di osservazione è obbligatoria** (è già compilata con la data del giorno): senza data la conferma finale non si può fare. Gara e valutatore sono facoltativi.

## 👤 Inserimento dei giocatori

- **Squadra**: si scrive o si sceglie dall'elenco (vedi *Squadre, CTL e Sezioni*). Se l'elenco ha **una sola squadra**, il nuovo giocatore la riceve già compilata; nella griglia, scegliendo una squadra dell'elenco, il **colore della maglia** si imposta da solo e sopra la tavolozza compaiono le due maglie della squadra.
- **Griglia**: **squadra** e **n° maglia** obbligatori.
- **Percorsi**: basta **cognome e nome**; squadra e n° maglia sono facoltativi. In alternativa al nome servono **squadra e n° maglia**. Senza numero, sul pulsante del giocatore compaiono le **iniziali** di ogni parola, in maiuscolo (es. *Rossi Mario* → **RM**).
- **Data di nascita**, **sesso**, **Sezione Territoriale** (e nella griglia anche **cognome e nome**): facoltativi; il sesso serve per il Percorso B. La Sezione si sceglie da una **tendina** (con **Altra** per scriverla) ed è già impostata sulla **Sezione predefinita** (all'inizio Emilia-Romagna).
- Solo nella griglia: **colore della maglia** (8 colori o uno personalizzato) e **ruolo attuale**.
- Dopo ogni inserimento l'app chiede se **aggiungere un altro giocatore**, finché rispondi *No* o raggiungi il numero consigliato. Oltre quel numero puoi ancora aggiungerne dal pulsante **Aggiungi giocatore**, con una conferma ogni volta.

## 🧑‍🤝‍🧑 Pannello giocatori

- Ogni giocatore ha un pulsante: nella griglia nel **colore della maglia**, nei percorsi **bluette** (maschi) o **fucsia** (femmine).
- Tocca il pulsante per aprire la **griglia** o i **percorsi** di quel giocatore.
- Sotto ogni giocatore confermato ci sono i comandi di **stampa**; quando i giocatori sono più di 6 il pannello diventa compatto.
- **Stampa tutti i non stampati**: stampa insieme le valutazioni confermate e non ancora stampate, una per pagina.
- **Invia alla CTL**: invia per e-mail le valutazioni confermate della sessione (vedi sotto).
- **Chiudi sessione**: se ci sono valutazioni non stampate, l'app propone di stamparle prima.

## 📝 Griglia di valutazione

1. Nel **menu delle abilità** tocca una delle cinque abilità.
2. Scegli il **livello** (da 1 a 5) e premi **Conferma**: torni al menu. Il pulsante **?** apre l'aiuto con i profili dei livelli, gli esempi in forma estesa e la legenda.
3. Mentre scegli il livello, sotto l'elenco compare quali **malus** restano possibili.
4. Apri la voce **Malus**:
    - **Malus H** (altezza inferiore a 155 cm, tolleranza 2 cm, −3 punti): per punteggi **da 5 a 20**.
    - **Malus A.A.I.I.** (protesi o menomazioni agli arti inferiori, fino a −6 punti): per punteggi **da 21 a 25**. Prima si spunta **«Il giocatore ha una o più protesi o menomazioni fisiche agli arti inferiori»**: senza questa spunta le voci del malus restano disattivate. Nella griglia stampata la casella compare accanto al Malus A.A.I.I.
    - La voce si apre anche prima di valutare tutte le abilità: ogni malus è **attivo solo se il suo intervallo è ancora raggiungibile** e si **disattiva in tempo reale** man mano che valuti. Se un malus selezionato diventa impossibile viene tolto, con un avviso.
5. Quando le cinque abilità sono valutate compare il **risultato**: punteggio, malus, punteggio finale e **ruolo** (5–10 → ruolo 3; 11–20 → ruolo 4; 21–25 → ruolo 5), con il confronto con il ruolo attuale.
6. **Conferma finale**: chiede conferma con il riepilogo. Dopo la conferma si attivano **Stampa griglia / PDF**, **Scarica griglia HTML** e **Invia alla CTL**. Per modificare usa **Riapri valutazione**.

## ⏱️ Percorsi

1. Toccando il giocatore scegli il **percorso** (A, B o C); lo schema del percorso è consultabile prima di iniziare.
    - Per il **Percorso B** serve il **sesso** (le fasce di tempo sono diverse).
    - Per il **Percorso C** scegli la **variante** (da ruolo 3 a 4, soglia 20 secondi; da ruolo 2 a ruolo R, soglia 40 secondi).
2. Nel **menu delle prove** apri una delle tre prove.
3. **Cronometro**: **Avvia** / **Ferma**, **Azzera**. Il tempo si può anche **scrivere a mano** nel campo *Tempo (s)*. Lo schermo resta acceso durante la misurazione.
4. Segna i **criteri** tecnici della prova: il totale dei punti si aggiorna da solo. Premi **Conferma prova**.
5. Dopo le tre prove l'**esito** indica il ruolo di partenza o il percorso successivo (es. dal Percorso A al Percorso C). Con **Conferma finale** si attivano stampa, HTML e **Invia alla CTL**; il pulsante del **seguito** avvia il percorso successivo per lo stesso giocatore.
6. **Riapri percorso** permette di correggere; **Cambia percorso** e **Dati del giocatore** sono sempre disponibili prima della conferma.

## 👥 Squadre, CTL e Sezioni

Dalla schermata iniziale, **Squadre, CTL e Sezioni** contiene tre elenchi, salvati sul dispositivo:

- **Squadre**: nome e **due colori di maglia** (facoltativi), scelti dalla tavolozza o personalizzati.
- **CTL**: una per **Sezione Territoriale**, con nome libero ed **e-mail facoltativa**. L'app parte con l'e-mail della sola CTL Emilia-Romagna; le altre si aggiungono quando ci sono. Se all'invio si sceglie una CTL senza e-mail, l'app avvisa.
- **Sezioni Territoriali**: l'elenco della tendina «Sezione Territoriale» del giocatore (Campania, Emilia-Romagna, Friuli-Venezia Giulia, Lazio, Lombardia Nord, Sud ed Est, Marche, Piemonte e Valle d'Aosta, Puglia, Sicilia, Toscana, Umbria, Veneto). Nella tendina si può sempre scegliere **Altra** e scriverla.

Per ogni elenco: **Aggiungi**, **Modifica**, elimina (✕), **Importa XLSX**, **Esporta XLSX** e **Scarica un modello**; CTL e Sezioni si possono anche **ripristinare** all'elenco predefinito.

Una **CTL** e una **Sezione** possono essere **predefinite** (★): si imposta toccando la stellina nell'elenco o con la casella *predefinita* nella scheda di modifica. La Sezione predefinita è proposta per ogni nuovo giocatore, la CTL predefinita all'invio. Nell'elenco standard sono predefinite la **Sezione Emilia-Romagna** e la **CTL Emilia-Romagna**. Nel file XLSX (primo foglio, intestazione facoltativa):

- squadre: colonne `nome | colore1 | colore2`, con i colori come `#rrggbb` o per nome (rosso, blu, bianco, nero, giallo, verde, azzurro, viola, arancione, grigio, rosa, granata…);
- CTL: colonne `nome | email | sezione | predefinita` (e-mail facoltativa);
- Sezioni: colonne `nome | predefinita`.

Nella colonna `predefinita` basta scrivere **sì** (oppure x, 1, vero) sulla riga da rendere predefinita; se ce n'è più d'una vale la prima.

L'import **aggiunge** le voci nuove e **aggiorna** quelle già presenti (stesso nome). In import si accettano anche i file CSV.

## ✉️ Invio alla CTL

Il pulsante **Invia alla CTL** si trova nel pannello giocatori (tutte le valutazioni confermate della sessione), nel menu di ogni giocatore confermato e in ogni voce dell'**Archivio**.

1. Scegli la **CTL destinataria** oppure **Altro indirizzo**. Viene proposta la **CTL predefinita** (★); se non c'è, quella della **Sezione Territoriale** delle valutazioni, poi l'ultima usata. Se la CTL scelta **non ha l'e-mail**, all'invio compare un **avviso**: aggiungila con **Gestisci l'elenco delle CTL** oppure usa *Altro indirizzo*.
2. Se le valutazioni sono più di una, spunta quelle da inviare: vengono riunite in **un solo file HTML**, una scheda per pagina.
3. Scegli come inviare:
    - **Invia con allegato** (telefono): si apre la condivisione, scegli l'app di posta. Il file è già allegato e il testo è già scritto; l'indirizzo della CTL è copiato negli appunti e scritto in cima al messaggio: incollalo come destinatario se l'app non lo inserisce.
    - **Scarica il file e scrivi la mail**: il file viene scaricato e si apre la mail già indirizzata, con oggetto e testo: **allega il file scaricato** prima di inviare.
4. Il file HTML si apre con qualsiasi browser e si può stampare o salvare in PDF.

Le valutazioni inviate contano come **stampate** per l'avviso di uscita.

## 🖨️ Stampa e uscita

- **Stampa / PDF** apre la stampa del browser: per un PDF scegli *Salva come PDF*.
- **Scarica HTML** salva la scheda in un file che contiene anche i loghi.
- Se esci dall'app (**Indietro** dalla schermata iniziale, **Chiudi sessione**, **Nuova sessione**) con valutazioni confermate non stampate, l'app chiede se **stamparle**. Se chiudi l'app dalle app recenti l'avviso ricompare alla riapertura.

## 🗂️ Archivio

- Contiene le **griglie** e i **percorsi** confermati, con **Stampa**, **HTML**, **Invia alla CTL** ed **Elimina**.
- Con più griglie dello stesso giocatore (stessa squadra e numero) l'app calcola la **media** dei risultati.
- **Nuova valutazione** riporta un giocatore dell'archivio in una sessione Griglia.
- **Esporta archivio** salva tutto in un file `.json`; **Importa archivio** lo ricarica, anche su un altro dispositivo.

## ℹ️ Informazioni, aggiornamenti e segnalazioni

- **Verifica aggiornamenti**: controlla se c'è una nuova versione; per applicarla chiudi e riapri l'app.
- **Segnala un problema**: apre una nuova segnalazione sul repository GitHub del progetto, con versione e browser già indicati (serve un account GitHub). Non vengono allegati dati dei giocatori.
- Le versioni di prova hanno il suffisso **a** (alpha), **b** (beta) o **RC** (es. `26.0b19`); la versione definitiva non lo ha (es. `26.0`).
