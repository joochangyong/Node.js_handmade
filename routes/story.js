var express = require('express');
var router = express.Router();
var session = require('express-session');
var mysql = require('mysql');
var bodyParser = require('body-parser');  //post로 사용자의 입력값 받기
var db = require('./dbconfig');
var con = mysql.createConnection(db);
router.use(bodyParser.urlencoded({ extended: true }));  //bodyParser 실행코드
var multer = require('multer');

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
    con.query('insert into story (storyimg) values (?)', [path], function () {
      res.redirect('/');
    });
  }
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@스토리리스트@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/story_board', function (req, res, next) {
  var val = req.session;
  var story = "SELECT * FROM story order by storynum desc"
  var category = "select * from category"
  con.query(story, [val.storynum], function (err, storyDetail) {
    con.query(category, function (err, row1) {
      res.render('./story/story_board', { user: val, seller: val, car: row1, story: storyDetail, title: 'Express' })
    })
  })
})

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@스토리상세정보@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/story_detail/:storynum', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var story = "SELECT * FROM story WHERE storynum = ?"
  con.query(story, [req.params.storynum], function (err, storyDetail) {
    con.query(sql, function (err, row2) {
      res.render('./story/story_detail', { car: row2, user: val, seller: val, story: storyDetail, title: 'Express' })
    })
  })
})


//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@스토리글올리기@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/story_insert', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var select = `select * from product where sellerId = ?`
  con.query(sql, function (err, row2) {
    con.query(select, [val.sellerId], function (err, row3) {
      res.render('./story/story_insert', { car: row2, user: val, seller: val, product: row3 })
    })
  })
})

router.post('/story_insert', upload.single('fileupload'), function (req, res, next) {
  var val = req.session;
  var body = req.body
  var asd = req.file.path.split('\\');
  asd.splice(0, 1);
  var path = asd.join('\\');
  var story = "insert into story (storyName, storyImg, storyInfo, sellerId, productNum) values (?, ?, ?, ?, ?)"
  con.query(story, [body.storyName, path, body.storyInfo, val.sellerId, body.productNum], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('실패하였습니다..'); history.back(); </script>");
    }
    else {
      res.redirect("/story/story_board");
    }
  });
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@스토리수정@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/story_update/:storynum', function (req, res, next) {
  var val = req.session;
  var sql = "SELECT * FROM category"
  var story = "SELECT * FROM story WHERE storynum = ?"
  var select = `select * from product where sellerId = ?`
  con.query(sql, function (err, row2) {
    con.query(story, [req.params.storynum], function (err, storyDetail) {
      con.query(select, [val.sellerId], function (err, row4) {
        res.render('./story/story_update', { car: row2, user: val, seller: val, story: storyDetail, product: row4 })
      })
    })
  })
})

router.post('/story_update/:storynum', upload.single('fileupload'), function (req, res, next) {
  var val = req.session
  var body = req.body
  var asd = req.file.path.split('\\');
  asd.splice(0, 1);
  var path = asd.join('\\');
  var story = "update story set storyName = ?, storyImg=?, storyInfo=?, productNum=? where storynum = ?"
  con.query(story, [body.storyName, path, body.storyInfo, body.productNum, req.params.storynum], function (err, row) {
    if (err) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write("<script> alert('실패하였습니다.'); history.back(); </script>");
    }
    else {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
      res.write(`<script> alert('스토리가 수정되었습니다!'); location.href='/story/story_detail/${req.params.storynum}';  </script>`);
    }
  })
});

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@스토리삭제@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@//
router.get('/delete/:storynum', function (req, res, next) {
  var val = req.session;
  var sql = "delete from story where storynum = ?";
  con.query(sql, [req.params.storynum], function (err, row) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8;" });
    res.write("<script> alert('삭제되었습니다!'); location.href='/story/story_board'; </script>");
  })
});


module.exports = router;