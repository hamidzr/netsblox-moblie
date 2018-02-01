import { Component } from '@angular/core';
import { ProjectPage } from '../project/project';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import common from '../../common';
import { Project, State } from '../../types';
import $ from 'jquery';
import ta from 'time-ago';

interface Cache {
  projects: any[];
};

@IonicPage()
@Component({
  selector: 'page-projects',
  templateUrl: 'projects.html',
})
export class ProjectsPage {
  projects: any[];
  publicProjects: any[];
  exampleProjects: any[];
  category: string = 'examples';
  cache:Cache = {projects: undefined};
  state:State = common.state; // TODO authentication should be handled in form of a middleware
  projectStructure:Project = common.getProjectStructure();

  // TODO use native cordova http module for fetching
  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController) {
    this.projects = [];
    this.projects.push(this.projectStructure);
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ProjectsPage');
    if (this.state.loggedIn) this.category = 'private';
    this.loadExamples();
  }

  ionViewWillEnter() {
    console.log('ionViewWillEnter ProjectsPage');
    if (!this.cache.projects) this.loadUserProjects();
  }

  itemSelected(project) {
    this.navCtrl.push(ProjectPage, {project});
  }

  // loadPublicProjects() {
  //   console.log('Calling server for public projects');
  //   return $.ajax({
  //     method: 'GET',
  //     url: common.SERVER_ADDRESS +'/api/Projects/PROJECTS'
  //   });
  // }

  loadExamples() {
    console.log('Calling server for example projects');
    $.ajax({
      url: common.SERVER_ADDRESS + '/api/Examples/EXAMPLES?metadata=true',
      method: 'GET'
    })
      .then(resp => {
        let projects = resp.map(proj => {
          return {
            name: proj.projectName,
            type: 'example',
            description: proj.notes,
            thumbnail: proj.thumbnail,
            services: proj.services
          };
        });
        this.exampleProjects = projects;
      })
  }

  // loads the projects from cache or request the server for projects
  loadUserProjects() {
    console.log('loading projects');
    if (this.cache.projects) {
      console.log('loading projects from cache');
      this.projects = [...this.cache.projects];
      return;
    }
    let url = common.SERVER_ADDRESS + '/api/getProjectList?format=json';
    $.ajax({
      url, 
      method: 'GET',
      xhrFields: {
        withCredentials: true
      },
      crossDomain: true
    })
      .then(resp => {
        console.log('received user projects', resp);
        this.state.loggedIn = true;
        let projects = resp.map(proj => {
          return {
            name: proj.ProjectName,
            type: 'private',
            description: proj.Notes,
            thumbnail: proj.Thumbnail,
            updatedAt: new Date(proj.Updated),
            updatedAtRelative: ta().ago(new Date(proj.Updated))
          };
        });
        this.cache.projects = projects;  
        this.projects = [...projects];
      })
      .catch(console.error);
  }

  filterItems(ev: any) {
    this.loadUserProjects();
    let val = ev.target.value;
    if (val && val.trim() !== '') {
      this.projects = this.projects.filter(project => {
        return project.name.toLowerCase().includes(val.toLowerCase());
      });
    }
  }

}
