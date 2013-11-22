var $ = require('jquery');

function message(phone, message){
    var url = 'http://41.206.23.36:8080/BulkSms/SendQuickMessageAPI';
    var args = {
        'header': 'PREPAYGO',
        'message': message,
        'username': 'prepaygo',
        'password': '12345',
        'phone': phone
    };
    
    $.get(url, args, function(res, textStatus, xhr) {
        if(res) {
            console.log(res);
        }else{
            console.log(textStatus);
        }
    });
}

exports.message = message;