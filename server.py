import os
import jwt, json
from eve import Eve
from flask import Flask, make_response, g, request, jsonify, Response,session
from eve.auth import TokenAuth
from datetime import datetime, timedelta
from functools import wraps
from settings import TOKEN_SECRET
from bson.objectid import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash
from bson import json_util
from framework.match_me_algorithm import *
import time
import urllib2, random
from weberdb import WeberDB
from flask.ext.socketio import SocketIO, emit, join_room, leave_room
from flask_mail import Mail, Message
import string
from friendRequests import Friends, Notifications, MatchUnmatch
import logging
from bson.json_util import dumps


logging.basicConfig(filename='/var/log/weber_error.log', format='%(asctime)s %(message)s', datefmt='%d/%m/%Y %I:%M:%S %p')

class TokenAuth(TokenAuth):
    def check_auth(self, token, allowed_roles, resource, method):
        accounts = app.data.driver.db['people']
        return accounts.find_one({'token': token})

app = Eve(__name__,static_url_path='/static')
app.debug = True,

app.config.update(
	DEBUG=True,
    #EMAIL SETTINGS
	MAIL_SERVER='smtp.gmail.com',
	MAIL_PORT=465,
	MAIL_USE_SSL=True,
	MAIL_USERNAME = 'team@theweber.in',
	MAIL_PASSWORD = 'ashok@weber'
	)

mail=Mail(app)
socketio = SocketIO(app)


def create_token(user):
    payload = {
        'sub': str(user['_id']),
        'iat': datetime.now(),
        'exp': datetime.now() + timedelta(days=14)
    }

    token = jwt.encode(payload, TOKEN_SECRET)
    return token.decode('unicode_escape')

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(error='Missing authorization header')
            response.status_code = 401
            return response

        payload = parse_token(request)

        if datetime.fromtimestamp(payload['exp']) < datetime.now():
            response = jsonify(error='Token has expired')
            response.status_code = 401
            return response

        g.user_id = payload['sub']

        return f(*args, **kwargs)

    return decorated_function

