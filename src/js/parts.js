Part['Menu'] = (function(){
    var processedNodes = [],
        pageSize;

    var checkPosition = function(item){
        pageSize = cm.getPageSize();
        var dropWidth = item['drop'].offsetWidth,
            parentLeft = cm.getX(item['node']),
            parentWidth = item['node'].parentNode && cm.isClass(item['node'].parentNode, 'pt__menu-dropdown') ? item['node'].parentNode.offsetWidth : 0;
        if(dropWidth + parentWidth + parentLeft >= pageSize['winWidth']){
            cm.replaceClass(item['drop'], 'pull-left', 'pull-right');
        }else{
            cm.replaceClass(item['drop'], 'pull-right', 'pull-left');
        }
    };

    var checkPositionHandler = function(e, item){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(item['drop'], target, true)){
            checkPosition(item);
        }
    };

    var clickHandler = function(e, item){
        if(cm._pageSize['winWidth'] > cm._config.adaptiveFrom && !item['_show']){
            item['_interval'] && clearTimeout(item['_interval']);
            item['_interval'] = setTimeout(function(){
                item['_show'] = false;
            }, 500);
            item['_show'] = true;
            var target = cm.getEventTarget(e);
            if(!cm.isParent(item['drop'], target, true)){
                if(cm.isClass(item['node'], 'is-show')){
                    cm.removeClass(item['node'], 'is-show');
                }else{
                    cm.preventDefault(e);
                    cm.addClass(item['node'], 'is-show');
                }
            }
        }
    };

    var cancelHandler = function(e, item){
        var target = cm.getEventTarget(e);
        if(!cm.isParent(item['node'], target, true)){
            cm.removeClass(item['node'], 'is-show');
        }
    };

    var setEvents = function(item){
        cm.addEvent(item['node'], 'pointerenter', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'touchenter', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'mouseover', function(e){
            checkPositionHandler(e, item);
        });
        cm.addEvent(item['node'], 'pointerdown', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(item['node'], 'touchstart', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(item['node'], 'mousedown', function(e){
            clickHandler(e, item);
        });
        cm.addEvent(document.body, 'pointerdown', function(e){
            cancelHandler(e, item);
        });
        cm.addEvent(document.body, 'touchstart', function(e){
            cancelHandler(e, item);
        });
        cm.addEvent(document.body, 'mousedown', function(e){
            cancelHandler(e, item);
        });
        checkPosition(item);
    };

    return function(container){
        container = cm.isUndefined(container)? document.body : container;
        var menus = cm.getByClass('pt__menu', container),
            items = [],
            item;
        cm.forEach(menus, function(node){
            if(!cm.inArray(processedNodes, node) && !cm.hasClass(node, 'is-manual')){
                item = {
                    'node' : node,
                    'drop' : cm.getByClass('pt__menu-dropdown', node)[0]
                };
                if(item['drop']){
                    setEvents(item);
                }
                items.push(item);
                processedNodes.push(node);
            }
        });
        cm.addEvent(window, 'resize', function(){
            cm.forEach(items, function(item){
                checkPosition(item);
            });
        });
    };
})();

Part['Autoresize'] = (function(){
    var processedNodes = [],
        nodes;

    var process = function(node){
        if(!cm.inArray(processedNodes, node)){
            if(cm.isNode(node) && node.tagName.toLowerCase() === 'textarea'){
                var resizeInt,
                    rows,
                    oldRows,
                    matches,
                    lineHeight = cm.getStyle(node, 'lineHeight', true),
                    padding = cm.getStyle(node, 'paddingTop', true)
                        + cm.getStyle(node, 'paddingBottom', true)
                        + cm.getStyle(node, 'borderTopWidth', true)
                        + cm.getStyle(node, 'borderBottomWidth', true);
                cm.addEvent(node, 'scroll', function(){
                    node.scrollTop = 0;
                });
                resizeInt = setInterval(function(){
                    if(!node || !cm.inDOM(node)){
                        clearInterval(resizeInt);
                    }
                    oldRows = rows;
                    matches = node.value.match(/\n/g);
                    rows = matches? matches.length : 0;
                    if(rows !== oldRows){
                        node.style.height = [(rows + 1) * lineHeight + padding, 'px'].join('');
                    }
                }, 5);
            }
            processedNodes.push(node);
        }
    };

    return function(container){
        container = cm.isUndefined(container)? document.body : container;
        nodes = cm.getByClass('cm-autoresize', container);
        cm.forEach(nodes, process);
    };
})();
