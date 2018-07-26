import html from '/module/html-element-plus/noop.js';
import getPouchDB from '../get-pouch-db.js';

document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="/lib/components/fave-star.css">`);

class FaveStar extends HTMLElement {
	constructor () {
		super();

		if (!this.shadowRoot) {
			this.attachShadow({mode: 'open'});
			this.shadowRoot.innerHTML = this.constructor.templateHTML;
		}

    this.addEventListener('click' , this.onClick);
	}

	// Set the HTML for the template
	static get templateHTML() {
    
    // ⭐, 🌟
		return html`
    <span id="star">&#9733;</span>`;
	}

  onClick() {
    if (!this.target) throw Error('No target set');
    const data = this.target.getData();
    getPouchDB('myPodcasts')
      .then(db => {
        db
        .get(data.id)
        .catch(e => ({
          _id: data.id,
          title: data.title,
          _deleted: true
        }))
        .then(o => {
          if (o._deleted === true) {
            o._deleted = false; 
            this.setAttribute('faved', 'true');
          } else {
            this.removeAttribute('faved');
            o._deleted = true;
          }
          return db.put(o);
        });
      });
  }

	get target() {
    const value = this.getAttribute('target');
    let parent = this.parentNode;
		return (function () {
      while(parent && !parent.matches(value)) {
        parent = parent.host || parent.parentNode;
        while (parent && !parent.matches) {
          parent = parent.host || parent.parentNode;
        }
      }
      return parent;
    }()) || document.querySelector(value);
	}
}

customElements.define('fave-star', FaveStar);