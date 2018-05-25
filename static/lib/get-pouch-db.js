
import addScript from './add-script.js';

function getPouchDB(name) {
  if (!getPouchDB.dbs) {
    getPouchDB.dbs = []; 
  }
  if (!getPouchDB.promise) {
    getPouchDB.promise = addScript('/module/pouchdb/dist/pouchdb.min.js'); 
  }
  return getPouchDB.promise
    .then(() => getPouchDB.dbs[name] || new window.PouchDB(name))
    .then(db => getPouchDB.dbs[name] = db);
}

export default getPouchDB;