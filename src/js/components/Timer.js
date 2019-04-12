cm.define('Com.Timer', {
    'modules' : [
        'Params',
        'Events'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onTick',
        'onEnd'
    ],
    'params' : {
        'count' : 0                 // ms
    }
},
function(params){
    var that = this;

    that.left = 0;
    that.pass = 0;

    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        render();
        that.triggerEvent('onRender');
    };

    var render = function(){
        that.left = that.params['count'];
        that.start();
    };

    var getLeftTime = function(){
        var o = {};
        o['d_total'] = Math.floor(that.left / 1000 / 60 / 60 / 24);
        o['h_total'] = Math.floor(that.left / 1000 / 60 / 60);
        o['m_total'] = Math.floor(that.left / 1000 / 60);
        o['s_total'] = Math.floor(that.left / 1000);
        o['d'] = Math.floor(o['d_total']);
        o['h'] = Math.floor(o['h_total'] - (o['d'] * 24));
        o['m'] = Math.floor(o['m_total'] - (o['d'] * 24 * 60) - (o['h'] * 60));
        o['s'] = Math.floor(o['s_total'] - (o['d'] * 24 * 60 * 60) - (o['h'] * 60 * 60) - (o['m'] * 60));
        return o;
    };

    /* ******* PUBLIC ******* */

    that.start = function(){
        var o = getLeftTime(),
            left = that.left,
            startTime = Date.now(),
            currentTime;
        that.isProcess = true;
        that.triggerEvent('onStart', o);
        // Process
        (function process(){
            if(that.isProcess){
                currentTime = Date.now();
                that.left = Math.max(left - (currentTime - startTime), 0);
                that.pass = that.params['count'] - that.left;
                o = getLeftTime();
                that.triggerEvent('onTick', o);
                if(that.left === 0){
                    that.stop();
                    that.triggerEvent('onEnd', o);
                }else{
                    animFrame(process);
                }
            }
        })();
        return that;
    };

    that.stop = function(){
        that.isProcess = false;
        return that;
    };

    init();
});