// Get initial values
cm._breakpoints = cm.getBreakpoints();
cm._breakpoint = cm.getBreakpoint();

cm.init = function(){
    var init = function(){
        cm._isDocumentReady = true;

        // Helpers
        checkBrowser();
        checkPageSize();
        checkBreakpoints();
        checkScrollSize();
        checkType();

        // Events
        cm.addEvent(window, 'mousemove', getClientPosition);
        cm.addEvent(window, 'resize', resizeAction);
        setInterval(checkAction, 50);
    };

    // Actions

    var checkAction = function(){
        animFrame(function(){
            checkPageSize();
            checkScrollSize();
        });
    };

    var resizeAction = function(){
        checkPageSize();
        checkBreakpoints();
        checkScrollSize();
        checkType();
    };

    var checkBrowser = function(){
        if(typeof Com.UA !== 'undefined'){
            Com.UA.setBrowserClass();
        }
    };

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

    var checkBreakpoints = function(){
        cm._breakpoints = cm.getBreakpoints();
        cm._breakpoint = cm.getBreakpoint();
    };

    var checkScrollSize = (function(){
        var size;
        return function(){
            cm._scrollSize = cm.getScrollBarSize();
            if(size !== cm._scrollSize){
                size = cm._scrollSize;
                cm.toggleClass(cm.getDocumentHtml(), 'is-scrollbar-visible', (size > 0));
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

    var checkType = (function(){
        var html = cm.getDocumentHtml(),
            width,
            height;

        return function(){
            width = cm._pageSize.winWidth;
            height = cm._pageSize.height;

            cm.removeClass(html, ['is', cm._deviceType].join('-'));
            cm.removeClass(html, ['is', cm._deviceOrientation].join('-'));

            cm._adaptive = width <= cm._config.adaptiveFrom;
            cm._deviceOrientation = width < height? 'portrait' : 'landscape';
            if(width >= cm._breakpoints.desktop){
                cm._deviceType = 'desktop';
            }
            if(width <= cm._breakpoints.desktopDown){
                cm._deviceType = 'tablet';
            }
            if(width <= cm._breakpoints.mobileDown){
                cm._deviceType = 'mobile';
            }

            cm.addClass(html, ['is', cm._deviceType].join('-'));
            cm.addClass(html, ['is', cm._deviceOrientation].join('-'));
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
