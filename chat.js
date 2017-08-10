var MOUSE = 0,socket,notif = document.createElement('audio');
notif.src = 'alert.mp3';

window.onload=function(){
	$(document).ready(function(){
		$(window).unload(function(){
			localStorage.removeItem('k');
		});
		$('body>*').css('left',(innerWidth-632)/2+'px');
		$(online).css('left',(innerWidth-632)/2+$(m).width()+5+'px');
		$('#m,#online').css('top',(innerHeight-600)/2+'px');
		$('body>.message').css('top',(innerHeight-600)/2+$(m).height()+5+'px');
		validate();
		if(!localStorage.k || (new Date()).getTime() - parseInt(localStorage.k) >= 6e5){
			localStorage.k = (new Date()).getTime();
		}else if((new Date()).getTime() - parseInt(localStorage.k) < 6e5){
			clearInterval(tick);
			document.write('You are already signed in');
		}
		$(preview).find('.name').text(localStorage.chatName);
		$(preview).find('#avi').attr('src',localStorage.chatPic);
		$(preview).css('background',localStorage.chatBack);
		$(preview).css('box-shadow','0 0 5px '+localStorage.chatBack);
		$('#preview textarea').css('font', localStorage.textStyle.split(';')[0].split(':')[1]);
		$('#preview textarea').css('color', localStorage.textStyle.split(';')[1].split(':')[1]);
		$(opt).on('click',function(){
			if($('#opt-menu').length==0){
				displayOptions();
			}else{
				hideOptions();
			}
		});
		socket = io();
		socket.emit('sign_in',localStorage.chatName.encodeHex());
		$(send).on('keypress',function(e){
			if(e.which==13||e.keyCode==13||e.charCode==13){
				e.preventDefault();
				if($(send).val()!=''){
					validate();
					var t=new Date();
					var J='{"name":"'+localStorage.chatName+'","pic":"'+localStorage.chatPic+'","text":"'+escape($(send).val())+'","time":"'+t.getTime()+'","background":"'+localStorage.chatBack+'","style":"'+localStorage.textStyle+'"}';
					socket.emit('msg_send',J.encodeHex());
					$(send).val('');
				}
			}
		}).on('keyup',function(e){
			if(e.which==13||e.keyCode==13||e.charCode==13){
				$(send).val('');
			}
		});
		socket.on('beat',function(ping){
			socket.emit('sign_out','pong%'+localStorage.chatName.encodeHex());
		});
		socket.on('sign_in',function(o){
			$('#online').html('');
			var L = o.split('%').sort(function(a,b){
				var l = Math.min(a.length,b.length);
				return parseInt(a.slice(0,l),16) - parseInt(b.slice(0,l),16);
			});
			L.forEach(function(e){
				$('#online').append($('<span>').text(e.decodeHex())).append('<br/>');
			});
		});
		socket.on('msg_send',function(msg){
			$(m).append(msg.constructMessage());
			notif.currentTime = 0;
			notif.play();
			m.scrollTop=m.scrollHeight;
		});
		socket.on('msg_load',function(mstring){
			$(m).text("");
			if(mstring!=""){
				mstring.slice(0,-1).split('%').forEach(function(e){
					if(e!='')$(m).append(e.constructMessage());
				});
				setTimeout(function(){m.scrollTop=m.scrollHeight;},100);
			}
		});
	});
};

window.addEventListener('resize', function(){
	$('body>*').css('left',(innerWidth-632)/2+'px');
	$(online).css('left',(innerWidth-632)/2+$(m).width()+5+'px');
	$('#m,#online,#opt-menu').css('top',(innerHeight-600)/2+'px');
	$('body>.message').css('top',(innerHeight-600)/2+$(m).height()+5+'px');
});

