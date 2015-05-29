angular.module('weberApp')
.factory('friendsActivity', function($http, Restangular, $alert, $timeout,CurrentUser) {

        var friendsActivity = function(currentuser, profileuser){
            //console.log(profileuser)
            this.currentuser = currentuser;
            this.profileuser = profileuser;
            this.status = null;
            this.status_method = null;

            if (typeof this.profileuser.notifications === "undefined"){
                profileuser.patch({
                    "notifications": []
                })
            }

            if(typeof this.currentuser.notifications === "undefined"){
                currentuser.patch({
                    "notifications": []
                })
            }
        }



        friendsActivity.prototype.getRelation = function(){

                if(this.status === null){
                    if(this.profileuser.friends.indexOf(this.currentuser._id) > -1){
                        this.status = 'unfriend';
                    }
                }

                if(this.status === null){
                    var k = '';
                    for (k in this.profileuser.notifications){
                        if((this.profileuser.notifications[k].friendid == (this.currentuser._id)) &&
                          (this.profileuser.notifications[k].notific_type == 1)){
                            this.status = 'cancelrequest';
                        }
                    }
                }

                if(this.status === null){
                    var k = ''
                    for (k in this.currentuser.notifications){
                        if((this.currentuser.notifications[k].friendid == (this.profileuser._id)) &&
                           (this.currentuser.notifications[k].notific_type == 1))
                        {
                            this.status = 'reject_accept';
                        }
                    }
                }

                if(this.status === null){
                    this.status = 'addfriend';
                }
            return (this.status);
        }

         return friendsActivity;
	})
	.service('Friends', function($http, Restangular) {

		this.addFriend = function(cuserid, puserid) {
		    return Restangular.one('add-friend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });
		}

		this.cancelRequest = function(cuserid, puserid){
		    //console.log(cuserid, puserid)
		    return Restangular.one('cancel-friend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.acceptRequest = function(cuserid, puserid){
		    return Restangular.one('accept-friend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed:Math.random()
		    });

		}

		this.rejectRequest = function(cuserid, puserid){
		    return Restangular.one('reject-friend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.unFreind = function(cuserid, puserid){
		    return Restangular.one('un-friend').get({
		        cuserid : cuserid,
		        puserid : puserid,
		        seed : Math.random()
		    });
		}

		this.makeSeen = function(cuserid){
		    return Restangular.one('make-seen').get({
		        cuserid : cuserid,
		        seed : Math.random()
		    });
		}
	});