import { Component } from "@angular/core";
import { NavParams, ViewController } from "ionic-angular";

@Component({
    selector: "modal-filtro",
    templateUrl: "modal-filtro.html"
  })
export class FiltrarDados {
    filtro: { DataInicial: Date; DataFinal: Date };
    // filtrosAplicados: String;

    constructor(public viewCtrl: ViewController, params: NavParams) {
      this.filtro = {
        DataInicial: params.get("DataInicial"),
        DataFinal: params.get("DataFinal")
      };

      // this.filtrosAplicados = this.preencherTextoFiltros();
    }
  
// preencherTextoFiltros(): string {
//   let textoFiltro = "--";

//   if (this.filtro.DataInicial != undefined && this.filtro.DataInicial != "")
//     textoFiltro = new Date(this.filtro.DataInicial).toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

//   if (this.filtro.DataFinal != undefined && this.filtro.DataFinal != "")
//   textoFiltro += " - " + new Date(this.filtro.DataFinal).toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })

//   return textoFiltro;
// }

    dismiss() {
      this.viewCtrl.dismiss();
    }

    aplicarFiltro() {
      this.viewCtrl.dismiss(this.filtro);
    }

    limparFiltro() {
      this.filtro.DataInicial = undefined;
      this.filtro.DataFinal = undefined;
      this.viewCtrl.dismiss(this.filtro);
    }
  }