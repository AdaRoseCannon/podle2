/* global Map*/

import { wire } from './hypermorphic/index.js';
const html = (...args) => wire()(...args);

function getRefObj(id) {
  getRefObj.refs = new Map();
  const obj = getRefObj.refs.get(id) || {id};
  getRefObj.refs.set(id, obj);
  return obj;
}

function parseFeed(feed) {
  feed.items.reverse();
  for (const item of feed.items) {
    if (item.enclosures && !item['media:content']) {
      item['media:content'] = item.enclosures;
    } 
  }
  return feed;
}

function getBody(response) {
	return response.text();
}

function isOk(response) {
	if (!response.ok) {
		return Promise.resolve(response)
			.then(getBody)
			.then(function (range) {
				throw Error('Bad response: ' + response.statusText + ' (' + response.status + ')');
			});
	}
	return response;
}

/*
  Search Item Template
*/
const searchItemTemplate = (termObject, i) => html`
  <li><a href=${termObject.api}>${termObject.text}</a> by ${termObject.author}</li>
`;

/*
  Loading Placeholder Template, used as a placeholder when loading search results
*/
const loadingTemplate = () => html`<h3>loading...</h3>`;

/*
  List of search results
*/
const searchTemplate = term => ({
  any: fetch('https://feed-service.herokuapp.com/search?term=' + term)
    .then(isOk)
    .then(r => r.json())
    .then(o => html`
      <h2>Search results for "${term}"</h2>
      <ul>${ o.body.map(searchItemTemplate) }</ul>
    `),
  placeholder: loadingTemplate()
});

/*
  The head information in a podcast page
*/
const metaTemplate = (url, meta) => wire(getRefObj(url), ':meta')`
  <section class="meta"><meta-details id="${url}">
	  <h2 slot="title">${meta.title}</h2>
	  ${meta.description ? html`<p slot="description">${meta.image ? html`<img src="${meta.image.url}" width="200" alt="${meta.title ? 'Podcast Poster, ' + meta.title : 'Podcast Image'}">` : ''}${meta.description}${meta.copyright ? html`<br />
&copy; ${meta.copyright}` : ''}</p>` : ''}
  </meta-details></section>
`;

/*
  Feed Item Template
*/
const feedItemTemplate = (o, i) => wire(getRefObj('feed-item'), `:feed-item-${i}`)`
	<details class="feed-item">
		<summary>
      <h2>${o.title}</h2><br />
		  <time>Updated - ${o.humanDate}</time>
    </summary>
		${o['media:content'] ? wire(getRefObj('feed-item'), `:feed-item-${i}-media-player`)`
      <podle-player>
				<audio slot="audio" src="${'/audioproxy?url=' + encodeURIComponent(o['media:content'].url)}" controls preload="none">
					<span><a href="${o['media:content'].url}" target="_blank" rel="noopener" rel="nofollow">${o.title}</a>
					  (<span class="filesize">${(Number(o['media:content'].filesize)/1E6).toFixed(1) + 'MB'}></span> ${o['media:content'].type})</span>
				</audio><br />
				<span>In case the player does not work <br />
          try the <a href="${o['media:content'].url}" download target="_blank" rel="noopener" rel="nofollow" title="${'Direct Download: ' + o.title}">original podcast file</a>.<br />
          (<span class="filesize">${(Number(o['media:content'].filesize)/1E6).toFixed(1) + 'MB'}</span> ${o['media:content'].type})
        </span>
      </podle-player>
		` : ''}
		<p>${{html: o.description}}</p>
		<p>${o.author ? wire(getRefObj('feed-item'), `:feed-item-${i}-author`)`by <span class="author">${o.author}</span></p>` : ''}
    ${o.copyright ? html`<br /> &copy; ${o.copyright}` : ''}</p>
  </details>
`;


/*
  The meta information and a list of podcasts in a feed
*/
const feedTemplate = url => {
  const promise = fetch('https://feed-service.herokuapp.com/feed?urls=' + url + '&meta=1&properties=title,description,enclosures,media%3Acontent,author,image,humanDate,feedUrl')
    .then(isOk)
    .then(r => r.json());
  return {
    metaPromise: promise.then(o => o.meta),
    any: promise
      .then(parseFeed)
      .then(feed => wire(getRefObj(url), ':body')`
        ${metaTemplate(url, feed.meta)}
        ${feed.items.map(i => (i.copyright = i.copyright || feed.meta.copyright, i)).map(feedItemTemplate)}
      `)
    ,
    placeholder: wire(dummyFeedItem)`
    <div class="dummy" aria-hidden="true">
      ${metaTemplate('', dummyMeta)}
      ${feedItemTemplate(dummyFeedItem)}
    </div>`
  }
};

export {
  feedTemplate,
  searchTemplate
};


const dummyMeta = {
  image: {
    url: '/logo.svg'
  },
  title: '██████ ████ ██ ████████',
  description: '█████████████ █████████ ███████ ███ ███ █████ ██████ ████ ██ █████ █████ █████████ █████ ████████ █████ █████████████ ████ ███ █████████ ██████ ███████ ██████████ ██████ ██ ███ █████ ████ ████ ██████ ███████ ████ ██████████ ███████ ███ ████████ ███████ ████ ██ ████ █████ ███ █████ █████ ████████ ███████ ████ ██ ███████ █████ █████ █████ ████ ███ ███████ ████████ ███ ██████ █████ ██ ██ ██ █████ ███ ██ █████ ██ ███████ █ ██ ███ █████ █████████████ █████████ ██ █████ ████ █████████ ███████ ██ ██████ ████ ███ ███████ ███████ ████████ ██ █████ ████████ ██ ███████ ██ ███████████████'
};

const dummyFeedItem = {
  title: '████ ████████ █████ ██████ ███ ███ █████ ██████ ████ ███████ █',
  humanDate: '█ █████ ███████████ █████',
  description: `
    <p>███████ ██ ███ █████ ██ ███ ████████ █████ ███████ ████████ ███ █████████ ██████████ █████ ████ █████████ ████ ███ ███ ██ ███ ██████ ██████ ████ ███ ██████ ███████ ███ █████ ██ ██████ ████ ██ ███ ███ ██████ ██ ███ ███ ████████ ████ ██ ███████ ███ ████</p>
    <p>████████ ████████ █████████ ██ ███ ████████ █████ ██████ ███ ███ █████ █████████ ███ ███ ███████ ███████ █████████ ██ ███ ███ ██ ████ ████████ ████████████</p>
    <p>██████ ██ ██████ ████████ ██ ███████ █████ ███ ████ ███████ ███ ██████████ ███ █████ ████████ ███ ████ ████ ███████ ███ ████ ██████ ████ ██ ███ █████ ███ █████ ███ ███ ████ ███ ███ ██ ███ ███████ ███ ███ ██ ███ █████ █████ ███ ██████ ████████ ██ █████████████████████</p>
    <p>█████████ ████ ███████ ████████ ██ ███ ████████ ██████ ██████ ██ ███ ████████ ███ ████ █████████ ██ ███ █████████ ███ ████ ████████ ██ ██ ████████████████████████████</p>
`
};