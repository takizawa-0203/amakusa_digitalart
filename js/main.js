// ハンバーガーメニュー
$(function () {
    $(".openbtn").on("click", function () {
        $(this).toggleClass("active");
        $("#js_nav").toggleClass("panelactive");
    });
    $("#g-navi a").on("click", function () {
        $(".openbtn").removeClass("active");
        $("#js_nav").removeClass("panelactive");
    });
});


$(document).ready(function() {

    $('.slider').slick({
        centerMode: true,           
        centerPadding: '15%',      
        slidesToShow: 1,          
        infinite: true,         
        speed: 400,               
        arrows: true,             
        prevArrow: '<button class="carousel-arrow carousel-arrow-prev">◀</button>',
        nextArrow: '<button class="carousel-arrow carousel-arrow-next">▶</button>',
        dots: true,  
        
        responsive: [
            {
                breakpoint: 768,   
                settings: {
                    centerPadding: '10%'
                }
            }
        ]
    });
});
