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
        'node' : cm.node('div'),
        'name' : '',
        'event' : 'hover',
        'top' : 'targetHeight',
        'left' : 0,
        'adaptiveFrom' : null,
        'adaptiveTop' : null,
        'adaptiveLeft' : null,
        'minWidth' : 'targetWidth',
        'tooltipConstructor' : 'Com.Tooltip',
        'tooltipParams' : {
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
        'button' : cm.node('div'),
        'target' : cm.node('div')
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
        that.params['tooltipParams']['targetEvent'] = that.params['event'];
        that.params['tooltipParams']['minWidth'] = that.params['minWidth'];
        that.params['tooltipParams']['top'] = that.params['top'];
        that.params['tooltipParams']['left'] = that.params['left'];
        that.params['tooltipParams']['adaptiveFrom'] = that.params['adaptiveFrom'];
        that.params['tooltipParams']['adaptiveTop'] = that.params['adaptiveTop'];
        that.params['tooltipParams']['adaptiveLeft'] = that.params['adaptiveLeft'];
    };

    var render = function(){
        // Tooltip
        cm.getConstructor(that.params['tooltipConstructor'], function(classConstructor){
            that.components['tooltip'] = new classConstructor(
                cm.merge(that.params['tooltipParams'], {
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
