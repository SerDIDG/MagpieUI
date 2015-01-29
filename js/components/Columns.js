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
        'onRender',
        'onAdd',
        'onRemove',
        'onChange',
        'onResize'
    ],
    'params' : {
        'container' : cm.Node('div'),
        'name' : '',
        'columns' : false,
        'minColumnWidth' : 12,              // in px
        'data' : []
    }
},
function(params){
    var that = this,
        nodes = {},
        items = [],
        chassisList = [],
        current;

    /* *** INIT *** */

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['container']);
        validateParams();
        if(that.params['columns']){
            collect();
        }else{
            render();
        }
        renderChassis();
        that.addToStack(that.params['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['container'])){
            that.params['name'] = that.params['container'].getAttribute('name') || that.params['name'];
        }
    };

    /* *** STRUCTURE *** */

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__columns'},
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['holder'] = cm.Node('div', {'class' : 'container'})
            )
        );
        // Render Columns
        cm.forEach(that.params['data'], renderColumn);
        // Embed
        that.params['container'].appendChild(nodes['container']);
    };

    var collect = function(){
        var columns;
        // Collect nodes
        nodes['container'] = that.params['columns'];
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

    /* *** COLUMNS *** */

    var collectColumn = function(container){
        var item = {
            'container' : container,
            'inner' : cm.getByAttr('data-com__columns', 'column-inner', container)[0] || cm.Node('div'),
            'width' : container.style.width
        };
        // Render ruler
        renderRuler(item);
        // Push to items array
        items.push(item);
    };

    var renderColumn = function(item, execute){
        item = cm.merge({
            'width' : '0%'
        }, item);
        // Structure
        item['container'] = cm.Node('div', {'class' : 'com__column'},
            item['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render ruler
        renderRuler(item);
        // Push to items array
        items.push(item);
        // Embed
        nodes['holder'].appendChild(item['container']);
        if(execute){
            // API onAdd event
            that.triggerEvent('onAdd', item);
        }
        return item;
    };

    var removeColumn = function(item, execute){
        var index = items.indexOf(item);
        cm.remove(item['container']);
        items.splice(index, 1);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var removeLastColumn = function(execute){
        var item = items.pop();
        cm.remove(item['container']);
        if(execute){
            // API onRemove event
            that.triggerEvent('onRemove', item);
        }
        return item;
    };

    var setEqualDimensions = function(){
        var itemsLength = items.length,
            width = (100 / itemsLength).toFixed(2);

        cm.forEach(items, function(item){
            item['width'] = [width, '%'].join('');
            item['container'].style.width = item['width'];
            item['rulerCounter'].innerHTML = item['width'];
        });
        // API onResize event
        that.triggerEvent('onResize', items);
        that.triggerEvent('onChange', items);
    };

    /* *** RULERS METHODS *** */

    var renderRuler = function(item){
        // Structure
        item['rulerContainer'] = cm.Node('div', {'class' : 'com__columns__ruler'},
            item['ruler'] = cm.Node('div', {'class' : 'pt__ruler is-horizontal is-small'},
                cm.Node('div', {'class' : 'line line-top'}),
                item['rulerCounter'] = cm.Node('div', {'class' : 'counter'}, item['width']),
                cm.Node('div', {'class' : 'line line-bottom'})
            )
        );
        // Embed
        item['inner'].appendChild(item['rulerContainer']);
    };

    /* *** CHASSIS METHODS *** */

    var renderChassis = function(){
        var count = items.length - 1;
        cm.forEach(count, renderChassisItem);
    };

    var removeChassis = function(){
        cm.forEach(chassisList, function(chassis){
            cm.remove(chassis['container']);
        });
        chassisList = [];
    };

    var updateChassis = function(){
        removeChassis();
        renderChassis();
    };

    var renderChassisItem = function(i){
        var chassis = {},
            ratio = nodes['holder'].offsetWidth / 100,
            left = ((cm.getRealX(items[i]['container']) - cm.getRealX(nodes['holder']) + items[i]['container'].offsetWidth) / ratio).toFixed(2);
        // Structure
        chassis['container'] = cm.Node('div', {'class' : 'com__columns__chassis'},
            chassis['drag'] = cm.Node('div', {'class' : 'pt__drag is-horizontal'},
                cm.Node('div', {'class' : 'line'}),
                cm.Node('div', {'class' : 'drag'},
                    cm.Node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Styles
        chassis['container'].style.left = [left, '%'].join('');
        // Push to chassis array
        chassisList.push(chassis);
        // Add events
        cm.addEvent(chassis['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        nodes['inner'].appendChild(chassis['container']);
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return false;
        }
        e = cm.getEvent(e);
        cm.preventDefault(e);
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
        // If not left mouse button, don't duplicate drag event
        if((cm.is('IE') && cm.isVersion() < 9 && e.button != 1) || (!cm.is('IE') && e.button)){
            return false;
        }
        // Current
        var index = chassisList.indexOf(chassis),
            leftColumn = items[index],
            rightColumn = items[index + 1];

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
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        return true;
    };

    var move = function(e){
        var leftWidth,
            rightWidth;
        e = cm.getEvent(e);
        cm.preventDefault(e);
        var x = e.clientX;
        if(cm.isTouch && e.touches){
            x = e.touches[0].clientX;
        }
        // Calculate sizes and positions
        leftWidth = x - current['left']['offset'];
        rightWidth = current['right']['offset'] - x;
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            current['left']['column']['width'] = [(leftWidth / current['ratio']).toFixed(2), '%'].join('');
            current['right']['column']['width'] = [(rightWidth / current['ratio']).toFixed(2), '%'].join('');

            current['left']['column']['container'].style.width = current['left']['column']['width'];
            current['right']['column']['container'].style.width = current['right']['column']['width'];
            current['chassis']['container'].style.left = [((x - current['offset']) / current['ratio']).toFixed(2), '%'].join('');

            current['left']['column']['rulerCounter'].innerHTML = current['left']['column']['width'];
            current['right']['column']['rulerCounter'].innerHTML = current['right']['column']['width'];
        }
        // API onResize event
        that.triggerEvent('onChange', items);
    };

    var stop = function(){
        // Remove move event from document
        cm.removeClass(nodes['container'], 'is-active');
        cm.removeClass(current['chassis']['drag'], 'is-active');
        cm.removeClass(current['left']['column']['ruler'], 'is-active');
        cm.removeClass(current['right']['column']['ruler'], 'is-active');
        cm.removeClass(document.body, 'pt__drag__body--horizontal');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        current = null;
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', items);
    };

    /* ******* MAIN ******* */

    that.redraw = function(){
        updateChassis();
        return that;
    };

    that.setColumnsCount = function(count){
        var itemsLength = items.length;
        if(!count || itemsLength == count){
            return that;
        }
        if(itemsLength < count){
            // Add new columns
            cm.forEach(count - itemsLength, function(){
                renderColumn({}, true);
            });
        }else{
            // Remove columns from last
            while(items.length > count){
                removeLastColumn(true);
            }
        }
        setEqualDimensions();
        updateChassis();
        return that;
    };

    that.get = function(){
        return items;
    };

    init();
});