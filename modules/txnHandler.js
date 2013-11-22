var soap = require('soap');
var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var util = require('util');
var voucher = require('./voucher');
var moment = require('moment');
var Parse = require('parse').Parse;
var sms = require('./sms');

var logger = require('./logger');

function xsdDateTime(date)
{
  function pad(n) {
	 var s = n.toString();
	 return s.length < 2 ? '0'+s : s;
  };

  var yyyy = date.getFullYear();
  var mm1  = pad(date.getMonth()+1);
  var dd   = pad(date.getDate());
  var hh   = pad(date.getHours());
  var mm2  = pad(date.getMinutes());
  var ss   = pad(date.getSeconds());

  return yyyy +'-' +mm1 +'-' +dd +'T' +hh +':' +mm2 +':' +ss;
}

exports.validateIbadan = function(url, user, pass, meter, cb) {
    console.log('validate meter called');
    
    var args = {
        'tns:authuser': user,
        'tns:authpwd': pass,
        'tns:AccountNumber': meter
    };
    
    var meterInfo = {};
    
    soap.createClient(url, function(err, client) {
        if(err) {
            console.log('soap client error');
            cb(err, null);
        } else {
            console.log('client created. Testing meter %s', meter);
            client.Service.ServiceSoap.getCustomerInfo(args, function(err, result) {
                if(err) {
                    console.log(err);
                    cb(err, null);
                } else {
                    console.log('parsing');
                    parser.parseString(result.getCustomerInfoResult, function(err, result) {
                        if(err) {
                            console.log(err);
                            cb(err, null);
                        } else {
                            console.log(util.inspect(result, false, null));
                            var details = result.CustomerInfo;
                            cb(null, details.Details[0], details);
                            //console.log(details.Details[0].CustomerName[0]);
                        }
                    });
                }
            });
        }
    });
}

exports.payIbadan = function(url, user, pass, meter, amount, ereceipt, tref, customer, zone, bu, cb) {
    console.log('pay meter called');
    
    var args = {
        'tns:CustomerCategory': 'PostPaid',
        'tns:CustomerName': customer,
        'tns:authuser': user,
        'tns:authpwd': pass,
        'tns:AccountNumber': meter,
        'tns:TransRef': tref,
        'tns:EReceipt': ereceipt,
        'tns:Zone': zone,
        'tns:district': bu,
        'tns:pymtRef': tref,
        'tns:Channel': 2,
        'tns:MeterNum': meter,
        'tns:AmountPaid': amount,
        'tns:TransDate': xsdDateTime(new Date()),
        'tns:ConvenienceFee': 100,
        'tns:AmountRemitted': amount-100
    };
    
    soap.createClient(url, function(err, client) {
        if(err) {
            console.log('soap client error');
            cb(err);
        } else {
            console.log('client created. paying meter %s', meter);
            client.Service.ServiceSoap.logTransactions(args, function(err, result) {
                if(err) {
                    console.log(err);
                    cb(err);
                } else {
                    var status = result.logTransactionsResult[0];
                    cb(null, status);
                    /*
                    if(status == '1'){
                        s.status = 'ok';
                        s.ereceipt = ereceipt;
                        s.amount = amount;
                        cb(null, s);
                        
                        //log transaction
                        //logger.voucherPayment(details, pin, meter, value);
                    } else if(status == '2') {
                        s.status = 'error - check details';
                        s.ereceipt = '';
                        cb(null, s);
                    } else if(status == '3') {
                        s.status = 'ereceipt number has been used for another meter';
                        s.ereceipt = '';
                        cb(null, s);
                    }else if(status == '4') {
                        s.status = 'wrong customer category';
                        s.ereceipt = '';
                        cb(null, s);
                    } */
                }
            });
        }
    });  
}