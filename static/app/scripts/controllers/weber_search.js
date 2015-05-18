'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:WeberSearchCtrl
 * @description
 * # WeberSearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
    .controller('WeberSearchCtrl', function($scope, $timeout, $q, $auth, Restangular,$route,$window, InterestsService,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.UserService = UserService;
	 	$scope.InterestsService = InterestsService;
	 	if(typeof $rootScope.currentUser === 'undefined'){
            $http.get('/api/me', {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': $auth.getToken()
                }
            }).success(function(user_id) {
                var params = '{"send_add_requests":1}';
                Restangular.one('people',JSON.parse(user_id)).get({embedded:params, seed: Math.random()}).then(function(user) {


                    $rootScope.currentUser = user;
                    //$rootScope.temp_user = user;
                    if($rootScope.currentUser.interests.length == 0 &&
                        $rootScope.currentUser.questions.length < 4){

                       $location.path("/enter_interests")
                    }

                    //console.log($scope.currentUser);
                    $scope.searchActivity = new SearchActivity($rootScope.currentUser);
                    $scope.searchActivity.getMysearches();
                    store_search_text($routeParams.query);

                });
            });

        }else{
            if($rootScope.currentUser.interests.length == 0 &&
                $rootScope.currentUser.questions.length < 4){
                $location.path("/enter_interests")
            }
            //console.log($scope.currentUser);
            $scope.searchActivity = new SearchActivity($scope.currentUser);
            $scope.searchActivity.getMysearches();
            store_search_text($routeParams.query);
        }

        // delete search history item
        $scope.delete_searchHistoryItem = function(id){
            $scope.delete_searchHistory = $timeout(function(){
                $scope.searchActivity.deleteItem(id);
            },2000);
        }

        $scope.perfomSearch = function(){
            $scope.load_data = $timeout(function(){
                $scope.search = true;
                if($scope.present_search_query == $scope.query) return;
                if($scope.query){
                    //alredy present searched query no need to search again
                    $location.search('query', $scope.query);
                    $scope.matchResults = new MatchMeResults($scope.query, $scope.location);
                    $scope.matchResults.newSearchResults();
                    if($scope.isAuthenticated()){
                        store_search_text($scope.query);
                    }
                }
                $scope.present_search_query = $scope.query;
            },2000);
        }

        $scope.storequestion = function(){
            var question = $scope.enterquestion;
            $scope.enterquestion = null;
            Restangular.all('questions').post({
                'question':question
            }).then(function(data){
                console.log('questions posted',data)
            });
        }

        $scope.go = function(query){
            $scope.query = query;
            $scope.perfomSearch($scope.query);
        }

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        if($routeParams.query){
            $scope.search = $routeParams.query;
            $scope.query = $routeParams.query;
            $scope.matchResults = new MatchMeResults($routeParams.query,$scope.location);
            $scope.matchResults.newSearchResults();
            $scope.searched=true;
        }

        function store_search_text(searchText){
            if(searchText){
                $scope.searchActivity.addSearchText(searchText);
            }
        }
 	});



