#!/usr/bin/env python3
# genera-guida.py by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45
"""Rigenera la schermata «Guida all'uso» (scr-guida) di pwa/index.html da
docs/guida-it.md, così le due copie restano allineate.
Uso (dalla radice del repository):  python3 tools/genera-guida.py
Richiede il pacchetto «markdown» (pip install markdown)."""
import pathlib, re, sys
import markdown

radice = pathlib.Path(__file__).resolve().parent.parent
md = (radice / 'docs' / 'guida-it.md').read_text(encoding='utf-8')
# nell'app non servono il rimando al README e la frase sulla guida integrata
md = re.sub(r" Per l'installazione, la pubblicazione e i dettagli tecnici vedi il \[README\]\(\.\./README\.md\)\.", '', md)
md = re.sub(r"\nLa stessa guida è integrata nell'app[^\n]*\n", '\n', md)
corpo = markdown.markdown(md.split('\n', 1)[1]).replace('<hr />', '')   # senza il titolo H1

html_path = radice / 'pwa' / 'index.html'
html = html_path.read_text(encoding='utf-8')
nuovo, n = re.subn(r'(<article class="card doc guida">\n).*?(\n    </article>)',
                   lambda m: m.group(1) + corpo + m.group(2), html, flags=re.S)
if n != 1:
    sys.exit('Schermata scr-guida non trovata in pwa/index.html')
html_path.write_text(nuovo, encoding='utf-8')
print('Guida aggiornata in', html_path.relative_to(radice))
