cm.define('Com.Draganddrop', {
    'modules' : [
        'Params',
        'Events'
    ],
    'events' : [
        'onRender',
        'onInit',
        'onDragStart',
        'onDrop',
        'onRemove',
        'onReplace'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'chassisTag' : 'div',
        'draggableContainer' : 'document.body',      // HTML node | selfParent
        'scroll' : true,
        'scrollNode' : window,
        'scrollSpeed' : 1,                           // ms per 1px
        'renderTemporaryAria' : false,
        'useCSSAnimation' : true,
        'useGracefulDegradation' : true,
        'dropDuration' : 400,
        'moveDuration' : 200,
        'direction' : 'both',                        // both | vertical | horizontal
        'limit' : false,
        'highlightAreas' : true,                     // highlight areas on drag start
        'highlightChassis' : false,
        'animateRemove' : true,
        'removeNode' : true,
        'classes' : {
            'area' : null
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        anims = {},
        areas = [],
        areasList = [],
        draggableList = [],
        filteredAvailableAreas = [],
        checkInt,
        chassisInt,
        pageSize,
        isScrollProccess = false,
        isGracefulDegradation = false,
        isHighlightedAreas = false,

        current,
        currentAboveItem,
        currentPosition,
        currentArea,
        currentChassis,
        previousArea;

    that.pointerType = null;

    /* *** INIT *** */

    var init = function(){
        var areasNodes;

        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);

        if(that.params['container']){
            // Check Graceful Degradation, and turn it to mobile and old ie.
            if(that.params['useGracefulDegradation'] && ((cm.is('IE') && cm.isVersion() < 9) || cm.isMobile())){
                isGracefulDegradation = true;
            }
            // Init misc
            anims['scroll'] = new cm.Animation(that.params['scrollNode']);
            // Render temporary area
            if(that.params['renderTemporaryAria']){
                nodes['temporaryArea'] = cm.Node('div');
                initArea(nodes['temporaryArea'], {
                    'isTemporary' : true
                });
            }
            // Find drop areas
            areasNodes = cm.getByAttr('data-com-draganddrop', 'area', that.params['container']);
            // Init areas
            cm.forEach(areasNodes, function(area){
                initArea(area, {});
            });
            /* *** EXECUTE API EVENTS *** */
            that.triggerEvent('onInit', {});
            that.triggerEvent('onRender', {});
        }
    };

    var getLESSVariables = function(){
        that.params['dropDuration'] = cm.getTransitionDurationFromLESS('PtDnD-DropDuration', that.params['dropDuration']);
        that.params['moveDuration'] = cm.getTransitionDurationFromLESS('PtDnD-MoveDuration', that.params['moveDuration']);
    };

    var initArea = function(node, params){
        // Check, if area already exists
        if(cm.inArray(areasList, node)){
            return;
        }
        // Config
        var area = cm.merge({
            'node' : node,
            'styleObject' : cm.getStyleObject(node),
            'type' : false,                             // content, form
            'isLocked' : false,
            'isTemporary' : false,
            'isSystem' : false,
            'isRemoveZone' : false,
            'draggableInChildNodes' : true,
            'cloneDraggable' : false,
            'items' : [],
            'chassis' : [],
            'dimensions' : {}
        }, params);
        // Get type
        area['type'] = area['node'].getAttribute('data-block-type');
        // Add mark classes
        cm.addClass(area['node'], 'pt__dnd-area');
        cm.addClass(area['node'], that.params['classes']['area']);
        if(area['isLocked']){
            cm.addClass(area['node'], 'is-locked');
        }else{
            cm.addClass(area['node'], 'is-available');
        }
        // Find draggable elements
        initAreaWidgets(area);
        // Push to areas array
        areasList.push(area['node']);
        areas.push(area);
    };

    var initAreaWidgets = function(area){
        var childNodes;
        area['items'] = [];
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
    };

    var initDraggable = function(node, area, params){
        // Config
        var draggable = cm.merge({
            'node' : node,
            'styleObject' : cm.getStyleObject(node),
            'type' : false,                             // content, form
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
        // Get type
        draggable['type'] = draggable['node'].getAttribute('data-block-type');
        // Set draggable event on element
        initDraggableDrag(draggable);
        // Return item to push in area array
        draggableList.push(draggable);
        return draggable;
    };

    var initDraggableDrag = function(draggable){
        var dragNode;
        draggable['drag'] = cm.getByAttr('data-com-draganddrop', 'drag', draggable['node'])[0];
        draggable['drag-bottom'] = cm.getByAttr('data-com-draganddrop', 'drag-bottom', draggable['node'])[0];
        // Set draggable event on element
        dragNode = draggable['drag'] || draggable['node'];
        // Add events
        cm.addEvent(dragNode, 'touchstart', function(e){
            start(e, draggable);
        });
        cm.addEvent(dragNode, 'mousedown', function(e){
            start(e, draggable);
        });
        if(draggable['drag-bottom']){
            cm.addEvent(draggable['drag-bottom'], 'mousedown', function(e){
                start(e, draggable);
            });
        }
    };

    /* *** DRAG AND DROP PROCESS ** */

    var start = function(e, draggable){
        cm.preventDefault(e);
        // If not left mouse button, don't duplicate drag event
        if(e.button){
            return;
        }
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return;
        }
        that.pointerType = e.type;
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e),
            x = position['left'],
            y = position['top'],
            tempCurrentAboveItem,
            tempCurrentPosition;
        pageSize = cm.getPageSize();
        // API onDragStart Event
        that.triggerEvent('onDragStart', {
            'item' : draggable,
            'node' : draggable['node'],
            'from' : draggable['area']
        });
        // Filter areas
        filteredAvailableAreas = areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(
                (draggable['type'] != area['type'] && !area['isRemoveZone'])
                || cm.isParent(draggable['node'], area['node'])
                || area['isLocked']
            ){
                return false;
            }
            // True - pass area
            return true;
        });
        // Highlight Areas
        if(that.params['highlightAreas']){
            toggleHighlightAreas();
        }
        // Get position and dimension of current draggable item
        getPosition(draggable);
        // Get offset position relative to touch point (cursor or finger position)
        draggable['dimensions']['offsetX'] = x - draggable['dimensions']['absoluteX1'];
        draggable['dimensions']['offsetY'] = y - draggable['dimensions']['absoluteY1'];
        // Set draggable item to current
        if(draggable['area']['cloneDraggable']){
            current = cloneDraggable(draggable);
        }else{
            current = draggable;
        }
        // Set position and dimension to current draggable node, before we insert it to draggableContainer
        current['node'].style.top = 0;
        current['node'].style.left = 0;
        current['node'].style.width = [current['dimensions']['width'], 'px'].join('');
        cm.setCSSTranslate(current['node'], [current['dimensions']['absoluteX1'], 'px'].join(''), [current['dimensions']['absoluteY1'], 'px'].join(''));
        // Unset area from draggable item
        unsetDraggableFromArea(current);
        // Insert draggable element to body
        if(that.params['draggableContainer'] && that.params['draggableContainer'] !== 'selfParent'){
            that.params['draggableContainer'].appendChild(current['node']);
        }
        cm.addClass(current['node'], 'pt__dnd-helper');
        cm.addClass(current['node'], 'is-active', true);
        // Calculate elements position and dimension
        getPositionsAll();
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
            if(y < current['area']['dimensions']['y1']){
                tempCurrentAboveItem = current['area']['items'][0];
                tempCurrentPosition = 'top';
            }else{
                tempCurrentAboveItem = current['area']['items'][current['area']['items'].length - 1];
                tempCurrentPosition = 'bottom';
            }
        }
        // Set chassis
        if(tempCurrentAboveItem){
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else{
            currentChassis = current['area']['chassis'][0];
        }
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-active');
            if(that.params['highlightChassis']){
                cm.addClass(currentChassis['node'], 'is-highlight');
            }
            currentChassis['node'].style.height = [current['dimensions']['absoluteHeight'], 'px'].join('');
        }
        // Set current area and above
        currentArea = current['area'];
        currentAboveItem = tempCurrentAboveItem;
        currentPosition = tempCurrentPosition;
        if(that.params['limit']){
            getPosition(currentArea);
            currentArea['node'].style.minHeight = currentArea['dimensions']['height']  + 'px';
        }
        cm.addClass(currentArea['node'], 'is-active');
        // Set check position event
        //checkInt = setInterval(checkPosition, 5);
        // Add move event on document
        cm.addClass(document.body, 'pt__dnd-body');
        // Add events
        switch(that.pointerType){
            case 'mousedown' :
                cm.addEvent(window, 'mousemove', move);
                cm.addEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.addEvent(window, 'touchmove', move);
                cm.addEvent(window, 'touchend', stop);
                break;
        }
    };

    var move = function(e){
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var position = cm.getEventClientPosition(e),
            x = position['left'],
            y = position['top'],
            posY = y - current['dimensions']['offsetY'],
            posX = x - current['dimensions']['offsetX'],
            styleX,
            styleY,
            tempCurrentArea,
            tempCurrentAboveItem,
            tempCurrentPosition;
        // Calculate drag direction and set new position
        switch(that.params['direction']){
            case 'both':
                styleX = [posX, 'px'].join('');
                styleY = [posY, 'px'].join('');
                break;
            case 'vertical':
                styleX = [current['dimensions']['absoluteX1'], 'px'].join('');
                if(that.params['limit']){
                    if(posY < current['area']['dimensions']['y1']){
                        styleY = [current['area']['dimensions']['y1'], 'px'].join('');
                    }else if(posY + current['dimensions']['absoluteHeight'] > current['area']['dimensions']['y2']){
                        styleY = [current['area']['dimensions']['y2'] - current['dimensions']['absoluteHeight'], 'px'].join('');
                    }else{
                        styleY = [posY, 'px'].join('');
                    }
                }else{
                    styleY = [posY, 'px'].join('');
                }
                break;
            case 'horizontal':
                styleX = [posX, 'px'].join('');
                styleY = [current['dimensions']['absoluteY1'], 'px'].join('');
                break;
        }
        cm.setCSSTranslate(current['node'], styleX, styleY);
        // Scroll node
        if(that.params['scroll']){
        //if(false){
            if(y + 48 > pageSize['winHeight']){
                toggleScroll(1);
            }else if(y - 48 < 0){
                toggleScroll(-1);
            }else{
                toggleScroll(0);
            }
        }
        // Check and recalculate position
        checkPosition();
        // Find above area
        cm.forEach(filteredAvailableAreas, function(area){
            if(x >= area['dimensions']['x1'] && x < area['dimensions']['x2'] && y >= area['dimensions']['y1'] && y <= area['dimensions']['y2']){
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
        // Animate previous chassis and get current
        if(currentChassis){
            cm.removeClass(currentChassis['node'], 'is-active is-highlight');
        }
        if(currentAboveItem && tempCurrentAboveItem && currentAboveItem['chassis'][currentPosition] != tempCurrentAboveItem['chassis'][tempCurrentPosition]){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, that.params['moveDuration']);
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else if(!currentAboveItem && tempCurrentAboveItem){
            animateChassis(currentArea['chassis'][0], 0, that.params['moveDuration']);
            currentChassis = tempCurrentAboveItem['chassis'][tempCurrentPosition];
        }else if(currentAboveItem && !tempCurrentAboveItem){
            animateChassis(currentAboveItem['chassis'][currentPosition], 0, that.params['moveDuration']);
            currentChassis = tempCurrentArea['chassis'][0];
        }else if(!currentAboveItem && !tempCurrentAboveItem && currentArea != tempCurrentArea){
            animateChassis(currentArea['chassis'][0], 0, that.params['moveDuration']);
            currentChassis = tempCurrentArea['chassis'][0];
        }
        // Animate current chassis
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-active');
            if(that.params['highlightChassis']){
                cm.addClass(currentChassis['node'], 'is-highlight');
            }
            animateChassis(currentChassis, current['dimensions']['absoluteHeight'], that.params['moveDuration']);
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
        // Set active area class name
        if(!(previousArea && previousArea['isTemporary'] && currentArea['isRemoveZone'])){
            cm.addClass(currentArea['node'], 'is-active');
        }
    };

    var stop = function(e){
        var currentHeight;
        // Remove check position event
        //checkInt && clearInterval(checkInt);
        // Remove move events attached on document
        cm.removeClass(document.body, 'pt__dnd-body');
        // Remove events
        switch(that.pointerType){
            case 'mousedown' :
                cm.removeEvent(window, 'mousemove', move);
                cm.removeEvent(window, 'mouseup', stop);
                break;
            case 'touchstart' :
                cm.removeEvent(window, 'touchmove', move);
                cm.removeEvent(window, 'touchend', stop);
                break;
        }
        // Calculate height of draggable block, like he already dropped in area, to animate height of fake empty space
        getPosition(current);
        current['node'].style.width = [(currentArea['dimensions']['innerWidth'] - current['dimensions']['margin']['left'] - current['dimensions']['margin']['right']), 'px'].join('');
        currentHeight = current['node'].offsetHeight + current['dimensions']['margin']['top'] + current['dimensions']['margin']['bottom'];
        current['node'].style.width = [current['dimensions']['width'], 'px'].join('');
        // If current draggable located above another draggable item, drops after/before it, or drops in area
        if(currentAboveItem){
            // Animate chassis blocks
            if(currentHeight != currentAboveItem['chassis'][currentPosition]['node'].offsetHeight){
                animateChassis(currentAboveItem['chassis'][currentPosition], currentHeight, that.params['dropDuration']);
            }
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'target' : currentAboveItem['node'],
                'append' : currentPosition == 'top' ? 'before' : 'after',
                'index' : currentArea['items'].indexOf(currentAboveItem) + (currentPosition == 'top' ? 0 : 1),
                'top' : [currentPosition == 'top'? currentAboveItem['dimensions']['absoluteY1'] : currentAboveItem['dimensions']['absoluteY2'], 'px'].join(''),
                'onStop' : unsetCurrentDraggable
            });
        }else if(currentArea['isRemoveZone'] || currentArea['isTemporary']){
            removeDraggable(current, {
                'onStop' : unsetCurrentDraggable
            });
        }else{
            // Animate chassis blocks
            animateChassis(currentArea['chassis'][0], currentHeight, that.params['dropDuration']);
            // Drop Item to Area
            dropDraggableToArea(current, currentArea, {
                'onStop' : unsetCurrentDraggable
            });
        }
        // Unset chassis
        if(currentChassis){
            cm.removeClass(currentChassis['node'], 'is-active is-highlight');
        }
        // Unset active area classname
        if(currentArea){
            if(that.params['limit']){
                currentArea['node'].style.minHeight = '';
            }
            cm.removeClass(currentArea['node'], 'is-active');
        }
        // Un Highlight Areas
        if(that.params['highlightAreas']){
            toggleHighlightAreas();
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
    };

    /* *** DRAGGABLE MANIPULATION FUNCTIONS *** */

    var cloneDraggable = function(draggable){
        var clonedNode = draggable['node'].cloneNode(true),
            area = that.params['renderTemporaryAria']? areas[0] : draggable['area'],
            clonedDraggable = initDraggable(clonedNode, area, {});

        clonedDraggable['dimensions'] = cm.clone(draggable['dimensions']);
        area['items'].push(clonedDraggable);
        return clonedDraggable;
    };

    var dropDraggableToArea = function(draggable, area, params){
        params = cm.merge({
            'target' : area['node'],
            'append' : 'child',
            'index' : 0,
            'width' : [area['dimensions']['innerWidth'], 'px'].join(''),
            'top' : [area['dimensions']['innerY1'] - draggable['dimensions']['margin']['top'], 'px'].join(''),
            'left' : [area['dimensions']['innerX1'] - draggable['dimensions']['margin']['left'], 'px'].join(''),
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // Animate draggable item, like it drops in area
        cm.addClass(draggable['node'], 'is-drop', true);
        draggable['node'].style.width = params['width'];
        cm.setCSSTranslate(draggable['node'], params['left'], params['top']);
        // On Dnimate Stop
        setTimeout(function(){
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
            cm.removeClass(draggable['node'], 'pt__dnd-helper is-drop is-active', true);
            // Reset styles
            draggable['node'].style.left = 'auto';
            draggable['node'].style.top = 'auto';
            draggable['node'].style.width = 'auto';
            cm.setCSSTranslate(current['node'], 'auto', 'auto');
            // Set index of draggable item in new area
            area['items'].splice(params['index'], 0, draggable);
            // API onDrop Event
            that.triggerEvent('onDrop', {
                'item' : draggable,
                'node' : draggable['node'],
                'to' : area,
                'from' : draggable['area'],
                'index' : params['index']
            });
            // Set draggable new area
            draggable['area'] = area;
            // System onStop event
            params['onStop']();
        }, that.params['dropDuration']);
    };

    var removeDraggable = function(draggable, params){
        var style, anim, node;
        // Remove handler
        var handler = function(){
            if(that.params['removeNode']){
                cm.remove(node);
            }
            // Remove from draggable list
            draggableList = draggableList.filter(function(item){
                return item != draggable;
            });
            unsetDraggableFromArea(draggable);
            // API onRemove Event
            if(!params['noEvent']){
                that.triggerEvent('onRemove', {
                    'item' : draggable,
                    'node' : draggable['node'],
                    'from' : draggable['area']
                });
            }
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
        if(params['isInDOM'] && that.params['animateRemove']){
            // If draggable is current - just animate pull out left, else - wrap to removable node
            if(params['isCurrent']){
                node = draggable['node'];
                anim = draggable['anim'];
                style = {
                    'left' : [-(draggable['dimensions']['absoluteWidth'] + 50), 'px'].join(''),
                    'opacity' : 0
                };
            }else{
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable'}), draggable['node']);
                anim = new cm.Animation(node);
                style = {
                    'height' : '0px',
                    'opacity' : 0
                };
            }
            // Animate draggable, like it disappear
            anim.go({
                'duration' : that.params['dropDuration'],
                'anim' : 'smooth',
                'style' : style,
                'onStop' : handler
            });
        }else{
            node = draggable['node'];
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
        var node = cm.Node(that.params['chassisTag'], {'class' : 'pt__dnd-chassis'});
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
        if(that.params['useCSSAnimation'] || isGracefulDegradation){
            if(!isGracefulDegradation && (style = cm.getSupportedStyle('transition-duration'))){
                chassis['node'].style[style] = [duration, 'ms'].join('');
            }
            chassis['node'].style.height = height;
        }else{
            chassis['anim'].go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : duration});
        }
    };

    /* *** POSITION CALCULATION FUNCTIONS *** */

    var getPosition = function(item){
        item['dimensions'] = cm.extend(item['dimensions'], cm.getFullRect(item['node'], item['styleObject']));
    };

    var getPositions = function(arr){
        cm.forEach(arr, getPosition);
    };

    var getPositionsAll = function(){
        getPositions(areas);
        cm.forEach(areas, function(area){
            getPositions(area['items']);
        });
    };

    var recalculatePosition = function(item){
        //item['dimensions']['x1'] = cm.getRealX(item['node']);
        item['dimensions']['y1'] = cm.getRealY(item['node']);
        //item['dimensions']['x2'] = item['dimensions']['x1'] + item['dimensions']['width'];
        item['dimensions']['y2'] = item['dimensions']['y1'] + item['dimensions']['height'];

        //item['dimensions']['innerX1'] = item['dimensions']['x1'] + item['dimensions']['padding']['left'];
        item['dimensions']['innerY1'] = item['dimensions']['y1'] + item['dimensions']['padding']['top'];
        //item['dimensions']['innerX2'] = item['dimensions']['innerX1'] + item['dimensions']['innerWidth'];
        item['dimensions']['innerY2'] = item['dimensions']['innerY1'] + item['dimensions']['innerHeight'];

        //item['dimensions']['absoluteX1'] = item['dimensions']['x1'] - item['dimensions']['margin']['left'];
        item['dimensions']['absoluteY1'] = item['dimensions']['y1'] - item['dimensions']['margin']['top'];
        //item['dimensions']['absoluteX2'] = item['dimensions']['x2'] + item['dimensions']['margin']['right'];
        item['dimensions']['absoluteY2'] = item['dimensions']['y2'] + item['dimensions']['margin']['bottom'];
    };

    var recalculatePositions = function(arr){
        cm.forEach(arr, recalculatePosition);
    };

    var recalculatePositionsAll = function(){
        var chassisHeight = 0;
        // Reset current active chassis height, cause we need to calculate clear positions
        if(currentChassis){
            cm.addClass(currentChassis['node'], 'is-immediately');
            chassisHeight = currentChassis['node'].offsetHeight;
            currentChassis['node'].style.height = 0;
        }
        recalculatePositions(areas);
        cm.forEach(areas, function(area){
            recalculatePositions(area['items']);
        });
        // Restoring chassis height after calculation
        if(currentChassis && chassisHeight){
            currentChassis['node'].style.height = [chassisHeight, 'px'].join('');
            (function(currentChassis){
                setTimeout(function(){
                    cm.removeClass(currentChassis['node'], 'is-immediately');
                }, 5);
            })(currentChassis);
        }
    };

    var checkPosition = function(){
        var filteredAreas = getFilteredAreas();
        if(filteredAreas[0]['dimensions']['y1'] != cm.getRealY(filteredAreas[0]['node'])){
            recalculatePositionsAll();
        }
    };

    /* *** AREA FUNCTIONS *** */

    var getFilteredAreas = function(){
        return areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(area['isTemporary'] || area['isSystem']){
                return false;
            }
            // True - pass area
            return true;
        });
    };

    var getRemoveZones = function(){
        return areas.filter(function(area){
            return area['isRemoveZone'];
        });
    };

    var toggleHighlightAreas = function(){
        if(filteredAvailableAreas){
            if(isHighlightedAreas){
                isHighlightedAreas = false;
                cm.forEach(filteredAvailableAreas, function(area){
                    cm.removeClass(area['node'], 'is-highlight');
                });
            }else{
                isHighlightedAreas = true;
                cm.forEach(filteredAvailableAreas, function(area){
                    cm.addClass(area['node'], 'is-highlight');
                });
            }
        }
    };

    /* *** HELPERS *** */

    var toggleScroll = function(speed){
        var scrollRemaining,
            duration,
            styles = {};

        if(speed == 0){
            isScrollProccess = false;
            anims['scroll'].stop();
        }else if(speed < 0 && !isScrollProccess){
            isScrollProccess = true;
            duration = cm.getScrollTop(that.params['scrollNode']) * that.params['scrollSpeed'];
            if(cm.isWindow(that.params['scrollNode'])){
                styles['docScrollTop'] = 0;
            }else{
                styles['scrollTop'] = 0;
            }
            anims['scroll'].go({'style' : styles, 'duration' : duration, 'onStop' : function(){
                isScrollProccess = false;
                //getPositionsAll();
                //recalculatePositionsAll();
            }});
        }else if(speed > 0 && !isScrollProccess){
            isScrollProccess = true;
            scrollRemaining = cm.getScrollHeight(that.params['scrollNode']) - pageSize['winHeight'];
            if(cm.isWindow(that.params['scrollNode'])){
                styles['docScrollTop'] = scrollRemaining;
            }else{
                styles['scrollTop'] = scrollRemaining;
            }
            duration = scrollRemaining * that.params['scrollSpeed'];
            anims['scroll'].go({'style' : styles, 'duration' : duration, 'onStop' : function(){
                isScrollProccess = false;
                //getPositionsAll();
                //recalculatePositionsAll();
            }});
        }
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

    that.updateArea = function(node){
        var area = that.getArea(node);
        if(area){
            initAreaWidgets(area);
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

    that.getDraggableList = function(){
        return draggableList;
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

    that.replaceDraggable = function(oldDraggableNode, newDraggableNode, params){
        var oldDraggable,
            newDraggable;
        // Find draggable item
        cm.forEach(draggableList, function(item){
            if(item['node'] === oldDraggableNode){
                oldDraggable = item;
            }
        });
        if(oldDraggable){
            // Find old draggable area and index in area
            var area = oldDraggable['area'],
                index = area['items'].indexOf(oldDraggable),
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable', 'style' : 'height: 0px;'}), newDraggableNode),
                anim = new cm.Animation(node);
            // Append new draggable into DOM
            cm.insertAfter(node, oldDraggableNode);
            // Remove old draggable
            removeDraggable(oldDraggable, params);
            // Animate new draggable
            anim.go({'style' : {'height' : [cm.getRealHeight(node, 'offset', 0), 'px'].join(''), 'opacity' : 1}, 'duration' : 300, 'anim' : 'simple', 'onStop' : function(){
                cm.insertAfter(newDraggableNode, node);
                cm.remove(node);
                // Register new draggable
                newDraggable = initDraggable(newDraggableNode, area);
                area['items'].splice(index, 0, newDraggable);
                // API onEmbed event
                that.triggerEvent('onReplace', {
                    'item' : newDraggable,
                    'node' : newDraggable['node'],
                    'to' : newDraggable['to']
                });
            }});
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
    
    init();
});