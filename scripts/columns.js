Com.Elements['Columns'] = {};

Com['GetColumns'] = function(id){
    return Com.Elements.Columns[id] || null;
};

Com['Columns'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'columns' : false,
            'data' : [],
            'indent' : 0
        }, o),
        nodes = {},
        items = [],
        chassises = [],
        current;

    var init = function(){
        // Render or collect columns structure
        if(config['columns']){
            collect();
        }else{
            render();
        }
        // Render draggable chassises
        renderChassises();
    };

    var collect = function(){
        var columns;
        // Collect nodes
        nodes['container'] = config['columns'];
        nodes['table'] = cm.getByClass('container', nodes['container'])[0];
        // Collect only first child columns
        columns = cm.clone(cm.getByClass('com-column', nodes['table']) || []);
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

    var collectColumn = function(container){
        var item = {
            'width' : container.style.width,
            'nodes' : {
                'container' : container,
                'outer' : cm.getByClass('outer', container)[0]
            }
        };
        // Push to items array
        items.push(item);
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-columns'},
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['table'] = cm.Node('div', {'class' : 'container'})
            )
        );
        // Render Columns
        cm.forEach(config['data'], renderColumn);
        // Embed
        config['container'].appendChild(nodes['container']);
    };

    var renderColumn = function(item){
        item = cm.merge({
            'node' : cm.Node('div'),
            'width' : 'auto',
            'nodes' : []
        }, item);
        // Structure
        item['nodes']['container'] = cm.Node('div', {'class' : 'com-column'},
            item['nodes']['outer'] = cm.Node('div', {'class' : 'outer'},
                item['node']
            )
        );
        // Styles
        item['nodes']['container'].style.width = item['width'];
        // Push to items array
        items.push(item);
        // Embed
        nodes['table'].appendChild(item['nodes']['container']);
    };

    var renderChassises = function(){
        var count = items.length - 1;
        cm.forEach(count, renderChassisItem);
    };

    var renderChassisItem = function(i){
        var chassis = {
                'nodes' : {}
            },
            ratio = nodes['table'].offsetWidth / 100,
            left = (
                (
                    cm.getRealX(items[i]['nodes']['container']) -
                    cm.getRealX(nodes['table']) +
                    items[i]['nodes']['container'].offsetWidth
                ) / ratio
            ).toFixed(2);
        // Structure
        chassis['nodes']['container'] = cm.Node('div', {'class' : 'com-columns-chassis'});
        // Styles
        chassis['nodes']['container'].style.left = [left, '%'].join('');
        // Push to chassis array
        chassises.push(chassis);
        // Add events
        cm.addEvent(chassis['nodes']['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        nodes['table'].appendChild(chassis['nodes']['container']);
    };

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
        var index = chassises.indexOf(chassis),
            leftColumn = items[index],
            rightColumn = items[index + 1];
        current = {
            'index' : index,
            'offset' : cm.getRealX(nodes['table']),
            'ratio' : nodes['table'].offsetWidth / 100,
            'chassis' : chassis,
            'left' : {
                'column' : leftColumn,
                'offset' : cm.getRealX(leftColumn['nodes']['container'])
            },
            'right' : {
                'column' : rightColumn,
                'offset' : cm.getRealX(rightColumn['nodes']['container']) + rightColumn['nodes']['container'].offsetWidth
            }
        };
        // Add move event on document
        cm.addClass(nodes['container'], 'is-active');
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
        if(leftWidth > 100 && rightWidth > 100){
            current['left']['column']['nodes']['container'].style.width = [(leftWidth / current['ratio']).toFixed(2), '%'].join('');
            current['right']['column']['nodes']['container'].style.width = [(rightWidth / current['ratio']).toFixed(2), '%'].join('');
            current['chassis']['nodes']['container'].style.left = [((x - current['offset']) / current['ratio']).toFixed(2), '%'].join('');
        }
    };

    var stop = function(){
        current = null;
        // Remove move event from document
        cm.removeClass(nodes['container'], 'is-active');
        cm.removeClass(document.body, 'com-columns-body');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
    };

    /* *** Main *** */

    that.addColumn = function(){
        return that;
    };

    init();
};

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
            columns = new Com.Columns({'columns' : item});
            if(id = item.id){
                Com.Elements.Columns[id] = columns;
            }
        });
    };

    init(node);
};