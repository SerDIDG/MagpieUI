Com['OldBrowserAlert'] = function(o){
    var that = this, config = cm.merge({
            'versions' : {
                'IE' : 8,
                'FF' : 24,
                'Chrome' : 29,
                'Safari' : 6,
                'Opera' : 15
            },
            'langs' : {
                'title' : 'Thank you for visiting our site!',
                'descr' : 'It seems that you are using an outdated browser <b>(%browser% %version%)</b>. As a result, we cannot provide you with the best user experience while visiting our site. Please upgrade your <b>%browser%</b> to version <b>%minimum_version%</b> or above, or use another standards based browser such as Firefox, Chrome or Safari, by clicking on the icons below.',
                'continue' : 'Continue'
            }
        }, o),
        useragent = Com.UA.get(),
        nodes = {},
        dialog;

    var init = function(){
        cm.forEach(config['versions'], function(version, browser){
            if(cm.is(browser) && cm.isVersion() < version){
                // Parse description string, insert browser name and verison
                config['langs']['descr'] = config['langs']['descr']
                    .replace(/%browser%/g, Com.UA['full_name'])
                    .replace(/%version%/g, Com.UA['full_version'])
                    .replace(/%minimum_version%/g, version);
                // Render window
                !cm.cookieGet('comOldBrowserAlert') && render();
            }
        });
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-oldbrowser-alert'},
            cm.Node('div', {'class' : 'descr'},
                cm.Node('p', {'innerHTML' : config['langs']['descr']})
            ),
            cm.Node('ul', {'class' : 'browsers'},
                cm.Node('li', cm.Node('a', {'class' : 'icon chrome', 'title' : 'Google Chrome', 'href' : 'http://www.google.com/chrome/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon firefox', 'title' : 'Mozilla Firefox', 'href' : 'http://www.mozilla.com/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon safari', 'title' : 'Apple Safari', 'href' : 'http://www.apple.com/safari/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon msie', 'title' : 'Microsoft Internet Explorer', 'href' : 'http://ie.microsoft.com/', 'target' : '_blank'}))
            ),
            cm.Node('div', {'class' : 'form'},
                cm.Node('div', {'class' : 'btn-wrap centered'},
                    nodes['button'] = cm.Node('input', {'type' : 'button', 'value' : config['langs']['continue']})
                )
            )
        );
        // Init dialog
        dialog = new Com.Dialog({
            'title' : config['langs']['title'],
            'content' : nodes['container'],
            'autoOpen' : false,
            'width' : 500,
            'onClose' : function(){
                cm.cookieSet('comOldBrowserAlert', '1');
            }
        });
        // Add event on continue button
        nodes['button'].onclick = dialog.close;
        // Open dialog
        dialog.open();
    };

    init();
};