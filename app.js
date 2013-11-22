
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var mongoose = require('mongoose');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/ip', routes.ip);
app.get('/landing', routes.landing);
app.get('/once', routes.once);
app.get('/reg', routes.reg);
app.get('/reset', routes.reset);
//app.get('/users', user.list);


app.get('/validateMeter', routes.validate);
app.get('/utilize', routes.utilize);
app.get('/payWithVoucher', routes.payWithVoucher);
app.get('/payViaSms', routes.payViaSms);

app.get('/vouchers', routes.vouchers);
app.get('/vAdmin', routes.vAdmin);

app.post('/payViaSms', routes.payViaSms);
app.post('/iswIbPostpaid', routes.iswIbPostpaid);
app.post('/generate', routes.generate);

http.createServer(app).listen(app.get('port'), function(){
    mongoose.connect('mongodb://nodejitsu_johnthas:o56jk26qemf6js2v0dsa70plir@ds045978.mongolab.com:45978/nodejitsu_johnthas_nodejitsudb5477107579');
  console.log('Express server listening on port ' + app.get('port'));
});
