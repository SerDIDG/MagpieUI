cm.init = function(){
    // Set browser class
    if(typeof Com.UA != 'undefined'){
        Com.UA.setBrowserClass();
    }
    // Check device type
    var checkDeviceType = function(){
        var sizes = cm.getPageSize(),
            width = sizes['winWidth'],
            height = sizes['winHeight'],
            html = document.getElementsByTagName('html')[0];

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
    cm.addEvent(window, 'resize', checkDeviceType);
    checkDeviceType();
};

cm.onReady(cm.init, false);