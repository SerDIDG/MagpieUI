cm.define('Com.ClassMaket', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div')
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
        render();
    };

    var render = function(){
        that.triggerEvent('onRender', {});
    };

    /* ******* MAIN ******* */

    init();
});