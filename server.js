// Open a realtime stream of Tweets, filtered according to rules
// https://developer.twitter.com/en/docs/twitter-api/tweets/filtered-stream/quick-start

const needle = require('needle');
const path = require('path');
const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');     //added for certificate error

//https://stackoverflow.com/questions/27393705/how-to-resolve-a-socket-io-404-not-found-error

var app = express();
var socket = require('socket.io');

//const server = http.createServer(app);


const secureServer = https.createServer({
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.cert'),
   // ca: fs.readFileSync('./server.ca'),
    requestCert: false,
    rejectUnauthorized: false
}, app);



//const io = require('socket.io')(server);
//const ios = require('socket.io')(secureServer);
const ios = require('socket.io')(secureServer, {
    cors: {
      origin: '*',
    }
  });

/*
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  }
});
*/

app.use(express.static('public'));

const HTTP_PORT = 3000;
const HTTPS_PORT = 443;

/*
io.on("connection", (socket) => {
  //  new Socket(socket);
})
*/


ios.on("connection", (socket) => {
    new Socket(socket)
});



/*
server.listen(HTTP_PORT, () => {
    console.log('server started at 3000');
});
*/


secureServer.listen(HTTPS_PORT, () => {
    console.log("secure server started at 3000");
})


var historyTweets = [];

// The code below sets the bearer token from your environment variables
// To set environment variables on macOS or Linux, run the export command below from the terminal:
// export BEARER_TOKEN='YOUR-TOKEN'
const token = process.env.TWITTER_BEARER_TOKEN;
const base = process.env.PWD;

const rulesURL = 'https://api.twitter.com/2/tweets/search/stream/rules';
const streamURL = 'https://api.twitter.com/2/tweets/search/stream';
const searchUrl = "https://api.twitter.com/2/tweets/search/recent";

// this sets up two rules - the value is the search terms to match on, and the tag is an identifier that
// will be applied to the Tweets return to show which rule they matched
// with a standard project with Basic Access, you can add up to 25 concurrent rules to your stream, and
// each rule can be up to 512 characters long

// Edit rules as desired below
const rules = [{
        'value': '我的 -is:retweet -is:reply -has:hashtags -has:media -has:images -has:videos',
        'tag': '我的'
    },
];

async function getAllRules() {

    const response = await needle('get', rulesURL, {
        headers: {
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        console.log("Error:", response.statusMessage, response.statusCode)
        throw new Error(response.body);
    }

    return (response.body);
}

async function deleteAllRules(rules) {

    if (!Array.isArray(rules.data)) {
        return null;
    }

    const ids = rules.data.map(rule => rule.id);

    const data = {
        "delete": {
            "ids": ids
        }
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 200) {
        throw new Error(response.body);
    }

    return (response.body);

}

async function setRules() {

    const data = {
        "add": rules
    }

    const response = await needle('post', rulesURL, data, {
        headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${token}`
        }
    })

    if (response.statusCode !== 201) {
        throw new Error(response.body);
    }

    return (response.body);

}

function streamConnect(retryAttempt, socket) {

    const stream = needle.get(streamURL, {
        headers: {
            "User-Agent": "v2FilterStreamJS",
            "Authorization": `Bearer ${token}`
        },
        timeout: 20000
    });

    stream.on('data', data => {
        try {
            const json = JSON.parse(data);
            socket.emit('tweet', json.data.text);
            console.log(json.data.text);         //printing it on the console works
            // A successful connection resets retry count.
            retryAttempt = 0;
        } catch (e) {
            if (data.detail === "This stream is currently at the maximum allowed connection limit.") {
                socket.emit('errormax', data.detail);
                console.log(data.detail)
                process.exit(1)
            } else {
                // Keep alive signal received. Do nothing.
            }
        }
    }).on('err', error => {
        if (error.code !== 'ECONNRESET') {
            console.log(error.code);
            process.exit(1);
        } else {
            // This reconnection logic will attempt to reconnect when a disconnection is detected.
            // To avoid rate limits, this logic implements exponential backoff, so the wait time
            // will increase if the client cannot reconnect to the stream.
            setTimeout(() => {
                console.warn("A connection error occurred. Reconnecting...")
                streamConnect(++retryAttempt);
            }, 2 ** retryAttempt)
        }
    });

    return stream;

}

/* ----- From recent_search.js   ------ */

async function getRequest(socket) {

    // Edit query parameters below
    // specify a search query, and any additional fields that are required
    // by default, only the Tweet ID and text fields are returned
    const params = {
      'query': '我的 -is:retweet -is:reply -has:hashtags -has:media -has:images -has:videos',
      'max_results': 30,
    }

    const res = await needle('get', searchUrl, params, {
        headers: {
            "User-Agent": "v2RecentSearchJS",
            "authorization": `Bearer ${token}`
        }
    })

    if (res.body) {
        historyTweets = res.body.data.map(x => x.text);
        socket.emit('search', historyTweets);
        return historyTweets;
    } else {
        throw new Error('Unsuccessful request');
    }
}

//console.log("NODE_ENV is", process.env.NODE_ENV);
/*
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../Twitter_Against_Lonesome/public")));    
  app.get("*", (request, res) => {
    res.sendFile(path.join(__dirname, "../Twitter_Against_Lonesome/public", "index.html"));
  });
} else {
  port = 3000;
}
*/


(async () => {

    /*
    try {
        // Make request
        const response = await getRequest(io);
        console.log(response);

    } catch (e) {
        console.log(e);
        process.exit(-1);
    }
    */

    let currentRules;

    try {
        
        // Gets the complete list of rules currently applied to the stream
        currentRules = await getAllRules();

        // Delete all rules. Comment the line below if you want to keep your existing rules.
        await deleteAllRules(currentRules);

        // Add rules to the stream. Comment the line below if you don't want to add new rules.
        await setRules();

    } catch (e) {
        console.error(e);
        process.exit(1);
    }

    // Listen to the stream.
    streamConnect(0, ios);


})();

