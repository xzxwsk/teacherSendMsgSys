var util = new Util();
var interfacePath = "http://192.168.1.106/";
var socketPath = "ws://192.168.1.106:3001/ws/";

$(function(){
	var scale = 1 / devicePixelRatio;
	document.documentElement.setAttribute("data-dpr", devicePixelRatio);
	document.querySelector('meta[name="viewport"]').setAttribute('content','width=device-width, initial-scale=' + scale + ', minimum-scale=' + scale + ', maximum-scale=' + scale + ', user-scalable=no');
	document.documentElement.style.fontSize = document.documentElement.clientWidth / 10 + 'px';
	
	$("body").show().height(Math.max($("body").height(), $(window).height()));
});