# generating friends for person
@app.route('/api/generate-fake-data', methods=['POST'])
def generate_fake_data():
    accounts = app.data.driver.db['people']
    user_email = accounts.find_one({'email': request.json['email']})
    if not user_email:
        dt = datetime.now()
        #data = requests.get('http://weber.ooo/api/similarwords?querystring='+' '.join(request.json['interests']))
        user = {
            'email' :request.json['email'],
            'username':request.json['username'],
            'name':{
               'first':request.json['firstname'],
               'last':request.json['lastname']
            },
            'password':{
                'password':generate_password_hash(request.json['password']),
                'password_updated':str(datetime.now())
            },
            'email_confirmed':True,
            'picture' : {
                'large' : "static/app/images/yp-logo-500X500.png",
                'medium' : "static/app/images/yp-logo-300X300.png",
                'thumbnail' : "static/app/images/yp-logo-300X300.png"
            },
            'phone': "",
            'send_add_requests':[],
            'study': {
              'intermediate':"",
              'graduate': ""
            },
            'random_string': id_generator(),
            'born' : "",
            'role': "normal",
            'questions':[],
            'gender' : "",
            'lastmessageseen': dt.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'location' : {
                'city' : "",
                'state' : "",
                'street' : ""
            },
            'friends' : [],
            'matchnotifications':[],
            'notifications':[],
            'interests': [],
            'conversations':[],
            '_updated': datetime.now()
        }
        accounts.insert(user)
        user_id = str(user['_id'])

        posts = app.data.driver.db['posts']
        for temp in range(1, 5):
            post = {
	            "interestedPeople" : [ ],
	            "author" : ObjectId(user['_id']),
	            "content" : "Dolor curae vitae neque fames auctor facilisi et ullamcorper urna. Netus proin hac urna placerat vel. Proin justo volutpat. Fames lacus a mollis tincidunt. Nulla curae laoreet nec fringilla nullam. Porta augue nisi inceptos tempus. Dolor ipsum quis mi nisl commodo ligula est arcu vestibulum ac. Velit class egestas eros ut. Augue purus sem cras. Dolor massa. Fames augue sagittis quam quisque laoreet nisi senectus. Velit fusce semper pellentesque facilisis purus dignissim. Neque class elit suspendisse aliquet mus blandit magnis urna diam.",
	            "type" : "text",
            }
            posts.insert(post)

        token = create_token(user)
        user['_id'] = str(user['_id'])
        # generating fake data for new user


        accounts = app.data.driver.db['people']
        data = accounts.find()
        print '------------------generating data------------------'
        interests_set = set()
        posts_set = set()

        for temp in data:
            interests_set.add(ObjectId(temp['_id']))

        interests_set.remove(ObjectId(user['_id']))
        temperary_set = interests_set
        count = 0

        posts = app.data.driver.db['posts']
        posts_data = posts.find({'author':ObjectId(user['_id'])})
        for temp3 in posts_data:
            posts_set.add(ObjectId(temp3['_id']))

        for temp in temperary_set:
            if(count < 3 and count >= 0):
                cdata = accounts.update({'_id': ObjectId(user['_id'])},
                                   { "$push" :{
                                                "notifications": {
                                                    'friendid': ObjectId(temp),
                                                    'seen': False,
                                                    'daterequest': str(datetime.now()),
                                                    'notific_type': 2 #accept request type
                                                },
                                                "friends": ObjectId(temp)
                                     },
                                   })

                pdata = accounts.update( {'_id': ObjectId(temp)},
                                         { "$push" :{ "friends": ObjectId(user['_id'])}})


                count += 1

            if(count >= 3 and count <6):
                data = accounts.update({'_id': ObjectId(user['_id'])},
                               { "$push" :{ "notifications":
                                                {'friendid': ObjectId(temp),
                                                 'seen': False,
                                                 'daterequest': str(datetime.now()),
                                                 'notific_type': 1 # friend request type
                                                 }
                                            }
                               })

                data2 = accounts.update({'_id': ObjectId(temp)},
                                        { "$push" :{ "send_add_requests": ObjectId(user['_id'])}})
                count += 1

            for temp2 in posts_set:
                print '-------------post set element-----------', temp2
                accounts.update( {'_id': ObjectId(user['_id'])},
                                     {
                                         "$push" :{
                                            "notifications": {
                                                'friendid': ObjectId(temp),
                                                'postid' : ObjectId(temp2),
                                                'seen': False,
                                                'daterequest': str(datetime.now()),
                                                'notific_type': 3 #match the post request type
                                            },
                                         }
                                     })

                posts.update( {'_id': ObjectId(temp2)},
                                     {
                                         "$push" :{
                                            "interestedPeople": {
                                                'interested_person': ObjectId(temp),
                                                'match_date': str(datetime.now()),
                                            },
                                         }
                                     })
            messages = app.data.driver.db['messages']
            ts = int(time.time())
            message = {
                'sender':ObjectId(temp),
                'receiver': ObjectId(user['_id']),
                'seen' : False,
                'message' : 'testing sample message',
                'timestamp': ts,
                'message_created': datetime.now()
            }

             #accounts.update({'timestamp':1425368551},{'$set':{'seen':True}})
            data = messages.insert(message)




        return dumps({'token':token, 'user': user, 'status':200})

    else:
        response = jsonify(error='You are already registered with this email, Please try forgot password ')
        response.status_code = 401
        return response




@app.route('/auth/login', methods=['POST'])
def login():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'email': request.json['email']})
    if not user:
        response = jsonify(error='Your email does not exist')
        response.status_code = 401
        return response
    if not user['email_confirmed'] == True:
        response = jsonify(error='Email is not confirmed')
        response.status_code = 401
        return response
    if not user or not check_password_hash(user['password']['password'], request.json['password']):
        response = jsonify(error='Wrong Email or Password')
        response.status_code = 401
        return response
    token = create_token(user)
    return dumps({'user':filterIdFields(user, all=True), 'token': token})



def filterIdFields(user, interests = None, questions = None, conversations = None, _id = None, \
                   send_add_requests= None, notifications = None,friends = None, _updated = None, all = None):
    temp_array = []

    if _updated or all is not None:
        print '-------------updated field---', user['username']
        user['_updated'] = str(user['_updated'])

    if _id or all is not None:
        user['_id'] = str(user['_id'])

    if interests or all is not None:
        for temp in user['interests']:
            temp_array.append(str(temp))
        user['interests'] = temp_array
        temp_array = []

    if questions or all is not None:
        # convert questions id to string
        for temp in user['questions']:
            temp['questionid'] = str(temp['questionid'])
            temp_array.append(temp)
        user['questions'] = temp_array
        temp_array = []

    if conversations or all is not None:
        #conversation ids to string
        for temp in user['conversations']:
            temp_array.append(str(temp))
        user['conversations'] = temp_array
        temp_array = []

    if friends or all is not None:
        #conversation ids to string
        for temp in user['friends']:
            temp_array.append(str(temp))
        user['friends'] = temp_array
        temp_array = []


    if send_add_requests or all is not None:
        #send add requests ids to string
        for temp in user['send_add_requests']:
            temp_array.append(str(temp))
        user['send_add_requests'] = temp_array
        temp_array = []
    if notifications or all is not None:
        #for notifcations convert ids to string
        for temp in user['notifications']:
            temp['friendid'] = str(temp['friendid'])
            temp['daterequest'] = str(temp['daterequest'])

            if hasattr(temp, 'postid'):
                print 'yes arrtibute-------------------'
                temp['postid'] =str(temp['postid'])
            temp_array.append(temp)
        user['notifications'] = temp_array

    return user


