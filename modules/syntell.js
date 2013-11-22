var soap = require('soap');
var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var util = require('util');

var url = 'http://ppg.ngrok.com/SyntellWL/VendingService?wsdl';

exports.validate = function(meter, res) {
    var args = {
        'serialNo': meter
    };
    
    soap.createClient(url, function(err, client) {
        if(err) {
            console.log('error object returned');
            res.send({});
        } else {
            console.log('success creating client');
            
            client.VendingService.VendingServicePort.verifyMeter(args, function(err, result) {
                if(err) {
                    console.log(err);
                    res.send({});
                } else {
                    console.log(result);
                    console.log(result.return[0]);
                    var r = result.return[0];
                    console.log(r.address[0]);
                    console.log(r.customer[0]);
                    console.log(r.maxVend[0]);
                    console.log(r.minVend[0]);
                    res.send(r);
                }
            });
        }
    });
}

exports.pay = function(meter, value, res, cb) {
    var args = {
        'serialNo': meter,
        'amount': value
    };
    
    soap.createClient(url, function(err, client) {
        if(err) {
            console.log('error object returned');
            res.send({});
        } else {
            console.log('success creating client');
            
            client.VendingService.VendingServicePort.verifyMeter({'serialNo': meter}, function(err, result) {
                if(err) {
                    console.log(err);
                    res.send({});
                } else {
                    
                    var r = result.return[0];
                    console.log(r.address[0]);
                    console.log(r.customer[0]);
                    console.log(r.maxVend[0]);
                    console.log(r.minVend[0]);
                    
                    if( (parseFloat(value) >= parseFloat(r.minVend[0])) && (parseFloat(value) <= parseFloat(r.maxVend[0])) ) {
                        client.VendingService.VendingServicePort.purchaseToken(args, function(e, r) {
                            if(e) {
                                console.log(e);
                                res.send({});
                                cb(e, null, null);
                            } else {
                                var s = r.return[0];
                                var t = {
                                    status: 'Vend Successful',
                                    ereceipt: s.token[0],
                                    amount: value
                                };
                                res.send(t);
                                cb(null, true, s.token[0]);
                            }
                        });
                    } else {
                        res.send('Your purchase amount is not within the purchase limit of ' + r.minVend[0] + ' and ' + r.maxVend[0]);
                    }
                }
            });
        }
    });
}