import { Component } from '@angular/core';
import { Project } from '../../types';
import common from '../../common';
import { State } from '../../types';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { RoomManagerPage } from '../room-manager/room-manager';



@IonicPage()
@Component({
  selector: 'page-editor',
  templateUrl: 'editor.html',
})
export class EditorPage {
  project:Project = common.getProjectStructure();
  state:State = common.state;

  constructor(public navCtrl: NavController, public navParams: NavParams, private statusBar: StatusBar, private screenOrientation: ScreenOrientation) {
    let project = this.navParams.get('project');
    if (project) {
      this.project = project;
    } else {
      console.error('project is not set');
    }
    console.log('got the proj', this.project);

    // detect orientation changes
    this.screenOrientation.onChange().subscribe(
      () => {
        if (this.screenOrientation.type.startsWith('landscape')) {
          this.setFocusMode(true);
        } else {
          this.setFocusMode(false);
        }
      }
    );

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EditorPage');
    console.log(this.screenOrientation.type);
    this.updateSnapHandle();
  }

  // gets the editor context
  updateSnapHandle() {
    let iframe: any;
    iframe = document.querySelector('iframe#editor');
    common.snap = iframe.contentWindow;
  }

  getWorld() {
    return common.snap.world;
  }

  getNbMorph() {
    return this.getWorld().children[0];
  }
  // helper
  applyOnEditor(fn, arg1, arg2) {
    const context = common.snap;
    let args = Array.prototype.slice.call(arguments, 1);
    return fn.apply(context, args);
  }

  // editor specific functions, this would refer to editor window
  setFullscreen(status) {
    if (status === undefined) status = !this.getNbMorph().isAppMode;
    this.getNbMorph().toggleAppMode(status);
  }

  setFocusMode(status) {
    if (status === undefined) status = !this.state.view.focusMode;
    let tabEl:any = document.querySelector('ion-tabs');
    if (status === true) {
      this.statusBar.hide();
      tabEl.className += ' focusMode';
    } else {
      //revert
      tabEl.className = tabEl.className.replace('focusMode', '');
    }
    this.state.view.focusMode = status;
  }

  openRoom() {
    this.navCtrl.push(RoomManagerPage, {});
  }


}
