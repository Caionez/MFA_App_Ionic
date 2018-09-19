import { Component } from '@angular/core';
import { BLE } from '@ionic-native/ble';

@Component({
  selector: 'baixar-arquivo',
  templateUrl: 'baixar-arquivo.html'
})
export class BaixarArquivoPage {

  objBLE: BLE;
  resultado: string;

  constructor() {
    //this.objBLE = ble;
    this.resultado = "";
  }

  /*
  service
  0000ffe0-0000-1000-8000-00805f9b34fb
  characteristic
  0000ffe1-0000-1000-8000-00805f9b34fb
  */


  conectarDispositivo() {

    this.objBLE = new BLE();

    this.objBLE.connect('00:15:83:30:BA:04').subscribe(
      peripheralData => { console.log(peripheralData); this.resultado += JSON.stringify(peripheralData); },
      peripheralData => { console.log('Desconectado'); this.resultado += 'Desconectado'; }
    );

    /*
    this.objBLE.scan(['0000ffe0-0000-1000-8000-00805f9b34fb'], 10).subscribe(device =>
      {
        console.log(JSON.stringify(device));
      });
      */
  }

  transferirArquivo() {
    this.objBLE.startNotification('00:15:83:30:BA:04',
      '0000ffe0-0000-1000-8000-00805f9b34fb',
      '0000ffe1-0000-1000-8000-00805f9b34fb').subscribe(
        result => {
          console.log(this.bytesToString(result));
          this.resultado += this.bytesToString(result);
        }
      );
  }

  desconectar() {
    this.objBLE.disconnect('00:15:83:30:BA:04').then(response => console.log("Desconectado pelo botão"));
  }


  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }
}
