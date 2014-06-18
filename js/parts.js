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