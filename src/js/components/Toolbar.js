cm.define('Com.Toolbar', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append'
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.groups = [];
    that.items = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var render = function(){
        that.nodes['container'] = cm.node('div');
        // Append
        that.embedStructure(that.nodes['container']);
    };

    /* ******* PUBLIC ******* */

    that.addGroup = function(item){
        item = cm.merge({
            'name' : '',
            'align' : 'left'
        }, item);
    };

    init();
});