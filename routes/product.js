var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드
var multer = require('multer');

var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = '0' + dd
  }
  if (mm < 10) {
    mm = '0' + mm
  }
  today = yyyy + '/' + mm + '/' + dd;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    //파일이 이미지 파일이면
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
      console.log("이미지 파일이네요")
      cb(null, './public/uploads/images')
    }
  },
  //파일이름 설정
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

//파일 업로드 모듈
var upload = multer({
  storage: storage,
  fileFilter: function (req, file, cd) {
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
      cd(null, true);
    } else {
      cd(null, false);
    }
  }
})

//파일 업로드 및 디비에 위치 저장
router.post('/fileupload', upload.single('fileupload'), function (req, res) {
  console.log('filename:' + req.file)
  if (req.file == undefined) {
    res.send('<script type="text/javascript">alert("올바른 이미지 파일을 첨부 해주세요");history.back();</script>');

  } else {
    console.log("post")
    var asd = req.file.path.split('\\');
    asd.splice(0, 1);
    var path = asd.join('\\');

    //파일 위치를 mysql 서버에 저장
    con.query('insert into product (productImg) values (?)', [path], function () {
      res.redirect('/');
    });
  }
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품리스트@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/product_board/:category', function (req, res) {
  var val = req.session;
  var productselect = `select * from product where category = ?`
  var sql = "SELECT * FROM category"
  con.query(productselect, [req.params.category], function (err, row) {
    con.query(sql, function (err, row1) {
      res.render('./product/product_board', { user: val, seller: val, car: row1, item: row, title: 'Express' })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품상세정보@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/product_detail/:productNum', function (req, res) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var selectSQL = `select * from product, seller where productNum = ? AND product.sellerId = seller.sellerId`
  var selectReview = `select * from review where productNum = ${req.params.productNum}`
  var selectOrder = `select DISTINCT id from ordersinfo, orders where ordersinfo.ordersNum=orders.orderNum && ordersinfo.productNum=?`
  con.query(sql, function (err, row2) {
    if(err){
      console.log("err",err);
    }else{
      
      con.query(selectSQL, [req.params.productNum], function (error, result) {
        if(error){
          console.log("error",error);
        }else{
       
          con.query(selectReview, function(err1,result2){
            if(err1){
              console.log("err1", err1);
            }else{
              con.query(selectOrder,[req.params.productNum],function(err2,result3){
                if(err2){
                  console.log("err2", err2);
                }else{
                  
                  res.render('./product/product_detail', { car: row2, user: val, seller: val, item: result, review : result2, order_people:result3 })
                }
              })
            }
          })
        }
      })

    }
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품등록@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/product_insert', function (req, res) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  con.query(sql, function (err, row2) {
    res.render('./product/product_insert', { car: row2, user: val, seller: val, title: 'Express' })
  })
})

router.post('/product_insert', upload.single('fileupload'), function (req, res, next) {
  var val = req.session;
  var body = req.body
  var asd = req.file.path.split('\\');
  asd.splice(0, 1);
  var path = asd.join('\\');
  var sql = `select * from product`
  var story = "insert into product (sellerId, productName, productImg, productInfo, category, price, amount) values (?, ?, ?, ?, ?, ?, ?)"
  con.query(sql, function (err, row1) {
    console.log(row1[0].category);
    con.query(story, [val.sellerId, body.productName, path, body.productInfo, body.category, body.price, body.amount], function (err, row) {
      if (err) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
        res.write("<script> alert('실패하였습니다..'); history.back(); </script>");
      }
      else {
        res.redirect(`./product_board/${row1[0].category}`);
      }
    })
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete/:productNum', function (req, res, next) {
  var val = req.session;
  var sql = `select * from product where productNum = ?`
  var productdelete = "delete from product where productNum = ?";
  con.query(sql, [req.params.productNum], function (err, row1) {
    con.query(productdelete, [req.params.productNum], function (err, row) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('삭제되었습니다!'); location.href='/product/product_board/${row1[0].category}'; </script>`);
    })
  })
});


router.get('/product_search', function(req, res, next) {
  var val = req.session;
  var productselect = `select * from product where category = ?`
  var sql = "SELECT * FROM category"
  con.query(productselect, [req.params.category], function (err, row) {
    console.log(row[0].category);
    con.query(sql, function (err, row1) {
      res.render('./product/product_board', { user: val, seller: val, car: row1, item: row, title: 'Express' })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품검색@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/product_search', function (req, res, next) {
  var val = req.session;
  var keyWord = req.body.keyWord
  var myinfo = {}
  var story = "SELECT * FROM story"
  var sql = "SELECT * FROM category"
  var sql1 = `SELECT * FROM product WHERE productName LIKE '%${keyWord}%'`
  con.query(story, [val.storynum], function (err, storyDetail) {
    con.query(sql1, function (err, productName) {
      con.query(sql, function (err, row2) {
        console.log("--------", productName);
        myinfo.product = productName;
        res.render('./product/product_board', { car: row2, user: val, seller: val, title: 'Express', item: productName, product: productName, story: storyDetail });
      })
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/product_update/:productNum', function(req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var SelectSQL = `select * from product where productNum = ?`
  con.query(sql,function(err,row){
    con.query(SelectSQL,[req.params.productNum],function(err,row2){
      res.render('./product/product_update',{car:row, user:val, seller:val, content:row2})
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/product_update', upload.single('fileupload'), function(req,res,next){
  var body = req.body;
  console.log('요기asdf양', body)
  var asd = req.file.path.split('\\');
  asd.splice(0, 1);
  var path = asd.join('\\');
  var updateSQL = `UPDATE product SET productName=?,productImg=?,productInfo=?,category=?,price=?,amount=? WHERE productNum=?`
  con.query(updateSQL,[body.productName, path, body.productInfo, body.category, body.price,body.amount,body.productNum],function(err,row2){
    console.log('요기양',body)
    res.redirect(`/product/product_detail/${body.productNum}`)
  })
})



//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품리뷰등록@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/product_review', function (req, res, next) {
  
  var val = req.session;
  var body = req.body;
  var sql = `INSERT INTO review(id, productNum, star, reviewDate, reviewInfo) VALUES (?,?,?,?,?)`
  var select = `select Count(*) from review where id=? && productNum=?`
  var selectStar = `select * from review where productNum=?`
  var update = `update product set star_avg=? where productNum=?`
  con.query(select,[val.userid, body.productNum],function(err, row){
    var abc = JSON.stringify(row)
    var sus = abc.substring(13,14) // 문자열 잘라서 등록한지 안한지 확인
    if(sus == '1'){
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('이미 리뷰를 등록한 회원입니다!'); history.back(); </script>`);
    }else{
      con.query(sql, [val.userid, body.productNum ,body.star, today , body.review_detail], function (err, row1) {
        con.query(selectStar,[body.productNum],function(err,row5){
          var sum = 0;
          var avg = 0;
          for(var i = 0; i< row5.length; i++){
            sum += row5[i].star;
          }
          avg = Math.floor(sum)/(row5.length)
          console.log(avg)
          con.query(update,[avg,body.productNum],function(err, row6){
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
            res.write(`<script> alert('리뷰가 등록되었습니다!'); location.href='/product/product_detail/${body.productNum}'; </script>`);
          })
        })
      })
    }
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품리뷰수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/review_update/:productNum', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var selectsql = `select * from review where productNum='${req.params.productNum}' && id='${val.userid}'`
  con.query(sql, function (err, row2) {
    con.query(selectsql, function(err,row3){
      console.log('row3', row3)
      res.render('./product/review_update', { car: row2, user: val, seller: val, content:row3 })
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품리뷰수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.post('/review_update', function (req, res, next) {
  var val = req.session;
  var body = req.body
  var sql = 'UPDATE review SET `star`=?,`reviewDate`=?,`reviewInfo`=? where id=? && productNum=?'
  var selectStar = `select * from review where productNum=?`
  var update = `update product set star_avg=? where productNum=?`
  con.query(sql,[body.star, today, body.reviewInfo, val.userid, body.productNum],function(err,row){
    con.query(selectStar,[body.productNum],function(err,row5){
      var sum = 0;
      var avg = 0;
      for(var i = 0; i< row5.length; i++){
        sum += row5[i].star;
      }
      avg = Math.floor(sum)/(row5.length)
      console.log(avg)
      con.query(update,[avg,body.productNum],function(err, row6){
        res.redirect(`/product/product_detail/${body.productNum}`)
      })
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@상품리뷰삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/review_delete/:productNum', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var delete1 = `DELETE FROM review where productNum='${req.params.productNum}' && id='${val.userid}'`
  con.query(sql, function (err, row2) {
    con.query(delete1, function(err,row3){
      res.redirect(`/product/product_detail/${req.params.productNum}`)
    })
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@인기상품@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/best_product', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var SQL = `select * from product order by star_avg DESC`
  con.query(sql, function (err, row2) {
    con.query(SQL, function(err,row5){
      res.render('./product/best_product', { car: row2, user: val, seller: val, product:row5})
    })
  })
});

module.exports = router;