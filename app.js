var changePort = 3000;
var port = (process.env.VCAP_APP_PORT || changePort);
var express = require("express"); 
var mongoClient = require("mongodb").MongoClient;

var twitter = require('ntwitter');
var debugLog = "";

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

var dbResultsCollection		= "results";
var dbAnalyzingCollection	= "analyzing";
var dbKeywordsCollection	= "keywords";
var liveModeIntervalId = 0;
var fakeDataPushId = 0;
var addSingleTweetIntervalId = 0;
var flag = false;



if (process.env.VCAP_SERVICES) {
    var env = JSON.parse(process.env.VCAP_SERVICES);

    if (env['mongodb-2.4']) {
        mongo['url'] = env['mongodb-2.4'][0]['credentials']['url'];
    }

    console.log("Mongo URL:" + mongo.url);
} else {
   console.log("No VCAP Services!");
} 


//Twitter Analysis
var twitter = require('ntwitter'); 
var monitoringKeywords = [];
var output = [];
var addOneKeywords = [];

var stream; 
var currentStream=null;
var token=[
{
    consumer_key: 'pxgpKlOkM2ZzDtDtHdN1rNGHE',
    consumer_secret: 'OD8y15tzLopptWGTgsODsXxCInEQ9qp3h9mQtGtXK9qR4rlmHm',
    access_token_key: '2151132853-K7nCNfeCbSjdSZvOgyfm7NCMPlweIxVAFsZzQE6',
    access_token_secret: 'LPpYQVmvrC9S3Y1I6aEBW7czcltN1b7iZfn442kvuxOEi'
},
{
        consumer_key: 'Wr7nCnCWW6K9VTc8BZFkmfRp4',
	consumer_secret: 'z1yZAinkZwnGiAAICgmU8RRYdUaQ1L9JnL6SGG8oipMF9rEFzt',
	access_token_key: '72076928-DJyqqtOMpyFbpkLdBvIob3DfDarSeulSGZCdKvWU2',
	access_token_secret: 'xkfNyQvB9DqIMK6sqgaTo7t7Jd5xUf3WH67wdT5NzpmPj'
},
{
        consumer_key: 'LpN0IrfZO5fEWuyzau8LzQDbm',
	consumer_secret: 'pn9BImti2ecx7NoeV6HBnXSH5yjpv3llT3jSgAtg3l757hNAkx',
	access_token_key: '3224420179-SFDPvKkMjeMtv8jRlGZG2fphSDDhMXSveHgD03g',
	access_token_secret: 'tRRC5zV8OOIiL9czJ3k7ahdmEiNSVTMAGPITOhKsSugvV'
},
{
    consumer_key: 'gNAAexpKuVNFfpukHIsY2WnRy',
    consumer_secret: 'XAMTcKXOF06wrAfqYmKpUnWklPeobywij8t4AVoIX1EbZgL5Qw',
    access_token_key: '2151132853-cDNd1ShYFxpHwMNJYDzFwUnOMpTn2nrz2KYIyPd',
    access_token_secret: 'JvxKoUNl90x5CXucGGPDLw1F3tNTxAzRePeTWdHIoI3KL'
},
{
    consumer_key: 'zPcNN9lHtpjHxxTxI1RHySi1g',
    consumer_secret: 'lRhqt4FWskKKoN3TQqKJKJdUWiiWlELgeTVr2km6p66Ud56TGb',
    access_token_key: '3296410757-sWdYkpR0EfdHgXTwDcIsSCptwec3TML7ynzlLao',
    access_token_secret: '89kxffDMrsbJlwqlTzszNBXqDPzndtUVLvUJVL1Qq75Gf'
},
{
    consumer_key: 'F7RVHn3DO80N13pVnZgTNB58p',
    consumer_secret: 'AFLTTBX7PjZF1Orv3E2lwg0gZgUsV7WI8HepaD65VkVxJpffWH',
    access_token_key: '1395490608-0OJEK1z1ZiZUlKk6HgDhwxooujzVRJK9JfCARiW',
    access_token_secret: 'KMg4QqLj1TGzi8HuKCqWY6frbYGMhew983Yb4rMyFUjuu'
}
];
var nowToken = 4;
var tweeter = new twitter(token[nowToken]);
var numberID = 6;
var pushLine=1000; 
var demoMode = false;
var demoAgain = false;
  
