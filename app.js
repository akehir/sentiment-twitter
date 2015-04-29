/* text form
var MonitoringKeywords = [
			{
				phrase:  'apple'				
			}
		];
var outputs = [
			{
				phrase:  'apple',
				text:,
				date: 
			}
		];

*/
var twitter = require('ntwitter');
var outputs = [];
var MonitoringKeywords = [{phrase:'apple'}];
 
// Twitter keys registered for url: http://sentimentanalysis-twitter-akehir.eu-gb.mybluemix.net/
// Created at: https://dev.twitter.com/apps
var tweeter = new twitter({
	consumer_key: '1sUZwiAsNf10CormEHFHHjvi4',
	consumer_secret: 'exCPrWNVYbKvq5EjXD7N7J03BCOzzqbDB0qoryJSncKLgdBO94',
	access_token_key: '72076928-3k6OWatiPDXCrnmtTKLgax7hdvtssqJmBRuCMV1pr',
	access_token_secret: 'F7Kbjf5mduPRRjOahLksXq66xTUsSGNwWrYFLQyCib4rQ'
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
  console.log(outputs);
},  5000);  
