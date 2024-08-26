Com.Elements['Columns'] = {};

Com['GetColumns'] = function(id){
    return Com.Elements.Columns[id] || null;
};

cm.define('Com.Columns', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack'
    ],
    'required' : [
        'Com.Draggable'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onAdd',
        'onRemove',
        'onChange',
        'onResize',
        'onEnableEditing',
        'onEnableEditable',
        'onDisableEditing',
        'onDisableEditable',
    ],
    'params' : {
        'columns' : false,                  // Deprecated, use 'node' parameter instead.
        'node' : cm.node('div'),
        'container' : false,
        'name' : '',
        'renderStructure' : false,
        'minColumnWidth' : 48,              // in px
        'data' : [],
        'isEditing' : true,
        'customEvents' : true
    }
},
function(params){
    var that = this,
        nodes = {},
        current;

    that.isEditing = null;
    that.pointerType = null;
    that.items = [];
    that.chassis = [];

    /* *** INIT *** */

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        renderChassis();
        that.params['isEditing'] && that.enableEditing();
        that.addToStack(nodes['container']);
        that.triggerEvent('onRender');
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['columns'])){
            that.params['node'] = that.params['columns'];
        }
    };

    /* *** STRUCTURE *** */

    var render = function(){
        if(that.params['renderStructure']){
            renderStructure();
        }else if(that.params['node']){
            collect();
        }
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(nodes['container'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(nodes['container'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(nodes['container'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
    };

    var collect = function(){
        var columns;
        // Collect nodes
        nodes['container'] = that.params['node'];
        nodes['inner'] = cm.getByAttr('data-com__columns', 'inner', nodes['container'])[0];
        nodes['holder'] = cm.getByAttr('data-com__columns', 'holder', nodes['container'])[0];
        // Set editable class
        //cm.addClass(nodes['container'], 'is-editable');
        // Collect only first child columns
        columns = cm.clone(cm.getByAttr('data-com__columns', 'column', nodes['holder']) || []);
        columns = columns.filter(function(item){
            var past = true;
            cm.forEach(columns, function(testItem){
                if(cm.isParent(testItem, item)){
                    past = false;
                }
            });
            return past;
        });
        cm.forEach(columns, collectColumn);
    };

    var renderStructure = function(){
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__columns'},
            nodes['inner'] = cm.node('div', {'class' : 'inner'},
                nodes['holder'] = cm.node('div', {'class' : 'container'})
            )
        );
        // Render Columns
        cm.forEach(that.params['data'], renderColumn);
        // Embed
        if(that.params['container']){
            that.params['container'].appendChild(nodes['container']);
        }
    };

    /* *** COLUMNS *** */

    var collectColumn = function(container){
        var item = {
            'container' : container,
            'inner' : cm.getByAttr('data-com__columns', 'column-inner', container)[0] || cm.node('div'),
            'width' : container.style.width
        };
        // Render ruler
        renderRuler(item);
        // Push to items array
        that.items.push(item);
    };

    var renderColumn = function(item, execute){
        item = cm.merge({
            'width' : '0%'
        }, item);
        // Structure
        item['container'] = cm.node('div', {'class' : 'com__column'},
            item['inner'] = cm.node('div', {'class' : 'inner'})
        );
        // Render ruler
        renderRuler(item);
        // Push to items array
        that.items.push(item);
        // Embed
        nodes['holder'].appendChild(item['container']);
        if(execute){
            // API onAdd event
            that.triggerEvent('onAdd', item);
        }
        return item;
    };

    var removeColumn = function(item, execute){
        var index = that.items.indexOf(item);
        cm.remove(item['container']);
        that.items.splice(index, 1);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var removeLastColumn = function(execute){
        var item = that.items.pop();
        cm.remove(item['container']);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var setEqualDimensions = function(){
        var itemsLength = that.items.length,
            width = (100 / itemsLength).toFixed(2);

        cm.forEach(that.items, function(item){
            item['width'] = [width, '%'].join('');
            item['container'].style.width = item['width'];
            item['rulerCounter'].innerHTML = item['width'];
        });
        // API onResize event
        that.triggerEvent('onResize', that.items);
        that.triggerEvent('onChange', that.items);
    };

    /* *** RULERS METHODS *** */

    var renderRuler = function(item){
        // Structure
        item['rulerContainer'] = cm.node('div', {'class' : 'com__columns__ruler'},
            item['ruler'] = cm.node('div', {'class' : 'pt__ruler is-horizontal is-small'},
                cm.node('div', {'class' : 'line line-top'}),
                item['rulerCounter'] = cm.node('div', {'class' : 'counter'}, item['width']),
                cm.node('div', {'class' : 'line line-bottom'})
            )
        );
        // Embed
        cm.insertFirst(item['rulerContainer'], item['inner']);
    };

    /* *** CHASSIS METHODS *** */

    var renderChassis = function(){
        that.chassis = [];
        var count = that.items.length - 1;
        cm.forEach(count, renderChassisItem);
    };

    var removeChassis = function(){
        cm.forEach(that.chassis, function(chassis){
            cm.remove(chassis['container']);
        });
        that.chassis = [];
    };

    var updateChassis = function(){
        removeChassis();
        renderChassis();
    };

    var redrawChassis = function(){
        cm.forEach(that.chassis, function(item){
            redrawChassisItem(item);
        });
    };

    var renderChassisItem = function(i){
        var chassis = {
            'index' : i
        };
        // Structure
        chassis['container'] = cm.node('div', {'class' : 'com__columns__chassis'},
            chassis['drag'] = cm.node('div', {'class' : 'pt__drag is-horizontal'},
                cm.node('div', {'class' : 'line'}),
                cm.node('div', {'class' : 'drag'},
                    cm.node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Styles
        redrawChassisItem(chassis);
        // Push to chassis array
        that.chassis.push(chassis);
        // Add events
        cm.addEvent(chassis['container'], 'touchstart', function(e){
            start(e, chassis);
        });
        cm.addEvent(chassis['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        nodes['inner'].appendChild(chassis['container']);
    };

    var redrawChassisItem = function(chassis){
        var ratio = nodes['holder'].offsetWidth / 100,
            i = chassis['index'],
            left = ((cm.getRealX(that.items[i]['container']) - cm.getRealX(nodes['holder']) + that.items[i]['container'].offsetWidth) / ratio).toFixed(2);
        // Structure
        chassis['container'].style.left = [left, '%'].join('');
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(current){
            return;
        }
        that.pointerType = e.type;
        // Current
        if(e.ctrlKey || e.metaKey){
            blockContextMenu();
            setEqualDimensions();
            redrawChassis();
        }else{
            // Hide IFRAMES and EMBED tags
            cm.hideSpecialTags();
            // Get columns
            var index = that.chassis.indexOf(chassis),
                leftColumn = that.items[index],
                rightColumn = that.items[index + 1];

            current = {
                'index' : index,
                'offset' : cm.getRealX(nodes['holder']),
                'ratio' : nodes['holder'].offsetWidth / 100,
                'chassis' : chassis,
                'left' : {
                    'column' : leftColumn,
                    'offset' : cm.getRealX(leftColumn['container'])
                },
                'right' : {
                    'column' : rightColumn,
                    'offset' : cm.getRealX(rightColumn['container']) + rightColumn['container'].offsetWidth
                }
            };
            // Add move event on document
            cm.addClass(nodes['container'], 'is-active');
            cm.addClass(current['chassis']['drag'], 'is-active');
            cm.addClass(current['left']['column']['ruler'], 'is-active');
            cm.addClass(current['right']['column']['ruler'], 'is-active');
            cm.addClass(document.body, 'pt__drag__body--horizontal');
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
        }
    };

    var move = function(e){
        cm.preventDefault(e);
        // Calculate sizes and positions
        var position = cm.getEventClientPosition(e),
            toFixed = e.shiftKey ? 0 : 2,
            leftWidth = position['left'] - current['left']['offset'],
            rightWidth = current['right']['offset'] - position['left'];
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            current['left']['column']['width'] = [(leftWidth / current['ratio']).toFixed(toFixed), '%'].join('');
            current['right']['column']['width'] = [(rightWidth / current['ratio']).toFixed(toFixed), '%'].join('');

            current['left']['column']['container'].style.width = current['left']['column']['width'];
            current['right']['column']['container'].style.width = current['right']['column']['width'];
            current['chassis']['container'].style.left = [((position['left'] - current['offset']) / current['ratio']).toFixed(toFixed), '%'].join('');

            current['left']['column']['rulerCounter'].innerHTML = current['left']['column']['width'];
            current['right']['column']['rulerCounter'].innerHTML = current['right']['column']['width'];
        }
        // API onResize event
        that.triggerEvent('onChange', that.items);
    };

    var stop = function(){
        // Remove move event from document
        cm.removeClass(nodes['container'], 'is-active');
        cm.removeClass(current['chassis']['drag'], 'is-active');
        cm.removeClass(current['left']['column']['ruler'], 'is-active');
        cm.removeClass(current['right']['column']['ruler'], 'is-active');
        cm.removeClass(document.body, 'pt__drag__body--horizontal');
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
        current = null;
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', that.items);
    };

    /* *** HELPERS *** */

    var blockContextMenu = function(){
        cm.addEvent(window, 'contextmenu', contextMenuHandler);
        cm.addEvent(window, 'mouseup', restoreContextMenu);
    };

    var restoreContextMenu = function(){
        cm.removeEvent(window, 'contextmenu', contextMenuHandler);
        cm.removeEvent(window, 'mouseup', restoreContextMenu);
    };

    var contextMenuHandler = function(e){
        cm.preventDefault(e);
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(!cm.isBoolean(that.isEditing) || !that.isEditing){
            that.isEditing = true;
            cm.addClass(nodes['container'], 'is-editing is-editable');
            that.redraw();
            that.triggerEvent('onEnableEditing');
            that.triggerEvent('onEnableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(!cm.isBoolean(that.isEditing) || that.isEditing){
            that.isEditing = false;
            cm.removeClass(nodes['container'], 'is-editing is-editable');
            that.triggerEvent('onDisableEditing');
            that.triggerEvent('onDisableEditable');
        }
        return that;
    };

    that.redraw = function(){
        redrawChassis();
        return that;
    };

    that.setColumnsCount = function(count){
        var itemsLength = that.items.length;
        if(!count || itemsLength === count){
            return that;
        }
        if(itemsLength < count){
            // Add new columns
            cm.forEach(count - itemsLength, function(){
                renderColumn({}, true);
            });
        }else{
            // Remove columns from last
            while(that.items.length > count){
                removeLastColumn(true);
            }
        }
        setEqualDimensions();
        updateChassis();
        return that;
    };

    that.get = function(){
        return that.items;
    };

    init();
});
