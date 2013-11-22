var util = require('util');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var dburl = undefined;
var moment = require('moment');

var PNRSchema = mongoose.Schema({
    AlternateCustReference: String,
    Amount: Number,
    BankCode: String,
    BankName: String,
    BranchName: String,
    ChannelName: String,
    CollectionsAccount: String,
    CustReference: String,
    CustomerName: String,
    CustomerPhoneNumber: String,
    DepositSlipNumber: String,
    FeeName: String,
    InstitutionId: String,
    InstitutionName: String,
    IsReversal: Boolean,
    Location: String,
    OtherCustomerInfo: String,
    PaymentCurrency: String,
    PaymentDate: String,
    PaymentLogId: String,
    PaymentMethod: String,
    PaymentReference: String,
    PaymentStatus: String,
    ProductGroupCode: String,
    ReceiptNo: String,
    SettlementDate: String,
    createdAt: Date
});

var PNR = mongoose.model('PNR', PNRSchema);

exports.create = function(obj, cb) {
    var pnr = new PNR();
    
    pnr.AlternateCustReference = obj.AlternateCustReference;
    pnr.Amount = parseFloat(obj.Amount);
    pnr.BankCode = obj.BankCode;
    pnr.BankName = obj.BankName;
    pnr.BranchName = obj.BranchName;
    pnr.ChannelName = obj.ChannelName;
    pnr.CollectionsAccount = obj.CollectionsAccount;
    pnr.CustReference = obj.CustReference;
    pnr.CustomerName = obj.CustomerName;
    pnr.CustomerPhoneNumber = obj.CustomerPhoneNumber;
    pnr.DepositSlipNumber = obj.DepositSlipNumber;
    pnr.FeeName = obj.FeeName;
    pnr.InstitutionId = obj.InstitutionId;
    pnr.InstitutionName = obj.InstitutionName;
    pnr.IsReversal = (obj.IsReversal == 'True');
    pnr.Location = obj.Location;
    pnr.OtherCustomerInfo = obj.OtherCustomerInfo;
    pnr.PaymentCurrency = obj.PaymentCurrency;
    pnr.PaymentDate = obj.PaymentDate;
    pnr.PaymentLogId = obj.PaymentLogId;
    pnr.PaymentMethod = obj.PaymentMethod;
    pnr.PaymentReference = obj.PaymentReference;
    pnr.PaymentStatus = obj.PaymentStatus;
    pnr.ProductGroupCode = obj.ProductGroupCode;
    pnr.ReceiptNo = obj.ReceiptNo;
    pnr.SettlementDate = obj.SettlementDate;
    pnr.createdAt = new Date();
    
    pnr.save(function(err) {
        if(err) {
            cb(err);
        } else {
            cb(null);
        }
    });
}

exports.findByPaymentLogId = function(PaymentLogId, cb) {
    PNR.findOne({PaymentLogId: PaymentLogId}, function(err, doc) {
        if(err) {
            cb(err, null);
        } else {
            if(doc) {
                cb(null, doc);
            } else {
                cb(null, null);
            }
        }
    });
}