# add to converstions
#delete conversation user
@app.route('/api/add-conversation', methods=['POST'])
def addConversation():
    data = json.loads(request.data)
    accounts = app.data.driver.db['people']
    add_conversation = accounts.update({'_id': ObjectId(data['cUserId'])},
                                       { "$push" :{ "conversations": ObjectId(data['conversationId'])}})
    if add_conversation is not None:
        return jsonify({'data': True})
    return jsonify({'data': False})



@app.route('/api/store-search-results', methods=['POST'])
def deleteSearchItem():
    data = json.loads(request.data)
    if (data['content'] != "" and data['author'] != "" and data['author']):
        search_account = app.data.driver.db['search-activity']
        previous_text = search_account.find_one({'author':ObjectId(data['author']), 'content':data['content']})
        if previous_text is None:
            _id = search_account.insert({
                                         'author':ObjectId(data['author']),
                                         'content': data['content'],
                                         'keywords':getSimilarWords(data['content'].lower())
                                        })

            return dumps({'data':True, '_id':_id})
    return jsonify({'data': False})

@app.route('/api/match-results', methods=['POST'])
def matchresults():
    data = json.loads(request.data)
    location_data = ""

    # for searching posts content and array of keywords
    # you must index the two felds by following way
    # to speed up mongo db search
    #db.posts.ensureIndex({'keywords':1,'content':text}
    keywords = getSimilarWords(data['query'])

    posts = app.data.driver.db['posts']
    posts_data = posts.find({"$or":[{"keywords": {"$in":keywords}}, \
                                    {"content":{"$regex":".*"+data['query']+".*"}}]},{'author':1})
    post_author_set = set()
    interests_list   = []
    interests_set = set()
    location_set    = set()
    searchActivity_set  = set()

    #keywords = getSimilarWords(data['query'])
    posts = app.data.driver.db['posts']

    posts_data = posts.find({"$or":[{"keywords": {"$in":keywords}}, \
                                    {"content":{"$regex":".*"+data['query']+".*"}}]},{'author':1})

    for temp in posts_data:
        post_author_set.add(temp['author'])

    #for to perform search in search activity
    #you must make index to keywords and content in searchActivity
    #db.posts.ensureIndex({'keywords':1,'content':'text'}"""

    searchActivity = app.data.driver.db['search-activity']
    searchActivity_data = searchActivity.find({"$or":[{"keywords": {"$in":keywords}},\
                                                      {"content":{"$regex":".*"+data['query']+".*"}}]},{'author':1})
    for temp in searchActivity_data:
        searchActivity_set.add(temp['author'])

    interests = app.data.driver.db['interests']
    interests_data = interests.find({"$or":[{"keywords": {"$in":keywords}},\
                                                      {"content":{"$regex":".*"+data['query']+".*"}}]}, {'_id':1})
    for temp in interests_data:
        interests_list.append(temp['_id'])

    peoples = app.data.driver.db['people']
    interested_people_data = peoples.find({"interests":{"$in":interests_list}}, {'_id':1})
    for temp in interested_people_data:
        interests_set.add(temp['_id'])


    if data['location']:
        location_data = peoples.find({"$or" : [{'location.address':data['location'].lower()},\
                                               {'location.city':data['location'].lower()}]}, {'_id':1})
        for temp in location_data:
            location_set.add(temp['_id'])

    three_sets = set.union(post_author_set, searchActivity_set, interests_set)
    all_four = set()

    if len(location_set) != 0:
        all_four = set.union(three_sets, location_set)

    # level 1 common values for search query
    level1 = set.intersection(all_four)
    # level 2 get values from search activity, posts, interests based on location
    remain_all_three = three_sets.difference(level1)

    level2 = set.intersection(remain_all_three, location_set)
    # level 3 make priority for remaining values
    level3 = set.difference(remain_all_three, level2)
    #level4 calculate and concluse all values completed
    level4 = all_four.difference(set.union(level1, level2, level3))

    #list operations for getting correct order
    level1_list = list(level1)
    level2_list = list(level2)
    level3_list = list(level3)
    level4_list = list(level4)
    level1_list.extend(level2_list)
    level1_list.extend(level3_list)
    level1_list.extend(level4_list)

    final_list = reduce(lambda r, v: v in r[1] and r or (r[0].append(v) or r[1].add(v)) or r, level1_list, ([], set()))[0]

    final_people_data = peoples.find({'_id':{"$in":final_list}},{'username':1,'_id':1,'interests':1,
                                                                 'location':1,'study':1,'name':1,'picture':1})
    filtered_people = []

    #return dumps({'final_result': final_people_data})
    for temp in final_people_data:
        print '-----------------'
        print temp['_id']
        filtered_people.append(filterIdFields(temp, _id=True, interests = True))
    return json.dumps({'final_result': filtered_people})



