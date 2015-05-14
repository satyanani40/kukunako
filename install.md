sudo apt-get install virtualenv
 
create virtualenv
==================
virtualenv venv

activate virtualenv
==================
goto venv folder then type: source bin/activate

pip install PyJwt

pip install eve

pip install nltk==2.0.5

pip install requests

install mongodb by following link

http://docs.mongodb.org/manual/tutorial/install-mongodb-on-ubuntu/
create mongouser by following way

db.createUser({
 user: "test",
  pwd: "test",

  roles: [
    { role: "dbAdmin", db: "test" },
  ]
})

pip install loremipsum

pip install nltk

then after download all nltk  packages by following way
goto pythonn console.

>> import nltk
>> nltk.download('all')

install python-dev
sudo apt-get install python-dev

pip install numpy

install instructions for chat socketio
=======================================
Flask-SocketIO

Werkzeug==0.9.4

gevent==1.0

gevent-socketio==0.3.6

gevent-websocket==0.9.2

greenlet==0.4.2

ujson==1.33


socketio reference from here
============================
http://flask-socketio.readthedocs.org/en/latest/#flask.ext.socketio.SocketIO.run

for ssh generation to git hub
=============================
https://help.github.com/articles/generating-ssh-keys/