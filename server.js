
'use strict';

var express = require('express');
var url = require('url');


var mongo = require('mongodb');
var mongoC = mongo.MongoClient;

var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;
var mdb = process.env.MONGO_URI
var regex = new RegExp("^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$");


app.use('/public', express.static(process.cwd() + '/public'));
app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});



app.use(cors());
/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.post('/new', (req,res) => {
  if(regex.test(req.body.url)) {
    res.redirect(301, '/new/'+req.body.url)
  }
  // res.send({'url' : req.body.url})

})

app.get('/new/:url(*)', (req, res) => {

  var fullUrl = req.params.url + '?'

  for(var key in req.query){
    fullUrl += key+'='+req.query[key]
  }
  (fullUrl == req.params.url+'?') ? fullUrl = req.params.url : console.log(fullUrl)

  mongoC.connect(mdb, (err, db)=> {
    err ? console.log('Could not connect to mongodb') : 
    console.log('Connection established to ' + mdb)
    
    var collection = db.collection('links');
    
    if(regex.test(req.params.url)) {
      var newUrl = {
        'originalUrl' : fullUrl,
        'shortUrl' : "" + new Date().getTime()
      }
      collection.insert([newUrl])
      res.json(newUrl)
      db.close()
    } else {
      res.json({'error' : 'Please provide valid url'})
      db.close()
    }
  })
});


app.get('/:shortId', (req, res)=> {
  mongoC.connect(mdb, (err, db)=> {
    err ? console.log('Could not connect to mongodb') : 
    console.log('Connection established to ' + mdb)
    
    var collection = db.collection('links');
    var newurl = ''
    
    collection.findOne({
      'shortUrl' : req.params.shortId
    },{
      originalUrl: 1,
      _id : 0
    }, (err, answer)=> {
      
      if(answer === null){
        res.json({'url' :'not found'})
      } else {
        // res.json({'url' : answer.originalUrl})
      if(answer.originalUrl.indexOf('http://') == -1 && answer.originalUrl.indexOf('https://') == -1)
      {
        newurl = 'https://'+answer.originalUrl
      } else {
        newurl = answer.originalUrl
      }  
      res.redirect(newurl)
      }
    }) 
    db.close()
  })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});