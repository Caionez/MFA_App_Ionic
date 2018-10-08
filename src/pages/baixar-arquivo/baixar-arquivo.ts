import { Component } from "@angular/core";
import {
  NavController,
  ToastController,
  LoadingController,
  Platform,
  AlertController
} from "ionic-angular";

import { BLE } from "@ionic-native/ble";
import { File } from "@ionic-native/file";
import { Diagnostic } from "@ionic-native/diagnostic";

@Component({
  selector: "baixar-arquivo",
  templateUrl: "baixar-arquivo.html"
})
export class BaixarArquivoPage {
  plataformaCordova: boolean;
  ble: BLE;
  file: File;
  diagCtrl: Diagnostic;
  streamBluetooth: string;
  estadoBluetooth: string;
  conectadoArduino: boolean;

  constructor(
    public navCtrl: NavController,
    public plt: Platform,
    public toastCtrl: ToastController,
    public loadingCtrl: LoadingController,
    public alertCtrl: AlertController
  ) {
    this.plataformaCordova = plt.is("cordova");
    this.ble = new BLE();
    this.file = new File();
    this.diagCtrl = new Diagnostic();

    this.streamBluetooth = "";
    this.diagCtrl.registerBluetoothStateChangeHandler(state => this.atualizarLabelEstadoBT(state));
  }

  ionViewDidEnter() {    
    this.verificarPermissoes();
  }

  /*
  service
  0000ffe0-0000-1000-8000-00805f9b34fb
  characteristic
  0000ffe1-0000-1000-8000-00805f9b34fb
  */

  verificarPermissoes() {
    this.diagCtrl.getBluetoothState().then(
      state => {
        if (state == this.diagCtrl.bluetoothState.POWERED_OFF){
          const confirm = this.alertCtrl.create({
            title: "Ativar Bluetooth?",
            message:
              "Para obter o Arquivo do Arduino, é necessário ativar o Bluetooth. \nDeseja ativar o Bluetooth?",
            buttons: [
              {
                text: "Não",
                handler: () => {
                  this.mostrarToast("Não é possível obter o arquivo sem o Bluetooth", 3000);
                }
              },
              {
                text: "Sim",
                handler: () => {
                  const loader = this.loadingCtrl.create({
                    content: "Ativando Bluetooth..."
                  });
                  loader.present().then(result => {
                    this.diagCtrl.setBluetoothState(true).then(result => { loader.dismiss(); });
                  });
                }
              }
            ]
          });
          confirm.present();
        }
        else if (state == this.diagCtrl.bluetoothState.UNAUTHORIZED) {
          this.diagCtrl.requestBluetoothAuthorization().then(result => this.mostrarToast(result, 3000));
        }
        else if (state == this.diagCtrl.bluetoothState.UNSUPPORTED) {
          this.mostrarToast("Bluetooth não suportado nesse dispositivo", 3000);
        }        
        else if (state == this.diagCtrl.bluetoothState.POWERED_ON) {
          this.mostrarToast("Bluetooth já ativado", 3000);
        }

        this.solicitarPermissoes();
        this.atualizarLabelEstadoBT(state);
      });
  }

  solicitarPermissoes() {
    this.diagCtrl
      .requestRuntimePermissions([
        this.diagCtrl.permission.ACCESS_COARSE_LOCATION,
        this.diagCtrl.permission.READ_EXTERNAL_STORAGE,
        this.diagCtrl.permission.WRITE_EXTERNAL_STORAGE
      ])
      .then(
        result => console.log("Permissões concedidas"),
        rejection =>
          this.mostrarToast(
            "É necessário conceder as permissões para obter o arquivo",
            3000
          )
      );
  }

  abrirConfiguracoesBluetooth() {
  this.diagCtrl.switchToBluetoothSettings();    
  }

  atualizarLabelEstadoBT(state: String) {
    if (this.plataformaCordova) {      
      switch (state) {
        case this.diagCtrl.bluetoothState.POWERED_ON:
          this.estadoBluetooth = "Ligado";
          break;
        case this.diagCtrl.bluetoothState.POWERED_OFF:
          this.estadoBluetooth = "Desligado";
          break;
        case this.diagCtrl.bluetoothState.POWERING_ON:
          this.estadoBluetooth = "Ligando";
          break;
        default:
          this.estadoBluetooth = "???";
      }
    } else this.estadoBluetooth = "Web";
  }

