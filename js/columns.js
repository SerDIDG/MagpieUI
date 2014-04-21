Com.Elements['Columns'] = {};

Com['GetColumns'] = function(id){
    return Com.Elements.Columns[id] || null;
};

Com['Columns'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'columns' : false,
            'minColumnWidth' : 100,      // in px
            'data' : []
        }, o),
        API = {
            'onAdd' : [],
            'onRemove' : []
        },
        nodes = {},
        items = [],
        chassisList = [],
        current;

    /* *** INIT *** */

    var init = function(){
        // Render or collect columns structure
        if(config['columns']){
            collect();
        }else{
            render();
        }
        // Render draggable chassis
        renderChassis();
    };

    /* *** STRUCTURE *** */

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-columns'},
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['holder'] = cm.Node('div', {'class' : 'container'})
            )
        );
        // Render Columns
        cm.forEach(config['data'], renderColumn);
        // Embed
        config['container'].appendChild(nodes['container']);
    };

    var collect = function(){
        var columns;
        // Collect nodes
        nodes['container'] = config['columns'];
        nodes['inner'] = cm.getByAttr('data-com-columns', 'inner', nodes['container'])[0];
        nodes['holder'] = cm.getByAttr('data-com-columns', 'holder', nodes['container'])[0];
        // Collect only first child columns
        columns = cm.clone(cm.getByAttr('data-com-columns', 'column', nodes['holder']) || []);
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
            'inner' : cm.getByAttr('data-com-columns', 'column-inner', container)[0] || cm.Node('div')
        };
        // Push to items array
        items.push(item);
    };

    var renderColumn = function(item, execute){
        item = cm.merge({
        }, item);
        // Structure
        item['container'] = cm.Node('div', {'class' : 'com-column'},
            item['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Push to items array
        items.push(item);
        // Embed
        nodes['holder'].appendChild(item['container']);
        if(execute){
            // API onAdd event
            executeEvent('onAdd', item);
        }
        return item;
    };

    var removeColumn = function(item, execute){
        var index = items.indexOf(item);
        cm.remove(item['container']);
        items.splice(index, 1);
        if(execute){
            // API onRemove event
            executeEvent('onRemove', item);
        }
        return item;
    };

    var removeLastColumn = function(execute){
        var item = items.pop();
        cm.remove(item['container']);
        if(execute){
            // API onRemove event
            executeEvent('onRemove', item);
        }
        return item;
    };

    var setEqualDimensions = function(){
        var itemsLength = items.length,
            width = (100 / itemsLength).toFixed(2);

        cm.forEach(items, function(item){
            item['container'].style.width = [width, '%'].join('');
        });
    };

    /* *** CHASSIS METHODS *** */

    var renderChassis = function(){
        var count = items.length - 1;
        cm.forEach(count, renderChassisItem);
    };

    var removeChassis = function(){
        cm.forEach(chassisList, function(chassis){
            cm.remove(chassis['node']);
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
        chassis['node'] = cm.Node('div', {'class' : 'com-columns-chassis'},
            cm.Node('div', {'class' : 'drag'},
                cm.Node('div', {'class' : 'icon draggable'})
            )
        );
        // Styles
        chassis['node'].style.left = [left, '%'].join('');
        // Push to chassis array
        chassisList.push(chassis);
        // Add events
        cm.addEvent(chassis['node'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        nodes['inner'].appendChild(chassis['node']);
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        // If current exists, we don't need to start another drag event until previous will not stop
        if(current){
            return false;
        }
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
        cm.addClass(current['chassis']['node'], 'is-active');
        cm.addClass(document.body, 'com-columns-body');
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.addEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        return true;
    };

    var move = function(e){
        var leftWidth, rightWidth;
        e = cm.getEvent(e);
        var x = e.clientX;
        if(cm.isTouch && e.touches){
            e.preventDefault();
            x = e.touches[0].clientX;
        }
        // Calculate sizes and positions
        leftWidth = x - current['left']['offset'];
        rightWidth = current['right']['offset'] - x;
        // Apply sizes and positions
        if(leftWidth > config['minColumnWidth'] && rightWidth > config['minColumnWidth']){
            current['left']['column']['container'].style.width = [(leftWidth / current['ratio']).toFixed(2), '%'].join('');
            current['right']['column']['container'].style.width = [(rightWidth / current['ratio']).toFixed(2), '%'].join('');
            current['chassis']['node'].style.left = [((x - current['offset']) / current['ratio']).toFixed(2), '%'].join('');
        }
    };

    var stop = function(){
        // Remove move event from document
        cm.removeClass(nodes['container'], 'is-active');
        cm.removeClass(current['chassis']['node'], 'is-active');
        cm.removeClass(document.body, 'com-columns-body');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        current = null;
    };

    /* *** EVENTS HANDLERS *** */

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

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

var testCol;

Com['ColumnsCollector'] = function(node){
    var allColumns,
        id,
        columns;

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
        allColumns = cm.clone((node.getAttribute('data-com-columns') == 'true') ? [node] : cm.getByAttr('data-com-columns', 'true', node));
        // Render columns
        cm.forEach(allColumns, function(item){
            columns = testCol = new Com.Columns({'columns' : item});
            if(id = item.id){
                Com.Elements.Columns[id] = columns;
            }
        });
    };

    init(node);
};