import { Component } from '@angular/core';
import { Project } from '../../types';
import common from '../../common';
import { State } from '../../types';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { RoomManagerPage } from '../room-manager/room-manager';
import { LoadingController } from 'ionic-angular';
import { DiagnosticService } from '../../app/diagnostic.service';
import { Geolocation } from '@ionic-native/geolocation';
import { Keyboard } from '@ionic-native/keyboard';
import { ViewController } from 'ionic-angular';
import { Platform } from 'ionic-angular';
import { ScreenOrientation } from '@ionic-native/screen-orientation';
import { ToastController } from 'ionic-angular';
import { AlertController } from 'ionic-angular';


@IonicPage()
@Component({
  selector: 'page-editor',
  templateUrl: 'editor.html',
})
export class EditorPage {
  project:Project;
  state:State = common.state;
  loader:any = null;
  projectLoaded:boolean = false;
  keyListeners:any[] = [];
  subscriptions:any[] = [];

  constructor(
    private keyboard: Keyboard,
    private orientation: ScreenOrientation,
    private geolocation: Geolocation,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private diagnosticService: DiagnosticService,
    private platform: Platform,
    public viewCtrl: ViewController,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController,
    public navParams: NavParams,
    private statusBar: StatusBar,
  ) {
    let project = this.navParams.get('project');
    if (project) {
      this.project = project;
      console.log('got the proj', this.project);
    } else {
      console.error('project is not set');
    }

    // populate keylisteners with some basic ones
    this.keyListeners = [
      {label: '&larr', icon: 'arrow-dropleft', value: 'left arrow'},
      {label: '&uarr', icon: 'arrow-dropup', value: 'up arrow'},
      {label: '&darr', icon: 'arrow-dropdown', value: 'down arrow'},
      {label: '&rarr', icon: 'arrow-dropright', value: 'right arrow'},
      {label: '+', icon: 'add', value: '+'},
      {label: '-', icon: 'remove', value: '-'},
      {label: 'space', icon: '', value: 'space'},
    ]
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad EditorPage');
    this.updateSnapHandle();
    let editor = this;
    // start loading snap after view is loaded and animations are settled (IOS)
    setTimeout(() => {common.snapFrame.src = editor.project.url;}, 250);
    // dynamically modify snap when its loaded
    // call onProjectLoaded when the project is loaded 
    this.raceForIt(() => {
      return common.snap.SnapActions !== undefined;
    }, 50, 5000)
      .then(stat => {
        let SnapActions = common.snap.SnapActions;
        let onOpenProject = common.snap.SnapActions.onOpenProject;
        common.snap.SnapActions.onOpenProject = function(str) {
          onOpenProject.apply(SnapActions, arguments);
          console.log('project loaded');
          // broadcast an event so other pages can listen to
          common.snapFrame.dispatchEvent(new Event('projectLoaded'));
          editor.onProjectLoaded();
        }
        // setup credentials to allow for cookie authentication
        common.snap.SnapCloud.username = common.state.username;
        common.snap.SnapCloud.password = true;
      })
      .catch(console.error);

    // disable scrolling of the content when keyboard popsup
    this.platform.ready().then(() => {
      this.keyboard.disableScroll(true);
    })

    this.presentLoading(`Loading ${this.project.name}..`);

    console.log('setting up snap mobile', common.snap);
    window.mobile = window.mobile || {};
    window.mobile.platform = common.platform;
    window.mobile.geolocation = this.geolocation;
    window.mobile.diagnosticService = this.diagnosticService;
    window.mobile.eventTarget = common.snapFrame;

    window.mobile.eventTarget.addEventListener('snapError', event => {
      let { message, error } = event.detail;
      console.error('exception in snap', error);
      if (this.loader) { // dismiss the loader if there is an error and notify user
        this.loader.dismiss();
        this.presentAlert('Something went wrong.', 'Please reload the project to try again.');
      } else {
        this.presentToast(message);
      }
    })

  }

  // really?! FIXME swap out with the proper solution
  // promisifiying race conditions!
  raceForIt(fn, delay=50, timeout=10000) {
    let counter = 0;
    return new Promise((resolve, reject) => {
      let myTimeout = setTimeout(() => {
        reject('timedout');
        clearInterval(interval);
      }, timeout)
      let interval = setInterval(() => {
        counter++;
        if (fn()) {
          clearInterval(interval);
          clearTimeout(myTimeout)
          console.log(`finished the race with #${counter} tries or ${counter * delay}ms wait`);
          resolve();
        }
      }, delay);
      // or accept failure
    })
  }

