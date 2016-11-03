var express = require('express');
var router = express.Router();
var request = require('request');
var constants = require('../config/constants');
var menu = require('../config/data-menu.json');

function addSession(req, userInfo) {
    var maxAge = 1000 * 60 * 60 * 24 * 1; // 一天
    req.session.maxAge = new Date(Date.now() + maxAge);
    req.session.userInfo = userInfo;
    req.session.isLogin = true;
}

router.get('/', function(req, res, next) {
    var resData = {};
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

/* login. */
router.post('/', function(req, res, next) {
    // var params = req.query;
    var params = req.body;
    var resData = {title: 'Express'};
    var sessionParam = {};
    if(!params.username || !params.psw) {
        resData.msg = '用户名或者密码错误';
        res.render('login', resData);
        return;
    }
    console.log(params);

    // 调用gitlab认证接认证用户信息
    request.post(constants.auth_token,
        {
            form: {
                grant_type: 'password',
                username: params.username,
                password: params.psw
            }
        },function (err,httpResponse,body){
            /*
             {
             "error":"invalid_grant",
             "error_description":"The provided authorization grant is invalid, expired, revoked, does not match the redirection URI used in the authorization request, or was issued to another client."
             }
             */console.log( body);
            var result = JSON.parse(body);
            if(!result) {
                resData.login = false;
                resData.msg = '调用gitlab认证失败';
                res.render('error', resData);
                return;
            }
            if(result.error) {
                resData.login = false;
                // resData.msg = result.error_description;
                resData.msg = '用户名或者密码错误';
                res.render('login', resData);
                return;
            }
            resData.login = true;
            resData.msg = '认证成功';
            resData.username = params.username;
            sessionParam.access_token = new Buffer(result.access_token, 'base64').toString();
            sessionParam.username = params.username;
            sessionParam.psw = params.psw;
            addSession(req, sessionParam);
            resData.data = menu;
            res.render('dashboard', resData);
        });

});



module.exports = router;



