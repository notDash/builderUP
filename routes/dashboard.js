var express = require('express');
var router = express.Router();
var menu = require('../config/data-menu.json');

/* GET home page. */
router.get('/', function(req, res, next) {
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

module.exports = router;