  presentAlert(title, msg) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: msg,
      buttons: ['OK']
    });
    alert.present();
    return alert;
  }

  presentToast(msg) {
    let toast = this.toastCtrl.create({
      message: msg,
      duration: 3000,
      position: 'bottom'
    });
    toast.present();
    return toast;
  }

  presentLoading(msg) {
    let loader = this.loadingCtrl.create({
      cssClass: 'desktopViewWidth',
      // dismissOnPageChange: true, // prematurely dismisses loader
      content: msg
    });

    loader.onDidDismiss(() => {
      this.loader = undefined;
    });

    loader.present();
    this.loader = loader;
    return loader;
  }

  onProjectLoaded() {
    this.getNbMorph().toggleAppMode(true);
    this.showSnap();
    this.loader.dismiss();
    this.projectLoaded = true;
  }

  showSnap() {
    common.snapFrame.style.visibility = 'visible';
  }

  hideSnap() {
    common.snapFrame.style.visibility = 'hidden';
  }

  ionViewWillEnter() {
    this.setFocusMode(true);
    this.setDesktopViewport(true);
    if(this.projectLoaded) this.showSnap();

    // resize snap when keyboard shows up
    let showSub = this.keyboard.onKeyboardShow()
      .subscribe((e) => {
        // figure out the minimum you have to push snap up
        // different from window.devicePixelRatio
        let pixelRatio =  window.innerHeight / window.outerHeight;
        let scaledKeyHeight = e.keyboardHeight * pixelRatio;
        this.pushUpSnap(scaledKeyHeight);
      });
    let hideSub = this.keyboard.onKeyboardHide()
      .subscribe(() => {
        this.pushUpSnap(0);
      });
    let orientationSub = this.orientation.onChange()
      .subscribe(() => {
        // in portrait mode use desktop viewport and change back on landscape
        this.setDesktopViewport(this.isPortraitMode());
      }
      );
    this.subscriptions.push(showSub, hideSub, orientationSub);
  }

  ionViewWillLeave() {
    this.setFocusMode(false);
    this.setDesktopViewport(false);
    this.hideSnap();
    this.subscriptions.forEach(sub => sub.unsubscribe()); // unsubscribe when leaving
    if ( this.loader ) this.loader.dismiss();
  }

  getSnapFrame() {
    return <any>document.querySelector('iframe#editor');
  }

  // gets the editor context
  updateSnapHandle() {
    let iframe = this.getSnapFrame();
    common.snapFrame = iframe;
    common.snap = iframe.contentWindow; // the 'window' inside iframe
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

  // forces snap world to fill the page
  snapReactToResize() {
    let world = this.getWorld();
    // if snap is loaded have it fill its available space
    if (world) world.fillPage();
  }

  setFocusMode(status) {
    if (status === undefined) status = !this.state.view.focusMode;
    let tabEl:any = document.querySelector('ion-tabs');
    if (status === true) {
      this.statusBar.hide();
      tabEl.className += ' focusMode';
    } else {
      //revert
      tabEl.className = tabEl.className.replace(' focusMode', '');
    }
    this.state.view.focusMode = status;
  }

  setDesktopViewport(status) {
    let vpEl:any = document.querySelector('meta[name="viewport"]');
    // don't change the viewport on tablets (or non mobile platforms)
    if (status && this.platform.is('mobile') && !this.platform.is('tablet') && this.isPortraitMode()) {
      if (this.platform.is('android')) {
        // it's not ios => android
        vpEl.content = 'width=980, user-scalable=no';
      } else if (this.platform.is('ios')) {
        // it's ios
        vpEl.content = 'width=980, user-scalable=no, maximum-scale=0.32, initial-scale=0.32, minimum-scale=0.32';
      }
    } else {
      // back to default
      vpEl.content = 'viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }
  }

  // pushes up snap to open space below to fit elements like keyboard
  // resets to full screen if the argument is falsy
  // does not work relative to cur state (does not stack)
  pushUpSnap(pixels) {
    const SMALL_BTN = 20;
    if (!pixels) {
      common.snapFrame.style.height = ''; // reset height
    } else {
      let curButtonSize = this.getNbMorph().mobileMode.btnConfig.size;
      // find out howmuch empty spaces are around the stage
      // OPTIMIZE buttons can jump to the right or any empy space they find.
      // consider landscape
      let topEmpty = this.getNbMorph().mobileMode.emptySpaces().top;
      // figure out the maximum you can push the snap env up
      let max = (topEmpty  - curButtonSize ) * 2;
      if (max < pixels) {
        let  neededSpace = pixels - max;
        let reduceFromBtn = neededSpace / 2;
        let newBtnSize = curButtonSize - reduceFromBtn;
        if (newBtnSize < SMALL_BTN){
          newBtnSize = SMALL_BTN;
          console.error('there is not enough space to move the whole editor into view w/ keyboard')
        };
        this.getNbMorph().mobileMode.setBtnSize(newBtnSize, false);
      }
      // in any case move the stage
      common.snapFrame.style.height = (common.snapFrame.clientHeight - pixels) + 'px';
    }
  }

  openRoom() {
    this.navCtrl.push(RoomManagerPage, {});
  }

  // simulates a key press to snap
  simulateKeyPress(key, duration=100) {
    this.getNbMorph().stage.fireKeyEvent(key);
    // TODO add mousedown and mouseup (touch) event listeners
    setTimeout(() => {
      this.getNbMorph().stage.removePressedKey(key);
    }, duration)
  }

  // checks if the phone is in portrait mode
  isPortraitMode() {
    return this.orientation.type.indexOf('portrait') !== -1;
  }


}
