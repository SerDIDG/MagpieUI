cm.define('Com.OldBrowserAlert', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Storage',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'name' : 'default',
        'remember' : true,
        'versions' : {
            'IE' : 10,
            'FF' : 31,
            'Chrome' : 40,
            'Safari' : 6,
            'Opera' : 26
        }
    },
    'strings' : {
        'title' : 'Thank you for visiting our site!',
        'descr' : 'It seems that you are using an outdated browser <b>(%browser% %version%)</b>. As a result, we cannot provide you with the best user experience while visiting our site. Please upgrade your <b>%browser%</b> to version <b>%minimum_version%</b> or above, or use another standards based browser such as Firefox, Chrome or Safari, by clicking on the icons below.',
        'continue' : 'Skip for now'
    }
},
function(params){
    var that = this,
        userAgent = Com.UA.get();

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.addToStack();
        check();
        that.triggerEvent('onRender');
    };

    var check = function(){
        cm.forEach(that.params['versions'], function(version, browser){
            if(Com.UA.is(browser) && Com.UA.isVersion() < version){
                // Parse description string, insert browser name and version
                that.params['langs']['descr'] = that.lang('descr', {
                    '%browser%' : userAgent['full_name'],
                    '%version%' : userAgent['full_version'],
                    '%minimum_version%' : version
                });
                // Render window
                if(!that.params['remember'] || (that.params['remember'] && !that.storageRead('isShow'))){
                    render();
                }
            }
        });
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__oldbrowser-alert'},
            cm.Node('div', {'class' : 'b-descr'},
                cm.Node('p', {'innerHTML' : that.lang('descr')})
            ),
            cm.Node('ul', {'class' : 'b-browsers'},
                cm.Node('li', cm.Node('a', {'class' : 'icon linked chrome', 'title' : 'Google Chrome', 'href' : 'http://www.google.com/chrome/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked firefox', 'title' : 'Mozilla Firefox', 'href' : 'http://www.mozilla.com/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked safari', 'title' : 'Apple Safari', 'href' : 'http://www.apple.com/safari/', 'target' : '_blank'})),
                cm.Node('li', cm.Node('a', {'class' : 'icon linked msie', 'title' : 'Microsoft Internet Explorer', 'href' : 'http://ie.microsoft.com/', 'target' : '_blank'}))
            ),
            cm.Node('div', {'class' : 'form'},
                cm.Node('div', {'class' : 'btn-wrap pull-center'},
                    that.nodes['button'] = cm.Node('input', {'type' : 'button', 'value' : that.lang('continue')})
                )
            )
        );
        // Init dialog
        cm.getConstructor('Com.Dialog', function(classConstructor){
            that.components['dialog'] = new classConstructor({
                'title' : that.lang('title'),
                'content' : that.nodes['container'],
                'autoOpen' : false,
                'width' : 500,
                'events' : {
                    'onClose' : function(){
                        if(that.params['remember']){
                            that.storageWrite('isShow', true);
                        }
                    }
                }
            });
            // Add event on continue button
            cm.addEvent(that.nodes['button'], 'click', that.components['dialog'].close);
            // Open dialog
            that.components['dialog'].open();
        });
    };

    /* ******* MAIN ******* */

    init();
});