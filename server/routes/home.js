module.exports = function ( app ) {
	app.get('/home', function(req, res){
		console.log("***********");
		console.log("req.session: ");
		console.log(req.session);
		console.log("***********");
		if(!req.session.user){                     //到达/home路径首先判断是否已经登录
			req.session.error = "请先登录"
			res.redirect("/login");                //未登录则重定向到 /login 路径
	    }
	    res.setHeader("Content-Type", "text/html");
		res.render("home",{title:'Home'});         //已登录则渲染home页面
	});
	
	//教师发送消息
	app.post('/sendMsg', function(req, res){
     //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
		var userList = global.dbHandel.getModel('user');
		var message = global.dbHandel.getModel('message');
		var umsg = req.body.msg;
		var uGroupList = req.body.groupList;
		console.log("***groupList***");
		console.log(uGroupList);
		/*
		var arrStr = "";
		for(var i=0; i<uGroupList.length; i++){
			arrStr += "'"+uGroupList[i]+"'";
			if(i < uGroupList.length-1){
				arrStr +=",";
			}
		}
		*/
		var funStr = 'var _uGroupList = ' + uGroupList + ';'+
			'for(var i=0; i<this.group.length; i++){'+
				'for(var j=0; j<_uGroupList.length; j++){'+
					'if(this.group[i] == _uGroupList[j]){'+
						'return true;'+
					'}'+
				'}'+
			'}'+
			'return false;';
		console.log(funStr);
		
		//查出属于这些群组的人员
		userList.find({"$where": new Function(funStr)}, function(err,doc){ 
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
			} else {
				if (!req.xhr) {
					res.status(200).send({status:1, data: doc });	
				}else{
					req.session.error = '查询成功';
					res.send(200);
				}
			}
		});
		/*
		message.create({  
			msg: umsg,
			groupList: uGroupList
		},function(err,doc){ 
			if (err) {
				if (!req.xhr) {
					res.status(500).send({status:0, error: err });		
				}else{
					res.send(500);
				}
				console.log(err);
			} else {
				if (!req.xhr) {
					res.status(200).send({status:1, msg: '消息创建成功！' });	
				}else{
					req.session.error = '消息创建成功！';
					res.send(200);
				}
			}
		});
		*/
	});

	//消息接收人员列表
	app.post('/addPersonList', function(req, res){
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
	app.post('/addGroup', function(req, res){
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
	app.post('/getGroupList', function(req, res){
		var groupList = global.dbHandel.getModel('groupList');
		var uCondition = req.body.condition;
		
		groupList.find({   
			groupName: new RegExp(uCondition, 'i')
		},function(err,doc){ 
			console.log("****err***");
			console.log(err);
			console.log("****doc*****");
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
					res.status(200).send({status:1, data:doc });
				}else{
					req.session.error = '人员增加成功！';
					res.send(200);
				}
			}
		});
	});

	//获取人员，如果有群组ID，则筛选所属群组不含该ID的人员
	app.post('/getPersonList', function(req, res){
		var userList = global.dbHandel.getModel('user');
		var uGroupId = req.body.groupId;
		var prompt = {role: "student"};
		console.log("***uGroupId****");
		console.log(uGroupId);
		console.log("*****");
		if(uGroupId){
			prompt.group = { $nin: [uGroupId] };
		}
		console.log("***prompt****");
		console.log(prompt);
		console.log("*****");
		userList.find(prompt,function(err,doc){ 
			console.log("*****");
			console.log("getPersonList");
			console.log("err:");
			console.log(err);
			console.log("doc:");
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
					res.status(200).send({status:1, data:doc });
				}else{
					res.send(200);
				}
			}
		});

		/*
		var callback = function(err,doc){ 
			console.log("*****");
			console.log("getPersonList");
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
					res.status(200).send({status:1, data:doc });
				}else{
					res.send(200);
				}
			}
		};
		if(uGroupId){
			userList.find({role: "student"}).where('group').in([uGroupId]).exec(callback)
		}else{
			userList.find({role: "student"}).exec(callback)
		}
		*/
	});

	//设置人员所属群组
	app.post('/setPersonOfGroup', function(req, res){
		var userList = global.dbHandel.getModel('user');
		var uGroupId = req.body.groupId;
		var uPersonSelLs = req.body.personSelLs;
		console.log("***uPersonSelLs**");
		console.log(uPersonSelLs);
		var callback = function(err,doc){ 
			console.log("***err**");
			console.log(err);
			console.log("***doc**");
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
					res.status(200).send({status:1, data:doc });
				}else{
					res.send(200);
				}
			}
		};
		userList.update({_id: {$in: uPersonSelLs}}, {'$addToSet':{'group':uGroupId}}, {multi: true}, callback );	
		
	});

	//获取用户登录信息，如果登录，则建立socket连接，接收信息，如果有预留消息，则显示
	/*
	app.get('/getUserInfo', function(req, res){
		var userInfo = req.session.user;
		console.log("***userInfo**");
		console.log(userInfo);
		if(userInfo){
			var result = {
				id: userInfo._id,
				name: userInfo.name
			};
			res.status(200).send({status:1, data: result });		
		}else{
			res.status(200).send({status:0, error: "未登录或登录已过期，请重新登录" });
			//res.redirect("login.html");
		}
	});
	*/

	var array_contain = function array_contain(array, obj){
		for (var i = 0; i < array.length; i++){
			if (array[i] == obj)//如果要求数据类型也一致，这里可使用恒等号===
				return true;
		}
		return false;
	}
}