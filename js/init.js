cm.init = function(){
    var init = function(){
        checkBrowser();
        checkType();
        checkScrollSize();
        cm.addEvent(window, 'resize', checkType);
        cm.addEvent(window, 'resize', checkScrollSize);
        cm.addEvent(window, 'mousemove', getClientPosition);
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
        var html = cm.getDocumentHtml(),
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

    var checkScrollSize = (function(){
        var oldSize = 0;

        return function(){
            oldSize = cm._scrollSize;
            cm._scrollSize = cm.getScrollBarSize();
            if(oldSize != cm._scrollSize){
                cm.customEvent.trigger(window, 'scrollSizeChange', {
                    'type' : 'all',
                    'self' : true,
                    'scrollSize' : cm._scrollSize
                })
            }
        };
    })();

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

    // Get client cursor position

    var getClientPosition = function(e){
        cm._clientPosition = cm.getEventClientPosition(e);
    };

    init();
};

cm.onReady(cm.init, false);