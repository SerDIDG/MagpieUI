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
        'preventClickEvent' : false,                    // Prevent default click event on the target, requires setting value 'targetEvent' : 'click'
        'top' : 0,                                      // Supported properties: targetHeight, selfHeight, number
        'left' : 0,                                     // Supported properties: targetWidth, selfWidth, number
        'width' : 'auto',                               // Supported properties: targetWidth, auto, number
        'duration' : false,
        'delay' : 0,
        'position' : 'absolute',
        'className' : '',
        'theme' : 'theme-default',
        'adaptive' : true,
        'adaptiveX' : true,
        'adaptiveY' : true,
        'title' : '',
        'titleTag' : 'h3',
        'content' : cm.Node('div'),
        'container' : 'document.body'
    }
},
function(params){
    var that = this,
        anim;
    
    that.nodes = {};
    that.delay = null;
    that.isHideProcess = false;
    that.isShowProcess = false;
    that.isShow = false;
    that.isWindowEvent = false;
    that.disabled = false;

    var init = function(){
        getCSSHelpers();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        setMiscEvents();
        that.triggerEvent('onRender');
    };

    var getCSSHelpers = function(){
        if(!cm.isNumber(that.params['duration'])){
            that.params['duration'] = cm.getTransitionDurationFromRule('.com__tooltip-helper__duration');
        }
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
        cm.setCSSTransitionDuration(that.nodes['container'], that.params['duration']);
        cm.addIsolateScrolling(that.nodes['content']);
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
        anim = new cm.Animation(that.nodes['container']);
        // Add target event
        if(that.params['preventClickEvent']){
            that.params['target'].onclick = function(e){
                cm.preventDefault(e);
            };
        }
        setTargetEvent();
        // Check position
        animFrame(getPosition);
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
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.addEvent(that.params['target'], 'mouseover', targetEvent, true);
                break;
            case 'click' :
                cm.addEvent(that.params['target'], 'click', targetEvent, true);
                break;
        }
    };

    var removeTargetEvent = function(){
        switch(that.params['targetEvent']){
            case 'hover' :
                cm.removeEvent(that.params['target'], 'mouseover', targetEvent);
                break;
            case 'click' :
                cm.removeEvent(that.params['target'], 'click', targetEvent);
                break;
        }
    };

    var show = function(immediately){
        if(!that.isShow){
            that.isShow = true;
            that.isShowProcess = true;
            that.triggerEvent('onShowStart');
            // Append child tooltip into body and set position
            that.params['container'].appendChild(that.nodes['container']);
            // Show tooltip
            that.nodes['container'].style.display = 'block';
            setWindowEvent();
            // Animate
            that.delay && clearTimeout(that.delay);
            if(immediately){
                cm.addClass(that.nodes['container'], 'is-immediately');
                showHandler(immediately);
                that.delay = setTimeout(function(){
                    cm.removeClass(that.nodes['container'], 'is-immediately');
                }, 5);
            }else if(that.params['delay'] && !that.isHideProcess){
                that.delay = setTimeout(function(){
                    showHandler();
                }, that.params['delay']);
            }else{
                showHandler();
            }
        }
    };

    var showHandler = function(immediately){
        if(immediately || !that.params['duration']){
            that.isShowProcess = false;
            that.isHideProcess = false;
            cm.addClass(that.nodes['container'], 'is-show', true);
            that.triggerEvent('onShow');
        }else{
            cm.addClass(that.nodes['container'], 'is-show', true);
            that.delay = setTimeout(function(){
                that.isShowProcess = false;
                that.isHideProcess = false;
                that.triggerEvent('onShow');
            }, that.params['duration']);
        }
    };

    var hide = function(immediately){
        if(that.isShow){
            that.isShow = false;
            that.isHideProcess = true;
            that.triggerEvent('onHideStart');
            // Animate
            that.delay && clearTimeout(that.delay);
            if(immediately){
                cm.addClass(that.nodes['container'], 'is-immediately');
                hideHandler(immediately);
                that.delay = setTimeout(function(){
                    cm.removeClass(that.nodes['container'], 'is-immediately');
                }, 5);
            }else if(that.params['delay'] && !that.isShowProcess){
                that.delay = setTimeout(function(){
                    hideHandler();
                }, that.params['delay']);
            }else{
                hideHandler();
            }
        }
    };

    var hideHandler = function(immediately){
        if(immediately || !that.params['duration']){
            that.isShowProcess = false;
            that.isHideProcess = false;
            removeWindowEvent();
            cm.removeClass(that.nodes['container'], 'is-show', true);
            cm.remove(that.nodes['container']);
            that.triggerEvent('onHide');
        }else{
            cm.removeClass(that.nodes['container'], 'is-show', true);
            that.delay = setTimeout(function(){
                that.isShowProcess = false;
                that.isHideProcess = false;
                removeWindowEvent();
                cm.remove(that.nodes['container']);
                that.triggerEvent('onHide');
            }, that.params['duration']);
        }
    };

    var getPosition = function(){
        if(that.isShow){
            var targetWidth =  that.params['target'].offsetWidth,
                targetHeight = that.params['target'].offsetHeight,
                selfHeight = that.nodes['container'].offsetHeight,
                selfWidth = that.nodes['container'].offsetWidth,
                pageSize = cm.getPageSize(),
                scrollTop = cm.getScrollTop(window),
                scrollLeft = cm.getScrollLeft(window);
            // Calculate size
            (function(){
                if(that.params['width'] != 'auto'){
                    var width = eval(
                        that.params['width']
                            .toString()
                            .replace('targetWidth', targetWidth)
                    );
                    if(width != selfWidth){
                        that.nodes['container'].style.width =  [width, 'px'].join('');
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
        }
        animFrame(getPosition);
    };

    var setWindowEvent = function(){
        if(that.params['hideOnOut'] && !that.isWindowEvent){
            that.isWindowEvent = true;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.addEvent(window, 'mousemove', windowEvent);
                    break;
                case 'click' :
                default :
                    cm.addEvent(window, 'mousedown', windowEvent);
                    break;
            }
        }
    };

    var removeWindowEvent = function(){
        if(that.params['hideOnOut'] && that.isWindowEvent){
            that.isWindowEvent = false;
            switch(that.params['targetEvent']){
                case 'hover' :
                    cm.removeEvent(window, 'mousemove', windowEvent);
                    break;
                case 'click' :
                default :
                    cm.removeEvent(window, 'mousedown', windowEvent);
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
        that.delay && clearTimeout(that.delay);
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