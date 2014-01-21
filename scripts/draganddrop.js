Com.Elements['Draganddrop'] = {};

Com['GetDraganddrop'] = function(id){
    return Com.Elements.Draganddrop[id] || null;
};

Com['Draganddrop'] = function(o){
    var that = this,
        config = cm.merge({
            'draganddrop' : cm.Node('div'),
            'chassisTag' : 'div',
            'helperContainer' : document.body,
            'showOrdering' : false,
            'limiter' : false,              // Limiter works only on draggable widget's area, and with vertical direction
            'direction' : 'both'            // both | vertical | horizontal
        }, o),
        dataAttributes = ['chassisTag', 'direction', 'helperContainer', 'showOrdering', 'limiter'],
        API = {
            'onInit' : [],
            'onDrop' : []
        },
        areasNodes = [],
        itemsNodes = [],
        areas = [],
        checkInt,
        current,
        currentAbove,
        currentAbovePosition,
        currentArea,
        currentAreaPosition;

    var init = function(){
        if(config['draganddrop']){
            // Merge data-attributes with config. Data-attributes have higher priority.
            processDataAttributes();
            // Find drop areas
            areasNodes = cm.getByAttr('data-area', 'true', config['draganddrop']);
            // Init areas
            cm.forEach(areasNodes, initArea);
            // Set ordering
            config['showOrdering'] && setOrder();
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onInit');
        }
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['draganddrop'].getAttribute(['data', item].join('-'));
            if(/^false|true$/.test(value)){
                value = value? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var initArea = function(node, i){
        var area = {
            'node' : node,
            'id' : node.getAttribute('data-id') || i,
            'items' : [],
            'chassis' : []
        };
        // Find draggable elements
        itemsNodes = cm.getByAttr('data-draganddrop-draggable', 'true', area['node']);
        // Init draggable nodes
        cm.forEach(itemsNodes, function(node){
            area['items'].push(initDraggable(node, area));
        });
        // Push to areas array
        areas.push(area);
    };

    var initDraggable = function(node, area){
        var draggable = {
            'node' : node,
            'id' : node.getAttribute('data-id'),
            'drag' : cm.getByAttr('data-draganddrop-drag', 'true', node)[0],
            'anim' : new cm.Animation(node),
            'area' : area,
            'offsetX' : 0,
            'offsetY' : 0,
            'chassis' : {
                'top' : null,
                'bottom' : null
            }
        };
        // Set draggable event on element
        if(draggable['drag']){
            cm.addEvent(draggable['drag'], 'mousedown', function(e){
                start(e, draggable);
            });
        }else{
            cm.addEvent(draggable['node'], 'mousedown', function(e){
                start(e, draggable);
            });
        }
        // Push to array
        return draggable;
    };

    var start = function(e, draggable){
        // If current exists, we don't need to start another drag event until previous will stop
        if(current){
            return;
        }
        e = cm.getEvent(e);
        var x = e.clientX,
            y = e.clientY,
            tempCurrentAbove, tempCurrentAbovePosition;
        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }else{
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
        // Get position
        getPosition(draggable);
        // Get offset from element position to cursor
        draggable['offsetX'] = x - draggable['x1'];
        draggable['offsetY'] = y - draggable['y1'];
        // Set styles on draggable clone
        with(draggable['node'].style){
            top = [draggable['y1'], 'px'].join('');
            left = [draggable['x1'], 'px'].join('');
            width = [draggable['width'], 'px'].join('');
        }
        cm.addClass(draggable['node'], 'cm-draganddrop-helper');
        // Insert draggable element to body
        if(config['helperContainer']){
            config['helperContainer'].appendChild(draggable['node']);
        }
        removeDraggableParent(draggable);
        // Set current draggable
        current = draggable;
        // Calculate elements position and render chassis blocks
        getPositions(areas);
        cm.forEach(areas, function(area){
            getPositions(area['items']);
        });
        renderChassisBlocks();
        // Set first chassis if exists
        cm.forEach(current['area']['items'], function(graggable){
            if(x >= graggable['x1'] && x < graggable['x2'] && y >= graggable['y1'] && y <= graggable['y2']){
                tempCurrentAbove = graggable;
                // Check above block position
                if((y - tempCurrentAbove['y1']) < (tempCurrentAbove['height'] / 2)){
                    tempCurrentAbovePosition = 'top';
                }else{
                    tempCurrentAbovePosition = 'bottom';
                }
            }
        });
        // If current draggable not above other elements
        if(!tempCurrentAbove){
            if(y < current['area']['y1']){
                tempCurrentAbove = current['area']['items'][0];
                tempCurrentAbovePosition = 'top';
            }else{
                tempCurrentAbove = current['area']['items'][current['area']['items'].length - 1];
                tempCurrentAbovePosition = 'bottom';
            }
        }
        if(tempCurrentAbove){
            tempCurrentAbove['chassis'][tempCurrentAbovePosition]['node'].style.height = [current['height'], 'px'].join('');
        }
        // Set current area and above
        currentArea = draggable['area'];
        currentAbove = tempCurrentAbove;
        currentAbovePosition = tempCurrentAbovePosition;
        // Set check position event
        checkInt = setInterval(checkPosition, 5);
        // Add move event on document
        cm.addClass(document.body, 'cm-draganddrop-body');
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
    };

    var move = function(e){
        e = cm.getEvent(e);
        var x = e.clientX,
            y = e.clientY,
            posY, posX, tempCurrentArea, tempCurrentAbove, tempCurrentAbovePosition;
        if(cm.isTouch && e.touches){
            e.preventDefault();
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        // Set new position
        posY = y - current['offsetY'];
        posX = x - current['offsetX'];

        with(current['node'].style){
            switch(config['direction']){
                case 'both':
                    top = [posY, 'px'].join('');
                    left = [posX, 'px'].join('');
                    break;
                case 'vertical':
                    if(config['limiter']){
                        if(posY < current['area']['y1']){
                            top = [current['area']['y1'], 'px'].join('');
                        }else if(posY > current['area']['y2']){
                            top = [current['area']['y2'], 'px'].join('');
                        }else{
                            top = [y - current['offsetY'], 'px'].join('');
                        }
                    }else{
                        top = [posY, 'px'].join('');
                    }
                    break;
                case 'horizontal':
                    left = [posX, 'px'].join('');
                    break;
            }
        }
        // Check area in which we are
        cm.forEach(areas, function(area){
            if(x >= area['x1'] && x < area['x2'] && y >= area['y1'] && y <= area['y2']){
                tempCurrentArea = area;
                // Check graggable in which we are above
                cm.forEach(area['items'], function(graggable){
                    if(x >= graggable['x1'] && x < graggable['x2'] && y >= graggable['y1'] && y <= graggable['y2']){
                        tempCurrentAbove = graggable;
                        // Check above block position
                        if((y - tempCurrentAbove['y1']) < (tempCurrentAbove['height'] / 2)){
                            tempCurrentAbovePosition = 'top';
                        }else{
                            tempCurrentAbovePosition = 'bottom';
                        }
                    }
                });
            }
        });
        // If current draggable not above other elements
        if(!tempCurrentAbove){
            if(!tempCurrentArea){
                tempCurrentArea = current['area'];
            }
            if(y < current['area']['y1']){
                tempCurrentAbove = tempCurrentArea['items'][0];
                tempCurrentAbovePosition = 'top';
            }else{
                tempCurrentAbove = tempCurrentArea['items'][tempCurrentArea['items'].length - 1];
                tempCurrentAbovePosition = 'bottom';
            }
        }
        // Reset chassis
        if(currentAbove && tempCurrentAbove && currentAbove['chassis'][currentAbovePosition] != tempCurrentAbove['chassis'][tempCurrentAbovePosition]){
            if(cm.isTouch && e.touches){
                currentAbove['chassis'][currentAbovePosition]['node'].style.height = '0px';
                tempCurrentAbove['chassis'][tempCurrentAbovePosition]['node'].style.height = [current['height'], 'px'].join('');
            }else{
                currentAbove['chassis'][currentAbovePosition]['anim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
                tempCurrentAbove['chassis'][tempCurrentAbovePosition]['anim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
            }
        }else if(!currentAbove && tempCurrentAbove){
            if(cm.isTouch && e.touches){
                tempCurrentAbove['chassis'][tempCurrentAbovePosition]['node'].style.height = [current['height'], 'px'].join('');
            }else{
                tempCurrentAbove['chassis'][tempCurrentAbovePosition]['anim'].go({'style' : {'height' : [current['height'], 'px'].join('')}, 'anim' : 'simple', 'duration' : 150});
            }
        }else if(currentAbove && !tempCurrentAbove){
            if(cm.isTouch && e.touches){
                currentAbove['chassis'][currentAbovePosition]['node'].style.height = '0px';
            }else{
                currentAbove['chassis'][currentAbovePosition]['anim'].go({'style' : {'height' : '0px'}, 'anim' : 'simple', 'duration' : 150});
            }
        }
        // Set current area and above
        currentArea = tempCurrentArea;
        currentAbove = tempCurrentAbove;
        currentAbovePosition = tempCurrentAbovePosition;
    };

    var stop = function(e){
        e = cm.getEvent(e);
        var currentHeight;
        // Remove check position event
        checkInt && clearInterval(checkInt);
        // Remove move event on document
        cm.removeClass(document.body, 'cm-draganddrop-body');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);

        if(currentAbove){
            // Animate chassis blocks
            current['node'].style.width = [currentAbove['width'], 'px'].join('');
            currentHeight = current['node'].offsetHeight;
            current['node'].style.width = [current['width'], 'px'].join('');
            if(currentHeight != currentAbove['chassis'][currentAbovePosition]['node'].offsetHeight){
                if(cm.isTouch && e.touches){
                    currentAbove['chassis'][currentAbovePosition]['node'].style.height = [currentHeight, 'px'].join('');
                }else{
                    currentAbove['chassis'][currentAbovePosition]['anim'].go({'style' : {'height' : [currentHeight, 'px'].join('')}, 'anim' : 'smooth', 'duration' : 400});
                }
            }
            // Animate draggable clone
            current['anim'].go({
                'duration' : 400,
                'anim' : 'smooth',
                'style' : {
                    'top' : [currentAbovePosition == 'top'? currentAbove['y1'] : currentAbove['y2'], 'px'].join(''),
                    'left' : [currentAbove['x1'], 'px'].join(''),
                    'width' : [currentAbove['width'], 'px'].join('')
                },
                'onStop' : function(){
                    // Append element in new position
                    if(currentAbovePosition == 'top'){
                        cm.insertBefore(current['node'], currentAbove['node']);
                    }else{
                        cm.insertAfter(current['node'], currentAbove['node']);
                    }
                    setDraggableParent();
                    removeDraggable();
                }
            });
        }else{
            current['anim'].go({
                'duration' : 400,
                'anim' : 'smooth',
                'style' : {
                    'top' : [currentArea['y1'], 'px'].join(''),
                    'left' : [currentArea['x1'], 'px'].join(''),
                    'width' : [currentArea['width'], 'px'].join('')
                },
                'onStop' : function(){
                    // Append element in new position
                    cm.appendChild(current['node'], currentArea['node']);
                    setDraggableParent();
                    removeDraggable();
                }
            });
        }
    };

    var getPositions = function(arr){
        cm.forEach(arr, getPosition);
    };

    var getPosition = function(item){
        item['width'] = item['node'].offsetWidth;
        item['height'] = item['node'].offsetHeight;
        item['x1'] = cm.getRealX(item['node']);
        item['y1'] = cm.getRealY(item['node']);
        item['x2'] = item['x1'] + item['width'];
        item['y2'] = item['y1'] + item['height'];
    };

    var checkPosition = function(){
        if(areas[0]['y1'] != cm.getRealY(areas[0]['node'])){
            getPositions(areas);
            cm.forEach(areas, function(area){
                getPositions(area['items']);
            });
        }
    };

    var renderChassisBlocks = function(){
        var length, chassis;
        cm.forEach(areas, function(area){
            length = area['items'].length;
            cm.forEach(area['items'], function(draggable, i){
                // Render chassis
                if(i == 0){
                    chassis = renderChassis();
                    cm.insertBefore(chassis['node'], draggable['node']);
                    area['chassis'].push(chassis);
                }
                chassis = renderChassis();
                cm.insertAfter(chassis['node'], draggable['node']);
                area['chassis'].push(chassis);
                // Associate with draggable
                draggable['chassis']['top'] = area['chassis'][i];
                draggable['chassis']['bottom'] = area['chassis'][i + 1];
            });
        });
    };

    var renderChassis = function(){
        var node = cm.Node(config['chassisTag'], {'class' : 'cm-draganddrop-chassis'});
        return {
            'node' : node,
            'anim' : new cm.Animation(node),
            'isShow' : false
        };
    };

    var removeChassisBlocks = function(){
        cm.forEach(areas, function(area){
            cm.forEach(area['chassis'], function(chassis){
                cm.remove(chassis['node']);
            });
            area['chassis'] = [];
        });
    };

    var removeDraggableParent = function(draggable){
        var area = draggable['area'];
        draggable['area']['items'] = draggable['area']['items'].filter(function(item){
            return item != draggable;
        });
    };

    var setDraggableParent = function(){
        var index = currentArea['items'].indexOf(currentAbove) + (currentAbovePosition == 'bottom' ? 1 : 0);
        currentArea['items'].splice(index, 0, current);
        current['area'] = currentArea;
    };

    var removeDraggable = function(){
        // Remove chassis blocks
        removeChassisBlocks();
        // Reset draggable block styles
        with(current['node'].style){
            width = 'auto';
            left = 'auto';
            top = 'auto';
        }
        cm.removeClass(current['node'], 'cm-draganddrop-helper');
        // Set ordering
        config['showOrdering'] && setOrder();
        // Reset other
        current = false;
        currentAbove = false;
        currentArea = false;
        /* *** EXECUTE API EVENTS *** */
        executeEvent('onDrop');
    };

    var setOrder = function(){
        cm.forEach(areas, function(area){
            cm.forEach(area['items'], function(item, i){
                item['node'].setAttribute('data-order', i);
                item['node'].setAttribute('data-area-id', area['id']);
            });
        });
    };

    var executeEvent = function(event){
        API[event].forEach(function(item){
            item(that);
        });
    };

    /* *** MAIN *** */

    that.getOrderingNodes = function(){
        var results = [],
            arr;
        cm.forEach(areas, function(area){
            arr = {
                'area' : area['node'],
                'items' : []
            };
            cm.forEach(area['items'], function(item){
                arr['items'].push(item['node']);
            });
            results.push(arr);
        });
        return areas.length == 1 ? arr['items'] : results;
    };

    that.getOrderingIDs = function(){
        var results = {},
            arr;
        cm.forEach(areas, function(area){
            arr = {};
            cm.forEach(area['items'], function(item, i){
                if(!item['id']){
                    throw new Error('Attribute "data-id" not specified on item node.');
                }
                arr[item['id']] = i;
            });
            results[area['id']] = arr;
        });
        return areas.length == 1 ? arr : results;
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