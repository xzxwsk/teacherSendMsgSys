var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.setHeader("Content-Type", "text/html");//处理页面显示代码<pre>
  res.render('index', { title: 'Express' });
});

router.get('/home', function(req, res){
	console.log("***********req.session: ***********");
	console.log(req.session);
	if(!req.session.user){                     //到达/home路径首先判断是否已经登录
		req.session.error = "请先登录"
		res.redirect("/user/login");                //未登录则重定向到 /login 路径
	}else{
		res.setHeader("Content-Type", "text/html");
		res.render("home",{title:'Home'});         //已登录则渲染home页面
	}
});

//教师发送消息
router.post('/sendMsg', function(req, res){
 //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
	var userList = global.dbHandel.getModel('user');
	var message = global.dbHandel.getModel('message');
	var umsg = req.body.msg;
	var uGroupList = req.body.groupList;
	//console.log("***groupList***");
	//console.log(uGroupList);
	var funStr = 'var _uGroupList = ' + uGroupList + ';'+
		'for(var i=0; i<this.group.length; i++){'+
			'for(var j=0; j<_uGroupList.length; j++){'+
				'if(this.group[i] == _uGroupList[j]){'+
					'return true;'+
				'}'+
			'}'+
		'}'+
		'return false;';
	//console.log(funStr);
	
	//查出属于这些群组的人员，并给其中已建立连接的人发送消息，未建立连接的则把信息保存到数据库
	userList.find({"$where": new Function(funStr)}, function(err,doc){ 
		if (err) {
			console.log("***err***");
			console.log(err);
			res.status(200).send({status:0, error: err });
			//if (!req.xhr) {
			//	res.status(500).send({status:0, error: err });
			//}else{
			//	res.sendStatus(500);
			//}
		} else {
			//console.log("**查出属于这些群组的人员doc***");
			//console.log(doc);
			var _personList = [];//保存属于这些群组的人员
			doc.forEach(function(val,index){
				_personList.push(val._id.toString());
			});
			global.personList = _personList;
			res.status(200).send({status:1, data: doc });
			//if (!req.xhr) {
			//	res.status(200).send({status:1, data: doc });
			//}else{
			//	req.session.error = '查询成功';
			//	res.sendStatus(200);
			//}
		}
	});
});

//消息接收人员列表
router.post('/addPersonList', function(req, res){
	var addPersonList = global.dbHandel.getModel('addPersonList');
	var uName = req.body.uname;
	var uPassword = req.body.upwd;
	var userNo = req.body.uxuehao;
	var uPhone = req.body.uphone;
	var uRole = req.body.urole;
	
	addPersonList.create({   
		name: uName,
		password: uPassword,
		userNo: userNo,
		phone: uPhone,
		role: uRole,
		group: []
	},function(err,doc){ 
		console.log("***err***");
		console.log(err);
		console.log("**doc***");
		console.log(doc);
		if (err) {
			if (!req.xhr) {
				res.status(500).send({status:0, error: err });		
			}else{
				res.send(500);
			}
			console.log(err);
		} else {
			if (!req.xhr) {
				res.status(200).send({status:1, msg: '人员增加成功！' });	
			}else{
				req.session.error = '人员增加成功！';
				res.send(200);
			}
		}
	});
});

//增加消息接收群体
router.post('/addGroup', function(req, res){
	var groupList = global.dbHandel.getModel('groupList');
	var uGruopName = req.body.uGruopName;
	
	groupList.findOne({groupName: uGruopName},function(err,doc){
		if(err){
			console.log(err);
			if (!req.xhr) {
				res.status(200).send({status:0, error: '网络异常错误！' });	
			}else{
				res.send(500);
				req.session.error =  '网络异常错误！';
			}            
		}else if(doc){ 
			console.log("群体名已存在！");
			if (!req.xhr) {
				res.status(200).send({status:0, error: '群体名已存在！' });	
			}else{
				req.session.error = '群体名已存在！';
				res.send(500);
			}
		}else{
			groupList.create({   
				groupName: uGruopName
			},function(err,doc){ 
				console.log("*****");
				console.log(err);
				console.log(doc);
				console.log("*****");
				if (err) {
					if (!req.xhr) {
						res.status(500).send({status:0, error: err });		
					}else{
						res.send(500);
					}
					console.log(err);
				} else {
					if (!req.xhr) {
						res.status(200).send({status:1, msg: '群体增加成功！' });	
					}else{
						req.session.error = '群体增加成功！';
						res.send(200);
					}
				}
			});
		}
	});		
});

//获取消息接收群体
router.post('/getGroupList', function(req, res){
	var groupList = global.dbHandel.getModel('groupList');
	var uCondition = req.body.condition;
	
	groupList.find({   
		groupName: new RegExp(uCondition, 'i')
	},function(err,doc){ 
		//console.log("****err***");
		//console.log(err);
		//console.log("****doc*****");
		//console.log(doc);
		if (err) {
			//if (!req.xhr) {
				res.status(500).send({status:0, error: err });		
			//}else{
			//	res.send(500);
			//}
			//console.log(err);
		} else {
			//if (!req.xhr) {
				res.status(200).send({status:1, data:doc });
			//}else{
			//	req.session.error = '人员增加成功！';
			//	res.send(200);
			//}
		}
	});
});

