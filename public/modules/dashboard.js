/**
 * Created by lishengyong on 2016/11/2.
 */
document.getElementById('logout').addEventListener('click', function () {
    var form = document.createElement('form');
    form.action = '/logout';
    form.method = 'POST';
    form.submit();
});


$("#menu li").on('click', function () {
    $("#content .dataContent").hide();
   var target = $(this).attr('data-target');
    $("#menu li").toggleClass('active', '');
    $("#" + target).show();
});




