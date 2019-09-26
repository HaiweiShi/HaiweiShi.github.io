
function renderList(recordList) {
	var html = '';
	for (let i = 0; i < recordList.length; i++) {
		html += '<li><a class="tle" href="' + (recordList[i].url ? recordList[i].url : 'md.html?' + recordList[i].serial)
			+ '">' + recordList[i].title
			+ '</a><div class="intro">' + recordList[i].intro
			+ '</div></li>'
	}
	$('.record-list').html(html)
}

$.get({ url: '/dataSource.json', dataType: 'text' }).then(function (data) {
	var recordList = JSON.parse(data || '') || []
	renderList(recordList)
}, function (err) {

})