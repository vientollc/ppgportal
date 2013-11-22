var url = require('url');
var querystring = require('querystring');
var validateMeter = require('../modules/validate.js');
var utilizeVoucher = require('../modules/voucher.js');
var pay = require('../modules/pay.js');
var iswIbPostpaid = require('../modules/iswIbPostpaid.js');
var voucher = require('../modules/voucher');
var momas = require('../modules/momas.js');
var Voucher = require('../models/voucher');
var sms = require('../modules/sms');
var syntell = require('../modules/syntell');

/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Prepaygo Portal' });
};

exports.ip = function(req, res) {
    res.send(req.connection.remoteAddress);
}

/*
 * GET landing page. after login
 */
exports.landing = function(req, res){
  res.render('landing', { title: 'Prepaygo Portal' });
};

/*
 * GET once page. for transactions without login
 */
exports.once = function(req, res){
  res.render('once', { title: 'Prepaygo Portal' });
};

/*
 * GET registration page.
 */
exports.reg = function(req, res){
  res.render('reg', { title: 'Prepaygo Portal' });
};

/*
 * GET vouchers login page
*/

exports.vouchers = function(req, res) {
    res.render('vouchers');
}

/*
 * GET vouchers admin page
*/

exports.vAdmin = function(req, res) {
    res.render('vAdmin');
}

/*
 * GET password reset page.
 */
exports.reset = function(req, res){
  res.render('reset', { title: 'Prepaygo Portal' });
};

/*
 * GET meter validation
 */
exports.validate = function(req, res){
    console.log('validate called');
    
    var disco = querystring.parse(url.parse(req.url).query).disco;
    var type = querystring.parse(url.parse(req.url).query).type;
    var meter = querystring.parse(url.parse(req.url).query).meter;
    
    if(disco == 'ib') {
        validateMeter.ibadan(meter, res);
    } else if(disco == 'eg') {
        momas.validate(meter, type, res);
    } else if(disco == 'fct') {
        syntell.validate(meter, res);
    }
};

/*
 * utilize a voucher
 */
exports.utilize = function(req, res) {
    var pin = querystring.parse(url.parse(req.url).query).pin;
    
    utilizeVoucher.utilize(pin, function(err, value) {
        var result = {};
        if(err) {
            result.response = err;
            result.value = 0;
        }else {
            result.response = 'ok';
            result.value = value;
        }
        res.send(result);
    });
};

exports.payWithVoucher = function(req, res) {
    var disco = querystring.parse(url.parse(req.url).query).disco;
    var type = querystring.parse(url.parse(req.url).query).type;
    var meter = querystring.parse(url.parse(req.url).query).meter;
    var pin = querystring.parse(url.parse(req.url).query).pin;
    var phone = querystring.parse(url.parse(req.url).query).phone;
    
    if(disco == 'ib') {
        pay.ibadanWithVoucher(meter, pin, phone, res);
    } else if(disco == 'eg') {
        Voucher.read(pin, function(err, doc) {
            if(err) {
                res.send('Cannot validate PIN at this time. Please try again. Thanks for using Prepaygo.')
            } else {
                console.log(doc);
                if('status' in doc) {
                    if(doc.status == 'active') {
                        momas.pay(meter, type, doc.value, res, function(e, r, t) {
                            if(e) {
                                
                            } else {
                                if(r == true) {
                                    Voucher.update(pin, 'used', meter, function(a,b) {
                                        if(a) {
                                            console.log('unable to update voucher status');
                                        } else {
                                            console.log('voucher updated successfully');
                                            //send sms
                                            var m2txt = 'Your electricty bills payment of N' + doc.value + '.00 for meter no.' + meter +'  was successful. Token: ' + t + '.Thank you for choosing PrepayGo';
                                                    
                                            //send sms
                                            sms.message(phone, m2txt);
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        res.send('Invalid PIN. Please try again. Thanks for using Prepaygo.')
                    }
                } else {
                    res.send('Invalid PIN. Please check the PIN and try again. Thanks for using Prepaygo.')
                }
            }
        });
    } else if(disco == 'fct') {
        Voucher.read(pin, function(err, doc) {
            if(err) {
                res.send('Cannot validate PIN at this time. Please try again. Thanks for using Prepaygo.')
            } else {
                console.log(doc);
                if('status' in doc) {
                    if(doc.status == 'active') {
                        syntell.pay(meter, doc.value, res, function(e, r, t) {
                            if(e) {
                                
                            } else {
                                if(r == true) {
                                    Voucher.update(pin, 'used', meter, function(a,b) {
                                        if(a) {
                                            console.log('unable to update voucher status');
                                        } else {
                                            console.log('voucher updated successfully');
                                            //send sms
                                            var m2txt = 'Your electricty bills payment of N' + doc.value + '.00 for meter no.' + meter +'  was successful. Token: ' + t + '.Thank you for choosing PrepayGo';
                                                    
                                            //send sms
                                            sms.message(phone, m2txt);
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        res.send('Invalid PIN. Please try again. Thanks for using Prepaygo.')
                    }
                } else {
                    res.send('Invalid PIN. Please check the PIN and try again. Thanks for using Prepaygo.')
                }
            }
        });
    }
};

exports.payViaSms = function(req, res) {
    var sourceaddr = querystring.parse(url.parse(req.url).query).SOURCEADDR;
    var destaddr = querystring.parse(url.parse(req.url).query).DESTADDR;
    var message = querystring.parse(url.parse(req.url).query).MESSAGE;
    var trx = querystring.parse(url.parse(req.url).query).TRX;
    
    var parts = message.split(' ');
    
    if((parts[0].toLowerCase() == 'phcnib') && (parts.length == 3)) {
        pay.ibadanViaSms(parts[2], parts[1], res);
    } else if((parts[0].toLowerCase() == 'phcneg') && (parts.length == 4)) {
        
    } else {
        res.send('Invalid message format. Send phcnib PIN account. Thanks for using Prepaygo Technologies.');
    }
};

/*
* POST ISW
*/
exports.iswIbPostpaid = function(req, res) {
    new iswIbPostpaid(req, res);
};

exports.generate = function(req, res) {
    var quantity = req.body.vq; console.log(quantity);
    var value = req.body.va; console.log(value);
    
    voucher.generate(quantity, value, res);
}