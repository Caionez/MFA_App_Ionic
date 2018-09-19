import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';


@Component({
  selector: 'menu-principal',
  templateUrl: 'menu-principal.html'
})
export class MenuPrincipalPage {
  
  constructor(public navCtrl: NavController, public navParams: NavParams) {    
  }
}
