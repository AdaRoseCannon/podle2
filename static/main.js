import loadPage from './lib/load-page.js';
import isLocal from './lib/is-local.js';
import serialize from './lib/serialize.js';
import './lib/components/fave-star.js';
import './lib/components/meta-details.js';
import './lib/components/my-podcasts.js';
import './lib/components/pouch-sync.js';
import './lib/components/podle-player.js';

if (location.protocol !== 'https:') location.protocol = 'https:';

function intercept(e) {
  var url;
  if (e.target.tagName === 'A' && e.type === 'click') url = e.target.href;
  if (e.target.tagName === 'FORM' && e.type === 'submit') url = e.target.action + '?' + serialize(e.target);

  if ( url && isLocal(url) ) {
    e.preventDefault();
    loadPage(url);
  }
}

if (navigator.serviceWorker.controller) {
  console.log('[PWA Builder] active service worker found, no need to register')
} else {

  //Register the ServiceWorker
  navigator.serviceWorker.register('sw.js', {
    scope: '/'
  }).then(function(reg) {
    console.log('Service worker has been registered for scope:'+ reg.scope);
  });
}

document.body.classList.add('client-render-ready');
document.body.addEventListener('submit', intercept);
document.body.addEventListener('click', intercept);
window.addEventListener('popstate', function () {
  loadPage(document.location.toString(), true);
});