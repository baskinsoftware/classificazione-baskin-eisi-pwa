/* nativo.js by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45 */
/* =====================================================================
   Classificazione Baskin EISI - adattamenti per l'app Android/iOS (Capacitor)
   Nel browser (PWA) questo file non fa nulla. Nell'app nativa:
   - stampa: plugin «Stampa» (PrintManager / UIPrintInteractionController),
     perché nella WebView window.print() non funziona (Android) o è limitato;
   - file (HTML, CSV, archivio JSON): salvati nella cache e passati alla
     condivisione di sistema (Salva su Drive/File, invia per mail, WhatsApp…);
   - invio alla CTL con allegato: Web Share sostituito dal plugin Share.
   ===================================================================== */
(function(){
  if(!NATIVO) return;
  const P = window.Capacitor.Plugins;
  document.documentElement.classList.add('nativo');

  const base64 = blob => new Promise((ok, ko) => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result).split(',')[1] || '');
    fr.onerror = ko; fr.readAsDataURL(blob);
  });
  async function salvaInCache(blob, nome){
    const r = await P.Filesystem.writeFile({ path: nome, data: await base64(blob), directory: 'CACHE' });
    return r.uri;
  }

  /* download -> condivisione di sistema */
  window.scarica = async function(blob, nome){
    try{
      const uri = await salvaInCache(blob, nome);
      await P.Share.share({ title: nome, files: [uri], dialogTitle: 'Salva o invia ' + nome });
    }catch(e){ if(!/cancel/i.test(String(e && e.message))) toast('Impossibile condividere il file: ' + (e && e.message || e)); }
  };

  /* Web Share (usato da «Invia alla CTL») -> plugin Share */
  navigator.canShare = () => true;
  navigator.share = async function({ files = [], title = '', text = '' } = {}){
    const uris = [];
    for(const f of files) uris.push(await salvaInCache(f, f.name));
    try{ await P.Share.share({ title, text, files: uris.length ? uris : undefined, dialogTitle: title }); }
    catch(e){ const err = new Error(e && e.message || 'annullato'); err.name = /cancel/i.test(err.message) ? 'AbortError' : 'Error'; throw err; }
  };

  /* stampa -> plugin nativo «Stampa»; ripiego: file HTML condiviso */
  window.stampaSchede = async function(lista, titoloFile){
    if(!lista.length) return;
    const html = docHtml(lista, titoloFile);
    try{
      if(!P.Stampa) throw new Error('plugin di stampa non disponibile');
      await P.Stampa.stampa({ html, nome: titoloFile });
    }catch(e){
      toast('Stampa non disponibile: condivido il file da aprire e stampare');
      await window.scarica(new Blob([html], { type: 'text/html' }), titoloFile + '.html');
    }
    lista.forEach(x => x.item.stampata = true);
    salvaSess();
    const scr = document.body.dataset.screen;
    if(scr === 'sessione') renderSessione(); else if(scr === 'home') renderHome();
    else if(scr === 'perc-menu') renderPercMenu(); else if(scr === 'abilita') renderMenuAbilita();
  };
})();
