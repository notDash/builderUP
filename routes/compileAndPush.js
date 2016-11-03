var express = require('express');
var router = express.Router();

var config = require('../config/config');
var sourceUrl = 'http://gitlab.intra.gomeplus.com/gomeplusFED/gomeplusUI.git';
var distUrl = 'http://gitlab.intra.gomeplus.com/gomeplusFED/opg.git';

var fs = require('fs');
var exec = require('child_process').exec;

var iconv = require('iconv-lite');
var encoding = 'cp936';
var binaryEncoding = 'binary';

/**
 * 根据传入的git项目url路径截取工程名
 * @param gitUrl
 * @returns {string}
 */
function getProjName(gitUrl) {
    var res = '';
    var tempArrUrl = gitUrl.split('/');
    if(tempArrUrl && tempArrUrl[tempArrUrl.length - 1]) {
        res = tempArrUrl[tempArrUrl.length - 1].split('.')[0]
    }
    return res;
}


function cloneFromGitIfNE(dist, gitRepos) {
    var gitUrls = [];
    if(gitRepos && typeof gitRepos === 'object') {
        gitUrls = Object.keys(gitRepos);
    }
    for(var i = 0; i < gitUrls.length; i++) {
        fs.access(dist + '/' + gitUrls[i], fs.F_OK, function (err) {
            if(err) {
                // 不存在则去git clone  gitRepos[gitUrls[i]]
                // spawn('git', [ 'clone', gitRepos[gitUrls[i]], dist + '/' + gitUrls[i]], {stdio: 'inherit'});
                // spawn('ls', ['-lh', '/usr'], {stdio: 'inherit'});
                exec('cat *.js bad_file', { encoding: binaryEncoding }, function(err, stdout, stderr){
                    console.log(iconv.decode(new Buffer(stdout, binaryEncoding), encoding), iconv.decode(new Buffer(stderr, binaryEncoding), encoding));
                });
            }
            console.log('存在该项目');
        });
    }
}

function gitCloneSpawn(gitSpawn) {

}

router.get('/', function(req, res, next) {

    // 获取源路径和目标路径
    var sourceUrl = req.body.sourceUrl;
    var distUrl = req.body.distUrl;

});

router.get('/init', function(req, res, next) {

    // 获取源路径和目标路径
    /*
    var sourceUrl = req.body.sourceUrl;
    var distUrl = req.body.distUrl;
    */
    var username = req.session.userInfo.username;
    var projWorkSpace = config.rootPath + '/' ;
    var sourceUrlP = '';
    var distUrlP = '';
    var cloneOpt = {};
    // 根据传入的路径截取最后的工程名， 再用当前用户名拼接上工程名作为本地仓库的文件夹名称
    if(username && sourceUrl && distUrl) {
        sourceUrlP = getProjName(sourceUrl);
        distUrlP = getProjName(distUrl);
        cloneOpt[sourceUrlP] = sourceUrl;
        cloneOpt[distUrlP] = distUrl;
        if(sourceUrlP && distUrlP) {
            projWorkSpace += username + '_' + sourceUrlP + '_' + distUrlP;
        }
    }
    console.log( __dirname + ' ------- '  +  projWorkSpace);

    // 判断该目录是否存在
    fs.access(projWorkSpace, fs.F_OK, function (err) {
        if(err) {
            // 不存在这样的目录的时候去创建改目录
            fs.mkdir(projWorkSpace, function(err){
                if(err) {
                    console.log(err);
                }
            });
        }
        console.log('存在该目录');
        cloneFromGitIfNE(projWorkSpace, cloneOpt);
    })

    console.log('the ends');

    res.render('error', {message:'test', error:{stack:'test'}});
});

module.exports = router;
