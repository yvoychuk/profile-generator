const express = require('express');
const app = express();
const axios = require('axios');
const randomWord = require('random-word');

const server = {};

const generateIntegers = function (config) {
  let random = config.random;
  axios.post(random.url, {
    'jsonrpc': '2.0',
    'method': 'generateIntegers',
    'params': {
      'apiKey': random.apiKey,
      'n': 1,
      'min': 1,
      'max': 5
    },
    'id': 0
  })
    .then((resp) => {
      let result = resp.data.result;
      console.log(result.requestsLeft)
      console.log(result.random.data)
    })
}

const generateIcon = function (config) {
  let dogceo = config.dogceo;
  axios.get(dogceo.url)
    .then((resp) => {
      console.log(resp.data.message)
    })
}

const generateApikey = function (profiles) {
  let apikey = [...Array(6)].map(
    () => {
      return Math.round(Math.random()) === 0 ?
        Math.floor(Math.random() * 10)
        : Math.random().toString(36).replace(/[^a-z]+/g, '').charAt(0)
    }
  ).join('');
  let exists = profiles.filter((profile) => {return profile.apikey === apikey}).length > 0;
  return exists ? generateApikey(profiles) : apikey;
}

const generateEmail = function (profiles, notUnique) {
  let name = randomWord();
  let base = randomWord().substr(3);
  let ext = '.com';
  let email = name + '@' + base + ext;
  let exists = profiles.filter((profile) => {return profile.email === email}).length > 0;
  return exists && !notUnique ? generateEmail(profiles) : email;
}

const generateUUID = function (apikey) {
  axios.post({
    'jsonrpc': '2.0',
    'method': 'generateUUIDs',
    'params': {
      'apiKey': apikey,
      'n': 1
    },
    'id': 0
  })
}

const generateProfile = function (config, db) {
  db.allDocs()
    .then(
      (result) => {
        let profile = {};
        profile.apikey = generateApikey(result.rows);
        profile.email = generateEmail(result.rows);
        profile.createdAt = Date.now();
        profile.emailVerificationStatus = 'pending';
        profile.groups = [];
        profile.id = '';//generateUUID(config.random.apiKey);
        profile.isManual = true;
        profile.joinedAt = null;
        profile.modifiedAt = "";
        profile.profileSources = [];
        profile.rev = '';
        profile.status = '';
        profile.badge = {};
        profile.badge.address = randomWord();
        profile.badge.badgeId = '';//generateUUID(config.randog.apiKey);
        profile.badge.bio = randomWord();
        profile.badge.company = randomWord();
        profile.badge.firstName = randomWord();
        profile.badge.icon = {origin: {cropUrl: 'https://robohash.org/' + randomWord() + '.png'}};
        profile.badge.interestTags = [];
        profile.badge.lastName = randomWord();
        profile.badge.name = (profile.badge.firstName + profile.badge.lastName).trim();
        profile.badge.phone = [...Array(10)].map(() => {return Math.floor(Math.random() * 10)}).join('');
        profile.badge.position = randomWord();
        profile.badge.secondaryEmail = generateEmail(result.rows, true);
        profile.badge.website = randomWord() + '.com';
        return profile;
      }
    )
    .then(
      (profile) => {
        db.put(Object.assign(
          {
            _id: profile.apikey
          },
          profile
        ))
      }
    )
}

server.run = function (config, db) {

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  app.get('/', (req, res, next) => {
    console.log('index');
    res.json({page: 'index'});
    next();
  })

  app.get('/fetch_all', (req, res, next) => {
    console.log('fetch all')
    db.allDocs(
      {
        include_docs: true
      }
    )
      .then((result) => {
        res.json({profiles: result.rows.map(
          (row) => {
            return row.doc;
          }
        )})
      })
      .then(() => {next()})
  })

  app.get('/fetch/:id', (req, res, next) => {
    let id = req.params.id
    db.get(id)
      .then((result) => {
        res.json({result: result})
      })
      .then(() => {next()})
  })

  app.get('/generate', (req, res, next) => {
    generateProfile(config, db);
    res.json({status: 'ok'})
  })

  app.get('/generate/:amount', (req, res, next) => {
    let amount = req.params.amount;
    for (let i = 0; i < amount; i++) {
      generateProfile(config, db);
    }
    res.json({status: 'ok'})
  })


  app.get('/remove_all', (req, res, next) => {
    db.allDocs()
      .then((resp) => {
        return resp.rows.map((row) => {
          return {
            _id: row.id,
            _rev: row.value.rev,
            _deleted: true
          }
        });
      })
      .then((docs) => {
        return db.bulkDocs(docs)
      })
      .then((result) => {
        res.json({
          result: result,
          status: 'removed all profiles'
        })
      })
  })

  let port = 3300;
  app.listen(port, () => console.log('Example app listening on port ' + port))

};

module.exports = server;