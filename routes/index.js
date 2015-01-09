var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

router.post('/', function(req, res){
	res.send('/ Post Ok');
});

router.get('/helloworld', function(req, res) {
  res.render('helloworld', { title: 'Hello, World' });
});

module.exports = router;
