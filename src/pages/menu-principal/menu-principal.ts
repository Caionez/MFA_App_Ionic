import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { BaixarArquivoPage } from '../baixar-arquivo/baixar-arquivo';
import { VisualizarDadosPage } from '../visualizar-dados/visualizar-dados';


@Component({
  selector: 'menu-principal',
  templateUrl: 'menu-principal.html'
})
export class MenuPrincipalPage {
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {    
  }
  
  navegarParaBaixarArquivo() {
    this.navCtrl.push(BaixarArquivoPage);
  }

  navegarParaVisualizarDados() {
    this.navCtrl.push(VisualizarDadosPage)
  }
}