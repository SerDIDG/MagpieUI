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
        'onSet'
    ],
    'params' : {
        'node' : cm.Node('div'),            // Node, for drag
        'target' : false,                   // Node, for drag target event
        'limiter' : false,                  // Node, for limit draggable in it
        'direction' : 'both',               // both | vertical | horizontal
        'alignNode' : false
    }
},
function(params){
    var that = this;
    
    that.isDrag = false;
    that.dimensions = {
        'target' : {}
    };

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
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
        cm.addEvent(that.params['target'], 'mousedown', start);
        that.triggerEvent('onRender');
    };

    var start = function(e){
        if(that.isDrag){
            return;
        }
        that.isDrag = true;
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var x = e.clientX,
            y = e.clientY;
        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }else{
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
        // Calculate dimensions and position
        that.getDimensions();
        setPosition(x, y);
        // Add move event on document
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Trigger Event
        that.triggerEvent('onStart');
    };

    var move = function(e){
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var x = e.clientX,
            y = e.clientY;
        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        // Calculate dimensions and position
        setPosition(x, y);
        // Trigger Event
        that.triggerEvent('onMove');
    };

    var stop = function(){
        that.isDrag = false;
        // Remove move events attached on document
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Trigger Event
        that.triggerEvent('onStop');
    };
    
    /* *** HELPERS *** */

    var setPosition = function(x, y){
        var posY =  y - that.dimensions['target']['absoluteY1'],
            posX = x - that.dimensions['target']['absoluteX1'],
            nodePosY,
            nodePosX;
        if(that.params['limiter']){
            if(y < that.dimensions['limiter']['absoluteY1']){
                posY = 0;
            }else if(y > that.dimensions['limiter']['absoluteY2']){
                posY = that.dimensions['limiter']['absoluteHeight'];
            }
            if(x < that.dimensions['limiter']['absoluteX1']){
                posX = 0;
            }else if(x > that.dimensions['limiter']['absoluteX2']){
                posX = that.dimensions['limiter']['absoluteWidth'];
            }
        }
        // Align node
        nodePosY = posY;
        nodePosX = posX;
        if(that.params['alignNode']){
            nodePosY -= (that.dimensions['node']['absoluteHeight'] / 2);
            nodePosX -= (that.dimensions['node']['absoluteWidth'] / 2);
        }
        // Set styles
        switch(that.params['direction']){
            case 'vertical' :
                that.params['node'].style.top = [nodePosY, 'px'].join('');
                break;
            case 'horizontal' :
                that.params['node'].style.left = [nodePosX, 'px'].join('');
                break;
            default :
                that.params['node'].style.top = [nodePosY, 'px'].join('');
                that.params['node'].style.left = [nodePosX, 'px'].join('');
                break;
        }
        // Trigger Event
        that.triggerEvent('onSet', {
            'posY' : posY,
            'posX' : posX,
            'nodePosY' : nodePosY,
            'nodePosX' : nodePosX
        });
    };

    /* ******* MAIN ******* */

    that.getDimensions = function(){
        that.dimensions['target'] = cm.getDimensions(that.params['target']);
        that.dimensions['node'] = cm.getDimensions(that.params['node']);
        that.dimensions['limiter'] = cm.getDimensions(that.params['limiter']);
        return that.dimensions;
    };

    that.setPosition = function(posX, posY, trigger){
        trigger = typeof trigger == 'undefined'? true : trigger;
        var nodePosY = posY,
            nodePosX = posX;
        if(that.params['alignNode']){
            nodePosY -= (that.dimensions['node']['absoluteHeight'] / 2);
            nodePosX -= (that.dimensions['node']['absoluteWidth'] / 2);
        }
        that.params['node'].style.top = [nodePosY, 'px'].join('');
        that.params['node'].style.left = [nodePosX, 'px'].join('');
        if(trigger){
            that.triggerEvent('onSet', {
                'posY' : posY,
                'posX' : posX,
                'nodePosY' : nodePosY,
                'nodePosX' : nodePosX
            })
        }
        return that;
    };

    init();
});