var myDb; 
//var mongoConnection = mongoClient.connect('mongodb://127.0.0.1/mydb', function(err, db) {
var mongoConnection = mongoClient.connect(mongo.url, function(err, db) {
    
   if(!err) {
    console.log("Connection to mongoDB established");
    debugLog+="Connection to mongoDB established";
    myDb = db;
    liveModeIntervalId = setInterval(function(){ checkNewKeywords();},  2000); 
    //console.log(liveModeIntervalId);
  } else {
  	console.log("Failed to connect to database!");
  }
}); 
// REST API
app.get('/reset', function (req, res) {

	if(addOneMode){ 		
		clearInterval(addSingleTweetIntervalId);
		cleanStream();
		addOneMode = false; 
	}	
	clearInterval(liveModeIntervalId); 	
	cleanStream();	
	nowToken = (nowToken+1)%numberID;
	tweeter = new twitter(token[(nowToken)%numberID]);
	monitoringKeywords=[];
	verify();
	liveModeIntervalId = setInterval(function(){ checkNewKeywords();},  2000); 	
	//establishTwitterConnection();
	console.log("restart request");
	res.send(200);
}); 

app.get('/liveMode', function (req, res) {
	//Switch to live mode
	demoMode = false;
	if(addOneMode){
		clearInterval(addSingleTweetIntervalId);
		cleanStream();
		addOneMode = false;
	} 
	liveModeIntervalId = setInterval(function(){ checkNewKeywords();},  2000);	
	establishTwitterConnection();
	console.log("Live mode request");
	debugLog+="	Live mode request";
	res.send(200);
}); 
  
app.post('/demoMode', function (req, res) {
	//Switch to demo mode
	demoMode = true;
	debugLog+="	Demo mode request";
	if (req.body.phrase) {
		pushLine = req.body.phrase;
	}
	console.log("Demo mode request "+pushLine); 
	

	clearInterval(liveModeIntervalId);
	clearInterval(addSingleTweetIntervalId);
	cleanStream(); 
	if(!demoAgain){
		var collection = myDb.collection(dbKeywordsCollection); 
		collection.insert({phrase: 'chrome'});	
		collection.insert({phrase: 'Firefox'});	
		collection.insert({phrase: 'opera'});	
		collection.insert({phrase: 'Safari'});
		collection.insert({phrase: 'Internet Explorer'});
	} 
	clearInterval(fakeDataPushId);
	pushData(); 
	demoAgain = true;
	res.send(200);
});

app.get('/clearDatabase', function (req, res) {
	console.log("Clear database request"); 
	cleanData(); 	
	res.send(200);	 
}); 
function cleanData(){
    var collection = myDb.collection(dbKeywordsCollection); 
        collection.remove();
	collection = myDb.collection(dbAnalyzingCollection); 
        collection.remove();
	collection = myDb.collection(dbResultsCollection); 
        collection.remove();
	monitoringKeywords = [];
	output = [];
}
var fakeData=[];
function pushData(){
	var fs = require('fs'),readline = require('readline');
        var rd = readline.createInterface({
   	        input: fs.createReadStream('big.txt'),
    		output: process.stdout,
                terminal: false
	});
	fakeData = [];
	
	var collection = myDb.collection(dbKeywordsCollection);
	collection.find().toArray(function(err, docs) {
		monitoringKeywords = docs;  
	});

	if(pushLine==null)
		pushLine = 1000; 
	debugLog+=" push start";
	console.log(pushLine);
 	fakeDataPushId = setInterval(function(){ fakeDataPush()},  1000);

	rd.on('line', function(line) {
		fakeData.push(line.toString()); 
	});
	rd.on('close', function() { 
		rd.close();
			 
	}); 

}

//Thu May 28 13:50:33 +0000 2015",

