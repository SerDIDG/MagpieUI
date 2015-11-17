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
        'duration' : 'cm._config.animDurationQuick',
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
    that.isShow = false;
    that.disabled = false;

    var init = function(){
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
                hide(false);
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
            // Append child tooltip into body and set position
            that.params['container'].appendChild(that.nodes['container']);
            // Show tooltip
            that.nodes['container'].style.display = 'block';
            // Animate
            anim.go({'style' : {'opacity' : 1}, 'duration' : immediately? 0 : that.params['duration'], 'onStop' : function(){
                that.triggerEvent('onShow');
            }});
            // Add document target event
            if(that.params['hideOnOut']){
                switch(that.params['targetEvent']){
                    case 'hover' :
                        cm.addEvent(document, 'mouseover', bodyEvent);
                        break;
                    case 'click' :
                    default :
                        cm.addEvent(document, 'mousedown', bodyEvent);
                        break;
                }
            }
            that.triggerEvent('onShowStart');
        }
    };

    var hide = function(immediately){
        if(that.isShow){
            that.isShow = false;
            // Remove document target event
            if(that.params['hideOnOut']){
                switch(that.params['targetEvent']){
                    case 'hover' :
                        cm.removeEvent(document, 'mouseover', bodyEvent);
                        break;
                    case 'click' :
                    default :
                        cm.removeEvent(document, 'mousedown', bodyEvent);
                        break;
                }
            }
            // Animate
            anim.go({'style' : {'opacity' : 0}, 'duration' : immediately? 0 : that.params['duration'], 'onStop' : function(){
                that.nodes['container'].style.display = 'none';
                cm.remove(that.nodes['container']);
                that.triggerEvent('onHide');
            }});
            that.triggerEvent('onHideStart');
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

    var bodyEvent = function(e){
        if(that.isShow){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(that.nodes['container'], target, true) && !cm.isParent(that.params['target'], target, true)){
                hide(false);
            }
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