'use strict';
/**
 * @ngdoc service
 * @name weberApp.weberService
 * @description
 * # weberService
 * Service in the weberApp.
 */
angular.module('weberApp')

       .factory('questions', function($http, Restangular,$auth) {

        var questions = function(currentuser){
            this.currentuser = currentuser;
            this.allquestions = [];
            this.cuserquestions = [];
            this.user2 = {},
            this.canswers = this.currentuser.questions;
            console.log(this.currentuser.username)
        }

        questions.prototype.getallquestions = function(){
          Restangular.all('questions').getList().then(function(data){
            this.allquestions.push.apply(this.allquestions, data);

          }.bind(this));
        }

        function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        questions.prototype.getUserQuestions = function(){
            var cuserquestionids = []

            for(var temp in this.currentuser.questions){
                cuserquestionids.push((this.currentuser.questions[temp].questionid).toString())
            }
            console.log('cuser question ids', cuserquestionids)

            var params = '{"_id": {"$in":['+combine_ids(cuserquestionids)+']}}';

            console.log(params)
            Restangular.all('questions').getList({where:params, seed: Math.random()}).then(function(data){
            this.cuserquestions.push.apply(this.cuserquestions, data);
          }.bind(this));

        }

        questions.prototype.updateAnswer = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.currentuser._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.canswers){
                    if(this.canswers[temp].questionid == question){
                        this.canswers[temp].answer = answer;
                        return true
                    }
		        }

		        this.canswers.push({'questionid':question, 'answer':answer});
		    }.bind(this));
        }

        questions.prototype.checkAnswer = function(questionid){
            for(var temp in this.canswers){
                if(this.canswers[temp].questionid == questionid){
                    return this.canswers[temp].answer;
                }
            }
            return 3;
        }

         questions.prototype.checkYouAnswered = function(questionid, cuser){
            this.user2 = cuser;
            for(var temp in this.user2.questions){
                if(this.user2.questions[temp].questionid == questionid){
                    return true;
                }
            }
            return false;
         }

         questions.prototype.updateUser2 = function(question, answer){
            console.log('----------------service------------')
            Restangular.one('updateAnswer').get({
		        question : question,
		        answer : answer,
		        cuserid : this.user2._id,
		        seed:Math.random()
		    }).then(function(data){
		        console.log('updated answer', data);
		        for(var temp in this.user2.questions){
                    if(this.user2.questions[temp].questionid == question){
                        this.user2.questions[temp].answer = answer;
                        return true
                    }
		        }
		       this.user2.questions.push({'questionid':question, 'answer':answer});
		    }.bind(this));
         }


        return questions;
    })

	.factory('InstanceSearch', function($http, Restangular, $alert, $timeout) {

		var InstanceSearch = function() {

			this.InstancesearchResult = [];
			this.busy = false;
			this.end = false;
			this.page = 1;
			this.query = null;
		};

		InstanceSearch.prototype.getInstancePeoples = function(query){

            var self = this;
            this.query = query;
            if((query)) {
                var req = {
                    method: 'POST',
                    url: '/api/getpeoplenames',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: this.page,
                        query: query.toLowerCase()
                    }
                }

                $http(req).success(function (peoples) {
                    self.InstancesearchResult = peoples;
                    //console.log(self.InstancesearchResult)
                }.bind(self));
            }else{
                self.InstancesearchResult = [];
            }

        };

        InstanceSearch.prototype.nextPage = function() {
            //console.log('next page')
            //console.log(this.busy, this.end)
            if (this.busy | this.end) return;
			this.busy = true;
			var self = this;
            var req = {
                 method: 'POST',
                 url: '/api/getpeoplenames',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 data: {
                    page: self.page,
                    query: self.query
                 },
            }

            $http(req).success(function(peoples){

                if (peoples.length === 0) {
					self.end = true;
				}
				self.InstancesearchResult.push.apply(self.InstancesearchResult, peoples);
				self.page = self.page + 1;
				self.busy = false;
				//console.log(self.InstancesearchResult)
            }.bind(self));

		};
       return InstanceSearch;
    })

	.service('UserService', function($http, Restangular) {
		this.users = [];

		this.get = function(userId) {
            for (var i in this.users) {
				if (this.users[i]._id == userId) {
				    return this.users[i];
				}
			}
			var promise = Restangular.one('people',userId).get().$object;
			promise._id = userId;
			this.users.push(promise);
			return promise;
		};

		this.getListUsers = function(userIdList){
		    this.usersList = [];
		    for(var k in userIdList){
		        this.usersList.push(this.get(userIdList[k]))
		    }
		    return this.usersList;
		}
	})
		.service('InterestsService', function($http, Restangular) {
		this.interests = [];

		this.get = function(interestid) {
		    if(interestid){
                for (var i in this.interests) {
                    if (this.interests[i]._id == interestid) {
                        return this.interests[i];
                    }
                }
                var promise = Restangular.one('interests',interestid).get().$object;
                promise._id = interestid;
                this.interests.push(promise);
                return promise;
            }
		};
	})

    .service('InstanceSearchHistory', function($http, Restangular) {
        this.history = [];
        this.get = function(query) {
            for (var i in this.history) {
                if (this.history[i].query == query) {
                    return this.history[i].result;
                }
            }
            return $http.get('/api/getpeoplenames/'+query);
        };

        this.pushToHistory = function(historyObject, query){
            this.history.push({
                'query':query,
                'result':historyObject
            })
        }
    })

	.service('MatchButtonService', function($http, Restangular, CurrentUser1) {

		this.checkMatchUnMatch = function(post, user) {
             //console.log('weber service post', post.interestedPeople)
             for(var i in post.interestedPeople){
		        if(post.interestedPeople[i].interested_person == user._id){
		            return true;
		        }
		     }
		     return false;
		};

		this.match = function(authorid, postid, cuserid){
		    return Restangular.one('match').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

		this.unmatch = function(authorid, postid, cuserid){
                return Restangular.one('unmatch').get({
		        cuserid : cuserid,
		        authorid : authorid,
		        postid: postid,
		        seed:Math.random()
		    });
		};

	})
    	.factory('InfinitePosts', function($http, Restangular, $alert, $timeout) {

		var InfinitePosts = function(user_obj,authorIds) {
			this.posts = [];
			this.SpecificPost = {},
			this.user_obj = user_obj;
			this.busy = true;
			this.page = 1;
			this.loadPostIds = authorIds;
			this.end = false;
            this.params = '{"author": {"$in":'+this.loadPostIds+'}}';
            //console.log('author params===>', this.params)
        }

        InfinitePosts.prototype.getEarlyPosts = function(){
                Restangular.all('posts').getList({
                    where : this.params,
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed:Math.random()
                }).then(function(posts) {
                    //console.log('loadposts')
                    if (posts.length < 10) {
                        this.end = true;
                    }
                    this.posts.push.apply(this.posts, posts);
                    this.page = this.page + 1;
                    this.busy = false;

                }.bind(this));
		};

        InfinitePosts.prototype.getSpecificPost = function(postid){
            var embedded = '{"author":1}';
            Restangular.one('posts', postid.postid).get({embedded:embedded, seed:Math.random()})
            .then(function(data){
                this.posts.push({
                    '_id':data._id,
                    'author':data.author,
                    'content':data.content,
                    '_created': data._created,
                    '_etag': data._etag,
                    'interestedPeople': data.interestedPeople,
                });
                //console.log('posts--------->', this.posts);
               // console.log('ddata--------->', data);
            }.bind(this));

        }

		InfinitePosts.prototype.nextPage = function() {
		    //console.log('nextpage')
			if (this.busy | this.end) return;
			this.busy = true;

			Restangular.all('posts').getList({
			    where : this.params,
				max_results: 10,
				page: this.page,
				sort: '[("_created",-1)]',
				seed:Math.random()
			}).then(function(posts) {
				if (posts.length === 0) {
					this.end = true;
				}
				this.posts.push.apply(this.posts, posts);
				this.page = this.page + 1;
				this.busy = false;
			}.bind(this));
		};

		InfinitePosts.prototype.loadNotificPost = function(postid, author){
            //console.log(postid, author)
            if(this.user_obj._id !== author){
                Restangular.one('posts', postid).get().then(function(post) {
                    //console.log(post)
                    this.posts.unshift({
                        author: post.author,
                        content: post.content,
                        _created: post._created,
                        _id: post._id,
                        _etag: post._etag,
                         interestedPeople : post.interestedPeople
                    });
                    //console.log(this.posts)
                }.bind(this));
            }
		}

		InfinitePosts.prototype.addPost = function(content, similar_keywords, imagePath) {

			this.user_obj.all('posts').post({
				author: this.user_obj._id,
				content: content,
				keywords: similar_keywords,
				post_image_path : imagePath,
				interestedPeople: []
			}).then(function(data) {

                this.posts.unshift({
                    author: this.user_obj._id,
                    content: content,
                    post_image_path : imagePath,
                    _created: new Date(),
                    _id:data._id,
                    _etag: data._etag,
                    interestedPeople : []

				});

				var myAlert = $alert({
					title: 'Successfully Posted! :)',
					placement: 'top',
					type: 'success',
					show: true
				});
				$timeout(function() {
					myAlert.hide();
				}, 5000);

			}.bind(this));
		};

		InfinitePosts.prototype.deletePost = function(post, user) {
            //console.log('delete post details', post.author)
			Restangular.one('posts', post._id).remove({},{
			    'If-Match': (post._etag).toString()
			}).then(function(data) {
			    for(var k in this.posts){
			        if(this.posts[k]._id == post._id){
			            this.posts.splice(k,1);
			            this.SpecificPost = {};
			            //console.log("successfully deleted")
			        }
			    }
			}.bind(this));

			for(var i in post.author.matchnotifications){
			    if(post.author.matchnotifications[i].postid == post._id){
    		       post.author.matchnotifications.splice(i,1);

    		       user.patch({'matchnotifications':post.author.matchnotifications})
    		       .then(function(data){
    		           /// console.log('delete notification==>', data)
    		       })
			    }
			}
		};
		return InfinitePosts;
	})
	.service('PostService', function($http, Restangular) {
		this.posts = [];
        var param1 = '{"author":1}';

		this.get = function(postid) {
		    //console.log('postid==>', postid)

			for (var i in this.posts) {
				if (this.posts[i]._id == postid) {
					return this.posts[i];
				}
			}

			var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
		};

	    this.resetPost = function(postid){
	        var promise = Restangular.one('posts', postid).get({embedded: param1, seed: Math.random() }).$object;
			promise._id = postid;
			this.posts.push(promise);
			return promise;
	    }


	})

	.service('sortIListService', function($http, Restangular,CurrentUser1) {
		this.sendList = function(list, cuserid){
		    if(list && list.length){
		        for(var temp in list){
    		       if(list[temp] == cuserid){
                        list.push(list.splice( temp, 1 )[0]);
	               }
		        }
    		    return list.reverse();
		    }else
		        return list;
		}

	}).service('CurrentUser1', function($http, Restangular) {
		this.userId = null;
		this.user = null;
		this.reset = function() {
			this.userId = null;
		};

		if (this.userId === null) {
			$http.get('/api/me', {
				headers: {
					'Content-Type': 'application/json'
				}
			}).success(function(userId) {
				this.userId = userId;
				Restangular.one('people', JSON.parse(userId)).get().then(function(user) {
					this.user = user;
				}.bind(this));
			}.bind(this));
		}

	})
	.factory('CurrentUser', function($http,$auth,$q, Restangular) {
            var CurrentUser = function() {
			    this.userId = null;
			    this.user = null;
            }

            CurrentUser.prototype.getUserId = function(){

                    return $http.get('/api/me', {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': $auth.getToken()
                        }
                    }).success(function(userId) {
                        this.userId = userId;
                    }.bind(this));
            };

			CurrentUser.prototype.getCUserDetails = function(userid){

                return Restangular.one('people',JSON.parse(userid)).get({seed:Math.random()});
            };

            return CurrentUser;
    })



    .service('ESClient', function(esFactory) {
		return esFactory({
			host: 'http://127.0.0.1:8000',
			apiVersion: '1.2',
			log: 'trace'
		});
	})
    .factory('SearchActivity', function($http, Restangular, $alert, $timeout) {

		var SearchActivity = function(user_obj) {
			this.searchHistory = [];
			this.user_obj = user_obj;
			this.busy = false;
			this.end = false;
			this.page = 1;
		};

		SearchActivity.prototype.deleteItem = function(id){
		    var self = this;
		    for(var temp in self.searchHistory){
		        if(self.searchHistory[temp]._id == id){
		            self.searchHistory.splice(temp, 1);
		            var req = {
                        method: 'POST',
                        url: '/api/deleteSearchHistoryItem',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: {'_id': id}
                    }
                    $http(req).then(function(data){
                        console.log(data);
                    })

		        }
		    }
		}

		SearchActivity.prototype.getMysearches = function(){
                Restangular.one('people', this.user_obj._id).all('searchActivity').getList({
                    max_results: 10,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
                }).then(function(data) {
                    //console.log('my search')
                    //console.log(data)
                    if (data.length < 10) {
					    this.end = true;
				    }

				    this.searchHistory.push.apply(this.searchHistory,data);
				    this.page = this.page + 1;
				    this.busy = false;
                }.bind(this));

		}

       SearchActivity.prototype.nextPage = function() {
			if (this.busy | this.end) return;
			this.busy = true;
            this.user_obj.all('searchActivity').getList({
                    max_results: 2,
                    page: this.page,
                    sort: '[("_created",-1)]',
                    seed: Math.random()
            }).then(function(data) {
                    if(data.length === 0){
                        this.end = true;
                    }
                    this.searchHistory.push.apply(this.searchHistory,data);
                    //console.log(this.searchResult)
                    this.page = this.page + 1;
				    this.busy = false;
            }.bind(this));
		};

       SearchActivity.prototype.addSearchText = function(content) {
		    var self = this;
            var req = {
                method: 'POST',
                url: '/api/storeSearchResults',
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {'content': content, 'author': self.user_obj._id}
            }
            $http(req).success(function(data){
                if(data.data){
                    self.searchHistory.unshift({
                        author: self.user_obj._id,
                        content: content,
                        _id: data._id
                    });
                }
            }.bind(self));
       };

       SearchActivity.prototype.getSimilarWords = function(sentence){
            return $http({
                       url: '/api/similarwords',
                       method: "GET",
                       params: {querystring: sentence }
            });
       }

		function combine_ids(ids) {
   			return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

    return SearchActivity;

	})
	.factory('MatchMeResults', function($http, Restangular, $alert, $timeout,CurrentUser,$auth,CurrentUser1) {

        function combine_ids(ids) {
   				return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		}

        // remove duplicate results
        function removeDuplicateResults(inputarry){
            var temparray = [];
            var authorIds = [];

            for(var i in inputarry){
                //console.log(i)
                if(authorIds.indexOf(inputarry[i].author._id) === -1){
                    authorIds.push(inputarry[i].author._id);
                    temparray.push(inputarry[i]);
                }
            }

            return temparray;
        }

		var  MatchMeResults = function(query, location) {

			this.total_matches = 0;

			this.mResultsNotFound = false;
			this.saResultsNotFound = false;

			this.mresults = [];
			this.matchedids = [];
			this.totalNames = '';
			this.searchNames =[];
			this.busy = true;
			this.page = 1;
			this.end = false;
            var keywords;
            this.param1 = null;
            this.param2 = null;
            this.query = query
            this.sPage = 1;
            this.sEnd = false;
            this.sBusy = true;
            this.suggestpeople = false;
            if(typeof location === 'undefined')
                this.location = 0;
            else
                this.location = location;
        };

        MatchMeResults.prototype.newSearchResults = function(){

            if(this.query){

                var keywords = combine_ids(this.query.split(" "));
                var self = this;
               /* var req = {
                    method: 'POST',
                    url: '/api/matchresults',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        page: self.page,
                        query: self.query,
                        keywords : keywords,
                        location : self.location
                    },
                }

            $http(req).success(function(data){
               console.log("============>", data)
               self.mresults.push.apply(self.mresults, data.final_result);
               console.log(self.mresults)
            }.bind(self));*/

            Restangular.all('matchresults').post({
                        page: self.page,
                        query: self.query,
                        keywords : keywords,
                        location : self.location
                    },{},{'Content-Type': 'application/json'}).then(function(data){
                        console.log(data)

                    });






                /*this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('posts').getList({
                    where : self.param1,
                    seed: Math.random(),
                    max_results: 30,
                    page: self.page,
                    embedded : self.param2
				}).then(function(data) {
				   if (data.length < 30) {
                        self.end = true;
    			   }

    			   if(data.length == 0){
    			        self.mResultsNotFound = true;

    			   }
                   self.mresults.push.apply(self.mresults,data);

                   self.mresults = removeDuplicateResults(self.mresults);
                   self.total_matches = data.length;
                   self.page = self.page + 1;
                   self.busy = false;
				}.bind(this));

				// also find in search activity
				this.param1 = '{"$or":[{"keywords": {"$in":['+keywords+']}},{"content":{"$regex":".*'+this.query+'.*"}}]}';
			    this.param2 = '{"author":1}';

                Restangular.all('searchActivity').getList({
				where : this.param1,
				seed: Math.random(),
				max_results: 30,
				page: this.sPage,
				embedded : this.param2
				}).then(function(data) {
                   if (data.length < 30) {
                        this.sEnd = true;
    			   }

    			   if(data.length == 0){
    			       self.saResultsNotFound = true;

    			   }

                   this.mresults.push.apply(this.mresults,data);
                   self.mresults = removeDuplicateResults(self.mresults);
                   this.total_matches = this.total_matches+data.length;
                   this.sPage = this.sPage + 1;
                   this.sBusy = false;
				}.bind(this));*/
            }
 		};



		MatchMeResults.prototype.getMatchedNewResults = function(searchPostId) {

			var params = '{"_id":"'+searchPostId+'"}';

			var data = Restangular.one("people",JSON.parse(CurrentUser1.userId)).all('searchActivity').getList({
				where :params,
				sort: '[("_created",-1)]',
				seed : Math.random()
			}).then(function(sResult) {

				var param = '{"_id":{"$in":['+combine_ids(sResult[0].matchedPosts)+']}}';
				var param2 = '{"author":1}';

				var data2 = Restangular.all("posts").getList({
					where: param,
					embedded: param2,
					seed : Math.random()
				}).then(function(data){
					this.total_matches = data.length;
					this.mresults.push.apply(this.mresults,data);
				}.bind(this));

				Restangular.one("searchActivity",searchPostId).patch(
					{newResults:0},{},
					{
						'Content-Type': 'application/json',
						'If-Match': sResult[0]._etag,
						'Authorization': $auth.getToken()
					}
				);

				return data2
            }.bind(this));
            return data;
		};

        MatchMeResults.prototype.nextPage = function() {

            if ((this.busy | this.end) && this.query) return;
			this.busy = true;
            var self = this;

			Restangular.all('posts').getList({
			    where : self.param1,
				max_results: 30,
				page: self.page,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.end = true;
				}
				//console.log('called infinity scroll')
				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);
				self.page = self.page + 1;
				self.busy = false;

			}.bind(self));


		};


		MatchMeResults.prototype.nextPageSearchResults = function() {
            //console.log("nextpage search resutls")
			if ((this.sBusy | this.sEnd) && this.query) return;
			this.sBusy = true;
            var self = this;

			Restangular.all('searchActivity').getList({
			    where : self.param1,
				max_results: 30,
				page: self.sPage,
				embedded : self.param2
			}).then(function(data) {

                if (data.length === 0) {
					self.sEnd = true;
				}

				self.mresults.push.apply(self.mresults, data);
                self.mresults = removeDuplicateResults(self.mresults);

				self.sPage = self.sPage + 1;
				self.sBusy = false;

			}.bind(self));
		};

		/*MatchMeResults.prototype.getMatchPeoples = function(searchText) {

			var params = '{"$or":[{"name.first":{"$regex":".*'+searchText+'.*"}},{"name.last":{"$regex":".*'+searchText+'.*"}},'+
			             '{"username":{"$regex":".*'+searchText+'.*"}}]}';
			Restangular.all('people').getList({
				where :params
				}).then(function(data) {
					this.totalNames = data.length;
					this.searchNames.push.apply(this.searchNames,data);
				}.bind(this));

		};

		MatchMeResults.prototype.getSuggestedPeople = function(){

            function combine_ids(ids) {
   			    return (ids.length ? "\"" + ids.join("\",\"") + "\"" : "");
		    }

            var param = '{"interestsimilarwords":{"$in":['+combine_ids(this.query.split(" "))+']}}';
            Restangular.all("people").getList({
					where: param,
					seed : Math.random()
			}).then(function(data){
                   if(data.length >= 1){
                     this.suggestpeople = true;
			       }
					var tempresutls = [];
					this.mresults.push.apply(this.mresults,data);
					for(var temp in this.mresults){
					    var author = {
					        author:{
                                name:{
                                    first:this.mresults[temp].name.first,
                                    last: this.mresults[temp].name.last,
                                },
                                _id:this.mresults[temp]._id,
                                picture:{
                                    medium:this.mresults[temp].picture.medium
                                }
                            }
					    }
					    tempresutls.push(author);
					}

					this.mresults = tempresutls;
			}.bind(this));
		}*/
		return MatchMeResults;
	});