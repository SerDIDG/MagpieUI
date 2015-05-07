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

    return function(container){
        container = typeof container == 'undefined'? document.body : container;
        var menus = cm.getByClass('pt__menu', container),
            items = [],
            item,
            target;
        cm.forEach(menus, function(node){
            if(!cm.inArray(processedNodes, node)){
                item = {
                    'node' : node,
                    'drop' : cm.getByClass('pt__menu-dropdown', node)[0]
                };
                cm.addEvent(item['node'], 'mouseover', function(e){
                    e = cm.getEvent(e);
                    target = cm.getObjFromEvent(e);
                    if(!cm.isParent(item['drop'], target, true)){
                        checkPosition(item);
                    }
                });
                cm.addEvent(item['node'], 'mousedown', function(e){
                    e = cm.getEvent(e);
                    target = cm.getObjFromEvent(e);
                    if(cm.getStyle(item['drop'], 'visibility') == 'hidden' && !cm.isClass(item['node'], 'is-show')){
                        if(!cm.isParent(item['drop'], target, true)){
                            if(cm.isClass(item['node'], 'is-show')){
                                cm.removeClass(item['node'], 'is-show');
                            }else{
                                cm.preventDefault(e);
                                cm.addClass(item['node'], 'is-show');
                            }
                        }
                    }
                });
                cm.addEvent(document.body, 'mousedown', function(e){
                    e = cm.getEvent(e);
                    target = cm.getObjFromEvent(e);
                    if(!cm.isParent(item['node'], target, true)){
                        cm.removeClass(item['node'], 'is-show');
                    }
                });
                checkPosition(item);
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
            if(cm.isNode(node) && node.tagName.toLowerCase() == 'textarea'){
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
        container = typeof container == 'undefined'? document.body : container;
        nodes = cm.getByClass('cm-autoresize', container);
        cm.forEach(nodes, process);
    };
})();