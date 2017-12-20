const PouchDB = require('pouchdb');

const db = {};

db.run = function () {
  return new PouchDB('profiles');
}

module.exports = db;