@app.route('/api/delete-search-historyItem', methods=['POST'])
def storeSearchResults():
    data = json.loads(request.data)
    if (data['_id'] != "" and data['_id']):
        search_account = app.data.driver.db['searchActivity']
        previous_text = search_account.remove({'_id':ObjectId(data['_id'])})
        if previous_text is None:
            return dumps({'data':True, '_id':data['_id']})
    return jsonify({'data': False})

#delete conversation user
@app.route('/api/delete-conversation', methods=['GET'])
def deleteConversation():
    data = request.args.to_dict()
    accounts = app.data.driver.db['people']
    delete_conversation = accounts.update({'_id': ObjectId(data['cuserid'])}, \
                                          { "$pull" :{ "conversations": ObjectId(data['conversationid'])}})
    messages = app.data.driver.db['messages']
    delete_message = messages.remove({ "$or" : [
        { "$and" : [ { "sender" : ObjectId(data['cuserid']) }, { "receiver" : ObjectId(data['conversationid']) } ] },
        { "$and" : [ { "sender" : ObjectId(data['conversationid']) },{ "receiver": ObjectId(data['cuserid']) }]}
    ]})
    if (delete_conversation and delete_message) is not None:
        return jsonify({'data': True})
    return jsonify({'data': False})


#update user answer
@app.route('/api/update-answer', methods=['POST', 'GET'])
def updateAnswer():
    print '----------update answer---------'
    accounts = app.data.driver.db['people']
    userdata = accounts.find_one({'_id':ObjectId(request.json['cuserid']), 'questions.questionid': ObjectId(request.json['question'])})
    if userdata is not None:
        accounts.update({'_id':ObjectId(request.json['cuserid']), 'questions.questionid': ObjectId(request.json['question'])},
                    {"$set":{"questions.$.answer": request.json['answer'] }})
        return jsonify({'data':True})
    else:
        accounts.update({'_id':ObjectId(request.json['cuserid'])},
                    { "$push" : { "questions":
                                                {'questionid': ObjectId(request.json['question']),
                                                 'answer': request.json['answer']
                                                }
                                }
                    })
        return jsonify({'data':True})



# adding friend request
@app.route('/api/add-friend', methods=['POST', 'GET'])
def addfriend():
    cuserid = request.args.get('cuserid')
    puserid = request.args.get('puserid')
    friends = Friends(cuserid, puserid, app)
    result = friends.addFriend()
    if result:
        socketio.emit('FMnotific',{'data':{'FMnotific': True}}, room = str(puserid))
    return jsonify({'data': result})

# cancel request
@app.route('/api/cancel-friend', methods=['POST', 'GET'])
def cancelfriend():
    cuserid = request.args.get('cuserid')
    puserid = request.args.get('puserid')
    friends = Friends(cuserid, puserid, app)
    result = friends.cancelFriend()
    return jsonify({'data':result})

@app.route('/api/accept-friend', methods=['POST', 'GET'])
def acceptfriend():
    cuserid = request.args.get('cuserid')
    puserid = request.args.get('puserid')
    friends = Friends(cuserid, puserid, app)
    result = friends.acceptFriend()
    if result:
        socketio.emit('FMnotific',{'data':{'FMnotific': True}}, room = str(puserid))
    return jsonify({'data':result})

@app.route('/api/reject-friend', methods=['POST', 'GET'])
def rejectfriend():
    cuserid = request.args.get('cuserid')
    puserid = request.args.get('puserid')
    friends = Friends(cuserid, puserid, app)
    result = friends.rejectFriend()
    print result
    return jsonify({'data':result})

@app.route('/api/un-friend', methods=['POST', 'GET'])
def unfriend():
    cuserid = request.args.get('cuserid')
    puserid = request.args.get('puserid')
    friends = Friends(cuserid, puserid, app)
    result = friends.unFriend()
    return jsonify({'data':result})

@app.route('/api/make-seen', methods=['POST', 'GET'])
def makeseen():
    cuserid = request.args.get('cuserid')
    operations = Notifications(cuserid, app)
    result = operations.makeSeen()
    return jsonify({'data':result})

@app.route('/api/match', methods=['POST', 'GET'])
def match():
    data = (request.args.to_dict())
    matchunmatch = MatchUnmatch(data, app)
    result = matchunmatch.match()
    if result:
        socketio.emit('FMnotific',{'data':{'FMnotific': True}}, room = str(data['authorid']))
    return jsonify({'data':result})

