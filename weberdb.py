from pymongo import MongoClient

class WeberDB(object):
  db=None
  def __init__(self):
      client = MongoClient()
      self.db = client['test']

  def update_search(self,keywordsList,id):

      data = self.db.searchActivity.update({'keywords':{'$in' : keywordsList}},{'$inc':{'newResults':1},'$push':{'matchedPosts':id }},False, multi=True)
      if((data['nModified']) >= 1):
          last_modified = self.db.searchActivity.find().limit(data['nModified']).sort("_updated",-1)
          """print last_modified
          for temp in last_modified:
              for attrbute,value in temp.iteritems():
                  print attrbute,'=====>',value"""
          return last_modified
      else:
          print '-----not to update-----'
          last_modified = {}
          return last_modified

  def collection_names(self):
      return self.db.collection_names()

  def find_document(self, collection, field, value):
      criteria = {'object.'+field: value}
      attrs = self.db[collection].find_one(criteria)
      return attrs

  def find_documents(self, collection, field, value):
      criteria = {'object.'+field: value}
      attrs = self.db[collection].find(criteria)
      return attrs

  def find_all_documents(self, collection):
      attrs = self.db[collection].find()
      return attrs

  def insert(self, collection, document):
      self.db[collection].insert(document)