function fakeDataPush(){ 

	for(var i=0;i<pushLine;i++){
		var line = fakeData.pop();
		if(line==null){	
			clearInterval(fakeDataPushId);
			debugLog+=" push finish";
			return;
		}	
		FindOutKeyWords(line,"Thu May "+(20+randomInt(10))+" 13:50:33 +0000 2015");
		//console.log(line+'\n'+"Thu May "+(20+randomInt(10))+" 13:50:33 +0000 2015");
   	} 
	
}

 
function randomInt(max) {
  return Math.floor(Math.random() * (max));
}



var preKeywords;
var singleTweetBuffer;
var addOneMode = false;
function cleanStream(){
	if(currentStream){ 
	  	     currentStream.removeAllListeners();	
		     currentStream.destroy(); 
	}
}
//because we only monitor the new keywords
var prePhrase=[];

app.get('/addOneMode', function (req, res) {
	//Add single tweet	 
	if(addOneMode == false){
		console.log("Add one mode");
		debugLog+=" Add one mode";
		addOneMode = true;
        	clearInterval(liveModeIntervalId);
		cleanStream();
		output = [];
		prePhrase = [];
		preKeywords= monitoringKeywords;
		monitoringKeywords = [];
		for(var i=0;i<preKeywords.length;i++)
			prePhrase.push(preKeywords[i].phrase); 
		 
		
	}	 
	res.send(200);
});
app.get('/stopAddOne', function (req, res) {
	if(addOneMode){ 		
		console.log("Stop add one mode");
		debugLog+="	Stop add one mode";
		clearInterval(addSingleTweetIntervalId);
		cleanStream();
		liveModeIntervalId = setInterval(function(){ checkNewKeywords();},  2000);
		addOneMode = false; 
		establishTwitterConnection();	
	}
	res.send(200);		
});
app.get('/addSingleTweet', function (req, res) {
	//Add single tweet
	console.log("addSingleTweet");
	debugLog+="	addSingleTweet";
	if(addOneMode){
		var collection = myDb.collection(dbAnalyzingCollection);
		if(output.length>0){
		   tmp = output.shift();
		   collection.insert(tmp);
		   //console.log(tmp); 
		   debugLog+=tmp;	
		}
	}	
	res.send(200);
}); 





verify(); 
function verify(){ 
	tweeter.verifyCredentials(function (error, data) { 
		if(error){
			console.log('verify fail' + token[(nowToken)%numberID].consumer_key);
			debugLog+=' verify fail' + nowToken;
			tweeter = new twitter(token[(nowToken++)%numberID]);
			if(nowToken>15)
				process.exit(1);
			verify();
			return;
		}		   	
		else{		
			console.log("Hello, " + data.name + ".  I am in your twitters.");
			debugLog+=" Hello, " + data.name + ".  I am in your twitters."
		}
	}); 
}
function FindOutKeyWords(data,created_at) {

	var collection = myDb.collection(dbAnalyzingCollection); 
	for(var i=0;i<monitoringKeywords.length;i++){ 
		tweeterText = data.toLowerCase();
		if(tweeterText.search(monitoringKeywords[i].phrase.toString().toLowerCase())!=-1)	{
			console.log(monitoringKeywords[i].phrase);
			if(!demoMode)
				debugLog+=' '+monitoringKeywords[i].phrase;
			//console.log(created_at);
			var tweet = {
				phrase:  monitoringKeywords[i].phrase,
				text:	 tweeterText,
				date: 	 created_at	
			}
			if(addOneMode)
				output.push(tweet); 
			else
				collection.insert(tweet);
		}
	}
}
 
  
function establishTwitterConnection() {
	
	// cleanup if we're re-setting the monitoring
	 	
 	console.log('establish');
	debugLog+=' establish';
	var monitoringPhrase = monitoringKeywords.map(function(elem){return elem.phrase;}).join(",");
        //console.log(monitoringKeywords);
	cleanStream();
	tweeter.verifyCredentials(function (error, data) {
		//verify();
		//token = token%numberID;  
		if (error) {
			return "Error connecting to Twitter: " + error;
		} else {
			//console.log('here');				   
			tweeter.stream('statuses/filter', {
				'track': monitoringPhrase
			}, function (stream) { 
				 console.log("Monitoring Twitter for " +  monitoringPhrase); 
				 debugLog+=' Monitoring Twitter for ' +  monitoringPhrase;
				 cleanStream();
			         currentStream = stream;	
				 stream.on('data', function (data) {
					//console.log(nowToken+' '+monitoringPhrase ); 
					
					if (data.lang === 'en') {
						 //console.log(data.text.toString());
						FindOutKeyWords(data.text.toString(),data.created_at);
					}					 
				}); 
				stream.on('error', function (error) {
					console.log('Error: ' + error);
					debugLog+=' Error: ' + error;
					setTimeout(function(){
						cleanStream(); 
						tweeter = new twitter(token[(nowToken++)%numberID]);
						console.log('nowToken '+nowToken);
						debugLog+=' nowToken '+nowToken;
						if(nowToken>15)
							process.exit(1);
						establishTwitterConnection();  
					}, 2000);
 
				}); 
				stream.on('disconnect', function (disconnectMessage) {
					setTimeout(function(){
						cleanStream();
						tweeter = new twitter(token[(nowToken++)%numberID]);
						establishTwitterConnection();  
					}, 1000);
   					console.log('disconnectMessage: ' + disconnectMessage); 
				});
				
				 
			}); 
			   
		}
	});
}