//获取人员，如果有群组ID，则筛选所属群组不含该ID的人员
router.post('/getPersonList', function(req, res){
	var userList = global.dbHandel.getModel('user');
	var uGroupId = req.body.groupId;
	var prompt = {role: "student"};
	console.log("***uGroupId****");
	console.log(uGroupId);
	if(uGroupId){//如果有群组ID，则筛选所属群组不含该ID的人员
		prompt.group = { $nin: [uGroupId] };
	}
	console.log("***prompt****");
	console.log(prompt);
	userList.find(prompt,function(err,doc){
		if (err) {
			console.log("******getPersonList err********:");
			console.log(err);
			res.status(200).send({status:0, error: err });
			//if (!req.xhr) {
			//	res.status(500).send({status:0, error: err });
			//}else{
			//	res.sendStatus(500);
			//}
			//console.log(err);
		} else {
			//console.log("******getPersonList doc********:");
			//console.log(doc);
			res.status(200).send({status:1, data:doc });
			//if (!req.xhr) {
			//	res.status(200).send({status:1, data:doc });
			//}else{
			//	res.sendStatus(200);
			//}
		}
	});
});

//获取人员，如果有群组ID，则筛选所属群组含该ID的人员
router.post('/getPersonOfList', function(req, res){
	var userList = global.dbHandel.getModel('user');
	var uGroupId = req.body.groupId;
	if(uGroupId){//如果有群组ID，则筛选所属群组不含该ID的人员
		var prompt = {role: "student"};
		prompt.group = { $in: [uGroupId] };
		userList.find(prompt,function(err,doc){
			if (err) {
				console.log("******getPersonOfList err********:");
				console.log(err);
				res.status(200).send({status:0, error: err });
			} else {
				res.status(200).send({status:1, data:doc });
			}
		});
	}else{
		res.status(200).send({status:1, data:[] });
	}
});

//设置人员所属群组
router.post('/setPersonOfGroup', function(req, res){
	var userList = global.dbHandel.getModel('user');
	var group = global.dbHandel.getModel('groupList');
	var uGroupId = req.body.groupId;//当前选中群组
	var uPersonSelLs = req.body.personSelLs;//当前选中人员
	//console.log("***uPersonSelLs uGroupId**");
	//console.log(uGroupId);
	var arr = [];//保存当前选中人员
	if("" != uPersonSelLs){
		arr = uPersonSelLs.split(",");
	}
	var callback = function(err,doc){
		if (err) {
			console.log("***err**");
			console.log(err);
			res.status(200).send({status:0, error: err });
			//if (!req.xhr) {
			//	res.status(500).send({status:0, error: err });
			//}else{
			//	res.send(500);
			//}
		} else {
			console.log("***doc**");
			console.log(doc);
			res.status(200).send({status:1, data:doc });
			//if (!req.xhr) {
			//	res.status(200).send({status:1, data:doc });
			//}else{
			//	res.send(200);
			//}
		}
	};
	//设置群组人员
	group.update({_id: uGroupId}, {'$set':{'userList':arr}}, function(err,doc){
		if (err) {
			console.log("***err**");
			console.log(err);
			res.status(200).send({status:0, error: err });
		} else {
			//用户表添加群组id
			//先清除所有学生的所属群组中该群组
			userList.update({"role":"student"}, {'$pull': {'group': uGroupId}}, {multi: true}, function(err2, doc2) {
				if (err2) {
					console.log("***err2**");
					console.log(err2);
					res.status(200).send({status:0, error: err2 });
				} else {
					console.log("***doc2**");
					console.log(doc2);
					//把选中的人员的所属群组中添加该群组
					if("" != uPersonSelLs) {
						console.log("*******arr***");
						console.log(arr);
						userList.update({_id: {$in: arr}}, {'$addToSet': {'group': uGroupId}}, {multi: true}, callback);
					}else{
						res.status(200).send({status:1, data:doc2 });
					}
				}
			});
		}
	} );
});

//读取未读信息
router.get('/getInfoList', function(req, res){
	var userList = global.dbHandel.getModel('user');
	var message = global.dbHandel.getModel('message');
	var id = req.query.id;//用户id
	var msgId = [];//消息id数组
	//通过id查询对应信息
	var callbackMsg = function(err,doc){
		if (err) {
			console.log("***通过id查询对应信息 err**");
			console.log(err);
			res.status(200).send({status:0, error: err });
		} else {
			//console.log("***通过id查询对应信息 doc**");
			//console.log(doc);
			//删除该用户的未读信息id
			var info = doc
			userList.update({_id: id}, {'$set':{'msg':[]}}, function(err,doc){
				if (err) {
					console.log("***删除该用户的未读信息id err**");
					console.log(err);
					res.status(200).send({status:0, data: err });
				} else {
					console.log("***删除该用户的未读信息id doc**");
					console.log(doc);
					//删除该用户的未读信息对应数据
					//console.log("***msgId**");
					//console.log(msgId);
					//console.log("***id**");
					//console.log(id);
					message.update({"_id": {"$in": msgId} }, {'$pull':{'userList':id}}, {multi: true}, function(err,doc){
						if (err) {
							console.log("***删除该用户的未读信息对应数据 err**");
							console.log(err);
						} else {
							console.log("***删除该用户的未读信息对应数据 doc**");
							console.log(doc);
							res.status(200).send({status:1, data:info });
						}
					});
				}
			} );
		}
	};
	//查询该用户未读信息id
	var callback = function(err,doc){
		if (err) {
			//console.log("***查询该用户未读信息id err**");
			//console.log(err);
			res.status(200).send({status:0, error: err });
		} else {
			//通过id查询信息
			msgId = doc.msg;
			//console.log("***查询该用户未读信息id：**");
			//console.log(msgId);
			message.find({"_id": {"$in": doc.msg} }, callbackMsg );
		}
	};
	//查询该用户未读信息id
	userList.findOne({_id: id}, callback );
});

/*
router.get("/hub",function(req,res){
	res.setHeader("Content-Type", "text/html");//处理页面显示代码<pre>
	res.render('hub');
});
*/

module.exports = router;

/*
module.exports = function ( app ) {
    require('./home')(app);
	return router;
};
*/