Com['Draganddrop'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'chassisTag' : 'div',
            'draggableContainer' : document.body,
            'renderTemporaryAria' : false,
            'useCSSAnimation' : false,
            'useGracefulDegradation' : true,
            'dropDuration' : 400,
            'classes' : {
                'area' : null
            }
        }, o),
        API = {
            'onInit' : [],
            'onDragStart' : [],
            'onDrop' : [],
            'onRemove' : []
        },
        nodes = {},
        areas = [],
        areasList = [],
        draggableList = [],
        filteredAvailableAreas = [],
        checkInt,
        isGracefulDegradation = false,

        current,
        currentAboveItem,
        currentPosition,
        currentArea,
        previousArea;

    /* *** INIT *** */

    var init = function(){
        var areasNodes;

        if(config['container']){
            // Check Graceful Degradation, and turn it to mobile and old ie.
            if(config['useGracefulDegradation'] && ((cm.is('IE') && cm.isVersion() < 9) || cm.isMobile())){
                isGracefulDegradation = true;
            }
            // Render temporary area
            if(config['renderTemporaryAria']){
                nodes['temporaryArea'] = cm.Node('div');
                initArea(nodes['temporaryArea'], {
                    'isTemporary' : true
                });
            }
            // Find drop areas
            areasNodes = cm.getByAttr('data-com-draganddrop', 'area', config['container']);
            // Init areas
            cm.forEach(areasNodes, function(area){
                initArea(area, {});
            });
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onInit', {});
        }
    };

    var initArea = function(node, params){
        // Check, if area already exists
        if(cm.inArray(areasList, node)){
            return;
        }
        // Config
        var area = cm.merge({
                'node' : node,
                'type' : 'area',
                'isLocked' : false,
                'isTemporary' : false,
                'isSystem' : false,
                'isRemoveZone' : false,
                'draggableInChildNodes' : true,
                'cloneDraggable' : false,
                'items' : [],
                'chassis' : [],
                'dimensions' : {}
            }, params),
            childNodes;
        // Add mark classes
        cm.addClass(area['node'], 'cm-draganddrop-area');
        cm.addClass(area['node'], config['classes']['area']);
        if(area['isLocked']){
            cm.addClass(area['node'], 'is-locked');
        }else{
            cm.addClass(area['node'], 'is-available');
        }
        // Find draggable elements
        if(area['draggableInChildNodes']){
            childNodes = area['node'].childNodes;
            cm.forEach(childNodes, function(node){
                if(node.tagName && node.getAttribute('data-com-draganddrop') == 'draggable'){
                    area['items'].push(
                        initDraggable(node, area, {})
                    );
                }
            });
        }else{
            childNodes = cm.getByAttr('data-com-draganddrop', 'draggable', area['node']);
            cm.forEach(childNodes, function(node){
                area['items'].push(
                    initDraggable(node, area, {})
                );
            });
        }
        // Push to areas array
        areasList.push(area['node']);
        areas.push(area);
    };

    var initDraggable = function(node, area, params){
        // Config
        var draggable = cm.merge({
            'node' : node,
            'type' : 'item',
            'chassis' : {
                'top' : null,
                'bottom' : null
            },
            'dimensions' : {
                'offsetX' : 0,
                'offsetY' : 0
            }
        }, params);
        draggable['area'] = area;
        draggable['anim'] = new cm.Animation(draggable['node']);
        // Set draggable event on element
        initDraggableDrag(draggable);
        // Return item to push in area array
        draggableList.push(draggable);
        return draggable;
    };

    var initDraggableDrag = function(draggable){
        var dragNode;
        draggable['drag'] = cm.getByAttr('data-com-draganddrop', 'drag', draggable['node'])[0];
        // Set draggable event on element
        dragNode = draggable['drag'] || draggable['node'];
        cm.addEvent(dragNode, 'mousedown', function(e){
            start(e, draggable);
        });
    };

    /* *** DRAG AND DROP PROCESS ** */

    var start = function(e, draggable){
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return;
        }
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var x = e.clientX,
            y = e.clientY,
            tempCurrentAboveItem, tempCurrentPosition, hack;
        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }else{
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
        // API onDragStart Event
        executeEvent('onDragStart', {
            'item' : draggable,
            'node' : draggable['node'],
            'from' : draggable['area']
        });
        // Filter areas
        filteredAvailableAreas = areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(cm.isParent(draggable['node'], area['node']) || area['isLocked']){
                return false;
            }
            // True - pass area
            return true;
        });
        // Get position and dimension of current draggable item
        getPosition(draggable);
        // Get offset position relative to touch point (cursor or finger position)
        draggable['dimensions']['offsetX'] = x - draggable['dimensions']['x1'];
        draggable['dimensions']['offsetY'] = y - draggable['dimensions']['y1'];
        // Set draggable item to current
        if(draggable['area']['cloneDraggable']){
            current = cloneDraggable(draggable);
        }else{
            current = draggable;
        }
        // Set position and dimension to current draggable node, before we insert it to draggableContainer
        with(current['node'].style){
            top = [current['dimensions']['y1'], 'px'].join('');
            left = [current['dimensions']['x1'], 'px'].join('');
            width = [current['dimensions']['innerWidth'], 'px'].join('');
        }
        // Unset area from draggable item
        unsetDraggableFromArea(current);
        // Insert draggable element to body
        if(config['draggableContainer']){
            config['draggableContainer'].appendChild(current['node']);
        }
        getPosition(current);
        cm.addClass(current['node'], 'cm-draganddrop-helper');
        hack = current['node'].clientHeight;
        cm.addClass(current['node'], 'is-active');
        // Calculate elements position and dimension
        getPositions(areas);
        cm.forEach(areas, function(area){
            getPositions(area['items']);
        });
        // Render Chassis Blocks
        renderChassisBlocks();
        // Find above draggable item
        cm.forEach(current['area']['items'], function(draggable){
            if(x >= draggable['dimensions']['absoluteX1'] && x < draggable['dimensions']['absoluteX2'] && y >= draggable['dimensions']['absoluteY1'] && y <= draggable['dimensions']['absoluteY2']){
                tempCurrentAboveItem = draggable;
                // Check above block position
                if((y - tempCurrentAboveItem['dimensions']['absoluteY1']) < (tempCurrentAboveItem['dimensions']['absoluteHeight'] / 2)){
                    tempCurrentPosition = 'top';
                }else{
                    tempCurrentPosition = 'bottom';
                }
            }
        });
        // If current current draggable not above other draggable items
        if(!tempCurrentAboveItem && current['area']['items'].length){
            if(y < current['area']['dimensions']['innerY1']){
                tempCurrentAboveItem = current['area']['items'][0];
                tempCurrentPosition = 'top';
            }else{
                tempCurrentAboveItem = current['area']['items'][current['area']['items'].length - 1];
                tempCurrentPosition = 'bottom';
            }
        }
        // Set chassis
        if(tempCurrentAboveItem){
            tempCurrentAboveItem['chassis'][tempCurrentPosition]['node'].style.height = [current['dimensions']['absoluteHeight'], 'px'].join('');
        }else{
            current['area']['chassis'][0]['node'].style.height = [current['dimensions']['absoluteHeight'], 'px'].join('');
        }
        // Set current area and above
        currentArea = current['area'];
        currentAboveItem = tempCurrentAboveItem;
        currentPosition = tempCurrentPosition;
        cm.addClass(currentArea['node'], 'is-active');
        // Set check position event
        checkInt = setInterval(checkPosition, 5);
        // Add move event on document
        cm.addClass(document.body, 'cm-draganddrop-body');
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
    };

    var move = function(e){
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var x = e.clientX,
            y = e.clientY,
            posY,
            posX,
            tempCurrentArea,
            tempCurrentAboveItem,
            tempCurrentPosition;

        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        }
        // Set new position
        posY = y - current['dimensions']['offsetY'];
        posX = x - current['dimensions']['offsetX'];
        with(current['node'].style){
            top = [posY, 'px'].join('');
            left = [posX, 'px'].join('');
        }
        // Find above area
        cm.forEach(filteredAvailableAreas, function(area){
            if(x >= area['dimensions']['innerX1'] && x < area['dimensions']['innerX2'] && y >= area['dimensions']['innerY1'] && y <= area['dimensions']['innerY2']){
                if(!tempCurrentArea){
                    tempCurrentArea = area;
                }else if(area['dimensions']['width'] < tempCurrentArea['dimensions']['width'] || area['dimensions']['height'] < tempCurrentArea['dimensions']['height']){
                    tempCurrentArea = area;
                }
            }
        });
        // Find above draggable item
        if(tempCurrentArea){
            cm.forEach(tempCurrentArea['items'], function(draggable){
                if(x >= draggable['dimensions']['absoluteX1'] && x < draggable['dimensions']['absoluteX2'] && y >= draggable['dimensions']['absoluteY1'] && y <= draggable['dimensions']['absoluteY2']){
                    tempCurrentAboveItem = draggable;
                    // Check above block position
                    if((y - tempCurrentAboveItem['dimensions']['absoluteY1']) < (tempCurrentAboveItem['dimensions']['absoluteHeight'] / 2)){
                        tempCurrentPosition = 'top';
                    }else{
                        tempCurrentPosition = 'bottom';
                    }
                }
            });
        }else{
            tempCurrentArea = currentArea;
        }
        // If current current draggable not above other draggable items
        if(!tempCurrentAboveItem && tempCurrentArea['items'].length){
            if(y < tempCurrentArea['dimensions']['innerY1']){
                tempCurrentAboveItem = tempCurrentArea['items'][0];
                tempCurrentPosition = 'top';
            }else{
                tempCurrentAboveItem = tempCurrentArea['items'][tempCurrentArea['items'].length - 1];
                tempCurrentPosition = 'bottom';
            }
        }
        // Animate chassis
        if(currentAboveItem && tempCurrentAboveItem && currentAboveItem['chassis'][currentPosition] != tempCurrentAboveItem['chassis'][tempCurrentPosition]){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, 150);
            animateChassis(tempCurrentAboveItem['chassis'][tempCurrentPosition], current['dimensions']['absoluteHeight'], 150);
        }else if(!currentAboveItem && tempCurrentAboveItem){
            animateChassis(currentArea['chassis'][0], 0, 150);
            animateChassis(tempCurrentAboveItem['chassis'][tempCurrentPosition], current['dimensions']['absoluteHeight'], 150);
        }else if(currentAboveItem && !tempCurrentAboveItem){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, 150);
            animateChassis(tempCurrentArea['chassis'][0], current['dimensions']['absoluteHeight'], 150);
        }else if(!currentAboveItem && !tempCurrentAboveItem && currentArea != tempCurrentArea){
            animateChassis(currentArea['chassis'][0], 0, 150);
            animateChassis(tempCurrentArea['chassis'][0], current['dimensions']['absoluteHeight'], 150);
        }
        // Unset classname from previous active area
        if(currentArea && currentArea != tempCurrentArea){
            cm.removeClass(currentArea['node'], 'is-active');
            previousArea = currentArea;
        }
        // Set current to global
        currentArea = tempCurrentArea;
        currentAboveItem = tempCurrentAboveItem;
        currentPosition = tempCurrentPosition;
        // Set active area claaanme
        if(!(previousArea && previousArea['isTemporary'] && currentArea['isRemoveZone'])){
            cm.addClass(currentArea['node'], 'is-active');
        }
    };

    var stop = function(e){
        e = cm.getEvent(e);
        var currentHeight;
        // Remove check position event
        checkInt && clearInterval(checkInt);
        // Remove move events attached on document
        cm.removeClass(document.body, 'cm-draganddrop-body');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Calculate height of draggable block, like he already dropped in area, to animate height of fake empty space
        getPosition(current);
        current['node'].style.width = [(currentArea['dimensions']['innerWidth'] - current['dimensions']['margin']['left'] - current['dimensions']['margin']['right']), 'px'].join('');
        currentHeight = current['node'].offsetHeight + current['dimensions']['margin']['top'] + current['dimensions']['margin']['bottom'];
        current['node'].style.width = [current['dimensions']['innerWidth'], 'px'].join('');
        // If current draggable located above another draggable item, drops after/before it, or drops in area
        if(currentAboveItem){
            // Animate chassis blocks
            if(currentHeight != currentAboveItem['chassis'][currentPosition]['node'].offsetHeight){
                animateChassis(currentAboveItem['chassis'][currentPosition], currentHeight, config['dropDuration']);
            }
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'target' : currentAboveItem['node'],
                'append' : currentPosition == 'top' ? 'before' : 'after',
                'index' : currentArea['items'].indexOf(currentAboveItem) + (currentPosition == 'bottom' ? 1 : 0),
                'top' : [currentPosition == 'top'? currentAboveItem['dimensions']['absoluteY1'] : currentAboveItem['dimensions']['absoluteY2'], 'px'].join(''),
                'onStop' : unsetCurrentDraggable
            });
        }else if(currentArea['isRemoveZone'] || currentArea['isTemporary']){
            removeDraggable(current, {
                'onStop' : unsetCurrentDraggable
            });
        }else{
            // Animate chassis blocks
            animateChassis(currentArea['chassis'][0], currentHeight, config['dropDuration']);
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'onStop' : unsetCurrentDraggable
            });
        }
        // Unset active area classname
        if(currentArea){
            cm.removeClass(currentArea['node'], 'is-active');
        }
    };

    /* *** DRAGGABLE MANIPULATION FUNCTIONS *** */

    var cloneDraggable = function(draggable){
        var clonedNode = draggable['node'].cloneNode(true),
            area = config['renderTemporaryAria']? areas[0] : draggable['area'],
            clonedDraggable = initDraggable(clonedNode, area, {});

        clonedDraggable['dimensions'] = cm.clone(draggable['dimensions']);
        area['items'].push(clonedDraggable);
        return clonedDraggable;
    };

    var dropDraggableToArea = function(draggable, area, params){
        var hack;
        params = cm.merge({
            'target' : area['node'],
            'append' : 'child',
            'index' : 0,
            'width' : [area['dimensions']['innerWidth'] - draggable['dimensions']['padding']['left'] - draggable['dimensions']['padding']['right'], 'px'].join(''),
            'top' : [area['dimensions']['innerY1'] - draggable['dimensions']['margin']['top'], 'px'].join(''),
            'left' : [area['dimensions']['innerX1'] - draggable['dimensions']['margin']['left'], 'px'].join(''),
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // Animate draggable item, like it drops in area
        draggable['anim'].go({
            'duration' : config['dropDuration'],
            'anim' : 'smooth',
            'style' : {
                'top' : params['top'],
                'left' : params['left'],
                'width' : params['width']
            },
            'onStop' : function(){
                // Append element in new position
                switch(params['append']){
                    case 'child' :
                        cm.appendChild(draggable['node'], params['target']);
                        break;
                    case 'before' :
                        cm.insertBefore(draggable['node'], params['target']);
                        break;
                    case 'after' :
                        cm.insertAfter(draggable['node'], params['target']);
                        break;
                    case 'first' :
                        cm.insertFirst(draggable['node'], params['target']);
                        break;
                }
                // Remove draggable helper classname
                cm.removeClass(draggable['node'], 'cm-draganddrop-helper');
                hack = draggable['node'].clientHeight;
                cm.removeClass(draggable['node'], 'is-active');
                // Reset styles
                with(draggable['node'].style){
                    width = 'auto';
                    left = 'auto';
                    top = 'auto';
                }
                // API onDrop Event
                executeEvent('onDrop', {
                    'item' : draggable,
                    'node' : draggable['node'],
                    'to' : area,
                    'from' : draggable['area'],
                    'index' : params['index']
                });
                // Set index of draggable item in new area
                area['items'].splice(params['index'], 0, draggable);
                // Set draggable new area
                draggable['area'] = area;
                // System onStop event
                params['onStop']();
            }
        });
    };

    var removeDraggable = function(draggable, params){
        var style, anim, node;
        // Remove handler
        var handler = function(){
            cm.remove(node);
            // Remove from draggable list
            draggableList = draggableList.filter(function(item){
                return item != draggable;
            });
            unsetDraggableFromArea(draggable);
            // API onRemove Event
            executeEvent('onRemove', {
                'item' : draggable,
                'node' : draggable['node'],
                'from' : draggable['area']
            });
            // System onStop event
            params['onStop']();
        };
        // Config
        params = cm.merge({
            'isCurrent' : draggable === current,
            'isInDOM' : cm.inDOM(draggable['node']),
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // If draggable not in DOM, we don't need to wrap and animate it
        if(params['isInDOM']){
            // If draggable is current - just animate pull out left, else - wrap to removable node
            if(params['isCurrent']){
                node = draggable['node'];
                anim = draggable['anim'];
                style = {
                    'left' : [-(draggable['dimensions']['absoluteWidth'] + 50), 'px'].join(''),
                    'opacity' : 0
                }
            }else{
                node = cm.wrap(cm.Node('div', {'class' : 'cm-draganddrop-removable'}), draggable['node']);
                anim = new cm.Animation(node);
                style = {
                    'height' : '0px',
                    'opacity' : 0
                }
            }
            // Animate draggable, like it disappear
            anim.go({
                'duration' : config['dropDuration'],
                'anim' : 'smooth',
                'style' : style,
                'onStop' : handler
            });
        }else{
            handler();
        }
    };

    var unsetDraggableFromArea = function(draggable){
        draggable['area']['items'] = draggable['area']['items'].filter(function(item){
            return item != draggable;
        });
    };

    var unsetCurrentDraggable = function(){
        // Remove chassis blocks
        removeChassisBlocks();
        // Reset other
        current = false;
        currentAboveItem = false;
        currentArea = false;
        previousArea = false;
    };

    /* *** CHASSIS FUNCTIONS *** */

    var renderChassisBlocks = function(){
        var chassis;
        cm.forEach(areas, function(area){
            if(area['isLocked']){
                return;
            }

            if(!area['items'].length){
                chassis = renderChassis();
                cm.appendChild(chassis['node'], area['node']);
                area['chassis'].push(chassis);
            }

            cm.forEach(area['items'], function(draggable, i){
                if(i === 0){
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

    var animateChassis = function(chassis, height, duration) {
        var style;
        height = [height, 'px'].join('');
        if(config['useCSSAnimation'] || isGracefulDegradation){
            if(!isGracefulDegradation && (style = cm.getSupportedStyle('transition-duration'))){
                chassis['node'].style[style] = [duration, 'ms'].join('');
            }
            chassis['node'].style.height = height;
        }else{
            chassis['anim'].go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : duration});
        }
    };

    /* *** POSITION CALCULATION FUNCTIONS *** */

    var getPositions = function(arr){
        cm.forEach(arr, getPosition);
    };

    var getPosition = function(item){
        // Get basic position and dimension
        item['dimensions']['width'] = item['node'].offsetWidth;
        item['dimensions']['height'] = item['node'].offsetHeight;
        item['dimensions']['x1'] = cm.getRealX(item['node']);
        item['dimensions']['y1'] = cm.getRealY(item['node']);
        item['dimensions']['x2'] = item['dimensions']['x1'] + item['dimensions']['width'];
        item['dimensions']['y2'] = item['dimensions']['y1'] + item['dimensions']['height'];
        // Calculate Padding and Inner Dimensions
        item['dimensions']['padding'] = {
            'top' : cm.getCSSStyle(item['node'], 'paddingTop', true),
            'right' : cm.getCSSStyle(item['node'], 'paddingRight', true),
            'bottom' : cm.getCSSStyle(item['node'], 'paddingBottom', true),
            'left' : cm.getCSSStyle(item['node'], 'paddingLeft', true)
        };
        item['dimensions']['innerWidth'] = item['dimensions']['width'] - item['dimensions']['padding']['left'] - item['dimensions']['padding']['right'];
        item['dimensions']['innerHeight'] = item['dimensions']['height'] - item['dimensions']['padding']['top'] - item['dimensions']['padding']['bottom'];
        item['dimensions']['innerX1'] = item['dimensions']['x1'] + item['dimensions']['padding']['left'];
        item['dimensions']['innerY1'] = item['dimensions']['y1'] + item['dimensions']['padding']['top'];
        item['dimensions']['innerX2'] = item['dimensions']['innerX1'] + item['dimensions']['innerWidth'];
        item['dimensions']['innerY2'] = item['dimensions']['innerY1'] + item['dimensions']['innerHeight'];
        // Calculate Margin and Absolute Dimensions
        item['dimensions']['margin'] = {
            'top' : cm.getCSSStyle(item['node'], 'marginTop', true),
            'right' : cm.getCSSStyle(item['node'], 'marginRight', true),
            'bottom' : cm.getCSSStyle(item['node'], 'marginBottom', true),
            'left' : cm.getCSSStyle(item['node'], 'marginLeft', true)
        };
        item['dimensions']['absoluteWidth'] = item['dimensions']['width'] + item['dimensions']['margin']['left'] + item['dimensions']['margin']['right'];
        item['dimensions']['absoluteHeight'] = item['dimensions']['height'] + item['dimensions']['margin']['top'] + item['dimensions']['margin']['bottom'];
        item['dimensions']['absoluteX1'] = item['dimensions']['x1'] - item['dimensions']['margin']['left'];
        item['dimensions']['absoluteY1'] = item['dimensions']['y1'] - item['dimensions']['margin']['top'];
        item['dimensions']['absoluteX2'] = item['dimensions']['x2'] + item['dimensions']['margin']['right'];
        item['dimensions']['absoluteY2'] = item['dimensions']['y2'] + item['dimensions']['margin']['bottom'];
    };

    var checkPosition = function(){
        var filteredAreas = getFilteredAreas();
        if(filteredAreas[0]['dimensions']['y1'] != cm.getRealY(filteredAreas[0]['node'])){
            getPositions(areas);
            cm.forEach(areas, function(area){
                getPositions(area['items']);
            });
        }
    };

    /* *** AREA FUNCTIONS *** */

    var getFilteredAreas = function(){
        var filteredAreas = areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(area['isTemporary'] || area['isSystem']){
                return false;
            }
            // True - pass area
            return true;
        });
        return filteredAreas;
    };

    /* *** EVENTS HANDLERS *** */

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.getArea = function(node){
        var area;
        cm.forEach(areas, function(item){
            if(item['node'] === node){
                area = item;
            }
        });
        return area;
    };

    that.registerArea = function(node, params){
        if(cm.isNode(node) && node.tagName){
            initArea(node, params || {});
        }
        return that;
    };

    that.removeArea = function(node, params){
        if(cm.isNode(node) && cm.inArray(areasList, node)){
            areasList = areasList.filter(function(area){
                return area != node;
            });
            areas = areas.filter(function(area){
                return area['node'] != node;
            });
        }
        return that;
    };

    that.getDraggable = function(node){
        var draggable;
        cm.forEach(draggableList, function(item){
            if(item['node'] === node){
                draggable = item;
            }
        });
        return draggable;
    };

    that.registerDraggable = function(node, areaNode, params){
        var draggable, area, newDraggable, index, childNodes, draggableNodes = [];
        // Find draggable item by node
        draggable = that.getDraggable(node);
        // If draggable already exists - reinit it, else - init like new draggable item
        if(draggable){
            initDraggableDrag(draggable);
        }else if(cm.inArray(areasList, areaNode)){
            node.setAttribute('data-com-draganddrop', 'draggable');
            // Fins area item by node
            area = that.getArea(areaNode);
            // Find draggable index
            if(area['draggableInChildNodes']){
                childNodes = area['node'].childNodes;
                cm.forEach(childNodes, function(node){
                    if(node.tagName && node.getAttribute('data-com-draganddrop') == 'draggable'){
                        draggableNodes.push(node);
                    }
                });
            }else{
                draggableNodes = cm.getByAttr('data-com-draganddrop', 'draggable', area['node']);
            }
            index = draggableNodes.indexOf(node);
            // Register draggable
            newDraggable = initDraggable(node, area, params || {});
            area['items'].splice(index, 0, newDraggable);
        }
        return that;
    };

    that.replaceDraggable = function(oldDraggableNode, newDraggableNode){
        var oldDraggable, newDraggable;
        // Find draggable item
        cm.forEach(draggableList, function(item){
            if(item['node'] === oldDraggableNode){
                oldDraggable = item;
            }
        });
        if(oldDraggable){
            // Find old draggable area and index in area
            var area = oldDraggable['area'],
                index = area['items'].indexOf(oldDraggableNode);
            // Append new draggable into DOM
            cm.insertAfter(newDraggableNode, oldDraggableNode);
            // Remove old draggable
            removeDraggable(oldDraggable, {});
            // Register new draggable
            newDraggable = initDraggable(newDraggableNode, area);
            area['items'].splice(index, 0, newDraggable);
        }
        return that;
    };

    that.removeDraggable = function(node, params){
        var draggable;
        // Find draggable item
        cm.forEach(draggableList, function(item){
            if(item['node'] === node){
                draggable = item;
            }
        });
        if(draggable){
            // Remove
            removeDraggable(draggable, params || {});
        }
        return that;
    };

    that.getOrderingNodes = function(){
        var results = [],
            arr,
            filteredAreas = getFilteredAreas();
        // Build array
        cm.forEach(filteredAreas, function(area){
            arr = {
                'area' : area['node'],
                'items' : []
            };
            cm.forEach(area['items'], function(item){
                arr['items'].push(item['node']);
            });
            results.push(arr);
        });
        return filteredAreas.length == 1 ? arr['items'] : results;
    };

    that.getOrderingIDs = function(){
        var results = {},
            arr,
            filteredAreas = getFilteredAreas();
        // Build array
        cm.forEach(filteredAreas, function(area){
            arr = {};
            cm.forEach(area['items'], function(item, i){
                if(!item['id']){
                    throw new Error('Attribute "data-id" not specified on item node.');
                }
                arr[item['id']] = i;
            });
            results[area['id']] = arr;
        });
        return filteredAreas.length == 1 ? arr : results;
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