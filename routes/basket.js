var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드

router.get('/', function (req, res) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var product = "select * from basket, basketinfo, product where basket.id = ? and basket.basketNum = basketinfo.basketNum and basketinfo.productNum = product.productNum"
  con.query(sql, function (err, row2) {
    con.query(product, [val.userid], function (err, row1) {
      res.render('./basket/basket', { car: row2, user: val, seller: val, basket: row1, title: 'Express' })
    })
  })
})


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@장바구니 담기@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/addBasket/:productNum', function (req, res, next) {
  var val = req.session;
  var body = req.body;
  val.productSum = req.body.basketCount;
  var sql = "select * from basket where id = ?"
  var sql1 = "insert INTO basketinfo (basketNum, productNum, basketCount) values (?, ?, ?)"
  var sql2 = "UPDATE basketinfo SET basketCount = basketCount + ? WHERE productNum = ? and basketNum = ?"
  if (req.body.basket != null) {
    con.query(sql, [val.userid], function (err, productdetail) {
      if (err) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
      }
      else {
        con.query(sql1, [productdetail[0].basketNum, req.params.productNum, body.basketCount], function (err, product) {
          if (err) {
            con.query(sql2, [body.basketCount, req.params.productNum, productdetail[0].basketNum], function (err, row) {
              console.log(row);
              res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
              res.write("<script> alert('장바구니에 추가하였습니다.'); location.href='/basket' </script>");
            })
          } else {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
            res.write("<script> alert('장바구니에 추가하였습니다.'); location.href='/basket' </script>");
          }
        });
      }
    });
  } else {
    res.redirect('/order/orders/' + req.params.productNum)
  }
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@장바구니삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete/:rowid', function (req, res, next) {
  var sess = req.session;
  var rowid2 = req.params.rowid
  console.log(rowid2);
  var deletebasket = `delete from basketinfo where productNum in (${rowid2})`
  con.query(deletebasket, [sess.userid], function (err, result) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('삭제되었습니다!'); location.href='/basket';  </script>`);
    }
  })
})

router.post('/',function(req,res,next){
  var sess = req.session;
  var body = req.body
  var select = `select * from basket, basketinfo where basket.basketNum = basketinfo.basketNum AND basket.id = ?`
  var update = `update basketinfo set basketCount = ? where basketNum = ? AND productNum = ?`
  con.query(select,[sess.userid],function(err,row){
    for(var i=0; i<row.length; i++){
      con.query(update,[body.count[i],row[0].basketNum,row[i].productNum],function(err,row2){
        
      })
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write("<script> alert('상품 수량을 변경하였습니다 !'); history.back(); </script>");
  })
})

module.exports = router;