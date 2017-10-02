cm.define('Com.Tooltip', {
    'modules' : [
        'Params',
        'Events',
        'Langs'
    ],
    'events' : [
        'onRender',
        'onShowStart',
        'onShow',
        'onHideStart',
        'onHide'
    ],
    'params' : {
        'target' : cm.Node('div'),
        'targetEvent' : 'hover',                        // hover | click | none
        'hideOnReClick' : false,                        // Hide tooltip when re-clicking on the target, requires setting value 'targetEvent' : 'click'
        'hideOnOut' : true,
        'hold' : false,
        'preventClickEvent' : false,                    // Prevent default click event on the target, requires setting value 'targetEvent' : 'click'
        'top' : 0,                                      // Supported properties: targetHeight, selfHeight, number
        'left' : 0,                                     // Supported properties: targetWidth, selfWidth, number
        'width' : 'auto',                               // Supported properties: targetWidth, auto, number
        'minWidth' : 0,
        'duration' : 'cm._config.animDurationShort',
        'delay' : 0,
        'resizeInterval' : 5,
        'disabled' : false,
        'position' : 'absolute',
        'className' : '',
        'theme' : 'theme-default',
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

    that.isHideProcess = false;
    that.isShowProcess = false;
    that.isShow = false;
    that.isWindowEvent = false;
    that.disabled = false;

    var init = function(){
        //
        that.windowEventHandler = windowEvent.bind(that);
        that.targetEventHandler = targetEvent.bind(that);
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
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
        // Add position style
        that.nodes['container'].style.position = that.params['position'];
        // Add theme css class
        !cm.isEmpty(that.params['theme']) && cm.addClass(that.nodes['container'], that.params['theme']);
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
        setTargetEvent();
    };

    var targetEvent = function(){
        if(!that.disabled){
            if(that.isShow && that.params['targetEvent'] == 'click' && that.params['hideOnReClick']){
                hide();
            }else{
                show();
            }
        }
    };

    var setTargetEvent = function(){
        // Hold
        if(that.params['hold']){
            cm.appendChild(that.nodes['container'], that.params['target']);
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
        that.triggerEvent('onShow');
    };

    var hide = function(immediately){
        if((that.isShow || that.isShowProcess) && !that.isHideProcess){
            that.isHideProcess = true;
            // Hide Handler
            clearDelayInterval();
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
        that.triggerEvent('onHideStart');
        clearResizeInterval();
        removeWindowEvent();
        that.nodes['container'].style.display = 'none';
        if(that.params['hold']){
            cm.appendChild(that.nodes['container'], that.params['target']);
        }else{
            cm.remove(that.nodes['container']);
        }
        that.isShow = false;
        that.isShowProcess = false;
        that.isHideProcess = false;
        that.triggerEvent('onHide');
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var targetWidth =  that.params['target'].offsetWidth,
            targetHeight = that.params['target'].offsetHeight,
            selfHeight = that.nodes['container'].offsetHeight,
            selfWidth = that.nodes['container'].offsetWidth,
            pageSize = cm.getPageSize(),
            scrollTop = cm.getScrollTop(window),
            scrollLeft = cm.getScrollLeft(window);
        // Calculate size
        (function(){
            var width = 0,
                minWidth = 0;
            if(that.params['minWidth'] !== 'auto'){
                minWidth = eval(
                    that.params['minWidth']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('selfWidth', selfWidth)
                );
                that.nodes['container'].style.minWidth =  [minWidth, 'px'].join('');
            }
            if(that.params['width'] !== 'auto'){
                width = eval(
                    that.params['width']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('selfWidth', selfWidth)
                );
                width = Math.max(minWidth, width);
                if(width !== selfWidth){
                    that.nodes['container'].style.width =  [width, 'px'].join('');
                    selfWidth = that.nodes['container'].offsetWidth;
                    selfHeight = that.nodes['container'].offsetHeight;
                }
            }
        })();
        // Calculate position
        (function(){
            var top = cm.getRealY(that.params['target']),
                topAdd = eval(
                    that.params['top']
                        .toString()
                        .replace('targetHeight', targetHeight)
                        .replace('selfHeight', selfHeight)
                ),
                left =  cm.getRealX(that.params['target']),
                leftAdd = eval(
                    that.params['left']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('selfWidth', selfWidth)
                ),
                positionTop,
                positionLeft;
            // Calculate adaptive or static vertical position
            if(that.params['adaptiveY']){
                positionTop = Math.max(
                    Math.min(
                        ((top + topAdd + selfHeight > pageSize['winHeight'])
                                ? (top - topAdd - selfHeight + targetHeight)
                                : (top + topAdd)
                        ),
                        (pageSize['winHeight'] - selfHeight)
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
                        ((left + leftAdd + selfWidth > pageSize['winWidth'])
                                ? (left - leftAdd - selfWidth + targetWidth)
                                : (left + leftAdd)
                        ),
                        (pageSize['winWidth'] - selfWidth)
                    ),
                    0
                );
            }else{
                positionLeft = left + leftAdd;
            }
            // Fix scroll position for absolute
            if(that.params['position'] == 'absolute'){
                if(that.params['container'] == document.body){
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
            if(positionTop != that.nodes['container'].offsetTop){
                that.nodes['container'].style.top =  [positionTop, 'px'].join('');
            }
            if(positionLeft != that.nodes['container'].offsetLeft){
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
        that.params['target'] = node || cm.Node('div');
        setTargetEvent();
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

    // Deprecated
    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});