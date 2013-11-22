var soap = require('soap');
var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var util = require('util');
var voucher = require('./voucher');
var moment = require('moment');
var Parse = require('parse').Parse;
var sms = require('./sms');

var logger = require('./logger');

//test url
/*
var ibUrl = 'http://50.63.173.81/ibedc/service.asmx?WSDL';
var uname = 'ufugi384igi';
var pwd = '74djgg9d7fu';
*/

//production

var ibUrl = 'http://50.63.116.157/ibedcaggregator/service.asmx?WSDL';
var uname = 'ppg958tyg375';
var pwd = 'udur43829djgp';


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

function ibadanWithVoucher(meter, pin, phone, res) {
    console.log('validate meter called');
    
    var args = {
        'tns:authuser': uname,
        'tns:authpwd': pwd,
        'tns:AccountNumber': meter
    };
    
    var meterInfo = {};
    
    soap.createClient(ibUrl, function(err, client) {
        if(err) {
            console.log('soap client error');
            res.send(meterInfo);
        } else {
            console.log('client created. Testing meter %s', meter);
            client.Service.ServiceSoap.getCustomerInfo(args, function(err, result) {
                if(err) {
                    console.log(err);
                    res.send(meterInfo);
                } else {
                    console.log('parsing');
                    parser.parseString(result.getCustomerInfoResult, function(err, result) {
                        if(err) {
                            console.log(err);
                            res.send(meterInfo);
                        } else {
                            console.log(util.inspect(result, false, null));
                            
                            var details = result.CustomerInfo;
                            //res.send(details);
                            //console.log(details.Details[0].CustomerName[0]);
                            if(details.Details[0].AccountNumber[0] == meter) {
                                //get value of pin
                                voucher.utilize(pin, details.Details[0].AccountNumber[0], function(err, value) {
                                    if(err) {
                                        res.send(err);
                                    }else if(value == 0){
                                        meterInfo.status = 'invalid pin';
                                        meterInfo.ereceipt = '';
                                        meterInfo.amount = 0;
                                        res.send(meterInfo);
                                    } else {
                                        //new set of arguments
                                        var args2 = {
                                            'tns:CustomerCategory': 'PostPaid',
                                            'tns:CustomerName': details.Details[0].CustomerName[0],
                                            'tns:authuser': uname,
                                            'tns:authpwd': pwd,
                                            'tns:AccountNumber': details.Details[0].AccountNumber[0],
                                            'tns:TransRef': pin,
                                            'tns:EReceipt': details.Details[0].EReceipt[0],
                                            'tns:Zone': details.Details[0].Zone[0],
                                            'tns:district': details.Details[0].BusinessUnit[0],
                                            'tns:pymtRef': pin,
                                            'tns:Channel': 2,
                                            'tns:MeterNum': meter,
                                            'tns:AmountPaid': value-100,
                                            'tns:TransDate': xsdDateTime(new Date()),
                                            'tns:ConvenienceFee': 100,
                                            'tns:AmountRemitted': value-100
                                        };
                                        
                                        console.log(args2);
                                        
                                        client.Service.ServiceSoap.logTransactions(args2, function(e, r) {
                                            if(e){
                                                console.log(e);
                                            }else{
                                                var status = r.logTransactionsResult[0];
                                                var s = {};
                                                if(status == '1'){
                                                    s.status = 'ok';
                                                    s.ereceipt = details.Details[0].EReceipt[0];
                                                    s.amount = value;
                                                    console.log(s);
                                                    res.send(s);
                                                    
                                                    var m2txt = 'Your electricty bills payment of N' + value + '.00 for account no.' + meter +'  was successful. payment ref ' + s.ereceipt + '.Thank you for choosing PrepayGo';
                                                    
                                                    //send sms
                                                    sms.message(phone, m2txt);
                                                    
                                                    //log transaction
                                                    logger.voucherPayment(details, pin, meter, value);
                                                } else if(status == '2') {
                                                    s.status = 'error - check details';
                                                    s.ereceipt = '';
                                                    console.log(s);
                                                    res.send(s);
                                                } else if(status == '3') {
                                                    s.status = 'ereceipt number has been used for another meter';
                                                    s.ereceipt = '';
                                                    console.log(s);
                                                    res.send(s);
                                                }else if(status == '4') {
                                                    s.status = 'wrong customer category';
                                                    s.ereceipt = '';
                                                    console.log(s);
                                                    res.send(s);
                                                }
                                                console.log(r);
                                                res.send(s);
                                                
                                            }
                                        });
                                    }
                                });
                            } else {
                                meterInfo.status = 'invalid meter';
                                meterInfo.ereceipt = '';
                                meterInfo.amount = 0;
                                res.send(meterInfo);
                            }
                            
                        }
                    });
                }
            });
        }
    });
    
    
    
}

