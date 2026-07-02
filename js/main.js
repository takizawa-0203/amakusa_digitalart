// ハンバーガーメニュー
$(function(){

    $(".openbtn").click(function(){
        $(this).toggleClass("active");
        $("#js_nav").toggleClass("panelactive");
    });

    $("#g-navi a").click(function(){
        $(".openbtn").removeClass("active");
        $("#js_nav").removeClass("panelactive");
    });

});
