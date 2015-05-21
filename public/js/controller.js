var app = angular.module('sentiment', []);

app.controller('myCtrl', function($scope, $http, $timeout) {

    $scope.switchMode = function() {

        if ($scope.mode == "Demo") {

        	$http.get('/liveMode').success(function(data) {
            });
            $scope.mode = "Live";

        } else {

            $http.get('/demoMode').success(function(data) {
            });
            $scope.mode = "Demo";

        }
    };

    $scope.clearDatabase = function() {
        $http.get('/clearDatabase').success(function(data) {
            alert("Database cleared!");
        });
    };

    $scope.addSingleTweet = function() {
        $http.get('/addSingleTweet').success(function(data) {
        });
    };

    $scope.mode = "Demo";
});