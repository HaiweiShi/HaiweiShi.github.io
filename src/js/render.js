var converter = new showdown.Converter()
$.get({ url: '/md/001.md', dataType: 'text' }).then(function (data) {
    var html = converter.makeHtml(data);
    $('#markdowm').html(html)
}, function (err) {

})