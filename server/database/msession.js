var Settings = require('./settings');
var Db = require('mongodb').Db;
var Server = require('mongodb').Server; 
var dbOptions = {
	'auto_reconnect': true, 
	'native_parser': true,
	'poolSize' : 1, 
	w : "majority", 
	wtimeout:10000,
	safe : true, 
	strict: false,
	j: true,
	fsync: true
};
var db = new Db(Settings.DB, new Server(Settings.HOST, Settings.PORT, {auto_reconnect:true, native_parser: true}), dbOptions);
//var db = new Db(Settings.DB, new Server(Settings.HOST, Settings.PORT, {auto_reconnect:true, native_parser: true}, {safe: true}), {safe: true}, {w: 'majority'}, {journal: true}, {fsync: true});
//var db = new Db(Settings.DB, new Server('localhost', 27017), {safe:false});
//var db = new Db(Settings.DB, new Server('localhost', 27017), {w: 1});
//		 new Db(settings.db, new Server(settings.host, Connection.DEFAULT_PORT, {safe:true}),{safe:true});
 
module.exports = db;