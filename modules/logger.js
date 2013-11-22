

var ISW = require('../models/isw');
var Voucher = require('../models/voucher');

var Parse = require('parse').Parse;

var appID = '1qMibFTk5E9vjKoEgZZrtWOdklstJomntoRJ6gw3';
var jsKey = 'YHXkgxBvsZmRPmOXTtCc9iRsBx8utdkSKp2u44cN';

exports.iswRequest = function(obj) {
    ISW.create(obj, function(err) {
        
    });
};

exports.voucherPayment = function(details, pin, meter, value) {
    Parse.initialize(appID, jsKey);
    var VoucherPayment = Parse.Object.extend('VoucherPayment');
    var vp = new VoucherPayment();
    vp.set('Disco', 'Ibadan');
    vp.set('CustomerCategory', 'PostPaid');
    vp.set('CustomerName', details.Details[0].CustomerName[0]);
    vp.set('AccountNumber', details.Details[0].AccountNumber[0]);
    vp.set('TransRef', pin);
    vp.set('EReceipt', details.Details[0].EReceipt[0]);
    vp.set('Zone', details.Details[0].Zone[0]);
    vp.set('District', details.Details[0].BusinessUnit[0]);
    vp.set('PymtRef', pin);
    vp.set('MeterNum', meter);
    vp.set('AmountPaid', value-100);
                                                
    vp.save(null, {
        success: function() {
                                                            
        },
        error: function(perr) {
            console.log('Unable to save transaction details - %s', perr.message);
        }
    });
};


exports.paymentNotificationRequest = function(payment) {
    Parse.initialize(appID, jsKey);
    var PaymentNotificationRequest = Parse.Object.extend('PaymentNotificationRequest');
    var pnf = new PaymentNotificationRequest();
    
    
    
    pnf.save(payment, {
        success: function() {
                                                            
        },
        error: function(perr) {
            console.log('Unable to save transaction details - %s', perr.message);
        }
    });
};
/*
exports.pnrExists = function(field, value, callback) {
    Parse.initialize(appID, jsKey);
    var PaymentNotificationRequest = Parse.Object.extend('PaymentNotificationRequest');
    var q = new Parse.Query(PaymentNotificationRequest);
    q.equalTo(field, value); 
    q.find({
        success: function(results) {
            console.log(results.length);
            callback(results.length); 
        },
        error: function(error) {
            console.log(error.message);
            callback(0); 
        }
    });
};
*/
