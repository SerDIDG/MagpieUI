cm.define('Com.Zoom', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onClose',
        'onCloseStart'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : 'document.body',
        'name' : '',
        'thumbnail' : '',
        'src' :'',
        'duration' : 'cm._config.animDuration',
        'autoOpen' : true,
        'removeOnClose' : true
    }
},
function(params){
    var that = this;

    that.isOpen = false;
    that.isLoad = false;
    that.nodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__zoom'},
            that.nodes['inner'] = cm.node('div', {'class' : 'inner'})
        );
        cm.addEvent(that.nodes['container'], 'click', that.close);
    };

    var renderImage = function(){
        that.nodes['image'] = cm.node('img');
        cm.addEvent(that.nodes['inner'], 'load', function(){
            that.isLoad = true;
        });
        that.nodes['image'].src = that.params['src'];
        that.nodes['inner'].appendChild(that.nodes['image']);
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            // ESC key
            that.close();
        }
    };

    /* ******* PUBLIC ******* */

    that.set = function(src){
        that.isLoad = false;
        that.params['src'] = src;
        return that;
    };

    that.open = function(){
        if(!that.isOpen){
            that.isOpen = true;
            // Add close event on Esc press
            cm.addEvent(window, 'keydown', windowClickEvent);
            // Append
            that.params['container'].appendChild(that.nodes['container']);
            renderImage();
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 1},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Event
                    that.triggerEvent('onOpen');
                }
            });
            // Event
            that.triggerEvent('onOpenStart');
        }
        return that;
    };

    that.close = function(){
        if(that.isOpen){
            that.isOpen = false;
            // Remove close event on Esc press
            cm.removeEvent(window, 'keydown', windowClickEvent);
            // Animate
            cm.transition(that.nodes['container'], {
                'properties' : {'opacity' : 0},
                'duration' : that.params['duration'],
                'easing' : 'ease-in-out',
                'onStop' : function(){
                    // Remove Window
                    that.params['removeOnClose'] && cm.remove(that.nodes['container']);
                    cm.remove(that.nodes['image']);
                    // Event
                    that.triggerEvent('onClose');
                }
            });
            // Event
            that.triggerEvent('onCloseStart');
        }
        return that;
    };

    init();
});