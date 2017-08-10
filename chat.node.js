//require
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var camellia = require('./lib/camellia.js');
var K;

app.set('port', (process.env.PORT || 5000)); //heroku

//route all files individually
app.get('/iso-r', function(req, res){
	res.sendFile(__dirname + '/img/iso-r.png');
});

app.get('/iso-m', function(req, res){
	res.sendFile(__dirname + '/img/iso-m.png');
});

app.get('/menu.png', function(req, res){
	res.sendFile(__dirname + '/img/menu.png');
});

app.get('/default', function(req, res){
	res.sendFile(__dirname + '/img/default.png');
});

app.get('/alert.mp3', function(req, res){
	res.sendFile(__dirname + '/alert.mp3');
});

app.get('/jquery-2.2.3.min.js', function(req, res){
	res.sendFile(__dirname + '/lib/jquery-2.2.3.min.js');
});

app.get('/socket.io-1.4.5.js', function(req, res){
	res.sendFile(__dirname + '/lib/socket.io-1.4.5.js');
});

app.get('/linkify.min.js', function(req, res){
	res.sendFile(__dirname + '/lib/linkify.min.js');
});

app.get('/linkify-html.min.js', function(req, res){
	res.sendFile(__dirname + '/lib/linkify-html.min.js');
});

app.get('/', function(req, res){
	console.log(req.connection.remoteAddress);
	res.sendFile(__dirname + '/chat.html');
});

app.get('/chat.css', function(req, res){
	res.sendFile(__dirname + '/chat.css');
});

app.get('/chat.js', function(req, res){
	res.sendFile(__dirname + '/chat.js');
});

//mechanics
io.on('connection', function(socket){
	var mdata = fs.readFileSync(__dirname + '/log/chatlog.txt').toString().slice(0,-1);
	var marr = mdata.split('%').slice(-10),mstring='';
	marr.forEach(function(e){
		mstring += (e == '' ? '' : decrypt(e)) + '%';
	});
	socket.emit('msg_load',mstring);
	socket.on('msg_send',function(msg){
		var m = validate(msg.decodeHex()).encodeHex();
		var mdata = fs.readFileSync(__dirname + '/log/chatlog.txt');
		mdata += encrypt(m) + '%';
		fs.writeFile(__dirname + '/log/chatlog.txt', mdata, function(err){
			if(err){
				console.log(err);
			}else{
				io.emit('msg_send',m);
			}
		});
	});
	socket.on('sign_in', function(name){
		var odata = fs.readFileSync(__dirname + '/log/online.txt');
		odata += name + '%';
		fs.writeFile(__dirname + '/log/online.txt', odata, function(err){
			if(err){
				console.log(err);
			}else{
				io.emit('sign_in', odata.slice(0,-1));
			}
		});
	});
	for(var i = 0; i < 2; i++){
		socket.on(i == 0 ? 'disconnect' : 'name_change', function(){
			K = [];
			fs.writeFile(__dirname + '/log/online.txt', '', function(err){
				if(err){
					console.log(err);
				}else{
					io.emit('beat','ping');
				}
			});
		});
	}
	socket.on('sign_out',function(pong){
		var p = pong.split('%');
		if(p[0] == 'pong'){
			if(K.indexOf(socket.id) == -1){
				K.push(socket.id);
				var odata = fs.readFileSync(__dirname + '/log/online.txt');
				odata += p[1] + '%';
				fs.writeFileSync(__dirname + '/log/online.txt', odata);
				io.emit('sign_in', odata.slice(0,-1));
			}
		}
	});
});

//heroku port
http.listen(app.get('port'), function(){
  console.log('listening');
});

//utility functions
function validate(json_string){
	var O = JSON.parse(json_string);
	if(!O.name || O.name == ''){
		O.name = 'invalid name';
	}
	if(!O.pic || !(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)|default/g).test(O.pic)){
		O.pic = 'default';
	}
	if(!O.background || !(/((#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\)))( url\(['"](http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)|default)['"]\))?/g).test(O.background)){
		O.background = '#c4c4c4';
	}
	if(!O.style || !(/font:[0-z ,-]*;color:((#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\)));/g).test(O.style)){
		O.style = 'font:12px Arial, Sans-Serif;color:#444444;';
	}
	return JSON.stringify(O);
}

function encrypt(json_string){
	var O = JSON.parse(json_string.decodeHex());
	O.text = camellia.ctr.encrypt(O.text, '788e72745f2c87d9c55a5503a2821af6cd9eac86e40fb892ed925c019d356dea');
	return JSON.stringify(O).encodeHex();
}

function decrypt(json_string){
	var O = JSON.parse(json_string.decodeHex());
	O.text = camellia.ctr.decrypt(O.text, '788e72745f2c87d9c55a5503a2821af6cd9eac86e40fb892ed925c019d356dea');
	return JSON.stringify(O).encodeHex();
}

String.prototype.encodeHex=function(){
	var t=unescape(encodeURIComponent(this)),r='';
	while(t.length>0){
		r+=('00'+t.charCodeAt(0).toString(16)).slice(-2);
		t=t.slice(1);
	}
	return r;
};

String.prototype.decodeHex=function(){
	var t=this,r='';
	while(t.length>0){
		r+=String.fromCharCode(parseInt(t.slice(0,2),16));
		t=t.slice(2);
	}
	return decodeURIComponent(escape(r));
};