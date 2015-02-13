cm.define('Com.Overlay', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onCloseStart',
        'onClose'
    ],
    'params' : {
        'container' : 'document.body',
        'openTime' : 300,
        'opacity' : 0.6,
        'position' : 'fixed',
        'autoOpen' : true,
        'removeOnClose' : true
    }
},
function(params){
    var that = this,
        anim = {};

    that.nodes = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
        that.params['autoOpen'] && that.open();
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'cm-overlay'},
            that.nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
            cm.Node('div', {'class' : 'inner'})
        );
        that.nodes['container'].style.position = that.params['position'];
        // Set opacity
        cm.setOpacity(that.nodes['bg'], that.params['opacity']);
        // Init animation
        anim['container'] = new cm.Animation(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    /* ******* MAIN ******* */

    that.open = function(){
        that.params['container'].appendChild(that.nodes['container']);
        that.nodes['container'].style.display = 'block';
        // Animate
        anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : that.params['openTime'], 'onStop' : function(){
            // Open Event
            that.triggerEvent('onOpen');
        }});
        // Open Event
        that.triggerEvent('onOpenStart');
        return that;
    };

    that.close = function(){
        // Animate
        anim['container'].go({'style' : {'opacity' : '0'}, 'duration' : that.params['openTime'], 'onStop' : function(){
            that.nodes['container'].style.display = 'none';
            // Close Event
            that.triggerEvent('onClose');
            if(that.params['removeOnClose']){
                cm.remove(that.nodes['container']);
            }
        }});
        // Close Event
        that.triggerEvent('onCloseStart');
        return that;
    };

    init();
});