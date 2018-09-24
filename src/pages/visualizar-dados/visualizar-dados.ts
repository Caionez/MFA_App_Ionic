import { Component } from '@angular/core';
import { RegistroAgua, DadosResumidosAgua } from '../../model/registro-agua';
import { LoadingController, Platform, Loading } from 'ionic-angular';

import { File } from '@ionic-native/file';

@Component({
  selector: 'visualizar-dados',
  templateUrl: 'visualizar-dados.html'
})
export class VisualizarDadosPage {

  plataformaCordova: boolean;
  dadosLidos: boolean;
  filtro: any;
  dados: Array<RegistroAgua>;
  menorDataEncontrada: string;
  maiorDataEncontrada: string;
  dadosFiltrados: Array<RegistroAgua>;
  dadosPorHora: Array<DadosResumidosAgua>;
  dadosPorDia: Array<DadosResumidosAgua>;
  exibirGraficoHora: boolean;
  exibirGraficoDia: boolean;

  parametros: { fluxoTotal: number, maiorFluxo: RegistroAgua, menorFluxo: RegistroAgua };

  file = new File();

  constructor(public loadingCtrl: LoadingController, public plt: Platform) {

    this.filtro = {
      DataInicial: '',
      DataFinal: ''
    }

    this.plataformaCordova = plt.is('cordova');
    this.lineChartData = new Array<any>();
    this.lineChartLabels = new Array<any>();
  }

  filtrarDados() {
    console.log(this.filtro);

    let loading = this.loadingCtrl.create({
      content: 'Lendo Arquivo...'
    });

    loading.present();

    this.parsearArquivo(loading);

    if (this.dadosFiltrados)
      this.calcularParametros(this.dadosFiltrados)
  }