var displayOptions = function(){
	var a = $(m).clone(),b,
		mStyle = localStorage.textStyle.split(';')[0].split(':')[1],
		mColor = localStorage.textStyle.split(';')[1].split(':')[1];
	a.attr('id','opt-menu');
	a.html('');
	$(m).css('-webkit-filter','blur(1px)');
	$(m).css('filter','blur(1px)');
	$('body').append(a);
	a.append($('<span>').text('Name:').css('left','26px').css('top','20px'));
	a.append($('<input type="text" placeholder="enter name here" maxlength="64">').val(localStorage.chatName).css('top','48px').attr('id','opt-name'));
	a.append($('<span>').text('Picture:').css('left','26px').css('top','95px'));
	a.append($('<input type="text" placeholder="enter image url" maxlength="256">').val(localStorage.chatPic).css('top','123px').attr('id','opt-pic'));
	a.append($('<img>').attr('src',localStorage.chatPic));
	a.append($('<span>').text('Message:').css('left','26px').css('top','270px'));
	a.append($('<input type="text" placeholder="font style" maxlength="64">').val(mStyle).css('top','298px').attr('id','opt-msg-style'));
	a.append($('<input type="text" placeholder="font color" maxlength="32">').val(mColor).css('top','335px').attr('name','font-color').attr('id','opt-msg-color'));
	a.append($('<div class="color-picker"><div style="height:25px;width:55px;"></div></div>').css('background',mColor).css('top','336px').css('left','273px'));
	a.append($('<span>').text('Background:').css('left','26px').css('top','382px'));
	a.append($('<input type="text" placeholder="background image" maxlength="256">').val(localStorage.chatBack.split(' ').length > 1 ? localStorage.chatBack.split(' ')[1].replace(/(url\(['"]|['"]\))/g, '') : '').css('top','410px').attr('id','opt-bg-image'));
	a.append($('<input type="text" placeholder="background color" maxlength="32">').val(localStorage.chatBack.split(' ')[0]).css('top','447px').attr('id','opt-bg-color'));
	a.append($('<div class="color-picker"><div style="height:25px;width:55px;"></div></div>').css('background',localStorage.chatBack.split(' ')[0]).css('top','448px').css('left','273px'));
	
	$('#opt-name').on('input', function(){
		if($(this).val() != '' && $(this).val().length <= 64 && !(/({|})/g).test($(this).val())){
			$('#preview>.name').text($(this).val());
			localStorage.chatName = $(this).val();
		}else{
			$('#preview>.name').text('invalid');
			localStorage.chatName = 'invalid';
		}
	});
	
	$('#opt-name').on('change', function(){
		$(this).val(localStorage.chatName);
		socket.emit('name_change', localStorage.chatName.encodeHex());
	});
	
	$('#opt-pic').on('change', function(){
		if((/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)|default/g).test($(this).val())){
			var I = new Image();
			I.onerror = function(){
				$('#opt-pic').val(localStorage.chatPic);
			};
			I.onload = function(){
				$('#opt-pic').css('color', '#444');
				$('#opt-menu>img, #avi').attr('src', $('#opt-pic').val());
				localStorage.chatPic = $('#opt-pic').val();
			};
			I.src = $(this).val();
		}else{
			$(this).val(localStorage.chatPic);
		}
	});
	
	$('#opt-msg-style').on('change', function(){
		if((/[^0-z ,-]/g).test($(this).val()) == !1){
			$('#preview textarea').css('font',$(this).val());
			localStorage.textStyle = 'font:' + $(this).val() + ';' + localStorage.textStyle.split(';')[1] + ';';
		}else{
			$(this).val(localStorage.textStyle.split(';')[0].split(':')[1]);
		}
	});
	
	$('#opt-msg-color').on('change', function(){
		if((/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g).test($(this).val()) && $(this).val().match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0] == $(this).val()){
			$('#preview textarea').css('color',$(this).val());
			localStorage.textStyle = localStorage.textStyle.split(';')[0] + ';color:' + $(this).val() + ';';
		}else{
			$(this).val(localStorage.textStyle.split(';')[1].split(':')[1]);
		}
	});
	
	$('#opt-bg-image').on('change', function(){
		if((/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)/g).test($(this).val())){
			var I = new Image();
			I.onerror = function(){
				if(localStorage.chatBack.match(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)/g) == null){
					$('#opt-bg-image').val('');
				}else{
					$('#opt-bg-image').val(localStorage.chatBack.match(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)/g)[0]);
				}
			};
			I.onload = function(){
				$('#preview').css('background-image', 'url("' + $('#opt-bg-image').val() + '")');
				localStorage.chatBack = localStorage.chatBack.match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0] + " url('" + $('#opt-bg-image').val() + "')";
			};
			I.src = $(this).val();
		}else{
			if($(this).val() == ''){
				$(this).val('');
				$('#preview').css('background-image', 'none');
				localStorage.chatBack = localStorage.chatBack.match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0];
			}else if(localStorage.chatBack.match(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)/g) == null){
				$(this).val('');
			}else{
				$(this).val(localStorage.chatBack.match(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)/g)[0]);
			}
		}
	});
	
	$('#opt-bg-color').on('change', function(){
		if((/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g).test($(this).val()) && $(this).val().match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0] == $(this).val()){
			$('#preview').css('background-color', $(this).val());
			$('#preview').css('box-shadow', '0 0 5px ' + $(this).val());
			localStorage.chatBack = localStorage.chatBack.replace(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g, $(this).val());
		}else{
			$(this).val(localStorage.chatBack.match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0]);
		}
	});
	
	$('.color-picker>div').on('click', function(){
		if($('canvas').length == 0){
			showPalette(this.parentNode);
		}else{
			$('canvas').remove();
		}
	});
	
	$('#opt-menu>input[placeholder~=color]').on('change', function(){
		$(this.nextSibling).css('background',$(this).val());
	});
	
	setTimeout(function(){
		$(a).css('opacity','1');
	},50);
}

