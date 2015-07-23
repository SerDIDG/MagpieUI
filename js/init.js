cm.init = function(){
    var init = function(){
        checkBrowser();
        checkType();
        checkScrollBar();
        cm.addEvent(window, 'resize', checkType);
        cm.addEvent(window, 'resize', checkScrollBar);
        //cm.addEvent(window, 'scroll', disableHover);
    };

    // Set browser class
    var checkBrowser = function(){
        if(typeof Com.UA != 'undefined'){
            Com.UA.setBrowserClass();
        }
    };

    // Get device type

    var checkType = (function(){
        var html = document.getElementsByTagName('html')[0],
            sizes,
            width,
            height;

        return function(){
            sizes = cm.getPageSize();
            width = sizes['winWidth'];
            height = sizes['winHeight'];

            cm.removeClass(html, ['is', cm._deviceType].join('-'));
            cm.removeClass(html, ['is', cm._deviceOrientation].join('-'));

            cm._deviceOrientation = width < height? 'portrait' : 'landscape';
            if(width > cm._config['screenTablet']){
                cm._deviceType = 'desktop';
            }
            if(width <= cm._config['screenTablet'] && width > cm._config['screenMobile']){
                cm._deviceType = 'tablet';
            }
            if(width <= cm._config['screenMobile']){
                cm._deviceType = 'mobile';
            }

            cm.addClass(html, ['is', cm._deviceType].join('-'));
            cm.addClass(html, ['is', cm._deviceOrientation].join('-'));
        };
    })();

    // Get device scroll bar size

    var checkScrollBar = function(){
        cm._scrollSize = cm.getScrollBarSize();
    };

    // Disable hover on scroll

    var disableHover = (function(){
        var body = document.body,
            timer;

        return function(){
            timer && clearTimeout(timer);
            if(!cm.hasClass(body, 'disable-hover')){
                cm.addClass(body, 'disable-hover');
            }
            timer = setTimeout(function(){
                cm.removeClass(body, 'disable-hover');
            }, 100);
        };
    })();

    init();
};

cm.onReady(cm.init, false);