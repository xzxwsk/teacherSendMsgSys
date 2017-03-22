var Util = function(){
	var contentTypeDef = "application/x-www-form-urlencoded; charset=utf-8",//默认的编码设置 
	getScript = function(url, callback) {
		//取出要加载的文件名
		var fileNameArr = url.split("/");
		var fileName = fileNameArr[fileNameArr.length-1];
		var isExist = 0;
		var scriptFileArr = document.getElementsByTagName('script');
		//遍历页面已加载所有js
		for(var i in scriptFileArr){
			if(scriptFileArr[i].src){
				//取出已加载的文件名
				var _fileNameArr = scriptFileArr[i].src.split("/");
				var _fileName = _fileNameArr[_fileNameArr.length-1];
				if(fileName == _fileName){
					isExist = 1;
				}				
			}
		}
		if(isExist){
			if (callback)
		    	callback();
			return;
		}
		
		var head = document.getElementsByTagName('head')[0];
		var script = document.createElement('script');
		script.type = "text/javascript";
		script.src = url;
		
		var done = false;
		script.onload = script.onreadystatechange = function() {
			if (!done && (!this.readyState ||
	        	this.readyState == 'loaded' || this.readyState == 'complete')) {
		        done = true;
		        if (callback)
		            callback();
		
		        script.onload = script.onreadystatechange = null;
	    	}
		};
	
		head.appendChild(script);
	},
	
	getCss = function getCss(url, callback) {
		//取出要加载的文件名
		var fileNameArr = url.split("/");
		var fileName = fileNameArr[fileNameArr.length-1];
		var isExist = 0;
		var cssFileArr = document.getElementsByTagName('link');
		//遍历页面已加载所有css
		for(var i in cssFileArr){
			if(cssFileArr[i].href){
				//取出已加载的文件名
				var _fileNameArr = cssFileArr[i].href.split("/");
				var _fileName = _fileNameArr[_fileNameArr.length-1];
				if(fileName == _fileName){
					isExist = 1;
				}				
			}
		}
		if(isExist){
			if (callback)
		    	callback();
			return;
		}
		
		var head = document.getElementsByTagName('head')[0];
		var cssScript = document.createElement('link');
		cssScript.rel="stylesheet";
		cssScript.type="text/css";
		cssScript.href = url;
		
		var done = false;
		cssScript.onload = cssScript.onreadystatechange = function() {
			if (!done && (!this.readyState ||
	        	this.readyState == 'loaded' || this.readyState == 'complete')) {
		        done = true;
		        if (callback)
		        	callback();
//		            callback("err");
		
		        cssScript.onload = cssScript.onreadystatechange = null;
	    	}
		};
	
		head.appendChild(cssScript);
	},

	getJSONP = function getJSONP(url, params, callback){
		var jsonpPara = "callback";
		if(null != params && undefined != params && undefined != params.jsonp){
			jsonpPara = params.jsonp;
		}
		var jsonpCallbackPara = "jsonpCallback";
		if(null != params && undefined != params && undefined != params.jsonpCallback){
			jsonpCallbackPara = params.jsonpCallback;
		}
		if(null != params && undefined != params){
			if(null != params.jsonp && undefined != params.jsonp){
				delete params.jsonp;
			}
			if(null != params.jsonpCallback && undefined != params.jsonpCallback){
				delete params.jsonpCallback;
			}
		}
		$.ajax({
			 type : "post",
			 url : url,  
			 data : params,
			 dataType : "jsonp",
			 success : callback,
			 jsonp: jsonpPara,
			 jsonpCallback: jsonpCallbackPara,
			 error : function(resData) {
				 if(resData.readyState == 4){
					 console.log("jsonp参数key与后台不一致");
				 }
			 }  
		 });
	},

	/**
	 * 统一UTF-8编码
	 * @param type
	 * @param url
	 * @param params
	 * @param callback
	 * @param async
	 */
	getOrPost = function getOrPost(type, url, params, callback, async){
		$.ajax({
			type : type,
			async : async,
			contentType: contentTypeDef,   
			url : url,  
			data : params,
			dataType : "json",
			//这里通过返回数据判断成功或者失败
			//complete : callback  
			success :callback,
			timeout: 15*1000,
			cache: false,
			error : function(data) {
				//alert("请求失败,请重新尝试!");
				var temp = '{"status":"-1"}';
				//转化为json
				data = eval('(' + temp + ')');
				eval(callback(data));
			}
		});
	};
	
	this.getFun = function (){
		var obj = {};
//			obj.getScript = getScript;
//			obj.getCss = getCss;
		return obj;
	};
	
	this.eachSeries = function (arr, iterator, callback) {
		callback = callback || function () {};
	    if (!arr.length) {
	        return callback();
	    }
	    var completed = 0;
	    var getCallback = function (err) {
            if (err) {
                callback(err);
                callback = function () {};
            } else {
                completed += 1;
                if (completed >= arr.length) {
                    callback(null);
                } else {
                    iterate();
                }
            }
        };
	    var iterate = function () {
	    	if("getCss" == iterator){
	    		getCss(arr[completed], getCallback);
	    	}else if("getScript" == iterator){
	    		getScript(arr[completed], getCallback);
	    	}
	    };
	    iterate();
	};
	
	/**
	 * 封装页面请求
	 * 备注：基于jquery请求对所有请求做对应的封装。每个页面需要先引用jquery.js
	 * @param type  0：get, 1：post, 2：getJSON(跨域问题,只提供get方式)。
	 * @param url 提交地址,绝对全路径。
	 * @param params 请求参数(为了方便这里用字符串组装方式提供).格式："key="+key +"&mac="+mac 。
	 * @param callback 回调函数。这里多个请求时
	 * @param async true：异步, false ：同步。
	 */
	this.postData = function postData(type, url, params, callback, async) {
		//默认为异步提交
		if(async === undefined){
			async = true;
		}
		if(type === 0){
			getOrPost("GET", url, params, callback, async);
		}else if(type === 1){
			getOrPost("POST", url, params, callback, async);
		}else if(type === 2){
			 //跨域请求
			getJSONP(url, params, callback);
		}
	}
	
	/*获取传值参数*/
	this.getParameter = function(param) {
		var query = window.location.search;
		var iLen = param.length;
		var iStart = query.indexOf(param);
		if (iStart == -1)
			return "";
		iStart += iLen + 1;
		var iEnd = query.indexOf("&", iStart);
		if (iEnd == -1)
			return query.substring(iStart);
		return query.substring(iStart, iEnd);
	}
};
