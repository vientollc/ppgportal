var util = require('util');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var dburl = undefined;
var moment = require('moment');

var PaymentSchema = mongoose.Schema({});

var Payment = mongoose.model('Payment', PaymentSchema);