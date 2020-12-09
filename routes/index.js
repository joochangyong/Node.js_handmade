var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

/* GET home page. */
router.get('/', function (req, res, next) {
  var val = req.session;
  var story = "SELECT * FROM story order by storynum desc limit 8"
  var category = "SELECT * FROM category"
  var product = "SELECT * FROM product where star_avg >= 4"
  con.query(story, function (err, storyDetail) {
    con.query(category, function (err, row2) {
      con.query(product, function (err, row3) {
        res.render('index', { user: val, car: row2, seller: val, story: storyDetail, product: row3 });
      })
    })
  });
})

module.exports = router;