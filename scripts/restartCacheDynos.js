const Heroku = require('heroku-client');
const heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });
heroku.delete('/apps/' + process.env.HEROKU_APP_NAME + '/dynos/clock').then(app => {});

