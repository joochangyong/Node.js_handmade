var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자회원가입@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/client_signup', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  con.query(sql, function (err, row2) {
    res.render('./signup/client_signup', { car: row2, user: val, seller: val, title: 'Express' })
  })
})

router.post('/sign_up', function (req, res, next) {
  var body = req.body
  var signup = "insert into clients (id, pw, name, phoneNum) values (?, ?, ?, ?)"
  var basket = "insert into basket (id) values (?)"
  con.query(signup, [body.id, body.pw, body.name, body.phoneNum], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('중복된 아이디 입니다..'); history.back(); </script>");
    }
    else {
      con.query(basket, [body.id])
      res.redirect("/users/login");
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자로그인@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/login', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  con.query(sql, function (err, row2) {
    res.render('./login/login', { car: row2, user: val, seller: val, title: 'Express' })
  })
})
router.post("/login", async function (req, res, next) {
  var body = req.body;
  var sess = req.session;
  var loginsql = `select * from clients where id = ? AND pw = ?`;
  con.query(loginsql, [body.id, body.pw], function (err, row) {
    if (err) {
      throw err;
    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('아이디 또는 비밀번호를 잘못 입력하였습니다.'); history.back(); </script>");
      }
      else {
        sess.userid = row[0].id;
        sess.userpw = row[0].pw;
        sess.username = row[0].name;
        sess.phoneNum = row[0].phoneNum;
        res.redirect('/');
      }
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자로그아웃@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get("/logout", function (req, res, next) { //세션 탈출탈출
  req.session.destroy();
  res.clearCookie('userid');
  res.redirect("/")
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@판매자회원가입@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/seller_signup', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  con.query(sql, function (err, row2) {
    res.render('./signup/seller_signup', { car: row2, user: val, seller: val, title: 'Express' })
  })
})

router.post('/seller_signup', function (req, res, next) {
  var body = req.body
  var sellersignup = "insert into seller (sellerId, categoryName, sellerPw, storeName, sellerPhone, sellerEmail) values (?, ?, ?, ?, ?, ?)"
  con.query(sellersignup, [body.sellerId, body.categoryName, body.sellerPw, body.storeName, body.sellerPhone, body.sellerEmail], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('중복된 아이디 입니다..'); history.back(); </script>");
    }
    else {
      res.redirect("./seller_login");
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@판매자로그인@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/seller_login', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  con.query(sql, function (err, row2) {
    res.render('./login/seller_login', { car: row2, user: val, seller: val, title: 'Express' })
  })
})

router.post("/seller_login", async function (req, res, next) {
  var body = req.body;
  var sess = req.session;
  var sellerloginsql = `select * from seller where sellerId = ? AND sellerPw = ?`;

  con.query(sellerloginsql, [body.sellerId, body.sellerPw], function (err, row) {
    if (err) {
      throw err;
    }
    else {
      if (row[0] == null) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('아이디 또는 비밀번호를 잘못 입력하였습니다.'); history.back(); </script>");
      }
      else {
        sess.sellerId = row[0].sellerId;
        sess.sellerPw = row[0].sellerPw;
        sess.storeName = row[0].storeName;
        sess.sellerPhone = row[0].sellerPhone;
        sess.sellerEmail = row[0].sellerEmail;
        res.redirect('/');
      }
    }
  });
});

router.get("/logout", function (req, res, next) { //세션 탈출탈출
  req.session.destroy();
  res.clearCookie('sellerId');
  res.redirect("/")
});

module.exports = router;