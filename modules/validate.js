var soap = require('soap');
var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var util = require('util');

//test
/*
var ibUrl = 'http://50.63.173.81/ibedc/service.asmx?WSDL';
var uname = 'ufugi384igi';
var pwd = '74djgg9d7fu';
*/

//production

var ibUrl = 'http://50.63.116.157/ibedcaggregator/service.asmx?WSDL';
var uname = 'ppg958tyg375';
var pwd = 'udur43829djgp';

function ibadan(meter, res) {
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
                            res.send(details);
                            //console.log(details.Details[0].CustomerName[0]);
                        }
                    });
                }
            });
        }
    });
    
    
    
}

exports.ibadan = ibadan;