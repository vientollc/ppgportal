var util = require('util');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var dburl = undefined;
var moment = require('moment');


var VoucherSchema = mongoose.Schema({
    batch: String,
    pin: String,
    serial: String,
    status: String,
    value: Number,
    createdAt: Date,
    utilizedAt: Date,
    utilizedBy: String
});

var Voucher = mongoose.model('Voucher', VoucherSchema);

exports.create = function(batch, pin, serial, status, value, cb) {
    var v = new Voucher();
    
    v.batch = batch;
    v.pin = pin;
    v.serial = serial;
    v.status = status;
    v.value = value;
    
    v.save(function(err) {
        if(err) {
            cb(err);
        } else {
            cb(null, pin);
        }
    });
}

exports.read = function(pin, callback) {
    Voucher.findOne({pin: pin}, function(err, doc) {
        if(err) {
            callback(err, null);
        } else {
            callback(null, doc);
        }
    });
}

exports.update = function(pin, status, user, cb) {
    exports.read(pin, function(err, doc) {
        if(err) {
            cb(err);
        } else {
            doc.status = status;
            doc.utilizedBy = user;
            doc.utilizedAt = new Date();
            doc.save(function(err) {
                if(err) {
                    cb(err);
                } else {
                    cb(null);
                }
            });
        }
    });
}