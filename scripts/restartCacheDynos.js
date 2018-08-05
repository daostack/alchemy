const Heroku = require('heroku-client');
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });
const appName = process.env.NODE_ENV == 'production' ? 'daostack-alchemy-client' : 'daostack-alchemy-staging';
heroku.delete('/apps/' + appName + '/dynos/clock').then(app => {});

