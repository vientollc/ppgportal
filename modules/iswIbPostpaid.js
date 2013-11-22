var xmljs = require('xml2js');
var parser = new xmljs.Parser();
var jsonxml = require('jsontoxml');
var soap = require('soap');
var logger = require('./logger.js');
var PNR = require('../models/pnr');
var txnHandler = require('../modules/txnHandler');
var sms = require('../modules/sms');

//test
/*
var merchant = '3925';
var ip = '41.223.145.177';
*/

//prod

var merchant = '3892';
var ip = '41.223.145.174';



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


module.exports = function(req, res) {
    console.log(req.connection.remoteAddress);
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.write('<?xml version="1.0" encoding="utf-8"?>');
    
    var postData = '';
    
    req.setEncoding('utf8');
        
    req.addListener('data', function(postDataChunk) {
        postData += postDataChunk;
    }).on('end', function() {
        //convert xml data to json
        if(postData.length > 0) {
            console.log(postData);
            parser.parseString(postData, function(error, result) {
                if(error) {
                    //error processing xml body, reply accordingly
                    console.log(error.message);
                } else {
                    //log request
                    logger.iswRequest(result);
                    if('CustomerInformationRequest' in result) {
                        //CustomerInformationRequest
                        var obj = result.CustomerInformationRequest;
                        
                        //check for merchant code
                        if(obj.MerchantReference[0] == merchant) {
                            var cr = obj.CustReference[0];
                            
                            //validate reference
                            var args = {
                                'tns:authuser': uname,
                                'tns:authpwd': pwd,
                                'tns:AccountNumber': cr
                            };
                            
                            soap.createClient(ibUrl, function(err, client) {
                                if(err) {
                                    var out = cResp(merchant, '1', '', '', '', '');
                                    
                                    var xml = jsonxml(out);
                                    res.write(xml);
                                    res.end();
                                } else {
                                    client.Service.ServiceSoap.getCustomerInfo(args, function(err, result) {
                                        if(err) {
                                            var out = cResp(merchant, '1', '', '', '', '');
                                            
                                            var xml = jsonxml(out);
                                            res.write(xml);
                                            res.end();
                                        } else {
                                            var parser2 = new xmljs.Parser();
                                            parser2.parseString(result.getCustomerInfoResult, function(err, result) {
                                                if(err) {
                                                    var out = cResp(merchant, '1', '', '', '', '');
                                                    
                                                    var xml = jsonxml(out);
                                                    res.write(xml);
                                                    res.end();
                                                } else {
                                                    var details = result.CustomerInfo;
                                                    //console.log(details.Details[0]);
                                                    if(details.Details[0].AccountNumber[0] == cr) {
                                                        var out = cResp(merchant, '0', details.Details[0].AccountNumber[0], 'Account Number', details.Details[0].CustomerName[0], '0');
                                                        
                                                        var xml = jsonxml(out); console.log(xml);
                                                        res.write(xml);
                                                        res.end();
                                                    } else {
                                                        var out = cResp(merchant, '2', '', '', '', '');
                                                        
                                                        var xml = jsonxml(out);
                                                        res.write(xml);
                                                        res.end();
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                            
                            
                        } else {
                            var out = cResp(merchant, '1', '', '', '', '');
                            
                            var xml = jsonxml(out);
                            res.write(xml);
                            res.end();
                        }
                    } else if(('PaymentNotificationRequest' in result)) {
                        //PaymentNotificationRequest
                        var obj = result.PaymentNotificationRequest;
                        var p = obj.Payments[0].Payment[0];
                        
                        var ProductGroupCode = p.ProductGroupCode[0];
                        var PaymentLogId = p.PaymentLogId[0];
                        var CustReference = p.CustReference[0];
                        var AlternateCustReference = p.AlternateCustReference[0];
                        var Amount = p.Amount[0];
                        var PaymentStatus = p.PaymentStatus[0];
                        var PaymentMethod = p.PaymentMethod[0];
                        var PaymentReference = p.PaymentReference[0];
                        var ChannelName = p.ChannelName[0];
                        var Location = p.Location[0];
                        var IsReversal = p.IsReversal[0];
                        var PaymentDate = p.PaymentDate[0];
                        var SettlementDate = p.SettlementDate[0];
                        var InstitutionId = p.InstitutionId[0];
                        var InstitutionName = p.InstitutionName[0];
                        var BranchName = p.BranchName[0];
                        var BankName = p.BankName[0];
                        var FeeName = p.FeeName[0];
                        var CustomerName = p.CustomerName[0];
                        var OtherCustomerInfo = p.OtherCustomerInfo[0];
                        var ReceiptNo = p.ReceiptNo[0];
                        var CollectionsAccount = p.CollectionsAccount[0];
                        var BankCode = p.BankCode[0];
                        var CustomerPhoneNumber = p.CustomerPhoneNumber[0];
                        var DepositSlipNumber = p.DepositSlipNumber[0];
                        var PaymentCurrency = p.PaymentCurrency[0];
                        
                        var pnr = {
                            'ProductGroupCode': ProductGroupCode,
                            'PaymentLogId': PaymentLogId,
                            'CustReference': CustReference,
                            'AlternateCustReference': AlternateCustReference,
                            'Amount': Amount,
                            'PaymentStatus': PaymentStatus,
                            'PaymentMethod': PaymentMethod,
                            'PaymentReference': PaymentReference,
                            'ChannelName': ChannelName,
                            'Location': Location,
                            'IsReversal': IsReversal,
                            'PaymentDate': PaymentDate,
                            'SettlementDate': SettlementDate,
                            'InstitutionId': InstitutionId,
                            'InstitutionName': InstitutionName,
                            'BranchName': BranchName,
                            'BankName': BankName,
                            'FeeName': FeeName,
                            'CustomerName': CustomerName,
                            'OtherCustomerInfo': OtherCustomerInfo,
                            'ReceiptNo': ReceiptNo,
                            'CollectionsAccount': CollectionsAccount,
                            'BankCode': BankCode,
                            'CustomerPhoneNumber': CustomerPhoneNumber,
                            'DepositSlipNumber': DepositSlipNumber,
                            'PaymentCurrency': PaymentCurrency
                        };
                        
                        //reversal?
                        if(pnr.IsReversal == 'False') {
                            //does the PaymentLogId exist?
                            PNR.findByPaymentLogId(pnr.PaymentLogId, function(err, doc) {
                                if(err) {
                                    console.log(err);
                                } else {
                                    if(doc) {
                                        // PaymentLogId exists, treat accordingly
                                        
                                        //if amount is the same, assume repeat notification and send success
                                        if(doc.Amount == parseFloat(pnr.Amount)) {
                                            //
                                            var out = pResp(pnr.PaymentLogId, '', '0');
                                            var xml = jsonxml(out);
                                            res.write(xml);
                                            res.end();
                                        } else {
                                            //invalid transaction. different amounts not allowed
                                            var out = pResp(pnr.PaymentLogId, '', '1');
                                            var xml = jsonxml(out);
                                            res.write(xml);
                                            res.end();
                                        }
                                        
                                    } else {
                                        // unique transaction
                                        
                                        //check that amount is positive
                                        if(parseFloat(pnr.Amount) > 0) {
                                            //validate meter
                                            txnHandler.validateIbadan(ibUrl, uname, pwd, pnr.CustReference, function(err, details, dets) {
                                                if(err) {
                                                    var out = pResp(pnr.PaymentLogId, '', '1');
                                                    var xml = jsonxml(out);
                                                    res.write(xml);
                                                    res.end();
                                                } else {
                                                    if(pnr.CustReference == details.AccountNumber[0]) {
                                                        //valid meter
                                                        var ereceipt = details.EReceipt[0];
                                                        var zone = details.Zone[0];
                                                        var bu = details.BusinessUnit[0];
                                                        
                                                        //make payment
                                                        txnHandler.payIbadan(ibUrl, uname, pwd, pnr.CustReference, parseFloat(pnr.Amount), ereceipt, pnr.PaymentLogId, pnr.CustomerName, zone, bu, function(err, result) {
                                                            if(err) {
                                                                var out = pResp(pnr.PaymentLogId, '', '1');
                                                                var xml = jsonxml(out);
                                                                res.write(xml);
                                                                res.end();
                                                            } else {
                                                                if(result) {
                                                                    var r = '1';
                                                                    if(result == '1') {
                                                                        r = '0';
                                                                        PNR.create(pnr, function(e, r) {});
                                                                        
                                                                        var m2txt = 'Your electricty bills payment of N' + pnr.Amount + '.00 for account no.' + pnr.CustReference +'  was successful. payment ref ' + ereceipt + '.Thank you for choosing PrepayGo';
                                                    
                                                                        //send sms
                                                                        sms.message(pnr.CustomerPhoneNumber, m2txt);
                                                                        
                                                                        //log transaction
                                                                        logger.voucherPayment(dets, pnr.PaymentLogId, pnr.CustReference, pnr.Amount);
                                                                    }
                                                                    var out = pResp(pnr.PaymentLogId, ereceipt, r);
                                                                    var xml = jsonxml(out);
                                                                    res.write(xml);
                                                                    res.end();
                                                                } else {
                                                                    var out = pResp(pnr.PaymentLogId, '', '1');
                                                                    var xml = jsonxml(out);
                                                                    res.write(xml);
                                                                    res.end();
                                                                }
                                                            }
                                                        }) ;
                                                    } else {
                                                        //invalid meter
                                                        var out = pResp(pnr.PaymentLogId, '', '1');
                                                        var xml = jsonxml(out);
                                                        res.write(xml);
                                                        res.end();
                                                    }
                                                }
                                            });
                                        } else {
                                            //invalid transaction. negative amounts not allowed
                                            var out = pResp(pnr.PaymentLogId, '', '1');
                                            var xml = jsonxml(out);
                                            res.write(xml);
                                            res.end();
                                        }
                                    }
                                }
                            });
                        }
                    }
                    
                }
            });
        } else {
            //empty body. reply accordingly
        }
        
    });
};

function cResp(merchant, status, cRef, crDesc, fName, amount) {
    var out = {
        'CustomerInformationResponse': {
            'MerchantReference': merchant,
            'Customers': {
                'Customer': {
                    'Status': status,
                    'CustReference': cRef,
                    'CustomerReferenceAlternate': '',
                    'CustomerReferenceDescription': crDesc,
                    'FirstName': fName,
                    'LastName': '',
                    'OtherName': '',
                    'Email': '',
                    'Phone': '',
                    'Amount': amount
                }
            }
        }
    };
    
    return out;
};

function pResp(id, token, status) {
    var out = {
        'PaymentNotificationResponse': {
            'Payments': {
                'Payment': {
                    'PaymentLogId': id,
                    'Token': token,
                    'Status': status
                }
            }
        }
    };
    
    return out;
}