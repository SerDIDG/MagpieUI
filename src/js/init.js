cm.init = function(){
    var init = function(){
        cm._isDocumentReady = true;
        // Helpers
        checkBrowser();
        checkType();
        checkScrollSize();
        checkPageSize();
        // Events
        cm.addEvent(window, 'mousemove', getClientPosition);
        cm.addEvent(window, 'resize', resizeAction);
        setInterval(checkAction, 50);
        //cm.addEvent(window, 'scroll', disableHover);
    };

    // Actions

    var checkAction = function(){
        animFrame(function(){
            checkScrollSize();
            checkPageSize();
        });
    };

    var resizeAction = function(){
        animFrame(function(){
            checkType();
            checkScrollSize();
            checkPageSize();
        });
    };

    // Set browser class

    var checkBrowser = function(){
        if(typeof Com.UA !== 'undefined'){
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
            if(width <= cm._config['adaptiveFrom']){
                cm._adaptive = true;
            }else{
                cm._adaptive = false;
            }

            cm.addClass(html, ['is', cm._deviceType].join('-'));
            cm.addClass(html, ['is', cm._deviceOrientation].join('-'));
        };
    })();

    // Get device scroll bar size

    var checkScrollSize = (function(){
        var size;
        return function(){
            cm._scrollSize = cm.getScrollBarSize();
            if(size !== cm._scrollSize){
                size = cm._scrollSize;
                cm.hook.trigger('scrollSizeChange', {
                    'scrollSize' : cm._scrollSize
                });
                cm.customEvent.trigger(window, 'scrollSizeChange', {
                    'direction' : 'all',
                    'self' : true,
                    'scrollSize' : cm._scrollSize
                });
            }
        };
    })();

    var checkPageSize = (function(){
        var size, sizeNew;
        return function(){
            cm._pageSize = cm.getPageSize();
            sizeNew = JSON.stringify(cm._pageSize);
            if(size !== sizeNew){
                size = sizeNew;
                cm.hook.trigger(window, 'pageSizeChange', {
                    'pageSize' : cm._pageSize
                });
                cm.customEvent.trigger(window, 'pageSizeChange', {
                    'direction' : 'all',
                    'self' : true,
                    'pageSize' : cm._pageSize
                });
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

cm.load = function(){
    cm._isDocumentLoad = true;
    // Redraw components and modules after full page loading
    if(cm._config.redrawOnLoad){
        cm.customEvent.trigger(document.body, 'redraw', {
            'direction' : 'child',
            'self' : false
        });
    }
};

cm.onReady(cm.init, false);
cm.onLoad(cm.load, false);
