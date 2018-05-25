/* global Map*/

import { wire, bind } from '../hypermorphic/index.js';
import { refs } from '/module/html-element-plus/mixins.js';
import getPouchDB from '../get-pouch-db.js';

class PouchSync extends refs(HTMLElement) {
	constructor () {
		super();
    this.attachShadow({mode: 'open'});
    bind(this.shadowRoot)`${this.constructor.template(this)}`;
    Promise.all([this.constructor.code.then(code => getPouchDB(`${document.location.origin}/db/${code}`)), getPouchDB('myPodcasts')])
    .then(([localDB, remoteDB]) => localDB.sync(remoteDB, {
        live: true,
        retry: true
      }).on('change', change => {
        this.refs.action.innerHTML = 'Syncing';
      }).on('paused', info => {
        this.refs.action.innerHTML = 'Waiting';
      }).on('active', info => {
        this.refs.action.innerHTML = 'Online';
      }).on('error', err => {
        console.log(err);
      }));
	}
  
  static get code () {
    return getPouchDB('mySettings')
    .then(db => db.get('my code'))
    .catch(() => ({code: false}))
    .then(o => o.code);
  }

	static template(el) {
    return wire()`<span ref="action">Preparing to Sync</span>`;
	}
}

customElements.define('pouch-sync', PouchSync);