// ローディング
$(window).on('load', function() {
    setTimeout(function() {
        $('body').addClass('appear');

        setTimeout(function() {
            $("#splash").hide();
        }, 1000);

    }, 3000); // 3000ms = 3秒
});


// ハンバーガーメニュー
$(function(){

    $(".openbtn").on("click", function(){

        $(this).toggleClass("active");
        $("#js_nav").toggleClass("panelactive");

    });

    $("#g-navi a").on("click", function(){

        $(".openbtn").removeClass("active");
        $("#js_nav").removeClass("panelactive");

    });

});


$(window).on('scroll', function() {
    const $title = $('.about_title');
    const $fixed05 = $('.fixed05');
    
    if ($title.length && $fixed05.length) {
        const fixed05Top = $fixed05[0].getBoundingClientRect().top;

        const titleHeight = $title.outerHeight();
        const titleBottom = 60 + titleHeight; 

        if (fixed05Top <= titleBottom) {
            const pushUpDistance = titleBottom - fixed05Top;
            
            $title.css({
                'transform': `translateY(-${pushUpDistance}px)`,
                // ↓ もし押し上げられながらフワッとフェードアウトさせたい場合はこの行のコメントを外します
                // 'opacity': fixed05Top / titleBottom 
            });
        } else {
            $title.css({
                'transform': 'translateY(0)',
                'opacity': 1
            });
        }
    }
});

$(function() {
    const movieSection = document.querySelector('.movie');
    
    if (movieSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.documentElement.style.scrollSnapType = 'none';
                } else {
                    document.documentElement.style.scrollSnapType = '';
                }
            });
        },
        {
            rootMargin: "0px 0px -50px 0px"
        });
        
        observer.observe(movieSection);
    }
});




