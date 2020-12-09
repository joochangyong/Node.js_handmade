var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@마이페이지리스트@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/client_mypage/:userid', function (req, res, next) {
  var val = req.session;
  var userid = req.params.userid
  var sql = "select * from clients where id = ?"
  var address = "SELECT * FROM address WHERE id = ?"
  var card = "SELECT * FROM card WHERE id = ?"
  var category = "SELECT * FROM category"
  var orderlist = "select * from product, ordersinfo, orders where orders.orderNum = ordersinfo.ordersNum and ordersinfo.productNum = product.productNum and id = ?"
  con.query(sql, [userid], function (err, row) {
    con.query(address, [val.userid], function (err, address) {
      con.query(card, [val.userid], function (err, card) {
        con.query(category, function (err, row1) {
          con.query(orderlist, [userid], function (err, row2) {
            res.render('./mypage/client_mypage', { userinfo: row, car: row1, order: row2, user: val, seller: val, address: address, card: card, title: 'Express' })
          })
        })
      })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@사용자정보수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/client_update/:userid', function (req, res, next) {
  var val = req.session;
  var clients = "select * from clients where id = ? "
  var address = "SELECT * FROM address WHERE id = ?"
  var card = "SELECT * FROM card WHERE id = ?"
  var category = "SELECT * FROM category"
  con.query(clients, [val.userid], function (err, users) {
    con.query(address, [val.userid], function (err, address) {
      con.query(card, [val.userid], function (err, card) {
        con.query(category, function (err, row1) {
          console.log(users);
          res.render('./mypage/client_update', { userinfo: users, user: val, car: row1, seller: val, address: address, card: card, title: 'Express' })
        })
      })
    })
  })
})

router.post('/client_update', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "update clients set name = ?, phoneNum=?, pw=? where id = ?"
  con.query(sql, [body.name, body.phoneNum, body.pw, sess.userid], function (err, row) {
    sess.username = body.name
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write(`<script> alert('사용자 정보가 수정되었습니다!'); location.href='/mypage/client_update/'+'${sess.userid}'; </script>`);
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@배송지추가@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/client_address', function (req, res, next) {
  var { zipCode, priAddress, detAddress } = req.body
  var val = req.session;
  var address = "INSERT INTO address(id, zipCode, priAddress, detAddress) VALUES (?,?,?,?)"
  con.query(address, [val.userid, zipCode, priAddress, detAddress], function (err, row) {
    if (zipCode == "" || priAddress == "" || detAddress == "") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('잘못된 정보입니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('배송지 정보가 추가되었습니다!'); location.href='/mypage/client_mypage/'+'${val.userid}'; </script>`);
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@배송지삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete1/:addressNum', function (req, res, next) {
  var addressNum = req.params.addressNum
  var val = req.session;
  var sql = "delete from address where addressNum = ?";
  con.query(sql, [addressNum], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('배송지 정보가 삭제되었습니다!'); location.href='/mypage/client_mypage/'+'${val.userid}'; </script>`);
    }
  })
});


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@카드추가@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/client_card', function (req, res, next) {
  var body = req.body
  var val = req.session;
  var card = "INSERT INTO card(cardNum, id, validity, CVC) VALUES (?,?,?,?)"
  con.query(card, [body.cardNum, val.userid, body.validity, body.CVC], function (err, row) {
    console.log(body.cardNum, val.userid, body.validity, body.CVC);
    if (body.cardNum == "" || body.validity == "" || body.CVC == "") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('잘못된 정보입니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('카드 정보가 추가되었습니다!'); location.href='/mypage/client_mypage/'+'${val.userid}'; </script>`);
    }
  });
});


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@카드삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete2/:cardNum', function (req, res, next) {
  var cardNum = req.params.cardNum
  var val = req.session;
  var sql = "delete from card where cardNum = ?";
  con.query(sql, [cardNum], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('카드 정보가 삭제되었습니다!'); location.href='/mypage/client_mypage/'+'${val.userid}'; </script>`);
    }
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@판매자마이페이지@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/seller_mypage', function (req, res, next) {
  var val = req.session;
  var category = "SELECT * FROM category"
  var productsql = `select * from product, seller where product.sellerId = seller.sellerId AND seller.sellerId = ?`
  var storysql = `select * from story, seller where story.sellerId = seller.sellerId AND seller.sellerId = ?`
  con.query(productsql, [val.sellerId], function (err, row) {
    con.query(storysql, [val.sellerId], function (err, row3) {
      con.query(category, function (err, row1) {
        res.render('./mypage/seller_mypage', { product: row, story: row3, car: row1, user: val, seller: val, title: 'Express' })
      })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@판매자정보수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/seller_update/:sellerId', function (req, res, next) {
  var val = req.session;
  var sellersql = `select * from seller where sellerId = ?`
  var params = req.params;
  var category = "SELECT * FROM category"
  con.query(sellersql, [val.sellerId], function (err, row) {
    con.query(category, function (err, row1) {
      console.log(row)
      res.render('./mypage/seller_update', { sellerinfo: row, car: row1, user: val, seller: val, title: 'Express' })
    })
  })
})

router.post('/seller_update', function (req, res, next) {
  var sess = req.session
  var body = req.body
  var sql = "update seller set storeName = ?, sellerPw=?, sellerPhone=?, sellerEmail=? where sellerId = ?"
  con.query(sql, [body.storeName, body.sellerPw, body.sellerPhone, body.sellerEmail, sess.sellerId], function (err, row) {
    sess.storeName = body.storeName;
    console.log(row);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write(`<script> alert('판매자 정보가 수정되었습니다!'); location.href='/mypage/seller_update/'+'${sess.sellerId}'; </script>`);
  });
});

module.exports = router;