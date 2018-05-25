import {bind} from './hypermorphic/index.js';
import {searchTemplate, feedTemplate} from './templates.js';

const renderTemplate = bind(document.querySelector('main'));
const render = arg => renderTemplate`${arg}`;


export default function loadPage(url, pop) {

	const backwards = pop || window.location.href.indexOf(url) === 0;
	if (!pop && url === window.location.href) return;
	if (!pop) {
		window.history.pushState({}, Date.now(), url); // Date.now should be current title
	}

	return new Promise(function (resolve) {

    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const search = urlObj.search;
    const searchParams = new URLSearchParams(search.slice(1));
    
    let promise;
    let title;
    
    if (path === '/feed') {
      const url = searchParams.get("urls");
      const template = feedTemplate(url);
      promise = template.metaPromise;
      promise.then(o => title = o.title);
      render(template);
    }

    if (path === '/search') {
      const term = searchParams.get("term");
      const template = searchTemplate(term);
      title = 'Search Results for ' + term;
      promise = template.any;
      render(template);
    }

    if (!promise) return;
    
    promise
    .then(function () {
      window.history.replaceState({}, title, url);
    })
    .catch(function (e) {
      if (window.history.state && window.history.state.loading) {
        window.history.back();
      }
      // TODO, Log Errors back to the server
      console.log(e);
    });
	});
}