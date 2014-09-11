cm.define('Com.ImageBox', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'animated' : false,
        'effect' : 'none'
    }
},
function(params){
    var that = this;

    that.procced = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        render();
    };

    var render = function(){
        if(that.params['animated']){

        }
        that.triggerEvent('onRender');
    };

    /* ******* MAIN ******* */

    init();
});