@app.route('/api/un-match', methods=['POST', 'GET'])
def unmatch():
    data = (request.args.to_dict())
    matchunmatch = MatchUnmatch(data, app)
    result = matchunmatch.unMatch()
    return jsonify({'data':result})

@app.route('/api/send-feedback', methods=['GET'])
def sendfeedback():
    data = (request.args.to_dict())
    msg = Message('FeedBack',
                      sender='FeedBack User',
                      recipients=['Team@theweber.in']

            )
    msg.html = "<b>"+ data['feedback_data'] +"</b>"
    if mail.send(msg):
        return jsonify({'data':True})
    return  jsonify({'data':False})

@app.route('/api/send-eng-career', methods=['GET'])
def sendEngCareer():
    data = (request.args.to_dict())
    msg = Message('Careers',
                      sender='Careers Youpep',
                      recipients=['Team@theweber.in']

            )
    msg.html = "<div style='min-height:100px;border:1px solid #dcdcdc;'>" \
                   "<h3>Applied for Youpep</h3>" \
                   "<div style='padding:20px 5px'>" \
                   "<b>First Name: "+ data['first_career'] +"</b><br />" \
                                            "<b>Last Name: "+ data['last_career'] +"</b><br />" \
                                            "<b>Qualification: "+ data['selectedQualification'] +"</b><br />" \
                                            "<b>Position: "+ data['selectedPosition'] +"</b><br />" \
                                            "<b>Applying for: "+ data['selectedApplying'] +"</b><br />" \
                                            "<b>Email: "+ data['email_career'] +"</b><br />" \
                                            "<b>Phone Number: "+ data['phone_career'] +"</b><br /></div></div>"
    if mail.send(msg):
        return jsonify({'data':True})
    return  jsonify({'data':False})

@app.route('/api/suggested-friends', methods=['POST','GET'])
def friendSuggestions():

    resultUsers = []
    peoples = app.data.driver.db['people']
    #data = peoples.find({ "location.state": {"$regex": user_data['location']['state'], "$options" :"$i" }})
    data = peoples.find({ "$and" : [
                        { "location.state": {"$regex":request.json['location'], "$options" :"$i" }},
                        { "friends" : {"$nin":request.json['friends'] }},
                        { "username" : {"$ne" : request.json['username']}},
                        {"notifications.friendid":{"$ne": ObjectId(request.json['_id'])}},
                        {"send_add_requests" :{"$nin":[ObjectId(request.json['_id'])]}}
                    ]},{"_id":1, "name":1, "picture":1}).limit(4)

    for temp in data:
        resultUsers.append(filterIdFields(temp, _id = True ))

    if(len(resultUsers) >= 4):
        return dumps({'data':resultUsers, 'status': 200})

    data2 = peoples.find({ "$and" : [
                        { "friends" : {"$nin": request.json['friends'] }},
                        { "username" : {"$ne" : request.json['username']}},
                        {"notifications.friendid":{"$ne": ObjectId(request.json['_id'])}},
                        {"send_add_requests" :{"$nin":[ObjectId(request.json['_id'])]}}
                    ]},{"_id":1, "name":1, "picture":1}).limit(4)

    for temp in data2:
        resultUsers.append(filterIdFields(temp, _id = True))

    if(len(resultUsers) >= 4):
        return dumps({'data':resultUsers, 'status': 200})

    return json.dumps({'data': 'no users found', 'status': False})



def parse_token(req):
    token = req.headers.get('Authorization').split()[1]
    return jwt.decode(token, TOKEN_SECRET)

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not request.headers.get('Authorization'):
            response = jsonify(error='Missing authorization header')
            response.status_code = 401
            return response

        payload = parse_token(request)

        if datetime.fromtimestamp(payload['exp']) < datetime.now():
            response = jsonify(error='Token has expired')
            response.status_code = 401
            return response

        g.user_id = payload['sub']

        return f(*args, **kwargs)

    return decorated_function

# Routes

@app.route('/')
def index():
	return make_response(open('static/app/index.html').read())


@app.route('/api/me')
@login_required
def me():
    return Response(json.dumps(g.user_id),  mimetype='application/json')

@app.route('/api/get-people-names/<query>',  methods=['GET','POST'])
def getnames(query):
    accounts = app.data.driver.db['people']
    data = accounts.find({"$or":[
                {"name.first":{"$regex":".*"+query+".*"}},
                {"name.name":{"$regex":".*"+query+".*"}},
                {"username":{"$regex":".*"+query+".*"}}
            ]}).limit(10);

    return json_util.dumps(data)




@app.route('/foo/<path:filename>')
def send_foo(filename):
    return send_from_directory('/static/', filename)