exports.ibadanWithVoucher = ibadanWithVoucher;

function ibadanViaSms(meter, pin, res) {
    console.log('validate meter called');
    
    var args = {
        'tns:authuser': uname,
        'tns:authpwd': pwd,
        'tns:AccountNumber': meter
    };
    
    soap.createClient(ibUrl, function(err, client) {
        if(err) {
            console.log('soap client error');
            res.send('We are unable to process your request at the moment. Please try again later');
        } else {
            console.log('client created. Testing meter %s', meter);
            client.Service.ServiceSoap.getCustomerInfo(args, function(err, result) {
                if(err) {
                    console.log(err);
                    res.send('We are unable to verify your meter at the moment. Please try again later');
                } else {
                    console.log('parsing');
                    parser.parseString(result.getCustomerInfoResult, function(err, result) {
                        if(err) {
                            console.log(err);
                            res.send('We are unable to verify your meter at the moment. Please try again later');
                        } else {
                            console.log(util.inspect(result, false, null));
                            var details = result.CustomerInfo;
                            //res.send(details);
                            //console.log(details.Details[0].CustomerName[0]);
                            console.log('meter> ' + meter);
                            console.log('AccountNumber> ' + details.Details[0].AccountNumber[0]);
                            if(details.Details[0].AccountNumber[0] == meter){
                                //get value of pin
                                voucher.utilize(pin, details.Details[0].AccountNumber[0], function(err, value) {
                                    if(err) {
                                        res.send('We are unable to confirm your PIN. Please check it and try again.');
                                    }else if(value == 0){
                                        res.send('The PIN you are attempting to use is not valid. Please use a different PIN.');
                                    } else {
                                        //new set of arguments
                                        var args2 = {
                                            'tns:CustomerCategory': 'PostPaid',
                                            'tns:CustomerName': details.Details[0].CustomerName[0],
                                            'tns:authuser': uname,
                                            'tns:authpwd': pwd,
                                            'tns:AccountNumber': details.Details[0].AccountNumber[0],
                                            'tns:TransRef': pin,
                                            'tns:EReceipt': details.Details[0].EReceipt[0],
                                            'tns:Zone': details.Details[0].Zone[0],
                                            'tns:district': details.Details[0].BusinessUnit[0],
                                            'tns:pymtRef': pin,
                                            'tns:Channel': 2,
                                            'tns:MeterNum': meter,
                                            'tns:AmountPaid': value-100,
                                            'tns:TransDate': xsdDateTime(new Date()),
                                            'tns:ConvenienceFee': 100,
                                            'tns:AmountRemitted': value-100
                                        };
                                        
                                        console.log(args2);
                                        
                                        client.Service.ServiceSoap.logTransactions(args2, function(e, r) {
                                            if(e){
                                                console.log(e);
                                            }else{
                                                var status = r.logTransactionsResult[0];
                                                var s = {};
                                                if(status == '1'){
                                                    s.status = 'ok';
                                                    s.ereceipt = details.Details[0].EReceipt[0];
                                                    s.amount = value;
                                                    console.log(s);
                                                    
                                                    var m2txt = 'Your electricty bills payment of N' + value + '.00 for account no.' + meter +'  was successful. payment ref ' + s.ereceipt + '.Thank you for choosing PrepayGo';
                                                    
                                                    //send sms
                                                    res.send(m2txt);
                                                    
                                                    //log transaction
                                                    logger.voucherPayment(details, pin, meter, value);
                                                } else if(status == '2') {
                                                    res.send('Please check your account number and try again');
                                                } else if(status == '3') {
                                                    res.send('The specified ereceipt has been used for another account. Please try again.');
                                                }else if(status == '4') {
                                                    res.send('Wrong customer category. Please try again.');
                                                }
                                                console.log(r);
                                                res.send('Unexpected result. Please try again later.');
                                                
                                            }
                                        });
                                    }
                                });    
                            } else {
                                res.send('invalid meter');
                            }
                            
                        }
                    });
                }
            });
        }
    });
    
    
    
}

exports.ibadanViaSms = ibadanViaSms;