  parsearArquivo(loading: Loading) {
    let linhasArquivo: String[];
    let colunasArquivo: String[];
    let dataRegistro: Date;
    this.dados = new Array<RegistroAgua>();

    if (this.plataformaCordova) {
      this.file.readAsText(this.file.externalRootDirectory, "dados.csv").then(streamArquivo => {
        linhasArquivo = streamArquivo.split('\n');

        if (linhasArquivo)
          linhasArquivo.forEach(coluna => {
            //console.log(coluna);
            colunasArquivo = coluna.split(';');

            colunasArquivo.forEach((coluna: string, indice) => {
              if (indice == 0) {
                let d = coluna.split(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
                dataRegistro = new Date(parseInt(d[1]), parseInt(d[2]) - 1, parseInt(d[3]), parseInt(d[4]), parseInt(d[5]));
              }
              else {
                let registro = new RegistroAgua(dataRegistro, +coluna);
                this.dados.push(registro);
                //console.log(registro);
                //Próximo registro feito após 1 minuto
                dataRegistro = new Date(dataRegistro.getTime() + 60 * 1000);
              }
            });
          });

        this.menorDataEncontrada = this.dados[0].dataRegistro.toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        this.maiorDataEncontrada = this.dados[this.dados.length - 1].dataRegistro.toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        console.log("Cordova: ", this.dados);

        loading.setContent('Filtrando os Dados...')
        this.preencherDadosFiltrados(this.filtro);
        loading.dismiss();
        this.dadosLidos = true;

      }).catch(error => console.log(error));
    }
    else {
      linhasArquivo =
        `2018-09-20 00:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20 01:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20 02:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20 03:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20 04:00;8.70;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128
2018-09-20 05:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 06:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 07:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 08:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 09:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 10:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 11:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 12:00;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129
2018-09-20 13:00;8.74;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134;8.135;8.136;8.137;8.138;8.139;8.140;8.141;8.142;8.143;8.144
2018-09-20 14:00;8.70;8.70;8.71;8.72;8.73;8.74;8.75;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128
2018-09-20 15:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 16:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 17:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 18:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 19:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 20:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 21:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 22:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-20 23:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-21 00:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73
2018-09-21 01:00;8.70;8.70;8.70;8.70;8.70;8.70;8.70;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119
2018-09-21 02:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;0.1;0.2;0.1;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118;8.119;8.120;8.121;8.122;8.123;8.124;8.125;8.126;8.127;8.128;8.129;8.130;8.131;8.132;8.133;8.134
2018-09-21 03:00;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;8.73;8.70;8.70;8.71;8.72;0.1;0.2;0.1;8.76;8.77;8.78;8.79;8.80;8.81;8.82;8.83;8.84;8.85;8.86;8.87;8.88;8.89;8.90;8.91;8.92;8.93;8.94;8.95;8.96;8.97;8.98;8.99;8.100;8.101;8.102;8.103;8.104;8.105;8.106;8.107;8.108;8.109;8.110;8.111;8.112;8.113;8.114;8.115;8.116;8.117;8.118
`.split('\n');

      if (linhasArquivo)
        linhasArquivo.forEach(coluna => {
          //console.log(coluna);
          colunasArquivo = coluna.split(';');

          colunasArquivo.forEach((coluna, indice) => {
            if (indice == 0) {
              dataRegistro = new Date(String(coluna));
            }
            else {
              let registro = new RegistroAgua(dataRegistro, +coluna);
              this.dados.push(registro);
              //console.log(registro);
              //Próximo registro feito após 1 minuto
              dataRegistro = new Date(dataRegistro.getTime() + 60 * 1000);
            }
          })
        });

      this.menorDataEncontrada = this.dados[0].dataRegistro.toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      this.maiorDataEncontrada = this.dados[this.dados.length - 1].dataRegistro.toLocaleDateString('pt-br', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      console.log(this.dados);

      loading.setContent('Filtrando os Dados...')
      this.preencherDadosFiltrados(this.filtro);
      loading.dismiss();
      this.dadosLidos = true;
    }
  }

  preencherDadosFiltrados(filtro: { DataInicial: Date, DataFinal: Date }) {
    this.dadosFiltrados = new Array<RegistroAgua>();

    this.dados.forEach(registro => {
      if ((!filtro.DataInicial || registro.dataRegistro >= filtro.DataInicial) && (!filtro.DataFinal || registro.dataRegistro <= filtro.DataFinal))
        this.dadosFiltrados.push(registro);
    });
  }

  calcularParametros(arrayDados: Array<RegistroAgua>) {

    let fluxoTotal: number = 0;
    let maiorFluxo: RegistroAgua = arrayDados[0];
    let menorFluxo: RegistroAgua = arrayDados[0];
    
    arrayDados.forEach(dado => {
      fluxoTotal += dado.valorRegistro;
      maiorFluxo = maiorFluxo.valorRegistro <= dado.valorRegistro ? dado : maiorFluxo;
      menorFluxo = menorFluxo.valorRegistro >= dado.valorRegistro ? dado : menorFluxo;
    });

    this.parametros = { fluxoTotal, maiorFluxo, menorFluxo };
  }

  agruparDados(arrayDados: Array<RegistroAgua>, tamanhoGrupo: number): Array<DadosResumidosAgua> {

    let grupoRegistros: Array<RegistroAgua> = new Array<RegistroAgua>();
    let dadosResumidos: Array<DadosResumidosAgua> = new Array<DadosResumidosAgua>();

    arrayDados.forEach((dado, index) => {
      if (index == 0 || index % tamanhoGrupo != 0) {
        grupoRegistros.push(dado);
      }
      else {
        dadosResumidos.push(new DadosResumidosAgua(grupoRegistros));
        //Limpando o array pra formar um novo grupo
        grupoRegistros = new Array<RegistroAgua>();
      }
    });

    //Se houver registros que ainda não foram agrupados pelo tamanho, cria um ultimo grupo
    if (grupoRegistros.length > 0)
      dadosResumidos.push(new DadosResumidosAgua(grupoRegistros));

    return dadosResumidos;
  }

  montarArraysChart(arrayDados: Array<DadosResumidosAgua>) {

    let valores: number[] = [];
    let datas: string[] = [];
    this.lineChartData = new Array<any>();
    this.lineChartLabels = new Array<any>();
    let formatoData = { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    arrayDados.forEach(registro => {
      valores.push(registro.valorMedio);
      datas.push(registro.dataInicialRegistro.toLocaleDateString('pt-br', formatoData));
    });

    console.log(valores, datas);
    this.lineChartData = [{ data: valores, label: 'Vazão de água' }];
    this.lineChartLabels = datas;
  }

  mostrarGrafico(formato) {
    if (formato == 'hora') {
      //Agrupar por hora (60 minutos)
      this.dadosPorHora = this.agruparDados(this.dadosFiltrados, 60);
      this.montarArraysChart(this.dadosPorHora);
      this.exibirGraficoHora = true;
      this.exibirGraficoDia = false;
    }
    else if (formato == 'dia') {
      //Agrupar por dia (1440 minutos)
      this.dadosPorDia = this.agruparDados(this.dadosFiltrados, 1440);
      this.montarArraysChart(this.dadosPorDia);
      this.exibirGraficoHora = false;
      this.exibirGraficoDia = true;
    }
  }

  public lineChartData: Array<any>;/* = [
    {data: [65, 59, 80], label: 'Vazão de água'}
  ];*/
  public lineChartLabels: Array<any>;/* = ['10/09/2018 - 10:00', '11/09/2018 - 10:00', '12/09/2018 - 10:00',];*/
  public lineChartOptions: any = {
    responsive: true
  };
  public lineChartColors: Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },
  ];
  public lineChartLegend: boolean = false;
  public lineChartType: string = 'line';

  // events
  public chartClicked(e: any): void {
    console.log(e);
  }

  public chartHovered(e: any): void {
    console.log(e);
  }

}
