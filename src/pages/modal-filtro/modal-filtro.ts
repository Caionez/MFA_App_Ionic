import { Component } from "@angular/core";
import { ViewController } from "ionic-angular";

@Component({
    selector: "modal-filtro",
    templateUrl: "modal-filtro.html"
  })
export class FiltrarDados {
    filtro: { DataInicial: String; DataFinal: String };
  
    constructor(public viewCtrl: ViewController) {
      this.filtro = {
        DataInicial: "",
        DataFinal: ""
      };
    }
  
    dismiss() {      
        let data = { 
            DataInicial: this.filtro.DataInicial != "" ? this.filtro.DataInicial : undefined,
            DataFinal: this.filtro.DataFinal != "" ? this.filtro.DataFinal : undefined
        }      
      this.viewCtrl.dismiss(data);
    }
  }