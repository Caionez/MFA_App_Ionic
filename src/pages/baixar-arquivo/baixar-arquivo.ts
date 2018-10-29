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
  versaoSistema: number;
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
    this.versaoSistema = plt.version().major;
    this.ble = new BLE();
    this.file = new File();
    this.diagCtrl = new Diagnostic();

    this.streamBluetooth = "";
    this.diagCtrl.registerBluetoothStateChangeHandler(state => this.atualizarLabelEstadoBT(state));

    console.log(this.versaoSistema);
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

    if (this.versaoSistema == 8) {
      this.testeSalvaArquivo();
      loader.dismiss();
      return;
    }

    this.ble.connect("00:15:83:30:BA:04").subscribe(
      peripheralData => {
        console.log(JSON.stringify(peripheralData));
        loader.dismiss();
        this.conectadoArduino = true;
      },
      error => {
        console.log("Desconectado: " + error);
        loader.dismiss();
        this.conectadoArduino = false;
        this.mostrarToast("Não foi possível conectar ao Arduino", 3000);
      }
    );
  }

  transferirArquivo() {
    this.streamBluetooth = "";
    const loader = this.loadingCtrl.create({
      content: "Pressione o botão no Arduino para iniciar..."
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
          loader.setContent("Salvando Arquivo...");
          this.salvarStreamEmArquivo();
          loader.dismiss();
        }
        else {
          loader.setContent("Transferindo Arquivo...");
        }
        
      }, error => this.mostrarToast("Erro ao transferir arquivo", 3000));
  }

  testeSalvaArquivo() {
    this.streamBluetooth = this.arquivoMock();

    if (this.verificarArquivoCompleto()) {
      this.salvarStreamEmArquivo();
    }
  }

  desconectar() {
    const loader = this.loadingCtrl.create({
      content: "Desconectando..."      
    });
    loader.present();
    
    this.ble
      .disconnect("00:15:83:30:BA:04")
      .then(response => {
        console.log("Desconectado pelo botão");
        this.conectadoArduino = false;
        loader.dismiss();
      });
  }

  verificarArquivoCompleto(): boolean {
    if (this.streamBluetooth.indexOf("#FNA#") != -1  &&
      this.streamBluetooth.indexOf("#EOF#") != -1 &&
      this.streamBluetooth.indexOf("#SOF#") != -1) {
      this.mostrarToast("Transmissão completa", 1000)
      return true;
    } 
    else return false;
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
        this.streamBluetooth = "";
      })
      .catch(result => {
        console.log("Erro ao transferir arquivo!" + JSON.stringify(result));
        this.mostrarToast("Erro ao transferir arquivo!", 3000);
        this.streamBluetooth = "";
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

  arquivoMock(): string {
    return `#FNA#dados.csv#FNA#
#SOF#    
2018-09-20T00:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20T01:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20T02:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20T03:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20T04:00;8.70;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128
2018-09-20T05:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T06:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T07:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T08:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T09:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T10:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T11:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T12:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20T13:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20T14:00;8.70;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128
2018-09-20T15:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T16:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T17:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T18:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T19:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T20:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T21:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T22:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20T23:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-21T00:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-21T01:00;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119
2018-09-21T02:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;0.1;0.2;0.1;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134
2018-09-21T03:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;0.1;0.2;0.1;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118
#EOF#`;
  }
}
