var util = require('util');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var dburl = undefined;
var moment = require('moment');


var ISWSchema = mongoose.Schema({
    request: {},
    createdAt: Date
});

var ISW = mongoose.model('ISW', ISWSchema);

exports.create = function(request, cb) {
    var i = new ISW();
    i.request = request;
    i.createdAt = new Date();
    i.save(function(err) {
        if(err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}