function checkNewKeywords() {
	// Check MongoDB Keywords Collection
	 
	var collection = myDb.collection(dbKeywordsCollection);
	collection.find().toArray(function(err, docs) {
		if (docs.length > 0) {
			if (JSON.stringify(monitoringKeywords) != JSON.stringify(docs)) {
		    	monitoringKeywords = docs; 
		    	establishTwitterConnection();  
		    	console.log(monitoringKeywords);
			debugLog+=' '+monitoringKeywords;
		    } else {
		    	//console.log("No new keywords");
		    }
	    } else {
	    	//console.log("No keywords in database!");
	    	if (monitoringKeywords.length != 0) { 	
		    	monitoringKeywords = [];
			//establishTwitterConnection();
		}
	    }
	  });
}


//app.listen(3337,'127.0.0.1');
app.listen(port);

console.log("Server listening on port " + port);

 
 
setInterval(function(){ 
	var collection = myDb.collection(dbAnalyzingCollection); 
	collection.find().toArray(function(err, docs) {
		console.log('number '+docs.length);
		debugLog+=' number '+docs.length;
		if(output.length>50){
			output = output.slice(1,50);
		}
	});
}, 5000);

/* 
setTimeout(function(){ 
var collection = myDb.collection(dbKeywordsCollection); 
collection.insert({phrase: 'coke'});
//location.reload();	
}, 600);


setTimeout(function(){ 
var collection = myDb.collection(dbKeywordsCollection); 
collection.insert({phrase: 'android'});
//location.reload();	
}, 10000);
setTimeout(function(){ 
var collection = myDb.collection(dbKeywordsCollection); 
collection.insert({phrase: 'bread'});
//location.reload();	
}, 15000);
setTimeout(function(){ 
var collection = myDb.collection(dbKeywordsCollection); 
collection.insert({phrase: 'wow'}); 
}, 20000);
*/ 
 


function monitorSingleWords() {
	// Check MongoDB Keywords Collection
        //console.log("single mode");
	var collection = myDb.collection(dbKeywordsCollection);
	collection.find().toArray(function(err, docs) {
		   if (docs.length > 0) { 
			if(JSON.stringify(preKeywords) != JSON.stringify(docs)){  
				for(var i=0;i<docs.length;i++){
					if(prePhrase.indexOf(docs[i].phrase)!=-1)
						continue;
					monitoringKeywords.push({phrase:docs[i].phrase});
				} 
				establishTwitterConnection(); 
				preKeywords = docs;
				 
			}  
		    }
	});
}


app.get('/sentiment', function (req, res) {
	/*
		Called by AngularJS application
		Delivers JSON with current sentiment analysis results
	*/
      res.json(debugLog);
      debugLog=''; 

});
 