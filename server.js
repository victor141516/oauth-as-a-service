const asyncRedis = require("async-redis");
const config = require('./config');
const express = require('express');
const {google} = require('googleapis');
const uuidv4 = require('uuid/v4');


const app = express();
const redisClient = asyncRedis.createClient({url: config.REDIS_URL});

const oauth2Client = new google.auth.OAuth2(
    config.CLIENT_ID,
    config.CLIENT_SECRET,
    config.REDIRECT_URI
);

app.get('/l/:scopes?', function (req, res) {
    let scope;
    if (req.params.scopes) scope = req.params.scopes.split(',');
    else scope = ['email', 'profile', 'openid'];
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope
    });

    res.redirect(url);
    res.end();
});

app.get('/callback', async (req, res) => {
    const {tokens} = await oauth2Client.getToken(req.query.code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const id = uuidv4();
    redisClient.set(id, refreshToken);
    res.json({id, accessToken});
    res.end();
});

app.get('/t/:id', async (req, res) => {
    const id = req.params.id;
    const refreshToken = await redisClient.get(id);
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });
    const {credentials} = await oauth2Client.refreshAccessTokenAsync();
    res.json({accessToken: credentials.access_token});
    res.end();
});


app.listen(config.PORT, function () {
    console.log(`Listening on port ${config.PORT}`);
});
