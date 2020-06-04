cm.define('Com.Tooltip', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onShowEnd',
        'onHideStart',
        'onHide',
        'onHideEnd'
    ],
    'params' : {
        'customEvents' : true,
        'name' : '',
        'target' : cm.node('div'),
        'targetEvent' : 'hover',                        // hover | click | none
        'hideOnReClick' : false,                        // Hide tooltip when re-clicking on the target, requires setting value 'targetEvent' : 'click'
        'hideOnSelfClick' : false,                      // Hide tooltip when clicked on own content
        'hideOnOut' : true,                             // Hide content when clicked / mouseover outside own content
        'autoHide' : false,
        'autoHideDelay' : 'cm._config.autoHideDelay',
        'hold' : false,                                 // After close hold content in specified node from 'holdTarget' parameter
        'holdTarget' : false,
        'preventClickEvent' : false,                    // Prevent default click event on the target, requires setting value 'targetEvent' : 'click'
        'positionTarget' : false,                       // Override target node for calculation position and dimensions
        'top' : 0,                                      // Supported properties: targetHeight, selfHeight, screenHeight, number
        'left' : 0,                                     // Supported properties: targetWidth, selfWidth, screenWidth, number
        'width' : 'auto',                               // Supported properties: targetWidth, screenWidth, auto, number
        'height' : 'auto',
        'minWidth' : 0,
        'adaptiveFrom' : null,
        'adaptiveTop' : null,
        'adaptiveLeft' : null,
        'adaptiveWidth' : null,
        'adaptiveHeight' : null,
        'scroll' : 'auto',                              // auto, scroll, visible
        'duration' : 'cm._config.animDurationShort',
        'delay' : 0,
        'resizeInterval' : 5,
        'disabled' : false,
        'position' : 'absolute',
        'className' : '',
        'theme' : 'theme-default',
        'animate' : false,
        'arrow' : false,
        'adaptive' : true,
        'adaptiveX' : true,
        'adaptiveY' : true,
        'title' : '',
        'titleTag' : 'h3',
        'content' : cm.node('div'),
        'container' : 'document.body'
    }
},
function(params){
    var that = this;
    
    that.nodes = {};
    that.animation = null;
    that.delayInterval = null;
    that.resizeInterval = null;
    that.autoHideInterval = null;

    that.isDestructed = false;
    that.isHideProcess = false;
    that.isShowProcess = false;
    that.isShow = false;
    that.isWindowEvent = false;
    that.disabled = false;

    var init = function(){
        // Bind context
        that.windowEventHandler = windowEvent.bind(that);
        that.targetEventHandler = targetEvent.bind(that);
        that.destructHandler = that.destruct.bind(that);
        // Params
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        setMiscEvents();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!that.params['adaptive']){
            that.params['adaptiveX'] = false;
            that.params['adaptiveY'] = false;
        }
        that.params['position'] = cm.inArray(['absolute', 'fixed'], that.params['position'])? that.params['position'] : 'absolute';
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.Node('div', {'class' : 'com__tooltip'},
            that.nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                that.nodes['content'] = cm.Node('div', {'class' : 'scroll'})
            )
        );
        cm.isString(that.params['scroll']) && cm.addClass(that.nodes['content'], ['is', that.params['scroll']].join('-'));
        // Add position style
        that.nodes['container'].style.position = that.params['position'];
        // Add theme css class
        !cm.isEmpty(that.params['theme']) && cm.addClass(that.nodes['container'], that.params['theme']);
        !cm.isEmpty(that.params['animate']) && cm.addClass(that.nodes['container'], ['animate', that.params['animate']].join('--'));
        !cm.isEmpty(that.params['arrow']) && cm.addClass(that.nodes['container'], ['arrow', that.params['arrow']].join('--'));
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(that.nodes['container'], that.params['className']);
        // Set title
        renderTitle(that.params['title']);
        // Embed content
        renderContent(that.params['content']);
        // Disabled / Enabled
        if(that.params['disabled']){
            that.disable();
        }else{
            that.enable();
        }
    };

    var renderTitle = function(title){
        cm.remove(that.nodes['title']);
        if(!cm.isEmpty(title)){
            that.nodes['title'] = cm.Node('div', {'class' : 'title'},
                cm.Node(that.params['titleTag'], title)
            );
            cm.insertFirst(that.nodes['title'], that.nodes['inner']);
        }
    };

    var renderContent = function(node){
        cm.clearNode(that.nodes['content']);
        if(node){
            that.nodes['content'].appendChild(node);
        }
    };

    var setMiscEvents = function(){
        // Init animation
        that.animation = new cm.Animation(that.nodes['container']);
        // Add target event
        if(that.params['preventClickEvent']){
            cm.addEvent(that.params['target'], 'click', function(e){
                cm.preventDefault(e);
            });
        }
        // Hide on self click
        if(that.params['hideOnSelfClick']){
            cm.addEvent(that.nodes['container'], 'click', function(){
                that.hide();
            });
        }
        // Add custom events
        if(that.params['customEvents']){
            cm.customEvent.add(that.getStackNode(), 'destruct', that.destructHandler);
        }
        setTargetEvent();
    };

    var targetEvent = function(){
        if(!that.disabled){
            if(that.isShow && that.params['targetEvent'] === 'click' && that.params['hideOnReClick']){
                hide();
            }else{
                show();
            }
        }
    };

    var setTargetEvent = function(){
        // Hold
        if(that.params['hold']){
            var holdTarget = that.params['holdTarget'] || that.params['target'];
            cm.appendChild(that.nodes['container'], holdTarget);
        }
        // Event
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.addEvent(that.params['target'], 'mouseover', that.targetEventHandler, true);
                break;
            case 'click' :
                cm.addEvent(that.params['target'], 'click', that.targetEventHandler, true);
                break;
        }
    };

    var removeTargetEvent = function(){
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.removeEvent(that.params['target'], 'mouseover', that.targetEventHandler);
                break;
            case 'click' :
                cm.removeEvent(that.params['target'], 'click', that.targetEventHandler);
                break;
        }
    };

    var show = function(immediately){
        if((!that.isShow && !that.isShowProcess) || that.isHideProcess){
            that.isShowProcess = true;
            setWindowEvent();
            // Show Handler
            clearDelayInterval();
            clearAutoHideInterval();
            if(immediately){
                showHandler(immediately);
            }else if(that.params['delay'] && !that.isHideProcess){
                that.delayInterval = setTimeout(showHandler, that.params['delay']);
            }else{
                showHandler();
            }
        }
    };

    var showHandler = function(immediately){
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        that.nodes['container'].style.display = 'block';
        resizeHelper();
        that.triggerEvent('onShowStart');
        // Animate
        cm.replaceClass(that.nodes['container'], 'id-hide', 'is-show', true);
        if(immediately || !that.params['duration']){
            showHandlerEnd();
        }else{
            that.animation.stop();
            that.animation.go({
                'style' : {'opacity' : 1},
                'duration' : that.params['duration'],
                'anim' : 'smooth',
                'onStop' : showHandlerEnd
            });
        }
    };

    var showHandlerEnd = function(){
        that.nodes['container'].style.opacity = 1;
        that.isShow = true;
        that.isShowProcess = false;
        that.isHideProcess = false;
        autoHideHandler();
        that.triggerEvent('onShow');
        that.triggerEvent('onShowEnd');
    };

    var hide = function(immediately){
        if((that.isShow || that.isShowProcess) && !that.isHideProcess){
            that.isHideProcess = true;
            // Hide Handler
            clearDelayInterval();
            clearAutoHideInterval();
            if(immediately){
                hideHandler(immediately);
            }else if(that.params['delay'] && !that.isShowProcess){
                that.delayInterval = setTimeout(hideHandler, that.params['delay']);
            }else{
                hideHandler(false);
            }
        }
    };

    var hideHandler = function(immediately){
        that.triggerEvent('onHideStart');
        // Animate
        cm.replaceClass(that.nodes['container'], 'is-show', 'id-hide', true);
        if(immediately || !that.params['duration']){
            hideHandlerEnd();
        }else{
            that.animation.go({
                'style' : {'opacity' : 0},
                'duration' : that.params['duration'],
                'anim' : 'smooth',
                'onStop' : hideHandlerEnd
            });
        }
    };

    var hideHandlerEnd = function(){
        clearResizeInterval();
        removeWindowEvent();
        that.nodes['container'].style.display = 'none';
        if(that.params['hold']){
            var holdTarget = that.params['holdTarget'] || that.params['target'];
            cm.appendChild(that.nodes['container'], holdTarget);
        }else{
            cm.remove(that.nodes['container']);
        }
        that.isShow = false;
        that.isShowProcess = false;
        that.isHideProcess = false;
        that.triggerEvent('onHide');
        that.triggerEvent('onHideEnd');
    };

    var autoHideHandler = function(){
        if(that.params['autoHide']){
            clearAutoHideInterval();
            that.autoHideInterval = setTimeout(hide, that.params['autoHideDelay']);
        }
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var target = that.params['positionTarget'] || that.params['target'],
            targetWidth =  target.offsetWidth,
            targetHeight = target.offsetHeight,
            selfHeight = that.nodes['container'].offsetHeight,
            selfWidth = that.nodes['container'].offsetWidth,
            pageSize = cm.getPageSize(),
            screenWidth = pageSize['winWidth'],
            screenHeight = pageSize['winHeight'],
            scrollTop = cm.getScrollTop(window),
            scrollLeft = cm.getScrollLeft(window),
            paramsTop = that.params['top'],
            paramsLeft = that.params['left'],
            paramsWidth = that.params['width'],
            paramsHeight = that.params['height'];
        // Validate
        if(!cm.isEmpty(that.params['adaptiveFrom']) && that.params['adaptiveFrom'] >= screenWidth){
            paramsTop = !cm.isEmpty(that.params['adaptiveTop']) ? that.params['adaptiveTop'] : paramsTop;
            paramsLeft = !cm.isEmpty(that.params['adaptiveLeft']) ? that.params['adaptiveLeft'] : paramsLeft;
            paramsWidth = !cm.isEmpty(that.params['adaptiveWidth']) ? that.params['adaptiveWidth'] : paramsWidth;
            paramsHeight = !cm.isEmpty(that.params['adaptiveHeight']) ? that.params['adaptiveHeight'] : paramsHeight;
        }
        // Calculate size
        (function(){
            var width = 0,
                height = 0,
                minWidth = 0;
            if(that.params['minWidth'] !== 'auto'){
                minWidth = eval(
                    that.params['minWidth']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('screenWidth', screenWidth)
                        .replace('selfWidth', selfWidth)
                );
                minWidth = Math.min(screenWidth, minWidth);
                that.nodes['container'].style.minWidth =  [minWidth, 'px'].join('');
            }
            if(paramsWidth !== 'auto'){
                width = eval(
                    paramsWidth
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('screenWidth', screenWidth)
                        .replace('selfWidth', selfWidth)
                );
                width = Math.max(minWidth, width);
                width = Math.min(screenWidth, width);
                if(width !== selfWidth){
                    that.nodes['container'].style.width =  [width, 'px'].join('');
                }
            }
            if(paramsHeight !== 'auto'){
                height = eval(
                    paramsHeight
                        .toString()
                        .replace('targetHeight', targetHeight)
                        .replace('screenHeight', screenHeight)
                        .replace('selfHeight', selfHeight)
                );
                height = Math.min(screenHeight, height);
                that.nodes['content'].style.maxHeight =  [height, 'px'].join('');
            }
            selfWidth = that.nodes['container'].offsetWidth;
            selfHeight = that.nodes['container'].offsetHeight;
        })();
        // Calculate position
        (function(){
            var top = cm.getRealY(target),
                topAdd = eval(
                    paramsTop
                        .toString()
                        .replace('targetHeight', targetHeight)
                        .replace('screenHeight', screenHeight)
                        .replace('selfHeight', selfHeight)
                ),
                left =  cm.getRealX(target),
                leftAdd = eval(
                    paramsLeft
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('screenWidth', screenWidth)
                        .replace('selfWidth', selfWidth)
                ),
                positionTop,
                positionLeft;
            // Calculate adaptive or static vertical position
            if(that.params['adaptiveY']){
                positionTop = Math.max(
                    Math.min(
                        ((top + topAdd + selfHeight > screenHeight)
                            ? (top - topAdd - selfHeight + targetHeight)
                            : (top + topAdd)
                        ),
                        (screenHeight - selfHeight)
                    ),
                    0
                );
            }else{
                positionTop = top + topAdd;
            }
            // Calculate adaptive or static horizontal position
            if(that.params['adaptiveX']){
                positionLeft = Math.max(
                    Math.min(
                        ((left + leftAdd + selfWidth > screenWidth)
                            ? (left - leftAdd - selfWidth + targetWidth)
                            : (left + leftAdd)
                        ),
                        (screenWidth - selfWidth)
                    ),
                    0
                );
            }else{
                positionLeft = left + leftAdd;
            }
            // Fix scroll position for absolute
            if(that.params['position'] === 'absolute'){
                if(that.params['container'] === document.body){
                    positionTop += scrollTop;
                    positionLeft += scrollLeft;
                }else{
                    positionTop -= cm.getRealY(that.params['container']);
                    positionLeft -= cm.getRealX(that.params['container']);
                }
            }
            positionTop = Math.round(positionTop);
            positionLeft = Math.round(positionLeft);
            // Apply styles
            if(positionTop !== that.nodes['container'].offsetTop){
                that.nodes['container'].style.top =  [positionTop, 'px'].join('');
            }
            if(positionLeft !== that.nodes['container'].offsetLeft){
                that.nodes['container'].style.left = [positionLeft, 'px'].join('');
            }
        })();
    };

    var setWindowEvent = function(){
        if(that.params['hideOnOut'] && !that.isWindowEvent){
            that.isWindowEvent = true;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.addEvent(window, 'mousemove', that.windowEventHandler);
                    break;
                case 'click' :
                default :
                    cm.addEvent(window, 'mousedown', that.windowEventHandler);
                    break;
            }
        }
    };

    var removeWindowEvent = function(){
        if(that.params['hideOnOut'] && that.isWindowEvent){
            that.isWindowEvent = false;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.removeEvent(window, 'mousemove', that.windowEventHandler);
                    break;
                case 'click' :
                default :
                    cm.removeEvent(window, 'mousedown', that.windowEventHandler);
                    break;
            }
        }
    };

    var windowEvent = function(e){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(that.nodes['container'], target, true) && !cm.isParent(that.params['target'], target, true)){
            hide(false);
        }else{
            show(true);
        }
    };

    var clearResizeInterval = function(){
        that.resizeInterval && clearTimeout(that.resizeInterval);
        that.resizeInterval = null;
    };

    var clearDelayInterval = function(){
        that.delayInterval && clearTimeout(that.delayInterval);
        that.delayInterval = null;
    };

    var clearAutoHideInterval = function(){
        that.autoHideInterval && clearTimeout(that.autoHideInterval);
        that.autoHideInterval = null;
    };

    /* ******* MAIN ******* */

    that.setTitle = function(title){
        renderTitle(title);
        return that;
    };

    that.setContent = function(node){
        renderContent(node);
        return that;
    };

    that.setTarget = function(node){
        removeTargetEvent();
        that.params['target'] = node || cm.node('div');
        setTargetEvent();
        return that;
    };

    that.setContainer = function(node){
        if(cm.isNode(node)){
            that.params['container'] = node;
        }
        return that;
    };

    that.show = function(immediately){
        show(immediately);
        return that;
    };

    that.hide = function(immediately){
        hide(immediately);
        return that;
    };

    that.disable = function(){
        that.disabled = true;
        return that;
    };

    that.enable = function(){
        that.disabled = false;
        return that;
    };

    that.scrollToNode = function(node){
        if(cm.isNode(node) && cm.isParent(that.nodes['content'], node)){
            that.nodes['content'].scrollTop = node.offsetTop - that.nodes['content'].offsetTop;
        }
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(that.nodes['container'], node, true);
    };

    that.remove = function(){
        hide(true);
        removeTargetEvent();
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(that.getStackNode(), 'destruct', {
                'direction' : 'child',
                'self' : false
            });
            cm.customEvent.remove(that.getStackNode(), 'destruct', that.destructHandler);
            that.removeFromStack();
            that.remove();
        }
        return that;
    };

    // Deprecated
    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});