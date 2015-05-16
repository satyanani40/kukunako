#from server import app
#from flask import  request
from bson.objectid import ObjectId
from datetime import datetime
import json
class Friends(object):

    #app = None

    def __init__(self, cuserid, puserid, app):
        Friends.app = app
        self.cuserid = cuserid
        self.puserid = puserid

    def isFriends(self, current_user, profile_user):

        if (current_user['_id']) in profile_user['friends'] or\
                        (profile_user['_id']) in current_user['friends']:
            print '-----------yes freinds--------------'
            return False
        print '----------------not friends--------------'
        return True

    def isAlredySent(self, current_user, profile_user):
        for temp in profile_user['notifications']:
            if  temp['friendid'] == (current_user['_id']) and temp['notific_type'] == 1:
                print temp['friendid'], current_user['_id']
                print '-------------request alredy sent----------'
                return False
        print '----------request alredy not sent--------------'
        return True

    def isAlredyReceived(self, current_user, profile_user):
        for temp in current_user['notifications']:
            if temp['friendid'] == profile_user['_id'] and temp['notific_type'] ==1 :
                print '---------yes alredy received---------'
                return False
        print '-----------no alredy not received-------------'
        return True


    def addFriend(self):
        print '-----------details-------------'
        print self.cuserid
        print self.puserid

        accounts = Friends.app.data.driver.db['people']
        currentuser = accounts.find_one({'_id': ObjectId(self.cuserid)})

        profileuser = accounts.find_one({'_id': ObjectId(self.puserid)})

        if not self.isFriends(currentuser, profileuser):
            print '-----------yes----------';
            return False

        if not self.isAlredySent(currentuser, profileuser):
            print 'alredy sent'
            return False

        if not self.isAlredyReceived(currentuser, profileuser):
            print 'alredy received'
            return False

        data = accounts.update({'_id': ObjectId(self.puserid)},
                               { "$push" :{ "notifications":
                                                {'friendid': currentuser['_id'],
                                                 'seen': False,
                                                 'daterequest': str(datetime.now()),
                                                 'notific_type': 1 # friend request type
                                                 }
                                            }
                               })

        data2 = accounts.update({'_id': ObjectId(self.cuserid)},
                               { "$push" :{ "send_add_requests": ObjectId(self.puserid)}})

        if (data and data2) is not None:
            print 'data is not none'
            return True

        return False

    #cancel friend request
    def cancelFriend(self):
        print '-----------details-------------'
        print self.cuserid
        print self.puserid

        accounts = Friends.app.data.driver.db['people']

        currentuser = accounts.find_one({'_id': ObjectId(self.cuserid)})
        profileuser = accounts.find_one({'_id': ObjectId(self.puserid)})

        if not self.isFriends(currentuser, profileuser):
            print '-----------yes----------';
            return False

        if not self.isAlredyReceived(currentuser, profileuser):
           print 'alredy received'
           return False

        if not self.isAlredySent(currentuser, profileuser):
            print 'alredy sent'
            data = accounts.update({'_id': ObjectId(self.puserid)},
                               { "$pull" :{ "notifications":
                                                {'friendid': ObjectId(self.cuserid)}
                                           }
                               })
            data2 = accounts.update({'_id': ObjectId(self.cuserid)},
                               { "$pull" :{ "send_add_requests": ObjectId(self.puserid)}})

            if (data and data2) is not None:
                print 'data is not none'
                return True
        return False

    def rejectFriend(self):
        print '-----------reject friend-------------'
        print self.cuserid
        print self.puserid

        accounts = Friends.app.data.driver.db['people']

        currentuser = accounts.find_one({'_id': ObjectId(self.cuserid)})
        profileuser = accounts.find_one({'_id': ObjectId(self.puserid)})

        if not self.isFriends(currentuser, profileuser):
            print '-----------yes----------';
            return False

        if not self.isAlredySent(currentuser, profileuser):
            print 'alredy sent'
            return False

        if not self.isAlredyReceived(currentuser, profileuser):


            print 'alredy received'

            data = accounts.update({'_id': ObjectId(self.cuserid)},
                                   { "$pull" :{ "notifications":
                                                {'friendid': ObjectId(self.puserid)}
                                           }
                               })

            data2 = accounts.update({'_id': ObjectId(self.puserid)},
                               { "$pull" :{ "send_add_requests": ObjectId(self.cuserid)}})
            if (data and data2) is not None:
                print 'data is not none'
                return True

        return False


    def acceptFriend(self):
        print '-----------accept request-------------'
        print self.cuserid
        print self.puserid

        accounts = Friends.app.data.driver.db['people']

        currentuser = accounts.find_one({'_id': ObjectId(self.cuserid)})
        profileuser = accounts.find_one({'_id': ObjectId(self.puserid)})

        if not self.isFriends(currentuser, profileuser):
            return False

        if not self.isAlredySent(currentuser, profileuser):
           print 'alredy sent'
           return False

        if not self.isAlredyReceived(currentuser, profileuser):
            print 'alredy received'

            cdata = accounts.update({'_id': ObjectId(self.cuserid)},
                               { "$pull" :{ "notifications":{'friendid': ObjectId(self.puserid)}},
                                 "$push" :{ "friends": ObjectId(self.puserid) }
                               })

            pdata = accounts.update( {'_id': ObjectId(self.puserid)},
                                     {
                                         "$push" :{
                                            "notifications": {
                                                'friendid': currentuser['_id'],
                                                'seen': False,
                                                'daterequest': str(datetime.now()),
                                                'notific_type': 2 #accept request type
                                            },
                                            "friends": ObjectId(self.cuserid)
                                         },
                                         "$pull" :{ "send_add_requests": ObjectId(self.cuserid)}

                                    })


            if cdata is not None and pdata is not None:
                print 'data is not none'
                return True

        return False

    def unFriend(self):
        print '-----------unfriend-------------'
        print self.cuserid
        print self.puserid

        accounts = Friends.app.data.driver.db['people']
        currentuser = accounts.find_one({'_id': ObjectId(self.cuserid)})
        profileuser = accounts.find_one({'_id': ObjectId(self.puserid)})

        if not self.isFriends(currentuser, profileuser):
            print '-----------processing----------';
            cdata = accounts.update({'_id': ObjectId(self.cuserid)},
                                    {"$pull" :{
                                         "friends": ObjectId(self.puserid),
                                         "notifications":{'friendid' : ObjectId(self.puserid)}
                                        }
                                    })

            pdata = accounts.update({'_id': ObjectId(self.puserid)},

                                    {"$pull" :{
                                         "friends": ObjectId(self.cuserid),
                                         "notifications":{'friendid' : ObjectId(self.cuserid)}
                                    }})

            if cdata is not None and pdata is not None:
                print 'data is not none'
                return True
        print '-----------all failed----------------'
        return False

