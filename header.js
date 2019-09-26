
	var str = "<header class='header'><div class='title'><a href='/index.html'><img style='width: 180px;' src='/src/assets/logo.png' alt='' /></a></div><div class='me' style='float:right'><img src='/src/assets/icon.jpg' alt='头像'></div></header>"
	var div = document.createElement('div')
	div.innerHTML = str
	var link = document.createElement('link')
	link.setAttribute('rel', 'stylesheet')
	link.setAttribute('href', "/src/css/main.css")
	var head = window.document.head
	head.appendChild(link);
	window.onload = function() {
		var body = window.document.body
		body.insertBefore(div, body.childNodes[0]);
	}