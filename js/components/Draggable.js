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
        cm.addEvent(that.params['target'], 'mousedown', start);
    };

    var start = function(e){
        if(that.isDrag){
            return;
        }
        that.isDrag = true;
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        that.startX = e.clientX;
        that.startY = e.clientY;
        if(cm.isTouch && e.touches){
            that.startX = e.touches[0].clientX;
            that.startY = e.touches[0].clientY;
        }else{
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
        // Calculate dimensions and position
        that.getDimensions();
        that.nodeStartX = cm.getStyle(that.params['node'], 'left', true);
        that.nodeStartY = cm.getStyle(that.params['node'], 'top', true);
        setPosition(that.startX, that.startY);
        // Add move event on document
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Trigger Event
        that.triggerEvent('onStart');
    };

    var move = function(e){
        cm.preventDefault(e);
        // Calculate dimensions and position
        setPosition(cm._clientPosition['x'], cm._clientPosition['y']);
        // Trigger Event
        that.triggerEvent('onMove');
    };

    var stop = function(){
        that.isDrag = false;
        // Remove move events attached on document
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // Trigger Event
        that.triggerEvent('onStop');
    };
    
    /* *** HELPERS *** */

    var setPosition = function(x, y){
        var posX = x,
            posY = y;
        if(that.params['node'] === that.params['target']){
            posX += that.nodeStartX - that.startX;
            posY += that.nodeStartY - that.startY;
        }else{
            posX -= that.dimensions['target']['absoluteX1'];
            posY -= that.dimensions['target']['absoluteY1'];
        }
        that.setPosition(posX, posY, true);
    };

    /* ******* MAIN ******* */

    that.getDimensions = function(){
        that.dimensions['target'] = cm.getFullRect(that.params['target']);
        that.dimensions['node'] = cm.getFullRect(that.params['node']);
        that.dimensions['limiter'] = cm.getFullRect(that.params['limiter']);
        return that.dimensions;
    };

    that.setPosition = function(posX, posY, triggerEvents){
        var nodePosY,
            nodePosX;
        triggerEvents = typeof triggerEvents == 'undefined'? true : triggerEvents;
        // Check limit
        if(that.params['limiter']){
            if(posY < 0){
                posY = 0;
            }else if(posY > that.dimensions['limiter']['absoluteHeight']){
                posY = that.dimensions['limiter']['absoluteHeight'];
            }
            if(posX < 0){
                posX = 0;
            }else if(posX > that.dimensions['limiter']['absoluteWidth']){
                posX = that.dimensions['limiter']['absoluteWidth'];
            }
        }
        // Limiters
        if(!isNaN(that.params['minY']) && posY < that.params['minY']){
            posY = that.params['minY'];
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
        if(triggerEvents){
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