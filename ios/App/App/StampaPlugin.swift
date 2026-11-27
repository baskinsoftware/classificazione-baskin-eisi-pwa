// StampaPlugin.swift by Daniele Lolli (UncleDan) feat. Claude AI - Release 26.0b20 - 2026-11-27 15-37-45
import Capacitor
import UIKit

/// Stampa nativa delle schede: riceve il documento HTML completo (loghi come
/// data URI) e apre la stampa di iOS (stampante AirPrint o «Salva su File» in PDF).
@objc(StampaPlugin)
public class StampaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StampaPlugin"
    public let jsName = "Stampa"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "stampa", returnType: CAPPluginReturnPromise)
    ]

    @objc func stampa(_ call: CAPPluginCall) {
        let html = call.getString("html") ?? ""
        let nome = call.getString("nome") ?? "Classificazione Baskin"
        DispatchQueue.main.async {
            let info = UIPrintInfo(dictionary: nil)
            info.outputType = .general
            info.jobName = nome
            let pc = UIPrintInteractionController.shared
            pc.printInfo = info
            pc.printFormatter = UIMarkupTextPrintFormatter(markupText: html)
            let fine: UIPrintInteractionController.CompletionHandler = { _, completata, _ in
                call.resolve(["aperta": true, "completata": completata])
            }
            if UIDevice.current.userInterfaceIdiom == .pad, let view = self.bridge?.viewController?.view {
                let r = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 1, height: 1)
                _ = pc.present(from: r, in: view, animated: true, completionHandler: fine)
            } else {
                _ = pc.present(animated: true, completionHandler: fine)
            }
        }
    }
}

/// Controller principale: registra i plugin locali dell'app.
class MainViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(StampaPlugin())
    }
}
