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
    this.atualizarLabelEstadoBT();

    //debugar
    this.verificarPermissoes();

    this.diagCtrl.registerBluetoothStateChangeHandler(this.atualizarLabelEstadoBT);
  }

  /*
  service
  0000ffe0-0000-1000-8000-00805f9b34fb
  characteristic
  0000ffe1-0000-1000-8000-00805f9b34fb
  */

  verificarPermissoes() {

    if (!this.verificarSePossuiPermissoes()) {
      const confirm = this.alertCtrl.create({
        title: "Permissões necessárias",
        message:
          "Para obter o Arquivo do Arduino, é necessário conceder permissões de Acesso a Localização e a Memória. \nConceda-as a seguir para continuar",
        buttons: [
          {
            text: "Ok",
            handler: () => {this.solicitarPermissoes();}
          }
        ]
      });
      confirm.present();
    }

    this.diagCtrl.isBluetoothAvailable().then(
      available => {
        this.atualizarLabelEstadoBT();
      },
      unavailable => {
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
      });
  }

  verificarSePossuiPermissoes(): boolean {
    if(this.diagCtrl.isLocationAuthorized().then(result => {return true}, error => {return false}) &&
      (this.diagCtrl.isExternalStorageAuthorized().then(result => {return true}, error => {return false})))
        return true;
      else 
        return false;
  }
  solicitarPermissoes() {
    this.diagCtrl
      .requestRuntimePermissions([
        this.diagCtrl.permission.ACCESS_COARSE_LOCATION,
        this.diagCtrl.permission.READ_EXTERNAL_STORAGE,
        this.diagCtrl.permission.WRITE_EXTERNAL_STORAGE
      ])
      .then(
        result => this.mostrarToast("Permissões concedidas", 3000),
        rejection =>
          this.mostrarToast(
            "É necessário conceder as permissões para obter o arquivo",
            3000
          )
      );
  }

  abrirConfiguracoesBluetooth() {
    //Solicitar permissoes ao acessar tela (nao solicitar do bluetooth, apenas ativar ele)
   /* this.diagCtrl
      .requestRuntimePermissions([
        this.diagCtrl.permission.ACCESS_COARSE_LOCATION,
        this.diagCtrl.permission.READ_EXTERNAL_STORAGE,
        this.diagCtrl.permission.WRITE_EXTERNAL_STORAGE
      ])
      .then(
        result => {
          this.mostrarToast("PERMISSOES" + result, 3000);
        },
        rejection => this.mostrarToast("rejection2" + rejection, 3000)
      );
*/
    // this.diagCtrl.requestLocationAuthorization().then(
    //   result => {
    //     this.mostrarToast("reqLocAuth " + result, 3000);
    //   },
    //   rejection => this.mostrarToast("rejection2" + rejection, 3000)
    //  );
  }

  atualizarLabelEstadoBT() {
    if (this.plataformaCordova) {
      this.diagCtrl
        .getBluetoothState()
        .then(state => {
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
        })
        .catch(e => console.error(e));
    } else this.estadoBluetooth = "Web";
  }

  conectarDispositivo() {
    this.ble.connect("00:15:83:30:BA:04").subscribe(
      peripheralData => {
        console.log(JSON.stringify(peripheralData));
      },
      peripheralData => {
        console.log("Desconectado");
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
    this.ble
      .write(
        "00:15:83:30:BA:04",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "0000ffe1-0000-1000-8000-00805f9b34fb",

        this.stringToBytes("ultimalinha")
      )
      .then
      //Iniciar a transmissão a partir daqui
      ();

    this.ble
      .startNotification(
        "00:15:83:30:BA:04",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "0000ffe1-0000-1000-8000-00805f9b34fb"
      )
      .subscribe(result => {
        console.log(this.bytesToString(result));

        if (this.verificarArquivoCompleto()) {
          this.salvarStreamEmArquivo();
        }
        this.streamBluetooth += this.bytesToString(result);
      });
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
      this.streamBluetooth.startsWith("#FNA#") &&
      this.streamBluetooth.endsWith("#EOF#") &&
      this.streamBluetooth.indexOf("#SOF#") > 0
    ) {
      return true;
    } else return false;
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
