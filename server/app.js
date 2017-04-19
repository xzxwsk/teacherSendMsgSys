var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var JPush = require("jpush-sdk");
var pushClient = JPush.buildClient('f5bae66fc408acca9d8d8dca', 'dbfc982dd495931c4adca26e');

//采用connect-mongodb中间件作为Session存储  
var session = require('express-session');  
//var RedisStore = require('connect-redis')(session);
//var Settings = require('./database/settings');  
//var MongoStore = require('connect-mongodb');  
//var db = require('./database/msession'); 

var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/user')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
var upload = multer({ storage: storage });
var cpUpload = upload.any();
var mongoose = require('mongoose');

var CrossStorageClient = require('cross-storage').CrossStorageClient;
var CrossStorageHub    = require('cross-storage').CrossStorageHub;

global.dbHandel = require('./database/dbHandel');
global.db = mongoose.connect("mongodb://192.168.1.106:27017/nodedb");
global.personList = [];//保存接收消息人员ID

var app = express();
var expressWs = require('express-ws')(app);  
var util = require('util'); 


app.use(session({ 
	resave: true,
	saveUninitialized: true,
    secret: 'secret',
    cookie:{ 
        maxAge: 1000*60*30
    }
	/*
	store: new RedisStore({
		host: '192.168.1.106',
		port: 3000
	})
	*/
}));

app.use(function(req, res, next) {
  res.locals.user = req.session.user; // 从session 获取 user对象
  var err = req.session.error; //获取错误信息
  delete req.session.error;
  res.locals.message = '';  // 展示的信息 message
  if (err) {
      res.locals.message = '<div class="alert alert-warning">' + err + '</div>';
  }
  next(); //中间件传递
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'ejs');
app.engine("html",require("ejs").__express);
//app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'images/favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cpUpload);
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

//D:\nodejsLogin\node_modules\connect-mongodb\node_modules\mongodb\node_modules\bson\ext\index.js中的bson = require('../build/Release/bson')改成bson = require('bson')

var routes = require('./routes');
//require('./routes')(app);
//var routes = require('./routes')(app);
var users = require('./routes/users');

//设置跨域访问
/*
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);// Allow Cookie
    res.header("Access-Control-Allow-Origin",  req.headers.origin);
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
*/

app.use('/', routes);  // 即为为路径 / 设置路由
//app.use('/', users);
app.use('/user', users); // 即为为路径 /users 设置路由
//app.use('/login',users); // 即为为路径 /login 设置路由
//app.use('/register',routes); // 即为为路径 /register 设置路由
//app.use('/home',routes); // 即为为路径 /home 设置路由
//app.use("/logout",routes); // 即为为路径 /logout 设置路由
//app.use("/getUserInfo",users);
//app.use("/hub",routes);

var clients = [], personList = [];
app.param('id', function (req, res, next, prompt) {
  req.prompt = prompt || 'id';
  return next();
});

app.ws('/ws/:id', function(ws, req) {
  util.inspect(ws);

  console.log('建立连接的人员id: ', req.prompt);
  clients.push(ws);

  ws.on('message', function(msg) {
    //console.log('***clients.length*****');
    //console.log(clients.length);
    //var str = "";
    //for(var i in ws.upgradeReq){
    //    str += i + "\n";
    //}
    //console.log("****str************");
    //console.log(str);
    //console.log("***global.personList*****");
    //console.log(global.personList);
    if(global.personList.length <1){
        return;
    }
    var unSendPerson = [];//保存未发送人员
    global.personList.forEach(function(val) {
        var flag = 0;//判断连接id是否为接收人员
        for(var clientSocket in clients){
            //console.log('***连接的id*****');
            //console.log(clientSocket.upgradeReq.params.id);
            //连接id为接收的在线人员，则发送消息
            if (val == clients[clientSocket].upgradeReq.params.id && clients[clientSocket].readyState === ws.OPEN) {
                flag = 1;
                clients[clientSocket].send(msg);
                break;
            }
        }
        //如果接收人员有未在线，则保存消息到数据库
        if (!flag) {
            unSendPerson.push(val);
        }
    });
    console.log("****未在线人员id:*******");
    console.log(unSendPerson);
    var message = global.dbHandel.getModel('message');
    var userList = global.dbHandel.getModel('user');
    //保存消息到消息表
    message.create({
        msg: msg,
        userList: unSendPerson
    },function(err,doc){
        if (err) {
            console.log("***err***");
            console.log(err);
        }else{
            //把消息id保存到离线的接收人员
            var id = doc._id;
            userList.update({_id: {$in: unSendPerson}}, {'$addToSet':{'msg':id.toString()}}, {multi: true},
                function(err2,doc2){
                    if (err2) {
                        console.log("***err***");
                        console.log(err2);
                    }else {
                        console.log("**doc***");
                        console.log(doc2);
                    }
            });
        }
    });

    //发送推送消息  
    pushClient.push().setPlatform(JPush.ALL)
      .setAudience(JPush.ALL)
      .setNotification('Hi, JPush', JPush.ios('ios alert', 'happy', 5))
      .send(function(err, res) {
          if (err) {
              console.log(err.message)
          } else {
              console.log('Sendno: ' + res.sendno)
              console.log('Msg_id: ' + res.msg_id)
          }
      });

  }); 
  ws.on('close', function close() {
    console.log('*****disconnected: '+req.prompt+"***********");
	var index = clients.indexOf(ws);
	console.log(index);
	if (index > -1) {
	  clients.splice(index, 1);
	}
  }); 
});
app.listen(3001);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
