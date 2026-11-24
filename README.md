# Classificazione Baskin EISI (PWA)

## Cos'è il Baskin

Il Baskin è uno sport fondato sul basket, inclusivo per progettazione, che prevede per regolamento la partecipazione simultanea degli atleti senza divisione in categorie grazie ad un sistema basato sui ruoli in campo: atleti di entrambi i sessi, con e senza disabilità, con disabilità fisiche e/o cognitive giocano insieme sullo stesso campo la stessa partita. Il regolamento del Baskin è una proprietà intellettuale di *Associazione Baskin* ed i campionati in Italia sono organizzati da *EISI - Ente Italiano Sport Inclusivi*, Ente di Promozione Paralimpica riconosciuto dal *Comitato Italiano Paralimpico*.

Per approfondire: [baskin.it](https://baskin.it) · [eisi.it](https://eisi.it)

> I loghi «EISI» e «Baskin» sono marchi registrati rispettivamente da Ente
> Italiano Sport Inclusivi e Associazione Baskin.

---

## La PWA

PWA per compilare da **smartphone**, anche **completamente offline**, la
**Griglia di valutazione delle abilità in partita** (ruoli 3, 4 e 5) prevista
dall'*Allegato A al regolamento di gioco - La classificazione dei ruoli nel
Baskin (rev. 1 settembre 2025)*. Pensata per essere ospitata su **GitHub Pages**.

<p align="center">
  <a href="https://uncledan.github.io/classificazione-baskin-eisi-pwa/pwa/"><img src="https://img.shields.io/badge/%E2%96%B6%20Apri%20la%20PWA-2962FF?style=for-the-badge&logoColor=white" alt="Apri la PWA"></a>
</p>

### Funzioni

- **Sessione**: si sceglie se la sessione è di **Griglia** (valutazione delle
  abilità in partita) o di **Percorsi** (A, B, C). Numero di giocatori
  consigliato: **4** per la griglia, **20** per i percorsi.
- **Inserimento dei giocatori**: squadra e numero di maglia obbligatori,
  cognome e nome, data di nascita e sesso facoltativi (il sesso serve per il
  Percorso B e viene chiesto all'avvio del B se manca); per la griglia anche
  il **colore della maglia** (selettore del Tabellone Baskin EISI: otto colori
  base più colore personalizzato) e il ruolo attuale. Dopo ogni inserimento
  l'app chiede se aggiungere un altro giocatore, fino alla risposta "No" o al
  numero consigliato; oltre si può ancora aggiungere dalla pulsantiera, con
  richiesta di conferma ogni volta.
- **Pulsantiera giocatori**: un pulsante per giocatore con stato,
  punteggio/esito e pulsante di stampa; nelle sessioni Griglia è nel colore
  della maglia, nelle sessioni Percorsi è bluette (M) o fucsia (F) secondo il
  sesso. Con più di 6 giocatori la pulsantiera diventa compatta.
- **Griglia**: menu delle cinque abilità più la voce Malus; ogni abilità si
  apre, si sceglie il livello, si **conferma** e si torna al menu; calcolo
  automatico (malus solo nella fascia prevista), confronto con il ruolo
  attuale, **conferma finale** con richiesta di conferma e poi stampa.
- **Percorsi**: per ogni giocatore scelta del percorso, menu delle tre prove,
  prova con **cronometro a 7 segmenti** (cifre del Tabellone; avvio/arresto
  anche toccando il display, schermo sempre acceso durante la misura) o tempo
  inserito a mano, criteri con punteggio automatico e **Conferma**. Esito
  secondo le tabelle "In sintesi": A → Ruolo 3, Ruolo 4 o Percorso C;
  B → Ruolo 4, Ruolo 4 da monitorare o Ruolo 5; C → verifica 3/4 (soglia 20")
  o 2/2R (soglia 40") su due prove su tre. Dopo la conferma finale si attiva la
  stampa e si può avviare il percorso successivo per lo stesso giocatore
  (A → B oppure A → C).
- **Stampa**: scheda risultati della griglia o scheda del percorso, da stampare
  / salvare come PDF o da scaricare come **HTML autonomo**. L'app tiene conto
  di cosa è già stato stampato: quando si chiude la sessione, se ne inizia
  un'altra o si esce dall'app con il tasto Indietro dalla home, chiede se
  stampare le valutazioni confermate rimanenti (un'unica stampa, una scheda per
  pagina). Riaprendo l'app, la home segnala le valutazioni ancora da stampare.
- **Aiuti contestuali** (pulsante **?**): livelli con il profilo di ruolo,
  esempi per ruolo dalla *Tabella delle casistiche in forma estesa*, note della
  legenda pertinenti, soglie, schemi e tabelle dei percorsi.
- **Testo integrale** dell'Allegato A, con indice, tabelle, esempi di calcolo e
  schemi dei percorsi A, B e C.
- **Archivio** delle griglie e dei percorsi confermati, con **media matematica**
  delle valutazioni dello stesso giocatore (squadra + numero), ristampa ed
  esportazione/importazione in JSON.

### Privacy

Tutti i dati restano sul dispositivo (memoria del browser): nessun dato viene
inviato in rete.

---

## Struttura

```
pwa/
  index.html              schermate + testo integrale + guida all'uso
  manifest.webmanifest
  service-worker.js       cache-first, offline completo
  css/styles.css
  js/data.js              testi della griglia, forma estesa, legenda, malus
  js/logos.js             loghi SVG come data URI (per l'export HTML)
  js/ctl.js               elenchi predefiniti di Sezioni Territoriali e CTL
  js/elenchi.js           elenchi squadre, CTL e Sezioni, import/export XLSX
  js/xlsx.js              lettura/scrittura XLSX senza librerie
  js/app.js               logica (griglia, archivio, stampa, invio alla CTL)
  js/seg.js               display a 7 segmenti (dal Tabellone)
  js/percorsi-data.js     tabelle di valutazione dei percorsi
  js/percorsi.js          percorsi A, B, C e cronometro
  icons/                  icone PWA e loghi vettoriali (logos/)
  img/doc/                figure del testo integrale
docs/guida-it.md          guida all'uso (copia integrata in index.html)
tools/genera-guida.py     rigenera la guida integrata dal markdown
  js/nativo.js            adattamenti per le app Android/iOS (Capacitor)
.github/workflows/pages.yml  pubblicazione su GitHub Pages
```

## Guida all'uso

Le istruzioni complete sono nella [Guida all'uso](docs/guida-it.md). La stessa guida è
integrata nell'app (**Guida all'uso** nella schermata iniziale e in Informazioni),
disponibile offline. Le due copie devono restare allineate: dopo aver modificato il
markdown, `python3 tools/genera-guida.py` rigenera la schermata `scr-guida` di
`pwa/index.html`.

## Squadre, CTL e Sezioni

Nella schermata **Squadre, CTL e Sezioni** ogni utente gestisce sul proprio dispositivo:

- l'elenco delle **squadre**, con nome e due colori di maglia;
- l'elenco delle **CTL**, una per Sezione Territoriale, con nome libero ed e-mail
  facoltativa (se all'invio si sceglie una CTL senza e-mail, l'app avvisa);
- l'elenco delle **Sezioni Territoriali**, usato dalla tendina del giocatore.

Una CTL e una Sezione possono essere **predefinite** (stellina nell'elenco,
casella nella scheda, colonna `predefinita` in Excel): la Sezione è proposta per
i nuovi giocatori, la CTL all'invio. Con una sola squadra in elenco, la squadra
viene proposta in automatico, modificabile. Tutti gli elenchi si importano ed esportano
in **XLSX** (primo foglio, intestazione facoltativa; in import anche CSV), con
lettura e scrittura in JavaScript senza librerie (`pwa/js/xlsx.js`):

| Elenco | Colonne |
|---|---|
| Squadre | `nome` · `colore1` · `colore2` (colori `#rrggbb` o per nome: rosso, blu, bianco…) |
| CTL | `nome` · `email` (facoltativa) · `sezione` · `predefinita` (sì / x / 1) |
| Sezioni | `nome` · `predefinita` (sì / x / 1) |

Gli elenchi **standard** (le 14 Sezioni Territoriali e una CTL per Sezione,
con l'e-mail della sola CTL Emilia-Romagna; Sezione e CTL predefinite:
Emilia-Romagna) sono in `pwa/js/ctl.js`.

## App Android e iOS (sperimentale)

Dallo stesso repository si compilano anche le app native, con
[Capacitor](https://capacitorjs.com): impacchettano la cartella `pwa/` così com'è,
con le stesse funzioni della PWA. Nell'app nativa `pwa/js/nativo.js` sostituisce
le parti che nella WebView non funzionano:

- **stampa** con il plugin locale `Stampa` (Android `PrintManager`, iOS
  `UIPrintInteractionController`): stampante o «Salva come PDF»;
- **file** (HTML, XLSX, archivio) e **invio alla CTL**: salvati nella cache e passati
  alla condivisione di sistema (plugin `@capacitor/filesystem` e `@capacitor/share`);
- niente service worker né «Installa app»; «Verifica aggiornamenti» apre le release.

| Piattaforma | Workflow | Risultato |
|---|---|---|
| Android | `.github/workflows/app-android.yml` (Linux) | APK debug sempre; APK release firmato se ci sono i secret `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` |
| iOS | `.github/workflows/app-ios.yml` (macOS) | `.ipa` **non firmato** e build per Simulatore — **solo a mano** (Actions → App iOS → Run workflow) finché non c'è un certificato Apple; per la compilazione automatica togliere il commento al blocco `push:` |

Le app non si compilano più a ogni push: si creano con il workflow **Release**
(Actions → Release → Run workflow), che crea il tag `v…` e avvia la build sul tag
con l'interruttore **App Android** (e **App iOS** quando ci sarà il certificato).
Gli APK finiscono nella release del tag, che per le versioni di prova (`aN`, `bN`,
`RCN`, es. `v26.0b19`) è una pre-release; ogni esecuzione li lascia anche tra gli
artifact. Lanciando a mano il workflow di un'app si ottengono solo gli artifact.

- **Android**: dal telefono, apri la release della versione e scarica l'APK
  (consenti l'installazione da questa fonte).
- **iOS**: senza account Apple Developer l'app non si può firmare in automatico.
  L'`.ipa` non firmato si installa con un tool di sideload (Sideloadly, AltStore)
  e un Apple ID gratuito, con durata di 7 giorni. Per TestFlight/App Store servono
  l'account Apple Developer, il certificato e il profilo di provisioning.

Struttura e comandi (servono Node.js 22, per Android JDK 21 e Android Studio, per
iOS un Mac con Xcode):

```
package.json, capacitor.config.json   configurazione Capacitor (webDir: pwa)
android/                              progetto Android (StampaPlugin.java)
ios/                                  progetto iOS (StampaPlugin.swift)
assets/                               sorgenti di icone e splash
tools/versione-app.mjs                versione app = APP_VERSION
```

```bash
npm ci
npm run android     # versione + cap sync + apre Android Studio
npm run ios         # versione + cap sync + apre Xcode
```

La versione delle app segue `APP_VERSION` (vedi [Versioni](#versioni)): `26.0b19` diventa
versionName `26.0b19` e versionCode `260000019` (la `26.0` finale `260000099`, la `26.0.1`
`260001099`); su iOS `26.0.0`, build `260000019`. Il build Android controlla che
versionName e versionCode rispettino la formula. Identificativo, uguale su Android e iOS: `io.github.baskinsoftware.classificazionebaskineisi`, cioè il dominio dell'organizzazione `baskinsoftware.github.io` rovesciato più il nome dell'app (senza trattini né underscore, l'unica forma valida su entrambe le piattaforme).

## Release

Le release si creano a mano da **Actions → Release → Run workflow**
(`.github/workflows/release.yml`, uguale a quello del Tabellone):

- **titolo** = primo titolo `#` del README + spazio + `vX.Y` (es. *Classificazione Baskin EISI (PWA) v26.1*);
- **tag** = `vX.Y`;
- **testo** = il README dalla prima riga non vuota dopo il titolo.

Parametri: versione (obbligatoria), ramo (predefinito `main`), README, prefisso del
tag, pre-release, bozza. Il tag creato dal workflow non avvia da solo gli altri
workflow, per questo le opzioni **App Android** (attiva) e **App iOS** (spenta
finché manca il certificato Apple) li lanciano sul nuovo tag, che allega l'APK
alla release.

## Versioni

Regola di versioning comune a tutti i progetti Baskin (v3):

- **Formato** `AA.M[.P[.W]]`: anno a due cifre, numero progressivo di release
  dell'anno (da 0, non è il mese), patch, e W solo per i fix del wrapper
  (app Android/iOS) quando la PWA non cambia. Le cifre in coda si scrivono solo se
  servono: `26.0`, `26.0.1`, `26.0.0.1`.
- **Pre-release**: alpha `aN`, beta `bN`, release candidate `RCN` (es. `26.0b19`);
  sono pre-release su GitHub e la PWA va in `/beta`. La finale non ha suffisso.
- **Tag** `v` + versione (`v26.0b19`, `v26.0`); i vecchi tag non si rinominano.
- **Build** Android/iOS: `(((AA×100 + M)×100 + P)×10 + W)×100 + contatore`, con
  contatore 01–98 per le pre-release e 99 per la finale; su iOS la versione visibile
  è `AA.M.P`.

Finché non esce la prima finale, la versione di destinazione è `26.0`: le beta
26.1b1–b6 della numerazione precedente sono state rinumerate di seguito
(26.0b13–b18) e la serie continua da `26.0b19`.

A ogni build aggiornare insieme `APP_VERSION` in `pwa/js/app.js` e `CACHE_NAME`
in `pwa/service-worker.js`, poi `node tools/versione-app.mjs`, con il tag git
corrispondente (`v26.0b19`, poi `v26.0`).

## Pubblicazione su GitHub Pages

Il workflow `.github/workflows/pages.yml` pubblica a ogni push su `main` o `beta`:

- ramo `main` → radice del sito (`/`);
- ramo `beta` → `/beta/`;
- se `main` non contiene `pwa/index.html`, la radice `/` reindirizza a `/beta/`.

Il vecchio indirizzo `/pwa/` reindirizza a `/` (o a `/beta/` se `main` non ha l'app),
così link e segnalibri precedenti restano validi; chi aveva installato l'app da
`/pwa/` riceve un service worker che si disinstalla e porta al nuovo indirizzo
(conviene reinstallare l'app dalla nuova pagina).

Il sito è sempre ricostruito con l'ultimo stato di entrambi i rami, quindi
pubblicare uno non cancella l'altro. Prima del primo deploy, nel repository:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions**;
2. **Settings → Environments → github-pages → Deployment branches**: consentire
   sia `main` sia `beta`.

## Segnalazioni

Dall'app, in **Informazioni → Segnala un problema**, si apre una nuova issue su
<https://github.com/baskinsoftware/classificazione-baskin-eisi-pwa/issues> con
versione, modalità e browser già compilati (nessun dato dei giocatori).

## Licenza

MIT — vedi [LICENSE](LICENSE). Il testo dell'Allegato A e i loghi restano dei
rispettivi titolari.
