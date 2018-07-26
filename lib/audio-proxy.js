'use strict';

const fileType = require('file-type');
const request = require('request');

const reqheaders = [
	'If-Range',
	'Range',
	'Accept',
	'Accept-Encoding',
	'Accept-Language',
  'Connection'
];

const resheaders = [
	'Connection',
	'Accept-Ranges',
	'Content-Encoding',
	'Content-Language',
	'Content-Length',
	'Content-MD5',
	'Content-Range',
	'Content-Type',
	'Date',
	'Last-Modified',
	'ETag'
];

const resheadersNoRange = [
	'Connection',
	'Content-Length',
	'Content-Encoding',
	'Content-Language',
	'Content-MD5',
	'Content-Type',
	'Date',
	'Last-Modified',
	'ETag'
];

module.exports = function (req, res) {
	let url = req.query.url;
	if (url.match(/^https?%3A%2F%2F/i)) {
		url = decodeURIComponent(url);
	}
  req.setTimeout(3600000);
	return new Promise(function (resolve, reject) {
		const headersObj = {
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1'
		};
    console.log(req.headers);
		for (const h of reqheaders) {
			if (req.headers[h.toLowerCase()]) headersObj[h] = req.headers[h.toLowerCase()];
		}
		if (url) {
			const myReq = request({
				url: url,
				followRedirect: true,
				strictSSL: false,
				timeout: 15000,
				headersObj
			});

			myReq.on('response', function (response) {

				req.on('close', function () {
					console.log('Termination of:', response.request.uri.href);
					myReq.abort();
					response.destroy();
				});

				// req.on('end', function() {
				// 	console.log('Stream finished?', response.request.uri.href);
				// 	myReq.abort();
				// 	response.destroy();
				// });

				response.on('data', chunk => {

          if (response.headers['access-control-allow-origin'] === '*') {
            console.log('Server supports access control so redirect.');
            myReq.abort();
            response.destroy();
            return res.redirect(301, response.request.uri.href);
          }
          
          if (!res.headersSent) {
            console.log('Proxying:', response.request.uri.href, headersObj.Range);
            console.log(response.headers);
            
            // If it does not have appropirate range headers assume it is the whole file.
            let useHeaders;
            
            if (
              response.headers['content-range'] &&
              response.headers['content-length'] &&
              response.headers['accept-ranges']
            ) {
              useHeaders = resheaders;
              res.status(206);
            } else {
              useHeaders = resheadersNoRange;
              res.status(200);
            }

            for (const h of useHeaders) {
              if (response.headers[h.toLowerCase()]) {
                res.set(h, response.headers[h.toLowerCase()]);
              }
            }
          }
					res.write(chunk);
				});

				response.on('end', function() {
          console.log('Stream finished sending');
				});
			});

			myReq.on('error', reject);
		} else {
			throw Error('No url param!!!');
		}
	})
	.catch(function (err) {
		console.log(err, err.stack);
		if (!res.finished) {
			res.status(400);
			res.json({
        error: true,
				message: err.message
			});
		}
	});
}