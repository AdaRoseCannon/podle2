/* global Map */

import { wire, bind } from '../hypermorphic/index.js';
import { refs } from '/module/html-element-plus/mixins.js';
import getPouchDB from '../get-pouch-db.js';

function getRefObj(id) {
  getRefObj.refs = new Map();
  const obj = getRefObj.refs.get(id) || {id};
  getRefObj.refs.set(id, obj);
  return obj;
}

const podcastEntry = item => wire(getRefObj(item.doc._id))`
  <li><a href="${'/feed?urls=' + item.doc._id}">${item.doc.title}</a></li>
`;

const loginForm = el => wire(el)`
  <p>Authenticate to keep your data synced across devices.</p>
  <form action="https://indieauth.com/auth" method="get">
    <label for="indie_auth_url">Web Address:</label>
    <input id="indie_auth_url" type="text" name="me" placeholder="yourdomain.com" />
    <p><button type="submit">Sign In</button></p>
    <input type="hidden" name="client_id" value="${document.location.origin}" />
    <input type="hidden" name="redirect_uri" value="${document.location.origin}" />
  </form>`;

class MyPodcasts extends refs(HTMLElement) {
	constructor () {
		super();
    bind(this)`${this.constructor.template(this, [])}`;
    getPouchDB('myPodcasts').then(db => {
      db.changes({
        since: 'now',
        live: true
      }).on('change', e => {
        this.update();
      });
    });
    this.update();
    
    const code = new URLSearchParams(document.location.search).get('code');
    if (code) {
      getPouchDB('mySettings').then(db => {
        db
        .get('my code')
        .catch(e => ({
          _id: 'my code'
        }))
        .then(o => {
          o.code = code;
          return db.put(o);
        });
      });
    }
	}
  
  static get code () {
    return getPouchDB('mySettings')
    .then(db => db.get('my code'))
    .catch(() => ({code: false}))
    .then(o => o.code);
  }
  
  update () {
    getPouchDB('myPodcasts')
    .then(db => db.allDocs({
      include_docs: true,
      attachments: true
    }))
    .then(result => {
      bind(this)`${this.constructor.template(this, result.rows)}`;
    }).catch(function (err) {
      console.log(err);
    });
  }

	static template(el, data) {
    return wire(el)`
      <details>
        <summary>${
          this.code.then(code => code ? wire(el, ':pouchSyncEl')`<pouch-sync></pouch-sync>` : `Back up your saved Podcasts`)
        }</summary>
        ${
          this.code.then(code => code ? wire()`<p>Logged in. <button onclick="${
            e => getPouchDB('mySettings')
                .then(db => db.get('my code').then(o => (o._deleted = true, db.put(o))))
                .catch(e => console.log(e))
                .then(() => el.update())
          }">Log Out</button></p>` : loginForm(el))
        }
      </details>
      <h2>
        My Podcasts  
      </h2>
      <ul ref="list">
        ${data.map(o => podcastEntry(o))}
      </ul>
    `;
	}
}

customElements.define('my-podcasts', MyPodcasts);