@app.route('/api/image-crop', methods=['GET','POST'])
def convertedCropedImage():
    import re
    data = json.loads(request.data)
    if (data['cropped_image'] != "" and data['user_id'] != "" and data['original_image']):

        data_uri = data['cropped_image']
        img_str = re.search(r'base64,(.*)', data_uri).group(1)
        cropped_image = str(data['user_id'])+"_cropped.png"
        output = open('static/app/profile_pic_images/'+cropped_image, 'wb')
        output.write(img_str.decode('base64'))

        data_uri = data['original_image']
        img_str = re.search(r'base64,(.*)', data_uri).group(1)
        original_image = str(data['user_id'])+"_original.png"
        output = open('static/app/profile_pic_images/'+original_image, 'wb')
        output.write(img_str.decode('base64'))

        accounts = app.data.driver.db['people']

        accounts.update({'_id': ObjectId(data['user_id'])},
                                        {"$set": { "picture.thumbnail": 'static/app/profile_pic_images/'+cropped_image,
                                                   "picture.large": 'static/app/profile_pic_images/'+original_image,
                                                   "picture.medium": 'static/app/profile_pic_images/'+cropped_image
                                                  }

                                        })
        output.close()
        return jsonify({'data':True})
    return jsonify({'data':False})

@app.route('/resend-activation-link', methods = ['POST', 'GET'])
def resendActivationLink():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'email': request.json['resend_email']})
    if not user:
        response = jsonify(error = 'Your Email does not Exist')
        response.status_code = 401
        return response

    create_random_number = id_generator()
    update_user = accounts.update({'username': user['username']},{'$set':{'random_string':create_random_number}})
    user_id = str(user['_id'])
    msg = Message('Re Confirm your Youpep account',
                  sender='Team@theweber.in',
                  recipients=[request.json['resend_email']]

        )
    msg.html = '<div style="min-height:100px;border:1px solid #dcdcdc;">' \
               '<h5>Thanks for registering with us, To complete your Youpep registration, Follow this link:</h5>' \
               '<div style="padding:20px 5px">' \
               '<a href="http://www.youpep.com/#/confirm-account/users/'+user_id+'/confirm/'+create_random_number+'">Click Here</a></div></div>'
    mail.send(msg)
    response = jsonify(data = 'Activation link has been sent to your email')
    response.status_code = 200
    return response


@app.route('/forgot-password-link', methods=['POST', 'GET'])
def forgotpassword():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'email': request.json['email']})
    user_name = user['username']
    user_randome_string = user['random_string']

    if not user:
        response = jsonify(error = 'Your Email does not exist in our database')
        response.status_code = 401
        return response
    else:
        msg = Message('Password Link',
                      sender='Team@weber.in',
                      recipients=[request.json['email']]

            )
        msg.html = "<p>Please click on the link:<br>\
                        <br><p style='color:red;border:1px solid #dcdcdc;padding:10px;" \
                       "width:800px;text-align:center;font-size:14px;'>" \
                       "<a href='http://www.youpep.com/#/users/"+user_name+"/change-password-link/"+user_randome_string+"'>Click Here</a></p>\
                        <br><br><br><br>\
                        Thanks,<br>The Youpep Team\
                        </p>"
        mail.send(msg)
        return "Recovery email link has been sent to providing email address"



@app.route('/change-password', methods=['POST', 'GET'])
def changepassword():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'username': request.json['user_name']})
    if user:
        password = generate_password_hash(request.json['password'])
        return password


@login_required
@app.route('/check-user-current-password', methods=['POST', 'GET'])
def check_user_current_password():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'username': request.json['user_name']})
    if check_password_hash(user['password']['password'], request.json['old_password']):
        response = jsonify(data = 'Your password is correct')
        response.status_code = 200
        return response
    else:
        response = jsonify(error = 'Your old password is incorrect')
        response.status_code = 401
        return response


@login_required
@app.route('/get-new-hash-password', methods=['POST', 'GET'])
def get_new_hash_password():
    accounts = app.data.driver.db['people']
    user = accounts.find_one({'username': request.json['user_name']})
    if user:
        return generate_password_hash(request.json['new_password'])
    else:
        response = jsonify(error = 'No user Found')
        response.status_code = 401
        return response


def getSimilarWords(data):
    words = parse_sentence(data)
    post_tokens = create_tokens(data)
    keywords = set(list(post_tokens)+list(words))
    return list(set(keywords))

@app.route('/api/sim-words', methods=['GET'])
def getsimwords():
    data = request.args.to_dict()
    words = parse_sentence(data['querystring'])
    post_tokens = create_tokens(data['querystring'])
    keywords = set(list(post_tokens)+list(words))
    return json.dumps(list(set(keywords)))
##################################################
#Signup with email confirm validation


