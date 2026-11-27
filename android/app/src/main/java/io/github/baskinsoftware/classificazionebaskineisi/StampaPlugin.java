// StampaPlugin.java by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45
package io.github.baskinsoftware.classificazionebaskineisi;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Stampa nativa: nella WebView di Android window.print() non fa nulla.
 * Riceve la scheda come documento HTML completo (loghi inclusi come data URI),
 * la carica in una WebView nascosta e apre la stampa di sistema
 * (stampante o «Salva come PDF»), formato A4.
 */
@CapacitorPlugin(name = "Stampa")
public class StampaPlugin extends Plugin {

    private WebView webStampa; // riferimento tenuto finché la stampa è aperta

    @PluginMethod
    public void stampa(PluginCall call) {
        final String html = call.getString("html", "");
        final String nome = call.getString("nome", "Classificazione Baskin");
        getActivity().runOnUiThread(() -> {
            WebView wv = new WebView(getContext());
            wv.getSettings().setJavaScriptEnabled(false);
            wv.setWebViewClient(new WebViewClient() {
                private boolean avviata = false;
                @Override
                public void onPageFinished(WebView view, String url) {
                    if (avviata) return;
                    avviata = true;
                    PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                    PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(nome);
                    PrintAttributes attr = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .build();
                    pm.print(nome, adapter, attr);
                    JSObject ret = new JSObject();
                    ret.put("aperta", true);
                    call.resolve(ret);
                }
            });
            webStampa = wv;
            wv.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }
}
