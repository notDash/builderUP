var express = require('express');
var router = express.Router();
var menu = require('../config/data-menu.json');
/* GET home page. */
router.get('/', function(req, res, next) {
  // 从session里获取登录信息， 如果获取到登录信息， 则直接跳转主页面，否则跳转登录页面
  var resData  = {};
  if(req.session.userInfo){
    resData.login = true;
    resData.msg = '认证成功';
    resData.username = req.session.userInfo.username;
    resData.data = menu;
    res.render('dashboard', resData);
    return;
  } else {
    res.render('login', {});
  }
});

router.post('/logout', function(req, res, next) {
  req.session = null;
  res.redirect('/login');
});

module.exports = router;
