'use strict';

var Voucher = require('../models/voucher');
var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var jsonxml = require('jsontoxml');
var sys = require('util');
var fs = require('fs');
var rest = require('restler');

var uri = 'mongodb://nodejitsu_johnthas:o56jk26qemf6js2v0dsa70plir@ds045978.mongolab.com:45978/nodejitsu_johnthas_nodejitsudb5477107579';

function utilize(pin, callback) {
    MongoClient.connect(uri, function(err, db) {
        if(err) {
            callback(err, 0);
        } else {
            var collection = db.collection('ppg');
            var cursor = collection.findOne({pin: pin}, function(err, item) {
                if(err) {
                    callback(err, 0);
                }else{
                    if(item){
                        if(item.status == 'active'){
                            callback(null, item.value);
                            item.status = 'used';
                            //mark voucher as used
                            collection.update({pin:pin}, item, function(e, r) {
                                console.log('pin %s was utilized', pin);
                            });
                        }else{
                            callback(null, 0);
                        }
                    }else{
                        callback(null, 0);
                    }
                    
                    
                }
            });
        }
    });
}

exports.utilize = function(pin, user, cb) {
    Voucher.read(pin, function(err, doc){
        if(err) {
            cb(err, 0);
        } else {
            if(doc) {
                if(doc.status == 'active') {
                    cb(null, doc.value);
                    Voucher.update(pin, 'used', user, function(err) {
                        if(err) {
                            console.log('could not mark pin as used');
                        } else {
                            console.log('pin marked as used');
                        }
                    });
                } else {
                    cb(null, 0);
                }
            } else {
                cb(null, 0);
            }
        }
    });
}

exports.generate = function(quantity, value, res) {
    console.log(quantity);
    console.log(value);
    var batch = moment().format('MMDDYYYYHHmmss');
    var pins = [];
    var pinTable = {
        table: []
    };
    pinTable.table.push({
        tr: [
            {td: 'Batch'},
            {td: 'PIN'},
            {td: 'Serial'},
            {td: 'Value'}
        ]
    });
    var pins2 = [];
    
    while( pins.length < quantity) {
        var pin = '';
        for(var j=0; j < 12; j++) {
            pin += Math.floor(Math.random() * 10);
        }
        
        pins.push(pin);
    }
    console.log('%d pins created', pins.length);
    
    //check database for same pin
    
    for(var i=0; i<pins.length; i++) {
        Voucher.create(batch, pins[i], batch + i, 'inactive', value, function(err, p) {
            if(err) {
                //do nothing
                console.log('error creating PIN in database');
                console.log(err.message);
            } else {
                pins2.push(p);
                pinTable.table.push({
                    tr: [
                        {td: batch},
                        {td: p},
                        {td: batch + i},
                        {td: value}
                    ]
                }); 
                
                if(pins2.length == quantity) {
                    console.log(pinTable);
                    var xml = jsonxml(pinTable);
                    console.log(xml);
                    rest.postJson('http://docraptor.com/docs', {
                        user_credentials: 'kV3J11cLziImLTyUoO',
                        doc: {
                            document_content: xml,
                            name: batch + '.xls',
                            document_type: 'xls',
                            tag: 'PrepayGo'
                        }
                    }).on('success', function(data, response) {
                        var raw = response.raw;
                        console.log('success creating document');
                        //res.setTimeout(60000);
                        //res.writeHead(200, {'Content-Type': 'application/vnd.ms-excel'});
                        res.write(raw);
                        res.end();
                    }).on('fail', function(data, response) {
                        console.log('Failure creating Document');
                        console.log(data);
                        res.end();
                    }).on('error', function(err, response) {
                        console.log('Error Creating Document');
                        console.log(err);
                        res.end();
                    });
                } else {
                    //need to generate more
                }
            }
        });
    }
    
}