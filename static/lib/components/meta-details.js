/* global Map*/

import { wire, bind } from '../hypermorphic/index.js';
import getPouchDB from '../get-pouch-db.js';

const refs = new Map();

class MetaDetails extends HTMLElement {
	constructor () {
		super();
    this.attachShadow({mode: 'open'});
    bind(this.shadowRoot)`${this.constructor.template(this)}`;
	}

	static template(el) {
    const obj = refs.get(el.id) || {id: el.id};
    refs.set(el.id, obj);

    const output = wire(obj)`
      <link rel="stylesheet" href="/lib/components/meta-details.css">
      <span class="title-area">
        <slot name="title">Default Title</slot>
        <h2>&nbsp;${
          getPouchDB('myPodcasts')
          .then(db => db.get(el.id))
          .then(data => !data._deleted ? 'true' : 'false')
          .catch(e => 'false')
          .then(val => wire(obj)`<fave-star target="meta-details" id="${el.id}" faved=${val}></fave-star>`)
      }</h2>
      </span>
      <slot name="image"></slot>
      <slot name="description"></slot>
    `;
    return output;
	}
  
  getData() {
    return {
      title: this.shadowRoot.querySelector('slot[name="title"]').assignedNodes()[0].textContent,
      description: this.shadowRoot.querySelector('slot[name="description"]').assignedNodes()[0].textContent,
      id: this.id
    };
  }
}

customElements.define('meta-details', MetaDetails);