Com['Tooltip'] = function(o){
    var that = this,
        config = cm.merge({
            'target' : cm.Node('div'),
            'targetEvent' : 'hover',        // hover | click | none
            'hideOnReClick' : false,        // Hide tooltip when re-clicking on the target, requires setting value 'targetEvent' : 'click'
            'preventClickEvent' : false,    // Prevent default click event on the target, requires setting value 'targetEvent' : 'click'
            'top' : 0,                      // Supported properties: targetHeight, selfWidth
            'left' : 0,                     // Supported properties: targetWidth, selfWidth
            'width' : 'auto',               // Supported properties: targetWidth | auto
            'className' : '',
            'adaptive' : true,
            'title' : '',
            'titleTag' : 'h3',
            'content' : cm.Node('div'),
            'container' : document.body,
            'events' : {}
        }, o),
        API = {
            'onShowStart' : [],
            'onShow' : [],
            'onHideStart' : [],
            'onHide' : []
        },
        checkInt,
        anim,
        isHide = true,
        nodes = {};

    var init = function(){
        // Convert events to API Events
        convertEvents(config['events']);
        // Render structure
        render();
        setMiscEvents();
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-tooltip'},
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['content'] = cm.Node('div', {'class' : 'scroll'})
            )
        );
        // Add css class
        !cm.isEmpty(config['className']) && cm.addClass(nodes['container'], config['className']);
        // Set title
        renderTitle(config['title']);
        // Embed content
        renderContent(config['content']);
    };

    var renderTitle = function(title){
        cm.remove(nodes['title']);
        if(!cm.isEmpty(title)){
            nodes['title'] = cm.Node('div', {'class' : 'title'},
                cm.Node(config['titleTag'], title)
            );
            cm.insertFirst(nodes['title'], nodes['inner']);
        }
    };

    var renderContent = function(node){
        cm.clearNode(nodes['content']);
        if(node){
            nodes['content'].appendChild(node);
        }
    };

    var setMiscEvents = function(){
        // Init animation
        anim = new cm.Animation(nodes['container']);
        // Add target event
        if(config['preventClickEvent']){
            config['target'].onclick = function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
            };
        }
        setTargetEvent();
    };

    var targetEvent = function(){
        if(!isHide && config['targetEvent'] == 'click' && config['hideOnReClick']){
            hide(false);
        }else{
            show();
        }
    };

    var setTargetEvent = function(){
        switch(config['targetEvent']){
            case 'hover' :
                cm.addEvent(config['target'], 'mouseover', targetEvent);
                break;
            case 'click' :
                cm.addEvent(config['target'], 'click', targetEvent);
                break;
        }
    };

    var removeTargetEvent = function(){
        switch(config['targetEvent']){
            case 'hover' :
                cm.removeEvent(config['target'], 'mouseover', targetEvent);
                break;
            case 'click' :
                cm.removeEvent(config['target'], 'click', targetEvent);
                break;
        }
    };

    var show = function(){
        if(isHide){
            isHide = false;
            // Append child tooltip into body and set position
            config['container'].appendChild(nodes['container']);
            getPosition();
            // Show tooltip
            nodes['container'].style.display = 'block';
            // Check position
            checkInt = setInterval(getPosition, 5);
            // Animate
            anim.go({'style' : {'opacity' : 1}, 'duration' : 100, 'onStop' : function(){
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onShow');
            }});
            // Add document target event
            switch(config['targetEvent']){
                case 'hover' :
                    cm.addEvent(document, 'mouseover', bodyEvent);
                    break;
                case 'click' :
                    cm.addEvent(document, 'mousedown', bodyEvent);
                    break;
            }
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onShowStart');
        }
    };

    var hide = function(immediately){
        if(!isHide){
            isHide = true;
            // Remove event - Check position
            checkInt && clearInterval(checkInt);
            // Remove document target event
            switch(config['targetEvent']){
                case 'hover' :
                    cm.removeEvent(document, 'mouseover', bodyEvent);
                    break;
                case 'click' :
                    cm.removeEvent(document, 'mousedown', bodyEvent);
                    break;
            }
            // Animate
            anim.go({'style' : {'opacity' : 0}, 'duration' : immediately? 0 : 100, 'onStop' : function(){
                nodes['container'].style.display = 'none';
                cm.remove(nodes['container']);
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onHide');
            }});
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onHideStart');
        }
    };

    var getPosition = function(){
        var targetWidth =  config['target'].offsetWidth,
            targetHeight = config['target'].offsetHeight,
            selfHeight = nodes['container'].offsetHeight,
            selfWidth = nodes['container'].offsetWidth,
            pageSize = cm.getPageSize();
        // Calculate size
        (function(){
            if(config['width'] != 'auto'){
                var width = eval(config['width'].toString().replace('targetWidth', targetWidth));

                if(width != selfWidth){
                    nodes['container'].style.width =  [width, 'px'].join('');
                }
            }
        })();
        // Calculate position
        (function(){
            var top = cm.getRealY(config['target']),
                topAdd = eval(
                    config['top']
                        .toString()
                        .replace('targetHeight', targetHeight)
                        .replace('selfHeight', selfHeight)
                ),
                left =  cm.getRealX(config['target']),
                leftAdd = eval(
                    config['left']
                        .toString()
                        .replace('targetWidth', targetWidth)
                        .replace('selfWidth', selfWidth)
                ),
                positionTop = (config['adaptive'] && top + topAdd + selfHeight > pageSize['winHeight']?
                    (top - topAdd - selfHeight + targetHeight) : top + topAdd
                ),
                positionLeft = (config['adaptive'] && left + leftAdd + selfWidth > pageSize['winWidth']?
                    (left - leftAdd - selfWidth + targetWidth) : left + leftAdd
                );

            if(positionTop != nodes['container'].offsetTop){
                nodes['container'].style.top =  [positionTop, 'px'].join('');
            }
            if(positionLeft != nodes['container'].offsetLeft){
                nodes['container'].style.left = [positionLeft, 'px'].join('');
            }
        })();
    };

    var bodyEvent = function(e){
        if(!isHide){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(nodes['container'], target, true) && !cm.isParent(config['target'], target, true)){
                hide(false);
            }
        }
    };

    var executeEvent = function(event){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that);
            });
        };

        switch(event){
            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    /* Main */

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
        config['target'] = node || cm.Node('div');
        setTargetEvent();
        return that;
    };

    that.show = function(){
        show();
        return that;
    };

    that.hide = function(immediately){
        hide(immediately);
        return that;
    };

    that.isHide = function(){
        return isHide;
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

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    that.remove = function(){
        hide(true);
        removeTargetEvent();
        return that;
    };

    init();
};