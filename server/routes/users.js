var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
	console.log("*******");
	console.log("login get:");
	console.log("*******");
	console.log(req.xhr);
	res.setHeader("Content-Type", "text/html");
    res.render("login",{title:'User Login'});
}).post(function(req,res){    // 从此路径检测到post方式则进行post数据的处理操作
//	res.header('Access-Control-Allow-Origin', '*');
//	res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');  
    var uname = req.body.uname;                //获取post上来的 data数据中 uname的值			
    User.findOne({account:uname},function(err,doc){   //通过此model以用户名的条件 查询数据库中的匹配信息
		//console.log("****err:****");
		//console.log(err);
		//console.log("****doc:****");
		//console.log(doc);
        if(err){                                         //错误就返回给原post处（login.html) 状态码为500的错误
			console.log(err);
			//if (!req.xhr) {
				res.status(500).send({status:0, error: err });		
			//}else{
			//	res.sendStatus(500);
			//}
        }else if(!doc){       //查询不到用户名匹配信息，则用户名不存在
            req.session.error = '用户名不存在';
            //res.send(404);    //    状态码返回404
            //if (!req.xhr) {
				//console.log("***用户名不存在****");
				//res.header("Access-Control-Allow-Origin", "*");
				res.status(200).send({status:0, error: '用户名不存在' });			
			//}else{
			//	console.log("****login post 404!****");
			//	res.sendStatus(404);
			//}
			//res.redirect("/login");
        }else{ 
            if(req.body.upwd != doc.password){     //查询到匹配用户名的信息，但相应的password属性不匹配				
                req.session.error = "密码错误";
				//if (!req.xhr) {
					res.status(200).send({status:0, error: '密码错误' });	
				//}else{
				//	res.sendStatus(404);
				//}
				//res.redirect("/login");
            }else{       //信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
                req.session.user = doc;
				//console.log("************req.session************");
				//console.log(req.session);
				//console.log("************req.xhr************");
				//console.log(req.xhr);
				//if (!req.xhr) {
					res.status(200).send({status:1, msg: '登录成功', data: {role: doc.role} });			
				//}else{					
				//	console.log("****req.session:****");
				//	console.log(req.session);
					//res.sendStatus(200);
				//	res.redirect("/home");
				//}
            }
        }
    });
});

/* GET register page. */
router.route("/register").get(function(req,res){    // 到达此路径则渲染register文件，并传出title值供 register.html使用	
	console.log("***register get:****");
	console.log("*******");
	console.log(req.xhr);
	res.setHeader("Content-Type", "text/html");
    res.render("register",{title:'User register'});
}).post(function(req,res){ 
     //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
	var uAccount = req.body.uaccount;
    var uName = req.body.uname;
	var uPassword = req.body.upwd;
	var userNo = req.body.uxuehao;
	var uPhone = req.body.uphone;
	var uRole = req.body.urole;

	console.log("***register post:****");
	console.log("*******");

    User.findOne({account: uAccount},function(err,doc){   // 同理 /login 路径的处理方式
		console.log("***err****");
        if(err){
			console.log(err);
			//if (!req.xhr) {
				res.status(200).send({status:0, error: '网络异常错误！' });	
			//}else{
			//	res.sendStatus(500);
			//	req.session.error =  '网络异常错误！';
			//}
        }else if(doc){ 
			//console.log("用户名已存在！");
			//if (!req.xhr) {
				res.status(200).send({status:0, error: '用户名已存在！' });	
			//}else{
			//	req.session.error = '用户名已存在！';
			//	res.sendStatus(500);
			//}
        }else{
            User.create({   // 创建一组user对象置入model
				account: uAccount,
                name: uName,
				password: uPassword,
				userNo: userNo,
				phone: uPhone,
				role: uRole,
				gruop: []
            },function(err,doc){ 
                if (err) {
					console.log(err);
					res.status(200).send({status:0, error: err });
					//if (!req.xhr) {
					//	res.status(500).send({status:0, error: err });
					//}else{
					//	res.sendStatus(500);
					//}
				} else {
					res.status(200).send({status:1, msg: '用户名创建成功！' });
					//if (!req.xhr) {
					//	res.status(200).send({status:1, msg: '用户名创建成功！' });
					//}else{
					//	req.session.error = '用户名创建成功！';
					//	res.sendStatus(200);
					//}
				}
			});
        }
    });
});


//获取用户登录信息，如果登录，则建立socket连接，接收信息，如果有预留消息，则显示
router.route("/getUserInfo").get(function(req, res){
	//console.log("***********req.session: ***********");
	//console.log(req.session);
	var userInfo = req.session.user;
	if(userInfo){
		var result = {
			id: userInfo._id,
			name: userInfo.name,
			role: userInfo.role
		};
		res.status(200).send({status:1, data: result });		
	}else{
		res.status(200).send({status:0, error: "未登录或登录已过期，请重新登录" });
		//res.redirect("login.html");
	}
});

/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
	res.status(200).send({status:1, msg: "注销成功" });
	//res.redirect("/user/login");
});

module.exports = router;
