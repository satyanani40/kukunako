'use strict';

/**
 * @ngdoc function
 * @name weberApp.controller:WeberSearchCtrl
 * @description
 * # WeberSearchCtrl
 * Controller of the weberApp
 */
angular.module('weberApp')
    .controller('WeberSearchCtrl', function($scope, $q, $auth, Restangular,$route,$window, InterestsService,
	 										InfinitePosts, $alert, $http,$location,$socket,
	 										CurrentUser, UserService,CurrentUser1,$rootScope,
	 										SearchActivity, $routeParams, MatchMeResults) {
	 	$scope.searched = false;
	 	$scope.UserService = UserService;
	 	$scope.InterestsService = InterestsService;
        $scope.$watch('currentUser', function(){
            if(typeof $scope.currentUser !== 'undefined' && $scope.isAuthenticated()){
                // check interests and questions answered or not
                if($scope.currentUser.interests.length == 0 &&
                    $scope.currentUser.questions.length < 4){
                    $location.path("/enter_interests")
                }

                //console.log($scope.currentUser);
                $scope.searchActivity = new SearchActivity($scope.currentUser);
                $scope.searchActivity.getMysearches();
                store_search_text($routeParams.query);
            }
        });

        // delete search history item
        $scope.delete_searchHistoryItem = function(id){
            $scope.searchActivity.deleteItem(id);
        }

        $scope.perfomSearch = function(){
            $scope.search = true;
            if($scope.present_search_query == $scope.query) return;
            if($scope.query){
                // alredy present searched query no need to search again
                $location.search('query', $scope.query);
                $scope.matchResults = new MatchMeResults($scope.query, $scope.location);
                $scope.matchResults.newSearchResults();
                if($scope.isAuthenticated()){
                    store_search_text($scope.query);
                }
            }
            $scope.present_search_query = $scope.query;
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



