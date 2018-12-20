cm.define('Com.Draggable', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onStart',
        'onMove',
        'onStop',
        'onSet',
        'onSelect'
    ],
    'params' : {
        'node' : cm.node('div'),            // Node, for drag
        'target' : false,                   // Node, for drag target event
        'limiter' : false,                  // Node, for limit draggable in it
        'minY' : false,
        'direction' : 'both',               // both | vertical | horizontal
        'alignNode' : false
    }
},
function(params){
    var that = this;

    that.startX = 0;
    that.startY = 0;
    that.nodeStartX = 0;
    that.nodeStartY = 0;
    that.isProcess = false;
    that.pointerType = null;
    that.dimensions = {
        'target' : {}
    };
    that.position = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!that.params['target']){
            that.params['target'] = that.params['node'];
        }
    };

    var render = function(){
        // Calculate dimensions and position
        that.getDimensions();
        // Add drag start event
        cm.addEvent(that.params['target'], 'touchstart', function(e){
            start(e);
        });
        cm.addEvent(that.params['target'], 'mousedown', function(e){
            start(e);
        });
    };

    var start = function(e){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(that.isProcess){
            return;
        }
        that.isProcess = true;
        that.pointerType = e.type;
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e);
        that.startX = position['left'];
        that.startY = position['top'];
        // Calculate dimensions and position
        that.getDimensions();
        that.nodeStartX = cm.getStyle(that.params['node'], 'left', true);
        that.nodeStartY = cm.getStyle(that.params['node'], 'top', true);
        setPositionHelper(position, 'onSelect');
        // Add move event on document
        switch(that.pointerType){
            case 'mousedown' :
                cm.addEvent(window, 'mousemove', move);
                cm.addEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.addEvent(window, 'touchmove', move);
                cm.addEvent(window, 'touchend', stop);
                break;
        }
        // Trigger Event
        that.triggerEvent('onStart');
    };

    var move = function(e){
        cm.preventDefault(e);
        var position = cm.getEventClientPosition(e);
        // Calculate dimensions and position
        setPositionHelper(position, 'onSelect');
        // Trigger Event
        that.triggerEvent('onMove');
    };

    var stop = function(e){
        cm.preventDefault(e);
        that.isProcess = false;
        // Calculate dimensions and position
        var position = cm.getEventClientPosition(e);
        setPositionHelper(position, 'onSet');
        // Remove move events attached on document
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // Trigger Event
        that.triggerEvent('onStop');
    };
    
    /* *** HELPERS *** */

    var setPositionHelper = function(position, eventName){
        position = cm.merge({
            'left' : 0,
            'top' : 0
        }, position);
        if(that.params['node'] === that.params['target']){
            position['left'] += that.nodeStartX - that.startX;
            position['top'] += that.nodeStartY - that.startY;
        }else{
            position['left'] -= that.dimensions['target']['absoluteX1'];
            position['top'] -= that.dimensions['target']['absoluteY1'];
        }
        position['left'] = Math.round(position['left']);
        position['top'] = Math.round(position['top']);
        position = setPositionAction(position);
        that.position = position;
        that.triggerEvent(eventName, that.position);
    };

    var setPositionAction = function(position){
        position = cm.merge({
            'left' : 0,
            'top' : 0,
            'nodeTop' : 0,
            'nodeLeft' : 0
        }, position);
        // Check limit
        if(that.params['limiter']){
            if(position['top'] < 0){
                position['top'] = 0;
            }else if(position['top'] > that.dimensions['limiter']['absoluteHeight']){
                position['top'] = that.dimensions['limiter']['absoluteHeight'];
            }
            if(position['left'] < 0){
                position['left'] = 0;
            }else if(position['left'] > that.dimensions['limiter']['absoluteWidth']){
                position['left'] = that.dimensions['limiter']['absoluteWidth'];
            }
        }
        // Limiters
        if(!isNaN(that.params['minY']) && position['top'] < that.params['minY']){
            position['top'] = that.params['minY'];
        }
        // Align node
        position['nodeTop'] = position['top'];
        position['nodeLeft'] = position['left'];
        if(that.params['alignNode']){
            position['nodeTop'] -= (that.dimensions['node']['absoluteHeight'] / 2);
            position['nodeLeft'] -= (that.dimensions['node']['absoluteWidth'] / 2);
        }
        // Set styles
        switch(that.params['direction']){
            case 'vertical' :
                that.params['node'].style.top = [position['nodeTop'], 'px'].join('');
                break;
            case 'horizontal' :
                that.params['node'].style.left = [position['nodeLeft'], 'px'].join('');
                break;
            default :
                that.params['node'].style.top = [position['nodeTop'], 'px'].join('');
                that.params['node'].style.left = [position['nodeLeft'], 'px'].join('');
                break;
        }
        return position;
    };

    /* ******* MAIN ******* */

    that.getDimensions = function(){
        that.dimensions['target'] = cm.getFullRect(that.params['target']);
        that.dimensions['node'] = cm.getFullRect(that.params['node']);
        that.dimensions['limiter'] = cm.getFullRect(that.params['limiter']);
        return that.dimensions;
    };

    that.setPosition = function(position, triggerEvents){
        position = cm.merge({
            'left' : 0,
            'top' : 0
        }, position);
        triggerEvents = cm.isUndefined(triggerEvents) ? true : triggerEvents;
        position = setPositionAction(position);
        that.position = position;
        // Trigger Event
        if(triggerEvents){
            that.triggerEvent('onSelect', that.position);
            that.triggerEvent('onSet', that.position);
        }
        return that;
    };

    that.get = function(){
        return that.position;
    };

    init();
});