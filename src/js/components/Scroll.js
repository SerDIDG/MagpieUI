Com['Scroll'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.node('div'),
            'step' : 15,
            'time' : 50,
            'duration' : 300,
            'nodes' : {},
            'events' : {}
        }, o),
        API = {
            'onScroll' : [],
            'onScrollStart' : [],
            'onScrollEnd' : []
        },
        nodes = {
            'left' : cm.node('div'),
            'right' : cm.node('div'),
            'up' : cm.node('div'),
            'down' : cm.node('div'),
            'scroll' : cm.node('div')
        },
        anim,
        animInterval,
        top,
        left;

    var init = function(){
        convertEvents(config['events']);
        getNodes(config['node'], 'ComScroll');
        render();
    };

    var render = function(){
        // Init animation
        anim = new cm.Animation(nodes['scroll']);
        // Reset
        nodes['scroll'].scrollTop = 0;
        nodes['scroll'].scrollLeft = 0;
        // Events
        cm.addEvent(nodes['up'], 'mousedown', startMoveUp);
        cm.addEvent(nodes['up'], 'mouseup', endAnimation);
        cm.addEvent(nodes['up'], 'mouseout', endAnimation);
        cm.addEvent(nodes['down'], 'mousedown', startMoveDown);
        cm.addEvent(nodes['down'], 'mouseup', endAnimation);
        cm.addEvent(nodes['down'], 'mouseout', endAnimation);
        cm.addEvent(nodes['left'], 'mousedown', startMoveLeft);
        cm.addEvent(nodes['left'], 'mouseup', endAnimation);
        cm.addEvent(nodes['left'], 'mouseout', endAnimation);
        cm.addEvent(nodes['right'], 'mousedown', startMoveRight);
        cm.addEvent(nodes['right'], 'mouseup', endAnimation);
        cm.addEvent(nodes['right'], 'mouseout', endAnimation);
    };

    var startMoveUp = function(){
        endAnimation();
        animInterval = setInterval(moveUp, config['time']);
        moveUp();
    };

    var startMoveDown = function(){
        endAnimation();
        animInterval = setInterval(moveDown, config['time']);
        moveDown();
    };

    var startMoveLeft = function(){
        endAnimation();
        animInterval = setInterval(moveLeft, config['time']);
        moveLeft();
    };

    var startMoveRight = function(){
        endAnimation();
        animInterval = setInterval(moveRight, config['time']);
        moveRight();
    };

    var endAnimation = function(){
        animInterval && clearInterval(animInterval);
    };

    var moveUp = function(){
        top = Math.max((nodes['scroll'].scrollTop - config['step']), 0);
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveDown = function(){
        top = Math.min((nodes['scroll'].scrollTop + config['step']), (nodes['scroll'].scrollHeight - nodes['scroll'].offsetHeight));
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveLeft = function(){
        left = Math.max((nodes['scroll'].scrollLeft - config['step']), 0);
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    var moveRight = function(){
        left = Math.min((nodes['scroll'].scrollLeft + config['step']), (nodes['scroll'].scrollWidth - nodes['scroll'].offsetWidth));
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'amim' : 'simple'});
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var getNodes = function(container, marker){
        if(container){
            var sourceNodes = {};
            if(marker){
                sourceNodes = cm.getNodes(container)[marker] || {};
            }else{
                sourceNodes = cm.getNodes(container);
            }
            nodes = cm.merge(nodes, sourceNodes);
        }
        nodes = cm.merge(nodes, config['nodes']);
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.scrollY = function(num){
        var top = Math.max(Math.min(num, nodes['scroll'].scrollHeight - nodes['scroll'].offsetHeight), 0);
        anim.go({'style' : {'scrollTop' : top}, 'duration' : config['duration'], 'amim' : 'smooth'});
        return that;
    };

    that.scrollX = function(num){
        var left = Math.max(Math.min(num, nodes['scroll'].scrollWidth - nodes['scroll'].offsetWidth), 0);
        anim.go({'style' : {'scrollLeft' : left}, 'duration' : config['duration'], 'amim' : 'smooth'});
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    init();
};
