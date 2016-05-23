cm.define('Com.Dashboard', {
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

    that.currentAreas = [];
    that.currentPlaceholder = null;
    that.currentArea = null;
    that.currentWidget = null;

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
            that.triggerEvent('onInit');
            that.triggerEvent('onRender');
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
                'type' : 'area',
                'isLocked' : false,
                'isTemporary' : false,
                'isSystem' : false,
                'isRemoveZone' : false,
                'draggableInChildNodes' : true,
                'cloneDraggable' : false,
                'items' : [],
                'chassis' : [],
                'placeholders' : [],
                'dimensions' : {}
            }, params),
            childNodes;
        // Add mark classes
        cm.addClass(area['node'], 'com__dashboard__area');
        cm.addClass(area['node'], that.params['classes']['area']);
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
            'styleObject' : cm.getStyleObject(node),
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
        draggable['drag-bottom'] = cm.getByAttr('data-com-draganddrop', 'drag-bottom', draggable['node'])[0];
        // Set draggable event on element
        dragNode = draggable['drag'] || draggable['node'];
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

    var start = function(e, widget){
        cm.preventDefault(e);
        // Prevent multiple drag event
        if(that.currentWidget){
            return;
        }
        // Prevent drag event not on LMB
        if(!cm.isTouch && e.button){
            return;
        }
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        cm.addClass(document.body, 'com__dashboard__body');
        // Get pointer position
        var params = cm.getEventClientPosition(e);
        // Filter areas
        that.currentAreas = getDroppableAreas(widget);
        // Drag start event
        that.triggerEvent('onDragStart', {
            'item' : widget,
            'node' : widget['node'],
            'from' : widget['area']
        });
        // Prepare widget, get offset, set start position, set widget as current
        prepareWidget(widget, params);
        // Render placeholders in filtered areas
        renderPlaceholders(that.currentAreas);
        // Find placeholder above widget
        checkPlaceholders(that.currentAreas, params);
        getCurrentPlaceholder(that.currentAreas, params);
        // Add events
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
        cm.addScrollEvent(window, scroll);
    };

    var move  = function(e){
        cm.preventDefault(e);
        // Get pointer position
        var params = cm.getEventClientPosition(e);
        // Move widget
        moveWidget(that.currentWidget, params, true);
        // Find placeholder above widget
        checkPlaceholders(that.currentAreas, params);
        getCurrentPlaceholder(that.currentAreas, params);
    };

    var stop = function(){
        // Unhighlight Placeholder
        unhighlightPlaceholder(that.currentPlaceholder);
        // Drop widget
        if(!that.currentArea || that.currentArea['isRemoveZone'] || that.currentArea['isTemporary']){
            removeWidget(that.currentWidget, {
                'onStop' : clear
            });
        }else{
            dropWidget(that.currentWidget, that.currentArea, {
                'index' : that.currentPlaceholder['index'],
                'placeholder' : that.currentPlaceholder,
                'onStop' : clear
            });
        }
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        cm.removeClass(document.body, 'com__dashboard__body');
        // Remove move events attached on document
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
        cm.removeScrollEvent(window, scroll);
    };

    var scroll = function(e){
        // Get pointer position
        var params = {
            'left' : cm._clientPosition['x'],
            'top' : cm._clientPosition['y']
        };
        // Update placeholders position
        updatePlaceholdersDimensions(that.currentAreas, params);
        // Find placeholder above widget
        getCurrentPlaceholder(that.currentAreas, params);
    };

    var clear = function(){
        removePlaceholders(that.currentAreas);
        // Clear variables
        that.currentAreas = [];
        that.currentPlaceholder = null;
        that.currentArea = null;
        that.currentWidget = null;
    };

    var startold = function(e, draggable){
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return;
        }
        cm.preventDefault(e);
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // Check event type and get cursor / finger position
        var x = cm._clientPosition['x'],
            y = cm._clientPosition['y'],
            tempCurrentAboveItem,
            tempCurrentPosition;
        if(!cm.isTouch){
            // If not left mouse button, don't duplicate drag event
            if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
                return;
            }
        }
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
            if(cm.isParent(draggable['node'], area['node']) || area['isLocked']){
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
        if(that.params['draggableContainer'] && that.params['draggableContainer'] != 'selfParent'){
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
        cm.addClass(currentArea['node'], 'is-active');
        // Set check position event
        //checkInt = setInterval(checkPosition, 5);
        // Add move event on document
        cm.addClass(document.body, 'pt__dnd-body');
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
    };

    var moveold = function(e){
        cm.preventDefault(e);
        // Check event type and get cursor / finger position
        var x = cm._clientPosition['x'],
            y = cm._clientPosition['y'],
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
                    }else if(posY > current['area']['dimensions']['y2']){
                        styleY = [current['area']['dimensions']['y2'], 'px'].join('');
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

    var stopold = function(e){
        var currentHeight;
        // Remove check position event
        //checkInt && clearInterval(checkInt);
        // Remove move events attached on document
        cm.removeClass(document.body, 'pt__dnd-body');
        cm.removeEvent(window, 'mousemove', move);
        cm.removeEvent(window, 'mouseup', stop);
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

    /* *** WIDGET *** */

    var prepareWidget = function(widget, params){
        updateDimensions(widget);
        // Get offset using pointer position (x and y)
        widget['dimensions']['offsetX'] = widget['dimensions']['absoluteX1'] - params['left'];
        widget['dimensions']['offsetY'] = widget['dimensions']['absoluteY1'] - params['top'];
        // Check clone statement and set widget as current
        if(widget['area']['cloneDraggable']){
            that.currentWidget = cloneDraggable(widget);
        }else{
            that.currentWidget = widget;
        }
        // Unset widget from his area
        unsetDraggableFromArea(that.currentWidget);
        // Set widget start position
        that.currentWidget['node'].style.top = 0;
        that.currentWidget['node'].style.left = 0;
        moveWidget(that.currentWidget, {
            'left' : that.currentWidget['dimensions']['absoluteX1'],
            'top' : that.currentWidget['dimensions']['absoluteY1'],
            'width' : that.currentWidget['dimensions']['width']
        });
        // Insert widget to body
        if(that.params['draggableContainer']){
            that.params['draggableContainer'].appendChild(that.currentWidget['node']);
        }
        // Set helper classes
        cm.addClass(that.currentWidget['node'], 'com__dashboard__helper');
        cm.addClass(that.currentWidget['node'], 'is-active', true);
    };

    var moveWidget = function(widget, params, offset){
        // Calculate
        var left = params['left'],
            top = params['top'],
            node = params['node'] || widget['node'];
        if(offset){
            left += widget['dimensions']['offsetX'];
            top += widget['dimensions']['offsetY'];
        }
        if(typeof params['width'] != 'undefined'){
            node.style.width = [params['width'], 'px'].join('');
        }
        if(typeof params['height'] != 'undefined'){
            node.style.height = [params['height'], 'px'].join('');
        }
        if(typeof params['opacity'] != 'undefined'){
            node.style.opacity = params['opacity'];
        }
        cm.setCSSTranslate(node, [left, 'px'].join(''), [top, 'px'].join(''));
    };

    var resetWidget = function(widget){
        // Remove helper classes
        cm.removeClass(widget['node'], 'com__dashboard__helper is-drop is-active', true);
        // Reset styles
        widget['node'].style.left = 'auto';
        widget['node'].style.top = 'auto';
        widget['node'].style.width = 'auto';
        cm.setCSSTranslate(widget['node'], 'auto', 'auto');
    };

    var dropWidget = function(widget, area, params){
        // Update area dimensions
        updateDimensions(area);
        // Merge params
        params = cm.merge({
            'index' : 0,
            'placeholder' : null,
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // Init drop state
        cm.addClass(widget['node'], 'is-drop', true);
        // Update widget dimensions
        updateDimensions(widget);
        // Move widget
        if(params['placeholder']){
            moveWidget(widget, {
                'left' : params['placeholder']['dimensions']['left'] - widget['dimensions']['margin']['left'],
                'top' : params['placeholder']['dimensions']['top'] - widget['dimensions']['margin']['top'],
                'width' : area['dimensions']['innerWidth']
            });
            // Animate placeholder
            cm.transition(params['placeholder']['node'], {
                'properties' : {
                    'height' : [widget['dimensions']['absoluteHeight'], 'px'].join('')
                },
                'duration' : that.params['dropDuration']

            });
        }else{
            moveWidget(widget, {
                'left' : area['dimensions']['innerX1'] - widget['dimensions']['margin']['left'],
                'top' : area['dimensions']['innerY1'] - widget['dimensions']['margin']['top'],
                'width' : area['dimensions']['innerWidth']
            });
        }
        // Animation end event
        setTimeout(function(){
            // Append
            if(params['placeholder']){
                cm.insertBefore(widget['node'], params['placeholder']['node']);
            }else{
                cm.appendChild(widget['node'], area['node']);
            }
            // Reset styles
            resetWidget(widget);
            // Set index of draggable item in new area
            area['items'].splice(params['index'], 0, widget);
            // Drop event
            that.triggerEvent('onDrop', {
                'item' : widget,
                'node' : widget['node'],
                'from' : widget['area'],
                'to' : area,
                'index' : params['index']
            });
            // Set draggable new area
            widget['area'] = area;
            // System onStop event
            params['onStop']();
        }, that.params['dropDuration']);
    };

    var removeWidget = function(widget, params){
        var node;
        // Merge params
        params = cm.merge({
            'onStart' : function(){},
            'onStop' : function(){}
        }, params);
        // System onStart event
        params['onStart']();
        // Check if widget exists and placed in DOM
        if(cm.inDOM(widget['node'])){
            // Update widget dimensions
            updateDimensions(widget);
            // Init drop state
            cm.addClass(widget['node'], 'is-drop', true);
            // Move widget
            if(widget === that.currentWidget){
                node = widget['node'];
                moveWidget(widget, {
                    'left' : -widget['dimensions']['absoluteWidth'],
                    'top' : widget['dimensions']['absoluteY1'],
                    'opacity' : 0
                });
            }else{
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable'}), widget['node']);
                cm.transition(node, {
                    'properties' : {
                        'height' : '0px',
                        'opacity' : 0
                    },
                    'duration' : that.params['dropDuration'],
                    'easing' : 'linear'
                });
            }
        }else{
            node = widget['node'];
        }
        // Animation end event
        setTimeout(function(){
            if(that.params['removeNode']){
                cm.remove(node);
            }
            // Remove from draggable list
            draggableList = draggableList.filter(function(item){
                return item != widget;
            });
            unsetDraggableFromArea(widget);
            // API onRemove Event
            if(!params['noEvent']){
                that.triggerEvent('onRemove', {
                    'item' : widget,
                    'node' : widget['node'],
                    'from' : widget['area']
                });
            }
            // System onStop event
            params['onStop']();
        }, that.params['dropDuration']);
    };

    /* *** PLACEHOLDER *** */

    var renderPlaceholders = function(areas){
        var placeholder;
        cm.forEach(areas, function(area){
            if(area['isLocked']){
                return;
            }
            if(!area['items'].length){
                placeholder = renderPlaceholder(area['node'], {
                    'append' : 'appendChild',
                    'isArea' : true
                });
                placeholder['area'] = area;
                placeholder['index'] = 0;
                area['placeholders'].push(placeholder);
            }
            cm.log('start');
            cm.forEach(area['items'], function(widget, i){
                cm.log(widget);
                if(i === 0){
                    placeholder = renderPlaceholder(widget['node'], {
                        'append' : 'insertBefore'
                    });
                    placeholder['area'] = area;
                    placeholder['index'] = i;
                    area['placeholders'].push(placeholder);
                }
                placeholder = renderPlaceholder(widget['node'], {
                    'append' : 'insertAfter'
                });
                placeholder['area'] = area;
                placeholder['index'] = i + 1;
                area['placeholders'].push(placeholder);
            });
        });
    };

    var renderPlaceholder = function(targetNode, params){
        params = cm.merge({
            'append' : 'appendChild',
            'isArea' : false
        }, params);
        // Placeholder object
        var placeholder = {
            'node' : cm.node(that.params['chassisTag'], {'class' : 'com__dashboard__placeholder'}),
            'isActive' : false,
            'isExpand' : false,
            'index' : 0,
            'area' : null
        };

        params['isArea'] && cm.addClass(placeholder['node'], 'is-area');
        cm[params['append']](placeholder['node'], targetNode);
        placeholder['dimensions'] = cm.getRect(placeholder['node']);
        cm.addClass(placeholder['node'], 'is-show', true);
        return placeholder;
    };

    var removePlaceholders = function(areas){
        cm.forEach(areas, function(area){
            cm.forEach(area['placeholders'], function(placeholder){
                cm.remove(placeholder['node']);
            });
            area['placeholders'] = [];
        });
    };

    var updatePlaceholdersDimensions = function(areas, params){
        cm.forEach(areas, function(area){
            cm.forEach(area['placeholders'], function(placeholder){
                placeholder['dimensions'] = cm.getRect(placeholder['node']);
            });
        });
    };

    var checkPlaceholders = function(areas, params){
        var additional = 96,
            top = params['top'] - additional,
            bottom = params['top'] + additional;
        cm.forEach(areas, function(area){
            cm.forEach(area['placeholders'], function(item){
                if(!cm.inRange(item['dimensions']['top'], item['dimensions']['bottom'], top, bottom)){
                    if(item['isExpand']){
                        collapsePlaceholder(item);
                        updatePlaceholdersDimensions(areas, params);
                        checkPlaceholders(areas, params);
                    }
                }else{
                    if(!item['isExpand']){
                        expandPlaceholder(item);
                        updatePlaceholdersDimensions(areas, params);
                        checkPlaceholders(areas, params);
                    }
                }
            });
        });
    };

    var getPlaceholder = function(areas, params){
        var placeholder;
        cm.forEach(areas, function(area){
            cm.forEach(area['placeholders'], function(item){
                if(
                    item['dimensions']['left'] <= params['left'] &&
                    item['dimensions']['right'] >= params['left'] &&
                    item['dimensions']['top']  <= params['top'] &&
                    item['dimensions']['bottom'] >= params['top']
                ){
                    placeholder = item;
                }
            });
        });
        return placeholder;
    };

    var getCurrentPlaceholder = function(areas, params){
        var placeholder = getPlaceholder(areas, params);
        if(!placeholder){
            placeholder = that.currentPlaceholder;
        }
        if(that.currentPlaceholder && placeholder != that.currentPlaceholder){
            unhighlightPlaceholder(that.currentPlaceholder);
        }
        if(placeholder && placeholder != that.currentPlaceholder){
            highlightPlaceholder(placeholder);
        }
        that.currentPlaceholder = placeholder;
        // Get current area
        if(that.currentPlaceholder){
            that.currentArea = that.currentPlaceholder['area'];
        }
        // Update placeholders position
        updatePlaceholdersDimensions(areas, params);
    };

    var expandPlaceholder = function(placeholder){
        if(placeholder && !placeholder['isExpand']){
            placeholder['isExpand'] = true;
            cm.addClass(placeholder['node'], 'is-expand', true);
        }
    };

    var collapsePlaceholder = function(placeholder){
        if(placeholder && placeholder['isExpand']){
            placeholder['isExpand'] = false;
            cm.removeClass(placeholder['node'], 'is-expand', true);
        }
    };

    var highlightPlaceholder = function(placeholder){
        if(placeholder && !placeholder['isActive']){
            highlightArea(placeholder['area']);
            placeholder['isActive'] = true;
            cm.addClass(placeholder['node'], 'is-active');
        }
    };

    var unhighlightPlaceholder = function(placeholder){
        if(placeholder && placeholder['isActive']){
            unhighlightArea(placeholder['area']);
            placeholder['isActive'] = false;
            cm.removeClass(placeholder['node'], 'is-active');
        }
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

    var updateDimensions = function(item){
        item['dimensions'] = cm.extend(item['dimensions'], cm.getFullRect(item['node'], item['styleObject']));
    };

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
            // Filter out temporary and system areas
            if(area['isTemporary'] || area['isSystem']){
                return false;
            }
            // True - pass area
            return true;
        });
    };

    var getDroppableAreas = function(widget){
        return areas.filter(function(area){
            // Filter out locked areas and inner areas
            if(cm.isParent(widget['node'], area['node']) || area['isLocked']){
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

    var highlightArea = function(area){
        if(area && !area['isActive']){
            area['isActive'] = true;
            cm.addClass(area['node'], 'is-active');
        }
    };

    var unhighlightArea = function(area){
        if(area && area['isActive']){
            area['isActive'] = false;
            cm.removeClass(area['node'], 'is-active');
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
                node = cm.wrap(cm.Node('div', {'class' : 'pt__dnd-removable', 'style' : 'height: 0px;'}), newDraggableNode);
            // Append new draggable into DOM
            cm.insertAfter(node, oldDraggableNode);
            // Remove old draggable
            removeDraggable(oldDraggable, params);
            // Animate new draggable
            cm.transition(node, {
                'properties' : {
                    'height' : [cm.getRealHeight(node, 'offset', 0), 'px'].join(''),
                    'opacity' : 1
                },
                'duration' : that.params['dropDuration'],
                'easing' : 'linear',
                'onStop' : function(){
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
                }
            });

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