class Notifications(object):

    def __init__(self, currentuserid, app):
        self.cuserid = currentuserid
        Notifications.app = app

    def makeSeen(self):
        account = Notifications.app.data.driver.db['people']
        cdata = account.update({'_id': ObjectId(self.cuserid), "notifications.seen": False},
                                    {"$set": { "notifications.$.seen": True}})
        if cdata is not None:
            print 'successfully updated seen'
            return True

        return False

class MatchUnmatch(object):

    def __init__(self, data, app):
        self.cuserid = data['cuserid']
        self.postid = data['postid']
        self.authorid = data['authorid']
        MatchUnmatch.app = app

    def match(self):

        account = MatchUnmatch.app.data.driver.db['people']
        #current_user = accounts.find_one({'_id': ObjectId(self.cuserid)})
        print '----------->', self.authorid

        user_status = account.update( {'_id': ObjectId(self.authorid)},
                                     {
                                         "$push" :{
                                            "notifications": {
                                                'friendid': ObjectId(self.cuserid),
                                                'postid' : ObjectId(self.postid),
                                                'seen': False,
                                                'daterequest': str(datetime.now()),
                                                'notific_type': 3 #match the post request type
                                            },
                                         }
                                     })

        post = MatchUnmatch.app.data.driver.db['posts']

        post_status = post.update( {'_id': ObjectId(self.postid)},
                                     {
                                         "$push" :{
                                            "interestedPeople": {
                                                'interested_person': ObjectId(self.cuserid),
                                                'match_date': str(datetime.now()),
                                            },
                                         }
                                     })

        if user_status is not None and post_status is not None:
            print 'data is not none'
            return True
        print '-----------match failed----------------'
        return False


    def unMatch(self):

        account = MatchUnmatch.app.data.driver.db['people']

        user_status = account.update( {'_id': ObjectId(self.authorid),
                                       "notifications.friendid" : ObjectId(self.cuserid),
                                       "notifications.postid" : ObjectId(self.postid),
                                       "notifications.notific_type" : 3},
                                     {
                                         "$pull" :{
                                            "notifications": {
                                                'friendid': ObjectId(self.cuserid),
                                                'postid' : ObjectId(self.postid),

                                            },
                                         }
                                     })

        post = MatchUnmatch.app.data.driver.db['posts']

        post_status = post.update( {'_id': ObjectId(self.postid),
                                    'interestedPeople.interested_person': ObjectId(self.cuserid),
                                    },
                                     {
                                         "$pull" :{
                                            "interestedPeople": {
                                                'interested_person': ObjectId(self.cuserid),
                                            },
                                         }
                                     })

        if user_status is not None and post_status is not None:
            print 'data is not none'
            return True
        print '-----------unmatch failed----------------'
        return False