  conectarDispositivo() {

    const loader = this.loadingCtrl.create({
      content: "Conectando..."
    });
    loader.present();

    this.ble.connect("00:15:83:30:BA:04").subscribe(
      peripheralData => {
        console.log(JSON.stringify(peripheralData));
        loader.dismiss();
        this.conectadoArduino = true;

      },
      peripheralData => {
        console.log("Desconectado");
        loader.dismiss();
        this.conectadoArduino = false;
        this.mostrarToast("Não foi possível conectar ao Arduino", 3000);
      }
    );

    /*
    this.objBLE.scan(['0000ffe0-0000-1000-8000-00805f9b34fb'], 10).subscribe(device =>
      {
        console.log(JSON.stringify(device));
      });
      */
  }

  transferirArquivo() {
    //Enviar para arduino ate onde já foi transferido
    /*    this.ble
          .write(
            "00:15:83:30:BA:04",
            "0000ffe0-0000-1000-8000-00805f9b34fb",
            "0000ffe1-0000-1000-8000-00805f9b34fb",
    
            this.stringToBytes("ultimalinha")
          )
          .then
          //Iniciar a transmissão a partir daqui
          ();*/
    this.streamBluetooth = "";
    const loader = this.loadingCtrl.create({
      content: "Transferindo arquivo...",
      duration: 15000
    });
    loader.present();

    this.ble
      .startNotification(
        "00:15:83:30:BA:04",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "0000ffe1-0000-1000-8000-00805f9b34fb"
      )
      .subscribe(result => {
        console.log(this.bytesToString(result));

        this.streamBluetooth += this.bytesToString(result);
        
        if (this.verificarArquivoCompleto()) {

          loader.dismiss();

          this.salvarStreamEmArquivo();
        }        
      }, error => this.mostrarToast("Erro ao transferir arquivo", 3000));
  }

  testeSalvaArquivo() {
    this.streamBluetooth = `#FNA#dados.csv#FNA#
#SOF#
01/01/2018 - 01:00;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;
02/01/2018 - 01:00;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;
03/01/2018 - 01:00;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.70;
04/01/2018 - 01:00;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;
05/01/2018 - 01:00;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;0.1;0.2;
#EOF#`;

    if (this.verificarArquivoCompleto()) {
      this.salvarStreamEmArquivo();
    }
  }

  desconectar() {
    this.ble
      .disconnect("00:15:83:30:BA:04")
      .then(response => console.log("Desconectado pelo botão"));
  }

  verificarArquivoCompleto(): boolean {
    if (
      this.streamBluetooth.indexOf("#FNA#") != -1  &&
      this.streamBluetooth.indexOf("#EOF#") != -1 &&
      this.streamBluetooth.indexOf("#SOF#") != -1
    ) {
      this.mostrarToast("Arquivo completo", 1000)
      return true;
    } else {
      //this.mostrarToast("Arquivo incompleto", 1000)
      return false;
    }
  }

  bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
  }

  stringToBytes(string): ArrayBuffer {
    var array = new Uint8Array(string.length);
    for (var i = 0, l = string.length; i < l; i++) {
      array[i] = string.charCodeAt(i);
    }
    return array.buffer;
  }

  salvarStreamEmArquivo() {
    let nomeArquivo: string = /^(#FNA#)(\w*\.\w*)(#FNA#)/.exec(
      this.streamBluetooth
    )[2]; //Extraindo o grupo 2 (Nome do arquivo)
    let conteudoArquivo: string = this.streamBluetooth
      .substr(this.streamBluetooth.indexOf("#SOF#") + 5)
      .replace("#EOF#", "")
      .trim();

    this.file
      .writeFile(
        this.file.externalRootDirectory,
        nomeArquivo,
        this.stringToBytes(conteudoArquivo),
        { replace: true }
      )
      .then(result => {
        console.log("Arquivo transferido." + JSON.stringify(result));
        this.mostrarToast(
          "Arquivo '" + nomeArquivo + "' transferido com sucesso!",
          3000
        );
      })
      .catch(result => {
        console.log("Erro ao transferir arquivo!" + JSON.stringify(result));
        this.mostrarToast("Erro ao transferir arquivo!", 3000);
      });
  }

  mostrarToast(mensagem: string, duracao: number) {
    const objToast = this.toastCtrl.create({
      message: mensagem,
      duration: duracao
    });
    objToast.present();
  }

  testeConectarArduino() {
    const loader = this.loadingCtrl.create({
      content: "Conectando...",
      duration: 2000
    });
    loader.present().then(result => {
      this.conectadoArduino = true;
    });
  }

  testeDesconectarArduino() {
    const loader = this.loadingCtrl.create({
      content: "Desconectando...",
      duration: 2000
    });
    loader.present().then(result => {
      this.conectadoArduino = false;
    });
  }
}
