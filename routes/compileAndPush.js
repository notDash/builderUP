var express = require('express');
var router = express.Router();

var config = require('../config/config');
var dataProjectInit = require('../config/data-project-init.json');
var sourceUrl = 'http://gitlab.intra.gomeplus.com/gomeplusFED/gomeplusUI.git';
var distUrl = 'http://gitlab.intra.gomeplus.com/gomeplusFED/opg.git';

var fs = require('fs');
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;

var iconv = require('iconv-lite');
var encoding = 'cp936';
var binaryEncoding = 'binary';

var path = require('path');

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

/**
 * 记录日志
 * @param logInfo
 */
function addLog(logInfo) {

}

/**
 * 获取要操作的文件夹路径
 * @param req
 * @returns {string}
 */
function getOptDistByUser(req) {
    return config.rootPath + '/' + dataProjectInit[req.session.userInfo.username].rootPath;
}

function cloneFromGitIfNE(dist, gitRepos, req, res) {
    var gitUrls = [];
    var result = {};
    if(gitRepos && typeof gitRepos === 'object') {
        gitUrls = Object.keys(gitRepos);
    }
    for(var i = 0; i < gitUrls.length; i++) {
        (function (dist, fileName, gitUrl) {
            fs.access(dist + '/' + fileName, fs.F_OK, function (err) {
                if(err) {
                    console.log('检出项目：' + fileName + '\n' + '----' + gitUrl);
                    // 不存在则去git clone  gitRepos[gitUrls[i]]
                    execSync('cd ' + dist + ' && git clone ' + gitUrl, function(err, stdout, stderr){
                        console.log(iconv.decode(new Buffer(stdout, binaryEncoding), encoding), iconv.decode(new Buffer(stderr, binaryEncoding), encoding));
                    });
                    // 把dist + '/' + fileName存储起来， 初始化完的项目
                    if(dataProjectInit) {
                        var dpi = dataProjectInit[req.session.userInfo.username];
                        if(!dpi) {
                            dpi["projects"] = [];
                            dpi["projects"].push(fileName);
                        } else if(dpi["projects"].indexOf(fileName) < 0) {
                            dpi["projects"].push(fileName);
                        }
                    }
                    fs.writeFileSync(config.dataProjectInit, JSON.stringify(dataProjectInit));
                    return true;
                }
                console.log('存在该项目:' + dist + '/' + fileName);
                // 如果存在该项目则去更新
                exec('cd ' + dist + '/' + fileName + ' && git pull ' , function(err, stdout, stderr){
                    if(err || stderr) {
                        console.log(iconv.decode(new Buffer(stderr, binaryEncoding), encoding));
                    }
                    console.log(iconv.decode(new Buffer(stdout, binaryEncoding), encoding));
                    console.log('更新成功...');
                });

            });
        })(dist, gitUrls[i], gitRepos[gitUrls[i]])
    }
}

function consoleInfo() {
    console.log('没有文件啦');
}

/**
 * 遍历文件
 * @param dir
 * @param callback
 * @param finish
 */
function travel(dir, bizPath, callback, finish) {
    fs.readdir(dir, function (err, files) {
        (function next(i) {
            if (i < files.length) {
                var pathname = path.join(dir, files[i]);
                var bizpath = path.join(bizPath, files[i]);
                fs.stat(pathname, function (err, stats) {
                    if (stats.isDirectory()) {
                        // 创建文件夹
                        fs.mkdir(bizpath, function (err) {
                            if(err) {
                                console.log(err);
                            }
                            console.log('文件夹创建成功');
                        });
                        travel(pathname, bizPath, callback, function () {
                            next(i + 1);
                        });
                    } else {
                        callback(pathname, function () {
                            next(i + 1);
                        });
                    }
                });
            } else {
                finish && finish();
            }
        }(0));
    });
}

/**
 * 拷贝文件
 * @param src
 * @param dst
 */
function copyFile(src, dst) {
    fs.createReadStream(src).pipe(fs.createWriteStream(dst));
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
                fs.mkdir(projWorkSpace + '/dist', function (err) {
                    if(err) {
                        console.log(err);
                    }
                });
                fs.mkdir(projWorkSpace + '/bizDist', function (err) {
                    if(err) {
                        console.log(err);
                    }
                });
            });
        }
        // console.log('存在该目录');
        cloneFromGitIfNE(projWorkSpace, cloneOpt, req, res);
    })



    console.log('the ends');
    res.render('error', {message:'test', error:{stack:'test'}});
});

router.get('/push', function(req, res, next) {
    // 在推送的时候， 先去编译再去拷贝文件， add, commit, push
    // 拷贝文件
    var dist = getOptDistByUser(req) + '/dist';
    var bizPath = getOptDistByUser(req) + '/bizDist';
    travel(dist, bizPath, function (pathname, call) {
        console.log(pathname);
        var tempPath = path.join(bizPath + '/', pathname.substring(dist.length, pathname.length));
        copyFile(pathname, tempPath);
        call();
    }, consoleInfo);

});



module.exports = router;
