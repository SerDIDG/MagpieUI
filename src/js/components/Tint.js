cm.define('Com.Tint', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append'
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){

    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__tint'},
            that.nodes['range'] = cm.node('div', {'class' : 'pt__range is-horizontal'},
                that.nodes['inner'] = cm.node('div', {'class' : 'inner'},
                    that.nodes['drag'] = cm.node('div', {'class' : 'drag'}),
                    that.nodes['canvas'] = cm.node('div', {'class' : 'canvas', 'width' : '100%', 'height' : '100%'})
                )
            )
        );
        // Append
        that.embedStructure(that.nodes['container']);
    };

    /* ******* PUBLIC ******* */

    init();
});