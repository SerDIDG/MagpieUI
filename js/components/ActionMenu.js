cm.define('Com.ActionMenu', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'Com.Tooltip' : {
            'className' : 'com-action-menu-tooltip',
            'top' : 'targetHeight',
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'theme' : false
        }
    }
},
function(params){
    var that = this,
        components = {};

    that.nodes = {
        'button' : cm.Node('div'),
        'target' : cm.Node('div')
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        // Tooltip
        components['tooltip'] = new Com.Tooltip(
            cm.merge(that.params['Com.Tooltip'], {
                'target' : that.nodes['button'],
                'content' : that.nodes['target'],
                'events' : {
                    'onShowStart' : function(){
                        cm.addClass(that.params['node'], 'active');
                        cm.addClass(that.nodes['button'], 'active');
                    },
                    'onHideStart' : function(){
                        cm.removeClass(that.params['node'], 'active');
                        cm.removeClass(that.nodes['button'], 'active');
                    }
                }
            })
        );
        // Trigger event
        that.triggerEvent('onRender', {});
    };

    /* ******* MAIN ******* */

    init();
});