import time
@app.route('/auth/signup', methods=['POST'])
def signup():

    accounts = app.data.driver.db['people']
    user_email = accounts.find_one({'email': request.json['email']})
    if not user_email:
        dt = datetime.now()
        #data = requests.get('http://weber.ooo/api/similarwords?querystring='+' '.join(request.json['interests']))
        user = {
            'email' :request.json['email'],
            'username':request.json['username'],
            'name':{
               'first':request.json['firstname'],
               'last':request.json['lastname']
            },
            'password':{
                'password':generate_password_hash(request.json['password']),
                'password_updated':str(datetime.now())
            },
            'email_confirmed':False,
            'picture' : {
                'large' : "static/app/images/yp-logo-500X500.png",
                'medium' : "static/app/images/yp-logo-300X300.png",
                'thumbnail' : "static/app/images/yp-logo-300X300.png"
            },
            'phone': "",
            'send_add_requests':[],
            'study': {
              'intermediate':"",
              'graduate': ""
            },
            'random_string': id_generator(),
            'born' : "",
            'role': "normal",
            'questions':[],
            'gender' : "",
            'lastmessageseen' : dt.strftime('%Y-%m-%dT%H:%M:%SZ'),
            'location' : {
                'city' : "",
                'state' : "",
                'street' : ""
            },
            'friends' : [],
            'matchnotifications':[],
            'notifications':[],
            'interests': [],
            'conversations':[]
        }
        accounts.insert(user)
        user_id = str(user['_id'])

        user_random_string = str(user['random_string'])
        msg = Message('Confirm your Youpep account',
                      sender='Team@theweber.in',
                      recipients=[request.json['email']]

            )
        msg.html = '<div style="min-height:100px;border:1px solid #dcdcdc;">' \
                   '<h5>Thanks for registering with us, To complete your Youpep registration, Follow this link:</h5>' \
                   '<div style="padding:20px 5px">' \
                   '<a href="http://www.youpep.com/#/confirm_account/users/'+user_id+'/confirm/'+user_random_string+'">Click Here</a></div></div>'
        mail.send(msg)

        token = create_token(user)
        user['_id'] = str(user['_id'])
        return dumps({'token':token, 'user': user, 'status':200})

    else:
        response = jsonify(error='You are already registered with this email, Please try forgot password ')
        response.status_code = 401
        return response

@app.route('/get-interested-ids', methods=['POST', 'GET'])
def after_get_interests_ids():
    data = get_interest_ids(request.json['interests'])
    accounts = app.data.driver.db['people']
    check_username = accounts.find_one({'username': request.json['username']})

    if check_username:
        response = accounts.update({'username':request.json['username']},{'$set':{'interests':data}})
        return  dumps({'data' : response, 'status_code':200,'interests':data})
    else:
        response = jsonify(error = 'sorry insertion failed')
        response.status_code = 401
        return response

def get_interest_ids(data):
    interests = app.data.driver.db['interests']
    interest_ids = []
    for temp in data:
        if temp is not None and temp:
            rs = interests.find_one({'interest_string': temp.lower()})
            if rs is None:
                id = interests.insert({'interest_string' : temp.lower(), 'keywords': getSimilarWords(temp.lower())})
                interest_ids.append(id)
            else:
                interest_ids.append(rs['_id'])
        else:
            id = interests.insert({'interest_string' : temp})
            interest_ids.append(id)
    return list(set(interest_ids))

@app.route('/api/chat/send-message', methods=['POST'])
def sendmessage():
    print '------------datetime-----------'

    print datetime.now()
    ts = int(time.time())

    if not request.json['sender'] or not request.json['receiver']\
            or not request.json['message']:
        return dumps({'status':'failed','data':0})

    accounts = app.data.driver.db['messages']

    message = {
        'sender':ObjectId(request.json['sender']),
        'receiver': ObjectId(request.json['receiver']),
        'seen' : False,
        'message' : request.json['message'],
        'timestamp': ts,
        'message_created': datetime.now()
    }

    #accounts.update({'timestamp':1425368551},{'$set':{'seen':True}})
    data = accounts.insert(message)
    if data:
        return dumps({'status': 'ok','data':data})
    return dumps({'status':'failed','data':0})

@app.route('/api/update-time-stamp', methods=['POST'])
def updateTimeStamp():
    accounts = app.data.driver.db['people']
    ts = int(time.time())
    data = accounts.update({'_id':ObjectId(request.json['userid'])},{'$set':{'lastmessageseen':ts}})
    if data:
        return jsonify({'status':'ok'})
    return jsonify({'status':'failed'})

