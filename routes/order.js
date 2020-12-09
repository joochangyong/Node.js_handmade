var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

var date = new Date();
var dd = date.getDate();
var mm = date.getMonth() + 1;
var yyyy = date.getFullYear();
var date = yyyy + '-' + mm + '-' + dd;

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@바로주문@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/orders/:productNum', function (req, res) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var product = "select * from product where productNum = ?"
  var card = "select * from card where id = ?"
  var address = "select * from address where id = ?"
  con.query(sql, function (err, row) {
    con.query(product, [req.params.productNum], function (err, row1) {
      con.query(card, [val.userid], function (err, row2) {
        con.query(address, [val.userid], function (err, row3) {
          res.render('./order/shortcut', { user: val, seller: val, car: row, product: row1, card: row2, address: row3, title: 'Express' })
        })
      })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@바로주문@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/orders/:productNum', function (req, res, next) {
  var val = req.session;
  var body = req.body;
  var Count = val.bookSum;

  var card = "SELECT * FROM card WHERE id = ?"
  var address = "SELECT * FROM address WHERE  id = ?"
  var sql2 = "INSERT INTO orders ( id, orderSum, date, zipCode, priAddress, detADdress, cardNum, validity, CVC) VALUES (?, ?, SYSDATE(), ?, ?, ?, ?, ?, ?)"
  var sql3 = "SELECT LAST_INSERT_ID() as orderNum"
  var sql4 = "INSERT INTO ordersinfo (ordersNum, productNum, orderCount) VALUES (?, ?, ?)"
  var sql5 = "UPDATE product SET amount = (amount - ?) WHERE productNum = ?";
  var totalprice = "UPDATE clients SET totalprice = (SELECT SUM(orderSum) FROM orders WHERE id = ?) WHERE id = ?"
  con.query(card, [val.userid], function (err, row) {
    con.query(address, [val.userid], function (err, row1) {
      con.query(sql2, [val.userid, body.orderSum, row1[0].zipCode, row1[0].priAddress, row1[0].detAddress, row[0].cardNum, row[0].validity, row[0].CVC], function (err, row2) {
        con.query(sql3, function (err, row3) {
          con.query(sql4, [row3[0].orderNum, req.params.productNum, body.productSum], function (err, row4) {
            con.query(sql5, [body.productSum, req.params.productNum], function (err, row5) {
              con.query(totalprice, [val.userid, val.userid], function (err, row6) {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
                res.write(`<script> alert('결제가 완료되었습니다!'); location.href='/mypage/client_mypage/${val.userid}'; </script>`);
              })
            })
          })
        })
      })
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@장바구니주문@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/:orderValue', function (req, res, next) {
  var sess = req.session;
  var value = req.params.orderValue;
  var sql = "SELECT * FROM category"
  var SQL = `select * from product, seller where seller.sellerId = product.sellerId and product.productNum in (${value}) order by productNum DESC`
  var SQL1 = 'select * from address, card where address.id = card.id and card.id = ?'
  var SQL2 = 'select * from basketinfo, basket where basketinfo.basketNum = basket.basketNum and basket.id = ? order by productNum DESC'
  var SQL3 = 'select * from clients where id = ?'

  con.query(sql, function (err, result) {
    con.query(SQL, function (err, row) {
      con.query(SQL1, [sess.userid], function (err, row1) {
        con.query(SQL2, [sess.userid], function (err, row2) {
          con.query(SQL3, [sess.userid], function (err, row3) {
            res.render('./order/order', { car: result, user: sess, seller: sess, productinfo: row, clientinfo: row1, basket: row2, point: row3 })
          })
        })
      })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@장바구니주문@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/', function (req, res) {
  var sess = req.session;
  var body = req.body;

  var SQL = 'select * from card, address where card.id=address.id and card.id = ? and card.cardNum = ? and address.addressNum = ?'
  // 주문 회원 카드, 주소 정보
  var SQL1 = 'insert into orders(id, orderSum, date, cardNum, validity, CVC, zipCode, priAddress, detAddress) values(?,?,SYSDATE(),?,?,?,?,?,?)'
  // orders에 인설트
  var SQL2 = 'select LAST_INSERT_ID() as orderNum;'
  // 가장 최신 orderNum
  var SQL3 = 'insert into ordersinfo(ordersNum, productNum, orderCount) values(?,?,?)'
  // ordersinfo 인설트
  var SQL4 = 'DELETE FROM basketinfo WHERE basketNum = (SELECT basketNum from basket WHERE id = ?) and productNum = ?'
  // 구매한 상품 장바구니에서 삭제
  var SQL5 = "UPDATE product SET amount = (amount - ?) WHERE productNum = ?";
  // 구매한 상품 수량 업데이트
  var SQL6 = "UPDATE clients SET totalprice = (SELECT SUM(orderSum) FROM orders WHERE id = ?) WHERE id = ?"
  // 
  con.query(SQL, [sess.userid, body.Card, body.Ship], function(err,row){
    con.query(SQL1, [sess.userid, body.price, row[0].cardNum, row[0].validity, row[0].CVC, row[0].zipCode, row[0].priAddress, row[0].detAddress], function(err,row1){
      con.query(SQL2, function(err, row2){
        for(var i=0; i<body.productNum.length; i++){
          con.query(SQL3,[row2[0].orderNum, body.productNum[i], body.amount[i]],function(err,row3){
          })
          con.query(SQL4,[sess.userid, body.productNum[i]],function(err,row4){
          })
          con.query(SQL5,[body.amount[i], body.productNum[i]],function(err,row5){
          })
        }
        con.query(SQL6,[sess.userid, sess.userid],function(err,row6){
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
          res.write(`<script> alert('결제가 완료되었습니다!'); location.href='/mypage/client_mypage/${sess.userid}'; </script>`);
        })
      })
    })
  })
})

module.exports = router;