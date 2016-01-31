cm.define('Com.ClassMaket', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : ''
    }
},
function(params){
    var that = this;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.addToStack(that.params['node']);
        validateParams();
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){

    };

    var render = function(){
    };

    /* ******* PUBLIC ******* */

    init();
});