var app = angular.module('sentiment', []);

app.controller('myCtrl', function($scope, $http, $timeout) {
    
    var message = ""; 
    $scope.switchMode = function() {

        if ($scope.mode == "Demo") {

        	//$http.get('/demoMode').success(function(data) {});
		$http.post('/demoMode', {phrase:$scope.addTerm}).success(function(data, status, headers, config) {});

            $scope.mode = "Live";

        } else {

            $http.get('/liveMode').success(function(data) {
            });
            $scope.mode = "Demo";

        }
    };
    $scope.addOneMode = function() {

        if ($scope.addMode == "Add-One Demo") {

        	$http.get('/addOneMode').success(function(data) {
            });
            $scope.addMode = "Stop Add-One";

        } else {

            $http.get('/stopAddOne').success(function(data) {
            });
            $scope.addMode = "Add-One Demo";

        }
    };    
    $scope.addMode = "Add-One Demo";

	
    $scope.clearDatabase = function() {
        $http.get('/clearDatabase').success(function(data) {
            alert("Database cleared!");
        });
    };
 
    $scope.addSingleTweet = function() {
        $http.get('/addSingleTweet').success(function(data) {
        });
    };
     $scope.reset = function() {
        $http.get('/reset').success(function(data) {
		message = "";
        });
    };	
    $scope.mode = "Demo";  
    var refresh = function() {
    	$http.get('/sentiment').success(function(data) { 
	     message = message +'	' + data  
	     $scope.debug = message;
    	});
    };
   
    var poll = function(){
    	$timeout(function(){refresh();poll();},1000);
    };	 
    poll();	
});