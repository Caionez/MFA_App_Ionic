import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { ChartsModule } from 'ng2-charts';

import { MenuPrincipalPage } from './../pages/menu-principal/menu-principal';
import { VisualizarDadosPage } from './../pages/visualizar-dados/visualizar-dados';
import { BaixarArquivoPage } from './../pages/baixar-arquivo/baixar-arquivo';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

@NgModule({
  declarations: [
    MyApp,
    MenuPrincipalPage,
    BaixarArquivoPage,
    VisualizarDadosPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    ChartsModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    MenuPrincipalPage,
    VisualizarDadosPage,
    BaixarArquivoPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