var hideOptions = function(){
	$('#opt-menu').css('opacity','0');
	setTimeout(function(){
		$('#opt-menu').remove();
		$(m).css('-webkit-filter','');
		$(m).css('filter','');
	},100);
}

var t=new Date();
time.innerHTML=('00'+t.getDate()).slice(-2)+'/'+('00'+(t.getMonth()+1)).slice(-2)+'/'+t.getFullYear().toString().slice(-2)+' '+t.toTimeString().slice(0,8).trim();

var tick=setInterval(function(){
	var t=new Date();
	localStorage.k = t.getTime();
	time.innerHTML=('00'+t.getDate()).slice(-2)+'/'+('00'+(t.getMonth()+1)).slice(-2)+'/'+t.getFullYear().toString().slice(-2)+' '+t.toTimeString().slice(0,8).trim();
},1e3);

String.prototype.constructMessage=function(){
	var d=document,
		s=this.decodeHex(),
		t=JSON.parse(s.slice(0,s.indexOf('}')+1)),
		u=new Date(parseInt(t.time)),
		bColor=t.background.match(/(#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\))/g)[0],
		tStyle=t.style.split(';')[0].split(':')[1],
		tColor=t.style.split(';')[1].split(':')[1],
		M=$('<div class="message">').css('background',t.background).css('box-shadow','0 0 5px '+bColor);
	u=('00'+u.getDate()).slice(-2)+'/'+('00'+(u.getMonth()+1)).slice(-2)+'/'+u.getFullYear().toString().slice(-2)+' '+u.toTimeString().slice(0,8).trim();
	M.append($('<div class="name">').text(t.name));
	M.append($('<img>').attr('src',t.pic));
	M.append($('<span>').text(u));
	M.append($('<div class="text">').text(unescape(t.text)).css('font',tStyle).css('color',tColor));
	var m = $(M).find('.text').html();
	$(M).find('.text').html(linkifyHtml(m));
	return M;
};

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

function showPalette(e){
	var C = $(e).css('background-color').match(/\(.*\)/g)[0].slice(1, -1).replace(/ /g,'').split(','),
		H = getHueRGB(parseInt(C[0]), parseInt(C[1]), parseInt(C[2])),
		shade = $('<canvas width="128" height="128">')[0],
		s = shade.getContext('2d'),
		hue = $('<canvas width="20" height="128">')[0],
		h = hue.getContext('2d'),
		setHue = function(C){
			var a = getHue(parseInt(C[0]), parseInt(C[1]), parseInt(C[2]));
			$(hue).attr('r',C[0]);
			$(hue).attr('g',C[1]);
			$(hue).attr('b',C[2]);
			$(hue).attr('hue', a < 0 ? a + 1 : a);
		},
		getShadesByRGB = function(H){
			var shadeData = s.getImageData(0, 0, shade.width, shade.height);
			for(var i = 0; i < shade.height; i++){
				for(var j = 0; j < shade.width; j++){
					var k = (i * 128 + j) * 4;
					shadeData.data[k] = (H[0] + (j * (255 - H[0]) / 127)) * (1 - (i / 127));
					shadeData.data[k + 1] = (H[1] + (j * (255 - H[1]) / 127)) * (1 - (i / 127));
					shadeData.data[k + 2] = (H[2] + (j * (255 - H[2]) / 127)) * (1 - (i / 127));
					shadeData.data[k + 3] = 255;
				}
			}
			s.putImageData(shadeData, 0, 0);
		},
		findShadeByRGB = function(C){
			var shadeData = s.getImageData(0, 0, shade.width, shade.height),
				pos = [64, 64],
				threshold = 5;
			for(var i = 0; i < shadeData.data.length; i = i + 4){
				if(Math.abs(parseInt(C[0]) - shadeData.data[i]) < threshold && Math.abs(parseInt(C[1]) - shadeData.data[i + 1]) < threshold && Math.abs(parseInt(C[2]) - shadeData.data[i + 2]) < threshold){
					pos = [(i / 4) % 128, Math.floor(i / (4 * 128))];
				}
			}
			$(shade).attr('x', pos[0]);
			$(shade).attr('y', pos[1]);
			s.beginPath();
			s.strokeStyle = 'white';
			s.arc(pos[0], pos[1], 4, 0, 2 * Math.PI);
			s.strokeStyle = '#888888';
			s.arc(pos[0], pos[1], 5, 0, 2 * Math.PI);
			s.stroke();
		},
		findShadeByPosition = function(x, y){
			var shadeData = s.getImageData(x, y, 1, 1).data;
			return [shadeData[0], shadeData[1], shadeData[2]];
		},
		initHue = function(H){
			var g = h.createLinearGradient(0, 0, 0, hue.height),
				hArr = ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"];
			for(var i = 0; i < 7; i++){
				g.addColorStop((1 / 6) * i, hArr[i]);
			}
			h.fillStyle = g;
			h.fillRect(0, 0, hue.width, hue.height);
			setHue(H);
			h.beginPath();
			h.moveTo(1, Math.round(hue.height * parseFloat($(hue).attr('hue'))) + 0.5);
			h.lineTo(hue.width, Math.round(hue.height * parseFloat($(hue).attr('hue'))) + 0.5);
			h.stroke();
		};
		
	$(e).append(shade);
	$(e).append(hue);
	
	initHue(H);
	
	getShadesByRGB(H);
	findShadeByRGB(C);
	
	$(hue).on('mousedown', function(event){
		MOUSE = 1;
		var k = event.clientY - Math.ceil($(hue).offset().top) - 3;
		if(k == -1)k++;
		if(k >= 0 && k < 128){
			k *= 4;
			var hueData = h.getImageData(0, 0, 1, hue.height).data,
				K = [hueData[k], hueData[k + 1], hueData[k + 2]],
				x = parseInt($(shade).attr('x')),
				y = parseInt($(shade).attr('y'));
			initHue(K);
			getShadesByRGB(K);
			var color = findShadeByPosition(x, y),
				colorString = '#' + color[0].toString(16) + color[1].toString(16) + color[2].toString(16);
			s.beginPath();
			s.strokeStyle = 'white';
			s.arc(x, y, 4, 0, 2 * Math.PI);
			s.strokeStyle = '#888888';
			s.arc(x, y, 5, 0, 2 * Math.PI);
			s.stroke();
			$(e.previousSibling).val(colorString).trigger('change');
			$(e).css('background', colorString);
		}
	}).on('mousemove', function(event){
		if(MOUSE == 1){
			var k = event.clientY - Math.ceil($(hue).offset().top) - 3;
			if(k == -1)k++;
			if(k >= 0 && k < 128){
				k *= 4;
				var hueData = h.getImageData(0, 0, 1, hue.height).data,
					K = [hueData[k], hueData[k + 1], hueData[k + 2]],
					x = parseInt($(shade).attr('x')),
					y = parseInt($(shade).attr('y'));
				initHue(K);
				getShadesByRGB(K);
				var color = findShadeByPosition(x, y),
					colorString = '#' + ('00' + color[0].toString(16)).slice(-2) + ('00' + color[1].toString(16)).slice(-2) + ('00' + color[2].toString(16)).slice(-2);
				s.beginPath();
				s.strokeStyle = 'white';
				s.arc(x, y, 4, 0, 2 * Math.PI);
				s.strokeStyle = '#888888';
				s.arc(x, y, 5, 0, 2 * Math.PI);
				s.stroke();
				$(e.previousSibling).val(colorString).trigger('change');
				$(e).css('background', colorString);
			}
		}
	}).on('mouseup mouseout mouseleave', function(){
		MOUSE = 0;
	});
	
	$(shade).on('mousedown', function(event){
		MOUSE = 1;
		var x = event.clientX - Math.ceil($(shade).offset().left) - 3,
			y = event.clientY - Math.ceil($(shade).offset().top) - 3;
		if(x >= 0 && x < 128 && y >= 0 && y < 128){
			var shadeData = s.getImageData(x, y, 1, 1).data,
				color = [parseInt(shadeData[0]), parseInt(shadeData[1]), parseInt(shadeData[2])],
				colorString = '#' + ('00' + color[0].toString(16)).slice(-2) + ('00' + color[1].toString(16)).slice(-2) + ('00' + color[2].toString(16)).slice(-2),
				K = [parseInt($(hue).attr('r')), parseInt($(hue).attr('g')), parseInt($(hue).attr('b'))];
			$(shade).attr('x', x);
			$(shade).attr('y', y);
			getShadesByRGB(K);
			s.beginPath();
			s.strokeStyle = 'white';
			s.arc(x, y, 4, 0, 2 * Math.PI);
			s.strokeStyle = '#888888';
			s.arc(x, y, 5, 0, 2 * Math.PI);
			s.stroke();
			$(e.previousSibling).val(colorString).trigger('change');
			$(e).css('background', colorString);
		}
	}).on('mousemove', function(event){
		if(MOUSE == 1){
			var x = event.clientX - Math.ceil($(shade).offset().left) - 3,
				y = event.clientY - Math.ceil($(shade).offset().top) - 3;
			if(x >= 0 && x < 128 && y >= 0 && y < 128){
				var shadeData = s.getImageData(x, y, 1, 1).data,
					color = [parseInt(shadeData[0]), parseInt(shadeData[1]), parseInt(shadeData[2])],
					colorString = '#' + ('00' + color[0].toString(16)).slice(-2) + ('00' + color[1].toString(16)).slice(-2) + ('00' + color[2].toString(16)).slice(-2),
					K = [parseInt($(hue).attr('r')), parseInt($(hue).attr('g')), parseInt($(hue).attr('b'))];
				$(shade).attr('x', x);
				$(shade).attr('y', y);
				getShadesByRGB(K)
				s.beginPath();
				s.strokeStyle = 'white';
				s.arc(x, y, 4, 0, 2 * Math.PI);
				s.strokeStyle = '#888888';
				s.arc(x, y, 5, 0, 2 * Math.PI);
				s.stroke();
				$(e.previousSibling).val(colorString).trigger('change');
				$(e).css('background', colorString);
			}
		}
	}).on('mouseup mouseout mouseleave', function(){
		MOUSE = 0;
	});
}

function getHueRGB(r,g,b){
	var c=function(h,s,l){
		var r,g,b;
		if(s==0){
			return [255, 0, 0];
			//r=g=b=l;
		}else{
			var a=function(p,q,t){
				if(t<0)t+=1;
				if(t>1)t-=1;
				if(t < 1/6)return p+(q-p)*6*t;
				if(t<1/2)return q;
				if(t<2/3)return p+(q-p)*(2/3-t)*6;
				return p;
			}
			var q=l<0.5?l*(1+s):l+s-l*s;
			var p=2*l-q;
			r=a(p,q,h+1/3);
			g=a(p,q,h);
			b=a(p,q,h-1/3);
		}
		return [Math.round(r*255),Math.round(g*255),Math.round(b*255)];
	};
	return c(getHue(r,g,b),1,0.5);
}

function getHue(r,g,b){
	if(r==g && g==b && b==r){
		return 0;
	}
	var RGB=[r/255,g/255,b/255],
		M=Math.max.apply(0,RGB),
		m=Math.min.apply(0,RGB),
		I=RGB.indexOf(M),H;
	if(I==0)H=(RGB[1]-RGB[2])/(M-m);
	if(I==1)H=2+(RGB[2]-RGB[0])/(M-m);
	if(I==2)H=4+(RGB[0]-RGB[1])/(M-m);
	return H/6;
}

function validate(){
	if(!localStorage.chatName || localStorage.chatName == ''){
		var n = window.prompt('Enter a name to join the chat','');
		while(n == '' || n == null || n.length > 64){
			n = window.prompt('Enter a name to join the chat','');
		}
		localStorage.removeItem('k');
		localStorage.chatName = n;
	}
	if(!localStorage.chatPic || !(/http[s]?:\/\/.*(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)|default/g).test(localStorage.chatPic)){
		localStorage.chatPic = 'default';
	}
	if(!localStorage.chatBack || !(/((#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\)))(url\(['"](http[s]?:\/\/(i.imgur|imageshack|photobucket|tinypic)..*\/.*.(png|jpg|gif|jpeg)|default)['"]\))?/g).test(localStorage.chatBack)){
		localStorage.chatBack = '#c4c4c4';
	}
	if(!localStorage.textStyle || !(/font:[0-z ,-]*;color:((#[0123456789abcdefABCDEF]{6})|((rgb|hsl)\(.*,.*,.*\)));/g).test(localStorage.textStyle)){
		localStorage.textStyle = 'font:12px Arial, Sans-Serif;color:#444444;';
	}
	if(localStorage.chatName.length > 64 || (/({|})/g).test(localStorage.chatName)){
		localStorage.chatName = 'invalid';
	}
	if((/({|})/g).test(localStorage.chatPic)){
		localStorage.chatPic = 'default';
	}
	if((/({|})/g).test(localStorage.chatBack)){
		localStorage.chatBack = '#c4c4c4';
	}
	if((/({|})/g).test(localStorage.textStyle)){
		localStorage.textStyle = 'font:12px Arial, Sans-Serif;color:#444444;';
	}
}