@app.route('/api/update-message-seen', methods=['POST'])
def makeMessagesSeen():
    print request.json['message_ids']
    list = []
    status = False
    accounts = app.data.driver.db['message_ids']

    for x in request.json['message_ids']:
        accounts.update({ '_id':ObjectId(x) },{'$set':{'seen':True}})
        status = True

    return json.dumps({'status': status})

def id_generator(size=60, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


#end of confirm validation
#################################################

import redis
r = redis.Redis()
pipe = r.pipeline()

friendsNotific = 0
searchNotific = 0

"""def check_updates(userid):

    skey = 'search_'+userid
    if((r.get(skey)) == 'search_notific'):
        yield 'data: %s \n\n' % json.dumps({'userid':userid,'searchNotific': 1,'friendsnotifc':0 })
        r.delete(skey)

    fkey = 'friend_'+userid
    if((r.get(fkey)) == 'friend_notific'):
        yield 'data: %s \n\n' % json.dumps({'userid':userid,'searchNotific': 0,'friendsnotifc':1 })
        r.delete(fkey):"""


@app.route('/stream/<userid>')
#@nocache
def stream(userid):
    return Response(check_updates(userid),mimetype='text/event-stream')

def after_post_inserted(items):
    post_author = ""
    post_id = ""
    for atribute,value in items[0].iteritems():
        print atribute, value

        if(atribute == "author"):
            post_author = str(value)
        if(atribute == "_id"):
            post_id = str(value)

    socketio.emit('postNotifications',{'data':{'postnotific': True},
                                           'author':post_author,
                                           'postid':post_id})


"""def after_friend_notification_get(updates, original):
    for attrbute,value in original.iteritems():
        if(attrbute == '_id'):
            socketio.emit('FMnotific',{'data':{'FMnotific': True}}, room = str(value))
            #key = 'friend_'+str(value)
            #pipe.set(key,'friend_notific')
    #pipe.execute()
"""

# match button notifications
def postNotific(updates, original):
    present = updates['interestedPeople']['presentupdated']
    last =  updates['interestedPeople']['lastupdated']
    if(present != last):
        socketio.emit('FMnotific',{'data':{'FMnotific': True}}, room = str(original['author']))
app.on_inserted_people_posts+= after_post_inserted
#app.on_updated_people+= after_friend_notification_get
app.on_updated_posts = postNotific
from werkzeug import secure_filename
UPLOAD_FOLDER = 'static/images'
ALLOWED_EXTENSIONS = set(['png','jpg', 'jpeg', 'bmp'])
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS

@app.route('/file-upload', methods=['GET', 'POST'])
def fileupload():
    if request.method == 'POST':
        file = request.files['file']
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            dt = str(datetime.datetime.now())
            renamed_filename = dt+'_'+filename
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], renamed_filename))
            #print os.path.join(app.config['UPLOAD_FOLDER'], renamed_filename)
        return os.path.join(app.config['UPLOAD_FOLDER'], renamed_filename)

@socketio.on('connecting')
def joiningtoroom(data):
    if(join_into_room(data['id'])):
        emit('joining-status',{'data': data['id'] in request.namespace.rooms})

@socketio.on('send-message')
def send_to_room(data):
    emit('receive-messages',
         {
          'message': data['message'],
          'senderid':data['senderid'],
          'receiverid':data['receiverid']
         },
         room=data['receiverid'])

@socketio.on_error()
def error_handler(e):
    print e

def join_into_room(id):
    data = False
    if id is not None:
        join_room(id)
        data = True
    return data

#app.threaded=True
socketio.run(app, host='127.0.0.1', port=8000)
# server sent events section
"""from redis import Redis
redis = Redis()
pubsub = redis.pubsub()


import time
from datetime import datetime
p = redis.pipeline()
app.config['ONLINE_LAST_MINUTES'] = 5


def mark_online(user_id):
    global p
    now = int(time.time())
    expires = now + (app.config['ONLINE_LAST_MINUTES'] * 60) + 10
    all_users_key = 'online-users/%d' % (now // 60)
    user_key = 'user-activity/%s' % user_id
    p.sadd(all_users_key, user_id)
    p.set(user_key, now)
    p.expireat(all_users_key, expires)
    p.expireat(user_key, expires)
    p.execute()

def mark_friend_requests(userid):
    global p
    now = int(time.time())
    user_key = 'friend-notific/%s' % userid
    p.set(user_key,now)




def get_user_last_activity(user_id):
    last_active = redis.get('user-activity/%s' % user_id)
    if last_active is None:
        return None
    return datetime.utcfromtimestamp(int(last_active))

def get_online_users():
    current = int(time.time()) // 60
    minutes = xrange(app.config['ONLINE_LAST_MINUTES'])
    return redis.sunion(['online-users/%d' % (current - x)
                         for x in minutes])


def mark_current_user_online(userid):
    mark_online(userid)"""
