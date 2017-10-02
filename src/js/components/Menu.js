cm.define('Com.Menu', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'event' : 'hover',
        'top' : 'targetHeight',
        'left' : 0,
        'minWidth' : 'targetWidth',
        'Com.Tooltip' : {
            'className' : 'com__menu-tooltip',
            'targetEvent' : 'hover',
            'hideOnReClick' : true,
            'theme' : null,
            'hold' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {
        'button' : cm.Node('div'),
        'target' : cm.Node('div')
    };
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Tooltip']['targetEvent'] = that.params['event'];
        that.params['Com.Tooltip']['top'] = that.params['top'];
        that.params['Com.Tooltip']['left'] = that.params['left'];
        that.params['Com.Tooltip']['minWidth'] = that.params['minWidth'];
    };

    var render = function(){
        // Tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor){
            that.components['tooltip'] = new classConstructor(
                cm.merge(that.params['Com.Tooltip'], {
                    'target' : that.nodes['container'] || that.nodes['button'],
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
        });
    };

    /* ******* PUBLIC ******* */

    that.show = function(){
        that.components['tooltip'] && that.components['tooltip'].show();
        return that;
    };

    that.hide = function(){
        that.components['tooltip'] && that.components['tooltip'].hide();
        return that;
    };

    init();
});