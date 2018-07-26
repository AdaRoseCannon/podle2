/* global Map*/

import { wire, bind } from '../hypermorphic/index.js';
import { refs } from '/module/html-element-plus/mixins.js';
import getPouchDB from '../get-pouch-db.js';

document.head.insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="/lib/components/podle-player.css">`);
function fmtMSS(s){return(s=Math.ceil(s),(s-(s%=60))/60+(9<s?':':':0')+s)}


// TODO: Media Session API!
class PodlePlayer extends refs(HTMLElement) {
	constructor () {
		super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(document.createElement('div'));
    this.audio = this.querySelector('audio[slot="audio"]');
    this.urlA = this.querySelector('a[slot="real-url"]');
    this.state = 'stopped';
    const render = bind(this.shadowRoot.firstChild);
    
    this.setUpEventListeners();
    
    if (this.setupInfo()) {
      render`${this.constructor.template(this.info)}`;
    } else {
      render`<slot></slot>`;
    }
    
    setInterval(() => {
      if (this.setupInfo()) {
        render`${this.constructor.template(this.info)}`;
      } else {
        render`<slot></slot>`;
      }
      if (this.info.audio.currentTime && this.info.audio.duration) {
        this.refs.timeline.style.setProperty('--time', this.info.audio.currentTime / this.info.audio.duration);
      }
    }, 500);
	}
  
  setupInfo() {
    if (this.info) return this.info;
    try {
      this.info = {
        name: new URL(this.urlA.href).pathname.split('/').pop(),
        url: this.urlA.href,
        audio: this.audio,
        el: this
      };
    } catch (e) {
      console.log('Invalid URL: ' + this.urlA.href);
      this.info = false;
    }
    return this.info;
  }
  
  setUpEventListeners() {
    
    this.addEventListener('play', () => {
      this.state = 'playing';
      this.refs.playwrapper.classList.toggle('playing', true);
    }, true);

    this.addEventListener('pause', () => {
      this.state = 'paused';
      this.refs.playwrapper.classList.toggle('playing', false);
    }, true);
    
    this.addEventListener('loadedmetadata', () => {
      // Update meta data
    }, true);
    
    this.addEventListener('progress', () => {
      // Show loaded sections
    }, true);
  }

	static template(info) {
    
    const text = wire(info, ':str')`
      <span>${info.name} ${fmtMSS(info.audio.currentTime || 0)}/${fmtMSS(info.audio.duration || 0)}</span>
    `;
    
    return wire(info, ':el')`
      <div class="hidden"><slot name="audio"></slot></div>
      <div class="hidden"><slot name="real-url"></slot></div>
      <div ref="playwrapper" class="button-wrapper">
        <button class="play-button" onclick=${() => {
          if (info.el.state === 'paused' || info.el.state === 'stopped') {
            info.el.audio.play();
          }
          if (info.el.state === 'playing') {
            info.el.audio.pause();
          }
        }} ref="play">Play/Pause</button>
      </div>
      <div class="timeline-container" ref="timeline">
        <div class="timeline"></div>
        <span class="text-details">${text}</span>
      </div>
      <button ref="rewind30" class="rewind30" aria-label="Rewind 30s" onclick="${() => info.audio.currentTime = Math.max(0, info.audio.currentTime - 30)}"><span>⭯</span>30s</button>
      <a href="${info.url}" download target="_blank" rel="noopener" rel="nofollow" ><button ref="download" class="download-button" aria-label="Download" title="${'download '+ new URL(info.url).pathname.split('/').pop()}">🔗&#xFE0E;</button></a>
    `;
	}
}

customElements.define('podle-player', PodlePlayer);