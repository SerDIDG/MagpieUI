Com.Elements['Draganddrop'] = {};

Com['GetDraganddrop'] = function(id){
    return Com.Elements.Draganddrop[id] || null;
};

Com['Draganddrop'] = function(o){
    var that = this,
        config = cm.merge({
            'draganddrop' : cm.Node('div'),
            'chassisTag' : 'div'
        }, o),
        API = {
            'onInit' : [],
            'onDrop' : []
        },
        areasNodes = [],
        itemsNodes = [],
        areas = [],
        items = [],
        current,
        currentAbove,
        currentAbovePosition,
        currentArea,
        currentAreaPosition;

    var init = function(){
        if(config['draganddrop']){
            // Find drop areas
            areasNodes = cm.getByAttr('data-area', 'true', config['draganddrop']);
            // Init areas
            cm.forEach(areasNodes, initArea);
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onInit');
        }
    };

    var initArea = function(node){
        var item = {
            'node' : node,
            'items' : []
        };
        // Push to global array
        areas.push(item);
        // Fing draggable elements
        itemsNodes = cm.getByAttr('data-draggable', 'true', item['node']);
        // Init draggable nodes
        cm.forEach(itemsNodes, function(node){
            initDraggable(node, item);
        });
    };

    var initDraggable = function(node, parent){
        var item = {
            'node' : node,
            'parent' : parent,
            'drag' : cm.getByAttr('data-drag', 'true', node)[0]
        };
        // Set draggable event on element
        if(item['drag']){
            cm.addEvent(item['drag'], 'mousedown', function(e){
                start(e, item);
            });
        }else{
            cm.addEvent(item['node'], 'mousedown', start);
        }
        // Push to array
        items.push(item);
        item['parent']['items'].push(item);
    };

    var start = function(e, item){
        e = cm.getEvent(e);
        if(e.button){
            return;
        }
        var x = e.clientX,
            y = e.clientY,
            outerX = cm.getRealX(item['node']),
            outerY = cm.getRealY(item['node']);
        // Get offset from element position to cursor
        item['offsetX'] = x - outerX;
        item['offsetY'] = y - outerY;
        // Create clone of draggable element
        document.body.appendChild(
            item['draggable'] = item['node'].cloneNode(true)
        );
        item['draggableAnim'] = new cm.Animation(item['draggable']);
        // Set styles on draggable clone
        cm.addClass(item['draggable'], 'cm-draganddrop-clone');
        with(item['draggable']){
            style.top = [outerY, 'px'].join('');
            style.left = [outerX, 'px'].join('');
            style.width = [item['node'].offsetWidth, 'px'].join('');
        }
        // Set current draggable
        current = item;
        // Calculate element position
        getPosition(areas);
        getPosition(items);
        renderChassisBlocks();
        // Add move event on document
        cm.addClass(document.body, 'cm-draganddrop-body');
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
    };

    var move = function(e){
        e = cm.getEvent(e);
        if(!current['draggable']){
            return;
        }
        var x = e.clientX,
            y = e.clientY,
            offsetX, offsetY;
        // Set new position
        with(current['draggable']){
            style.top = [y - current['offsetY'], 'px'].join('');
            style.left = [x - current['offsetX'], 'px'].join('');
        }
        // Check where we now
        cm.forEach(areas, function(item){
            if(x >= item['x1'] && x < item['x2'] && y >= item['y1'] && y <= item['y2']){
                currentArea = item;
            }
        });
        cm.forEach(items, function(item){
            if(x >= item['x1'] && x < item['x2'] && y >= item['y1'] && y <= item['y2']){
                offsetX = x - item['x1'];
                offsetY = y - item['y1'];
                // If current above not exists or current above not equal previous
                if(!currentAbove || currentAbove['node'] != item['node']){
                    // Animate out previous chassis block
                    hideCurrentAboveChassisBlocks();
                    if(item['node'] != current['node']){
                        currentAbove = item;
                        if(offsetY < (currentAbove['height'] / 2)){
                            currentAbovePosition = 'top';
                            currentAbove['chassisTopAnim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
                        }else{
                            currentAbovePosition = 'bottom';
                            currentAbove['chassisBottomAnim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
                        }
                    }else{
                        currentAbove = false;
                    }
                }else{
                    if(offsetY < (currentAbove['height'] / 2) && currentAbovePosition != 'top'){
                        currentAbovePosition = 'top';
                        currentAbove['chassisTopAnim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
                        currentAbove['chassisBottomAnim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
                    }else if(offsetY >= (currentAbove['height'] / 2) && currentAbovePosition != 'bottom'){
                        currentAbovePosition = 'bottom';
                        currentAbove['chassisTopAnim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
                        currentAbove['chassisBottomAnim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
                    }
                }
            }
        });
        if(!currentAbove && currentArea['node'] != current['parent']['node'] || currentAbove && currentArea['node'] != currentAbove['parent']['node']){
            // Animate out previous chassis block
            hideCurrentAboveChassisBlocks();
        }
    };

    var stop = function(e){
        e = cm.getEvent(e);
        var x = e.clientX,
            y = e.clientY,
            areaNode,
            currentHeight;
        // Calculate last draggable element position
        if(currentArea){
            areaNode = currentArea['node'].appendChild(cm.Node('div'));
            currentArea['y3'] = cm.getRealY(areaNode);
            cm.remove(areaNode);
            if(y < currentArea['y3']){
                currentAreaPosition = 'top';
            }else{
                currentAreaPosition = 'bottom';
            }
        }
        // Drop
        if(currentAbove){
            // Animate chassis blocks
            current['node'].style.width = [currentAbove['width'], 'px'].join('');
            currentHeight = current['node'].offsetHeight;
            current['node'].style.width = 'auto';
            if(currentHeight != currentAbove['height']){
                if(currentAbovePosition == 'top'){
                    currentAbove['chassisTopAnim'].go({'style' : {'height' : [currentHeight, 'px'].join('')}, 'anim' : 'smooth', 'duration' : 400});
                }else{
                    currentAbove['chassisBottomAnim'].go({'style' : {'height' : [currentHeight, 'px'].join('')}, 'anim' : 'smooth', 'duration' : 400});
                }
            }
            // Animate draggable clone
            current['draggableAnim'].go({
                'duration' : 400,
                'anim' : 'smooth',
                'style' : {
                    'top' : [currentAbovePosition == 'top'? currentAbove['y1'] : currentAbove['y2'], 'px'].join(''),
                    'left' : [currentAbove['x1'], 'px'].join(''),
                    'width' : [currentAbove['width'], 'px'].join(''),
                    'opacity' : 1
                },
                'onStop' : function(){
                    // Hide current block
                    hideCurrentBlock();
                    // Append element in new position
                    if(currentAbovePosition == 'top'){
                        cm.insertBefore(current['node'], currentAbove['node']);
                    }else{
                        cm.insertAfter(current['node'], currentAbove['node']);
                    }
                    resetItemArea();
                    removeDraggable();
                }
            });
        }else if(current && currentArea && (currentArea['node'] != current['parent']['node'] || currentAreaPosition == 'bottom')){
            current['draggableAnim'].go({
                'duration' : 400,
                'anim' : 'smooth',
                'style' : {
                    'top' : [currentAreaPosition == 'top'? currentArea['y1'] : currentArea['y3'], 'px'].join(''),
                    'left' : [currentArea['x1'], 'px'].join(''),
                    'width' : [currentArea['width'], 'px'].join(''),
                    'opacity' : 1
                },
                'onStop' : function(){
                    // Hide current block
                    hideCurrentBlock();
                    // Append element in new position
                    if(currentAreaPosition == 'top'){
                        cm.insertFirst(current['node'], currentArea['node']);
                    }else{
                        cm.appendChild(current['node'], currentArea['node']);
                    }
                    resetItemArea();
                    removeDraggable();
                }
            });
        }else{
            current['draggableAnim'].go({
                'duration' : 400,
                'anim' : 'smooth', 'style' : {
                    'top' : [current['y1'], 'px'].join(''),
                    'left' : [current['x1'], 'px'].join(''),
                    'opacity' : 0
                },
                'onStop' : removeDraggable
            });
        }
        // Remove move event on document
        cm.removeClass(document.body, 'cm-draganddrop-body');
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
    };

    var getPosition = function(arr){
        cm.forEach(arr, function(item){
            item['width'] = item['node'].offsetWidth;
            item['height'] = item['node'].offsetHeight;
            item['x1'] = cm.getRealX(item['node']);
            item['y1'] = cm.getRealY(item['node']);
            item['x2'] = item['x1'] + item['width'];
            item['y2'] = item['y1'] + item['height'];
        });
    };

    var renderChassisBlocks = function(){
        cm.forEach(items, function(item){
            item['chassisTop'] = cm.Node(config['chassisTag'], {'class' : 'cm-draganddrop-chassis top'});
            item['chassisBottom'] = cm.Node(config['chassisTag'], {'class' : 'cm-draganddrop-chassis bottom'});
            item['chassisTopAnim'] = new cm.Animation(item['chassisTop']);
            item['chassisBottomAnim'] = new cm.Animation(item['chassisBottom']);
            // Append
            cm.insertBefore(item['chassisTop'], item['node']);
            cm.insertAfter(item['chassisBottom'], item['node']);
        });
    };

    var removeChassisBlocks = function(){
        cm.forEach(items, function(item){
            cm.remove(item['chassisTop']);
            cm.remove(item['chassisBottom']);
        });
    };

    var hideCurrentAboveChassisBlocks = function(){
        if(currentAbove){
            if(currentAbovePosition == 'top'){
                currentAbove['chassisTopAnim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
            }else if(currentAbovePosition == 'bottom'){
                currentAbove['chassisBottomAnim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
            }
        }
        currentAbove = false;
    };

    var hideCurrentBlock = function(){
        var clone = current['node'].cloneNode(true);
        clone.style.overflow = 'hidden';
        cm.insertBefore(clone, current['node']);
        cm.remove(current['node']);
        new cm.Animation(clone).go({'style' : {'height' : '0px', 'opacity' : 0}, 'anim' : 'smooth', 'duration' : 400, 'onStop' : function(){
            cm.remove(clone);
        }});
    };

    var resetItemArea = function(){
        currentArea['items'].push(current);
        current['parent']['items'] = current['parent']['items'].filter(function(item){
            return current != item;
        });
        current['parent'] = currentArea;
    };

    var removeDraggable = function(){
        removeChassisBlocks();
        cm.remove(current['draggable']);
        current = false;
        currentAbove = false;
        currentArea = false;
        /* *** EXECUTE API EVENTS *** */
        executeEvent('onDrop');
    };

    var executeEvent = function(event){
        API[event].forEach(function(item){
            item(that);
        });
    };

    /* *** MAIN *** */

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

Com['DraganddropCollector'] = function(node){
    var draganddrops,
        id,
        draganddrop;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };

    var render = function(node){
        draganddrops = cm.clone((node.getAttribute('data-draganddrop') == 'true') ? [node] : cm.getByAttr('data-draganddrop', 'true', node));
        // Render draganddrops
        cm.forEach(draganddrops, function(item){
            draganddrop = new Com.Draganddrop({'draganddrop' : item});
            if(id = item.id){
                Com.Elements.Draganddrop[id] = draganddrop;
            }
        });
    };

    init(node);
};