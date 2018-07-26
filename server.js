// init project
import {searchTemplate, feedTemplate} from './static/lib/templates.js';
import express from 'express';
import util from 'util';
import helmet from 'helmet';
import csp from 'helmet-csp';
import path from 'path';
import audioProxy from './lib/audio-proxy.js';
import PouchDB from 'pouchdb';
import expressPouchDB from 'express-pouchdb';
import fs from 'fs';
import viperHTML from 'viperhtml';
import fetch from 'node-fetch';
import http from 'http';

global.fetch = fetch;

// create pouchdb database in .data
const  app = express();
const TempPouchDB = PouchDB.defaults({prefix: '.data/', mode: 'minimumForPouchDB'});

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

const codeCache = {};

function getDBFromCode(code) {
  const url = 'https://podle.glitch.me';
  const body = `code=${code}&redirect_uri=${url}&client_id=${url}`;
  return codeCache[code] || (codeCache[code] = fetch("https://indieauth.com/auth", {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    method: "POST",
    body
  })
  .then(response => response.json())
  
  // TODO!! VERIFY THIS!
  .then(json => {
    if (!json.me) throw Error('Invalid User! ' + JSON.stringify(json) + '\nbody: ' + body);
    const name = json.me.replace(/[^a-z0-9.+&]/ig, '_');
    try {
      const db = new TempPouchDB(name);
      // Get an item which doesn't exist to ensure it is readable
      return db.get('lol').catch(() => name).then(() => name);
    }catch (e) {console.log(e.message)}
    return name;
  }));
}

const db = expressPouchDB(TempPouchDB);

app.use('/_session', db);
app.use('/db', function (req, res, next) {
  return db(req, res, next);
});

app.use(helmet());
app.use(csp({
	// Specify directives as normal.
	directives: {
		defaultSrc: ["'self'", 'http:', 'https:'],
		scriptSrc: ["'self'", 'cdn.polyfill.io', "'sha256-mgrn3g5+HfeacZDmN+Ey6yWYzMnWyxTklTVDO9i/ORk='"],
		styleSrc: ["'self'", 'samsunginter.net'],
		fontSrc: ["'self'", 'samsunginter.net'],
		imgSrc: ["'self'", 'data:', 'https:',  'http:'],
		// reportUri: '/api/report-violation',
		frameAncestors: ['\'none\''],

		objectSrc: ["'none'"],
	},

	setAllHeaders: true,
	disableAndroid: false,
	browserSniff: false
}));


const file = fs.readFileSync(path.join(process.cwd(), 'static', 'index.html'), 'utf8').split('<main></main>');
const asyncRender = viperHTML.async();
const renderIndex = function (renderFn, details) {
  return  renderFn`${{html: file[0]}}<main>${details.main}</main>${{html: file[1]}}`;
}

app.use('/feed', (req,res) => {
  res.set({ 'content-type': 'text/html; charset=utf-8' })
  renderIndex(
    asyncRender(chunk => res.write(chunk)),
    {main: feedTemplate(req.query.urls)}
  )
  .then(() => {
    res.end()
  });
});

app.use('/search', (req,res) => {
  res.set({ 'content-type': 'text/html; charset=utf-8' })
  renderIndex(
    asyncRender(chunk => res.write(chunk)),
    {main: searchTemplate(req.query.term)}
  )
  .then(() => {
    res.end()
  });
});

app.use('/lib/hypermorphic/*', (req,res) => res.sendFile(path.join(process.cwd(), 'node_modules', 'hyperhtml/esm/', req.params[0])));

app.use('/module/', express.static('node_modules'));

app.use('/icons/', express.static('.icons'));

app.get('/audioproxy/', audioProxy);

app.use('/', express.static('./static'));

// listen for requests :)
http.createServer(function (req, res) {
  
  if (req.url.match(/^\/db\//)) {
    
    const codeMatch = req.url.match(/^\/db\/([^\/]+)/);
    
    if (!codeMatch) return app(req, res);
    
    const code = codeMatch[1];
  
    if (code === '_utils') {
      return app(req, res);
    }

    return getDBFromCode(code).then(dbname => {
      req.url = req.url.replace(code, dbname);
      app(req, res);
    }).catch(e => {
      res.end(e.message);
    });
  }

  return app(req,res);
}).listen(process.env.PORT || 8080);

console.log('Your pouchdb is listening on port ' + (process.env.PORT || 8080));
