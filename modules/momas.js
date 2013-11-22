'use strict';

//requires
var $ = require('jquery');
var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var http = require('http');
var Parse = require('parse').Parse;
var moment = require('moment');

//variables
var merchant = '105',
    host = 'http://41.73.228.162:8080',
    app = '/EnuguEDCWebServices_Pilot/webresources/',
    h = '41.73.228.162',
    p = '8080',
    referenceType = '',
    appID = '1qMibFTk5E9vjKoEgZZrtWOdklstJomntoRJ6gw3',
    jsKey = 'YHXkgxBvsZmRPmOXTtCc9iRsBx8utdkSKp2u44cN';

function validate(meter, type, res) {
    console.log('validate called for meter %s of type %s', meter, type);
    var service = "Identification",
        postpaid = (type === 'post') || (type === 'postpaid');
    referenceType = postpaid ? 'accountnumber' : 'meter';
    
    //connection string
    var url = app + service + '/' + merchant + '/' + meter + ';referencetype=' + referenceType + '?postpaid=' + postpaid;
    //var url = app + service + '/' + merchant + '/' + meter + '?postpaid=' + postpaid;
    console.log('http://' + h + ':' + p + url);
    
    var noresult = {};
    var options = {
        host: h,
        port: p,
        path: url,
        method: 'GET'
    };
    
    var req = http.get(options, function(result) {
        var pageData = '';
        result.setEncoding('utf8');
        
        result.on('data', function(chunk) {
            pageData += chunk;
        });
        
        result.on('end', function() {
            parser.parseString(pageData, function(e, r) {
                if(e) {
                    console.log(e);
                    res.send(noresult);
                } else {
                    console.log(r);
                    console.log(r.customer.customerName[0]);
                    res.send(r);
                }
            });
        });
    });
    
    req.on('error', function(e) {
        console.log('Problem with http request: %s', e.message);
        res.send(noresult);
    });
    
    req.end();
}

function pay(meter, type, amount, res, cb) {
    var service = "Payment",
        postpaid = (type === 'post') || (type === 'postpaid'),
        typeDesc = postpaid ? 'postpaid/' : 'prepaid/',
        referenceType = postpaid ? 'accountnumber' : 'meter';
    var tref = merchant + moment().format('YYYYMMDDHHmmss');
    
    
    //payment
    //var url = app + service + '/' + meter +  '/' + typeDesc + merchant + '/' + tref + '/' + amount;
    var url = app + service + '/' + meter + ';referencetype=' + referenceType +  '/' + typeDesc + merchant + '/' + tref + '/' + amount;
    
    console.log('http://' + h + ':' + p + url);
    
    var noresult = {};
    var options = {
        host: h,
        port: p,
        path: url,
        method: 'POST'
    };
    
    var req = http.request(options, function(result) {
        var pageData = '';
        result.setEncoding('utf8');
        
        result.on('data', function(chunk) {
            pageData += chunk;
        });
        
        result.on('end', function() {
            parser.parseString(pageData, function(e, r) {
                if(e) {
                    console.log(e);
                    res.send(noresult);
                    cb(e, null, null);
                } else {
                    console.log(r);
                    res.send(r);
                    cb(null, true, r.transaction.recieptNumber[0]);
                }
            });
        });
    });
    
    req.on('error', function(e) {
        console.log('Problem with http request: %s', e.message)
        res.send(noresult);
        cb(e, null, null);
    });
    
    req.end();
}

