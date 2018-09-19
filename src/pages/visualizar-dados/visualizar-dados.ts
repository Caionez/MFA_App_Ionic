import { Component } from '@angular/core';

@Component({
  selector: 'visualizar-dados',
  templateUrl: 'visualizar-dados.html'
})
export class VisualizarDadosPage {
  
  filtro: any;
  
  constructor() {

    this.filtro = {
      DataInicial : '',
      DataFinal : ''     
    }

    this.lineChartData = new Array<any>();
    this.lineChartLabels = new Array<any>();
  }

  filtrarDados() {
    console.log(this.filtro);

    this.lineChartData = [{data: [65, 59, 80], label: 'Vazão de água'}];
    console.log("instanciei o dataset");
    this.lineChartLabels = ['10/09/2018 - 10:00', '11/09/2018 - 10:00', '12/09/2018 - 10:00',];
  }

  public lineChartData:Array<any>;/* = [
    {data: [65, 59, 80], label: 'Vazão de água'}
  ];*/
  public lineChartLabels:Array<any>;/* = ['10/09/2018 - 10:00', '11/09/2018 - 10:00', '12/09/2018 - 10:00',];*/
  public lineChartOptions:any = {
    responsive: true
  };
  public lineChartColors:Array<any> = [
    { // grey
      backgroundColor: 'rgba(148,159,177,0.2)',
      borderColor: 'rgba(148,159,177,1)',
      pointBackgroundColor: 'rgba(148,159,177,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(148,159,177,0.8)'
    },   
  ];
  public lineChartLegend:boolean = false;
  public lineChartType:string = 'line';
 
  public randomize():void {
    let _lineChartData:Array<any> = new Array(this.lineChartData.length);
    for (let i = 0; i < this.lineChartData.length; i++) {
      _lineChartData[i] = {data: new Array(this.lineChartData[i].data.length), label: this.lineChartData[i].label};
      for (let j = 0; j < this.lineChartData[i].data.length; j++) {
        _lineChartData[i].data[j] = Math.floor((Math.random() * 100) + 1);
      }
    }
    this.lineChartData = _lineChartData;
  }
 
  // events
  public chartClicked(e:any):void {
    console.log(e);
  }
 
  public chartHovered(e:any):void {
    console.log(e);
  }

}
