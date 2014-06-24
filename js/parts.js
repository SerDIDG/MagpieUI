Part['Menu'] = (function(){
    var processedNodes = [],
        menus;

    return function(container){
        container = typeof container == 'undefined'? document.body : container;
        menus = cm.getByClass('cm-menu', container);
        cm.forEach(menus, function(node){
            if(!cm.inArray(processedNodes, node)){
                var drop = cm.getByClass('cm-menu-dropdown', node)[0],
                    target;
                cm.addEvent(node, 'mousedown', function(e){
                    e = cm.getEvent(e);
                    target = cm.getObjFromEvent(e);
                    if(!cm.isParent(drop, target, true)){
                        if(cm.isClass(node, 'is-show')){
                            cm.removeClass(node, 'is-show');
                        }else{
                            cm.preventDefault(e);
                            cm.addClass(node, 'is-show');
                        }
                    }
                });
                cm.addEvent(document.body, 'mousedown', function(e){
                    e = cm.getEvent(e);
                    target = cm.getObjFromEvent(e);
                    if(!cm.isParent(node, target, true)){
                        cm.removeClass(node, 'is-show');
                    }
                });
                processedNodes.push(node);
            }
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