function payWithVoucher(meter, type, pin, res) {
    //validate meter
    console.log('validate called for meter %s of type %s', meter, type);
    var service = "Identification",
        postpaid = (type === 'post') || (type === 'postpaid');
    referenceType = postpaid ? 'accountnumber' : 'meter';
    
    //connection string
    var url = app + service + '/' + merchant + '/' + meter + '?postpaid=' + postpaid;
    console.log('http://' + h + ':' + p + url);
    
    var noresult = {};
    var options = {
        host: h,
        port: p,
        path: url,
        method: 'GET'
    };
    
    var req = http.get(options, function(result) {
        var pageData = '';
        result.setEncoding('utf8');
        
        result.on('data', function(chunk) {
            pageData += chunk;
        });
        
        result.on('end', function() {
            parser.parseString(pageData, function(e, r) {
                if(e) {
                    console.log(e);
                    res.send(noresult);
                } else {
                    //valid meter
                    var minimumPurchase = parseFloat(r.customer.minimumPurchase[0]);
                    
                    //check that pin value exceeds minimum purchase
                    Parse.initialize(appID, jsKey);
                    var Voucher = Parse.Object.extend('Voucher');
                    var q = new Parse.Query(Voucher);
                    q.equalTo('pin', pin);
                    q.find({
                        success: function(results) {
                            var active = false; 
                            if(results.length > 0) {
                                active = results[0].get('status') == 'active';
                            }
                            if(results.length > 0 && active){
                                var voucher = results[0];
                                console.log('Voucher OK');
                                var vAmount = parseFloat(voucher.get('value')); console.log(vAmount);
                                if(vAmount > minimumPurchase){
                                    //make purchase
                                    service = "Payment";
                                    postpaid = (type === 'post') || (type === 'postpaid');
                                    var typeDesc = postpaid ? 'postpaid/' : 'prepaid/';
                                    referenceType = postpaid ? 'accountnumber' : 'meter';
                                    var tref = merchant + moment().format('YYYYMMDDHHmmss');
                                    
                                    
                                    //payment
                                    url = app + service + '/' + meter +  '/' + typeDesc + merchant + '/' + tref + '/' + vAmount;
                                    
                                    console.log('http://' + h + ':' + p + url);
                                    
                                    
                                    options = {
                                        host: h,
                                        port: p,
                                        path: url,
                                        method: 'POST'
                                    };
                                    
                                    var req3 = http.request(options, function(result) {
                                        var pageDat = '';
                                        result.setEncoding('utf8');
                                        
                                        result.on('data', function(chunk) {
                                            pageDat += chunk;
                                        });
                                        
                                        result.on('end', function() {
                                            parser.parseString(pageDat, function(e, r) {
                                                if(e) {
                                                    console.log(e);
                                                    res.send(noresult);
                                                } else {
                                                    console.log(r.transaction); var txn = r.transaction; 
                                                    if('errorCode' in txn) { 
                                                        noresult.status = txn.errorMessage[0]; 
                                                        noresult.ereceipt = '';
                                                        noresult.amount = 0;
                                                        res.send(noresult);
                                                    }else{
                                                        if('recieptNumber' in txn){
                                                            noresult.status = 'Payment Successful';
                                                            noresult.amount = vAmount;
                                                            noresult.ereceipt = txn.recieptNumber[0];
                                                            res.send(noresult);
                                                            
                                                            //transaction was successful so mark card as used
                                                            voucher.set('status', 'used');
                                                            voucher.save();
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                    
                                    req3.on('error', function(e) {
                                        console.log('Problem with http request: %s', e.message)
                                    });
                                    
                                    req3.end();
                                }else{
                                    noresult.status = 'Amount on PIN is N' + vAmount + '. You must make a minimum purchase of N' + minimumPurchase;
                                    noresult.ereceipt = '';
                                    noresult.amount = 0;
                                    
                                    res.send(noresult);
                                }
                            }else{
                                noresult.status = 'Invalid PIN';
                                noresult.ereceipt = '';
                                noresult.amount = 0;
                                
                                res.send(noresult);
                            }
                        },
                        error: function(error) {
                            console.log(error.message);
                            noresult.status = 'Invalid PIN';
                            noresult.ereceipt = '';
                            noresult.amount = 0;
                            
                            res.send(noresult);
                        }
                    });
                }
            });
        });
    });
}

function payViaSms(meter, type, pin, res) {
    //validate meter
    console.log('validate called for meter %s of type %s', meter, type);
    var service = "Identification",
        postpaid = (type === 'post') || (type === 'postpaid');
    referenceType = postpaid ? 'accountnumber' : 'meter';
    
    //connection string
    var url = app + service + '/' + merchant + '/' + meter + '?postpaid=' + postpaid;
    console.log('http://' + h + ':' + p + url);
    
    var noresult = {};
    var options = {
        host: h,
        port: p,
        path: url,
        method: 'GET'
    };
    
    var req = http.get(options, function(result) {
        var pageData = '';
        result.setEncoding('utf8');
        
        result.on('data', function(chunk) {
            pageData += chunk;
        });
        
        result.on('end', function() {
            parser.parseString(pageData, function(e, r) {
                if(e) {
                    console.log(e);
                    res.send('We are unable to process your request at the moment, please try again later.');
                } else {
                    //valid meter
                    var minimumPurchase = parseFloat(r.customer.minimumPurchase[0]);
                    
                    //check that pin value exceeds minimum purchase
                    Parse.initialize(appID, jsKey);
                    var Voucher = Parse.Object.extend('Voucher');
                    var q = new Parse.Query(Voucher);
                    q.equalTo('pin', pin);
                    q.find({
                        success: function(results) {
                            var active = false; 
                            if(results.length > 0) {
                                active = results[0].get('status') == 'active';
                            }
                            if(results.length > 0 && active){
                                var voucher = results[0];
                                console.log('Voucher OK');
                                var vAmount = parseFloat(voucher.get('value')); console.log(vAmount);
                                if(vAmount > minimumPurchase){
                                    //make purchase
                                    service = "Payment";
                                    postpaid = (type === 'post') || (type === 'postpaid');
                                    var typeDesc = postpaid ? 'postpaid/' : 'prepaid/';
                                    referenceType = postpaid ? 'accountnumber' : 'meter';
                                    var tref = merchant + moment().format('YYYYMMDDHHmmss');
                                    
                                    
                                    //payment
                                    url = app + service + '/' + meter +  '/' + typeDesc + merchant + '/' + tref + '/' + vAmount;
                                    
                                    console.log('http://' + h + ':' + p + url);
                                    
                                    
                                    options = {
                                        host: h,
                                        port: p,
                                        path: url,
                                        method: 'POST'
                                    };
                                    
                                    var req3 = http.request(options, function(result) {
                                        var pageDat = '';
                                        result.setEncoding('utf8');
                                        
                                        result.on('data', function(chunk) {
                                            pageDat += chunk;
                                        });
                                        
                                        result.on('end', function() {
                                            parser.parseString(pageDat, function(e, r) {
                                                if(e) {
                                                    console.log(e);
                                                    res.send('We encountered an error while processing your request. Please try again later.');
                                                } else {
                                                    console.log(r.transaction); var txn = r.transaction; 
                                                    if('errorCode' in txn) { 
                                                        noresult.status = txn.errorMessage[0]; 
                                                        noresult.ereceipt = '';
                                                        noresult.amount = 0;
                                                        res.send(noresult.status + ' Please try again later.');
                                                    }else{
                                                        if('recieptNumber' in txn){
                                                            noresult.status = 'Payment Successful';
                                                            noresult.amount = vAmount;
                                                            noresult.ereceipt = txn.recieptNumber[0];
                                                            var m2txt = 'Your electricty bills payment of N' + vAmount + '.00 for meter no.' + meter +'  was successful. Token: ' + noresult.ereceipt + '.Thank you for using Defcom Technologies';
                                                            res.send(m2txt);
                                                            
                                                            //transaction was successful so mark card as used
                                                            voucher.set('status', 'used');
                                                            voucher.save();
                                                        }
                                                    }
                                                }
                                            });
                                        });
                                    });
                                    
                                    req3.on('error', function(e) {
                                        console.log('Problem with http request: %s', e.message)
                                    });
                                    
                                    req3.end();
                                }else{
                                    noresult.status = 'Amount on PIN is N' + vAmount + '. You must make a minimum purchase of N' + minimumPurchase;
                                    noresult.ereceipt = '';
                                    noresult.amount = 0;
                                    
                                    res.send(noresult.status);
                                }
                            }else{
                                noresult.status = 'Invalid PIN';
                                noresult.ereceipt = '';
                                noresult.amount = 0;
                                
                                res.send(noresult.status);
                            }
                        },
                        error: function(error) {
                            console.log(error.message);
                            noresult.status = 'Invalid PIN';
                            noresult.ereceipt = '';
                            noresult.amount = 0;
                            
                            res.send(noresult.status);
                        }
                    });
                }
            });
        });
    });
}

exports.validate = validate;

exports.pay = pay;

exports.payWithVoucher = payWithVoucher;

exports.payViaSms = payViaSms;
