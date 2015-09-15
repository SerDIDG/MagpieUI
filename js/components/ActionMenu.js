cm.define('Com.ActionMenu', {
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
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        // Tooltip
        cm.getConstructor('Com.Tooltip', function(classConstructor){
            that.components['tooltip'] = new classConstructor(
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
        });
    };

    /* ******* PUBLIC ******* */

    init();
});