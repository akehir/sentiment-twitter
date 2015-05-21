var port = (process.env.VCAP_APP_PORT || 3000);
var express = require("express"); 
var mongoClient = require("mongodb").MongoClient;

var twitter = require('ntwitter');
var DEFAULT_TOPIC = "IBM";

// defensiveness against errors parsing request bodies...
process.on('uncaughtException', function (err) {
	console.log('Caught exception: ' + err.stack);
});

var app = express();
// Configure the app web container
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.static(__dirname + '/public'));
});


// Database Connection
var mongo = {};
var dbKeywordsCollection	= "keywords";

if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);

    if (env['mongodb-2.4']) {
        mongo['url'] = env['mongodb-2.4'][0]['credentials']['url'];
    }

    console.log("Mongo URL:" + mongo.url);
} else {
   console.log("No VCAP Services!");
}


var myDb;
var mongoConnection = mongoClient.connect(mongo.url, function(err, db) {
  if(!err) {
    console.log("Connection to mongoDB established");
    myDb = db;
  } else {
  	console.log("Failed to connect to database!");
  }
});


// REST API
app.get('/liveMode', function (req, res) {
	//Switch to live mode
	res.send(200);
}); 
  
app.get('/demoMode', function (req, res) {
	//Switch to demo mode
	res.send(200);
});

app.get('/clearDatabase', function (req, res) {
	//Clear Database
	res.send(200);
}); 

app.get('/addSingleTweet', function (req, res) {
	//Add single tweet
	res.send(200);
});


//Twitter Analysis
var twitter = require('ntwitter');
var outputs = [];
var MonitoringKeywords = [{phrase:'apple'}];
var stream; 
var tweeter = new twitter({
    consumer_key: 'pxgpKlOkM2ZzDtDtHdN1rNGHE',
    consumer_secret: 'OD8y15tzLopptWGTgsODsXxCInEQ9qp3h9mQtGtXK9qR4rlmHm',
    access_token_key: '2151132853-K7nCNfeCbSjdSZvOgyfm7NCMPlweIxVAFsZzQE6',
    access_token_secret: 'LPpYQVmvrC9S3Y1I6aEBW7czcltN1b7iZfn442kvuxOEi'	
});
tweeter.verifyCredentials(function (error, data) { 
	console.log("Hello, " + data.name + ".  I am in your twitters.");
});

function FindOutKeyWords(data) {
	for(var i=0;i<MonitoringKeywords.length;i++){ 
		tweeterText = data.text.toString();
		if(tweeterText.search(MonitoringKeywords[i].phrase.toString().toLowerCase())!=-1)	{
			//console.log(data.text);
			//console.log(data.created_at);
			outputs.push({
				phrase:  MonitoringKeywords[i].phrase,
				text:	 tweeterText,
				date: 	 data.created_at	
			})
		}
	}
}

function FormatInput() {
	MonitoringKeywords.push({phrase:'coke'});
}

tweeter.verifyCredentials(function (error, data) {
		if (error) {
			return "Error connecting to Twitter: " + error;
		} else {
			FormatInput();		
			console.log(MonitoringKeywords);	 
			KeyWords =  MonitoringKeywords.map(function(elem){return elem.phrase;}).join(",");
			console.log(KeyWords);

			stream = tweeter.stream('statuses/filter', {
				'track': KeyWords
			}, function (stream) {
				console.log("Monitoring Twitter for "); 
				stream.on('data', function (data) {
					// only evaluate the sentiment of English-language tweets
					if (data.lang === 'en') {
						FindOutKeyWords(data);
					}
						 
				});
			}); 
			return stream;
		}
});


setInterval(function(){

	// Check MongoDB Keywords Collection
	var collection = myDb.collection(dbKeywordsCollection);
	collection.find().toArray(function(err, docs) {
		if (docs.length > 0) {
			console.log("Keywords:");
	    	console.log(docs);
	    } else {
	    	console.log("No keywords in database!");
	    }
	    res.send(200);
	  });
	

  console.log(outputs);
},  5000);  

//app.listen(1337,'127.0.0.1');

app.listen(port);
console.log("Server listening on port " + port);

