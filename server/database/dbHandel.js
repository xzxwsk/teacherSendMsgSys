var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var models = require("./models");

for(var m in models){ 
	//versionKey²»Òª_v£¨°æ±¾ºÅ£©
    mongoose.model(m,new Schema(models[m],{versionKey: false}),m);
}

module.exports = { 
    getModel: function(type){ 
        return _getModel(type);
    }
};

var _getModel = function(type){ 
    return mongoose.model(type);
};