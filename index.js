const server = require('./server.js');
const pouchdb = require('./db.js');
const config = require('./config.js');

const db = pouchdb.run();

// db.info()
//   .then((info) => {console.log(info)})
//   .catch((err) => {console.log(err)})

server.run(config, db);