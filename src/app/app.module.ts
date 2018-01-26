import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { SafePipe } from '../pipes';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { ProjectsPage } from '../pages/projects/projects';
import { ProjectPage } from '../pages/project/project';
import { LoginPage } from '../pages/login/login';
import { EditorPage } from '../pages/editor/editor';
import { RoomManagerPage } from '../pages/room-manager/room-manager';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';

import { StatusBar } from '@ionic-native/status-bar';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { HTTP } from '@ionic-native/http';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Geolocation } from '@ionic-native/geolocation';
import { Diagnostic } from '@ionic-native/diagnostic';
import { DiagnosticService } from './diagnostic.service';
import { LocationAccuracy } from '@ionic-native/location-accuracy';
import { Device } from '@ionic-native/device';


@NgModule({
  declarations: [
    SafePipe,
    MyApp,
    AboutPage,
    ContactPage,
    ProjectsPage,
    ProjectPage,
    LoginPage,
    EditorPage,
    RoomManagerPage,
    HomePage,
    TabsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    ProjectsPage,
    ProjectPage,
    LoginPage,
    EditorPage,
    RoomManagerPage,
    HomePage,
    TabsPage
  ],
  providers: [
    StatusBar,
    Device,
    Geolocation,
    Diagnostic,
    DiagnosticService,
    LocationAccuracy,
    ScreenOrientation,
    InAppBrowser,
    HTTP,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
