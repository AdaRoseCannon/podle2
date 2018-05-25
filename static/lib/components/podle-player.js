/* global Map*/

import { wire, bind } from '../hypermorphic/index.js';
import { refs } from '/module/html-element-plus/mixins.js';
import getPouchDB from '../get-pouch-db.js';

class PodlePlayer extends refs(HTMLElement) {
	constructor () {
		super();
    this.attachShadow({mode: 'open'});
    bind(this.shadowRoot)`${this.constructor.template(this)}`;
	}

	static template(el) {
    return wire(el)`
      <slot name="audio"></slot>
    `;
	}
}

customElements.define('podle-player', PodlePlayer);