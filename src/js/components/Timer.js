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
        'count' : 0,                 // ms
        'tick' : 500                 // ms
    }
},
function(params){
    var that = this,
        tickInterval;

    that.left = 0;
    that.pass = 0;

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
        o['d'] = Math.floor(that.left / 1000 / 60 / 60 / 24);
        o['h'] = Math.floor((that.left / 1000 / 60 / 60) - (o['d'] * 24));
        o['m'] = Math.floor((that.left / 1000 / 60) - (o['d'] * 24 * 60) - (o['h'] * 60));
        o['s'] = Math.floor((that.left / 1000) - (o['d'] * 24 * 60 * 60) - (o['h'] * 60 * 60) - (o['m'] * 60));
        return o;
    };

    /* ******* PUBLIC ******* */

    that.start = function(){
        var o = getLeftTime(),
            tick = Date.now(),
            tack;
        that.triggerEvent('onStart', o);
        tickInterval = setInterval(function(){
            tack = tick;
            tick = Date.now();
            that.left = Math.max(that.left - (tick - tack), 0);
            that.pass = that.params['count'] - that.left;
            o = getLeftTime();
            that.triggerEvent('onTick', o);
            if(that.left == 0){
                that.stop();
                that.triggerEvent('onEnd', o);
            }
        }, 500);
    };

    that.stop = function(){
        clearInterval(tickInterval);
    };

    init();
});