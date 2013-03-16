jQuery(function($) {
				"use strict";
				//socket.ioのサーバに接続
				var socket = io.connect('http://'+location.host+'/');
				
				//サーバからmessageイベントが送信されたとき
				socket.on('message',function(data){
								$('#list').prepend($('<div/>').text(data.user+": "+data.text+'('+data.date+')'));
						});
				//sendボタンがクリックされたとき
				$('#send').click(function(){
								var text = $('#input').val();
								if(text !== ''){
										//サーバにテキストを送信
										socket.emit('message',{text:text});
										$('#input').val('');
								}
						});
		});