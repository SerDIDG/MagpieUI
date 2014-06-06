Com['Gridlist'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'data' : [],
            'cols' : [],
            'sort' : true,
            'sortBy' : 'id',                        // default sort by key in array
            'orderBy' : 'ASC',
            'pagination' : true,
            'perPage' : 25,
            'showCounter' : false,
            'dateFormat' : '%Y-%m-%d %H:%i:%s',     // input date format
            'langs' : {
                'counter' : 'Count: ',
                'check-all' : 'Check all',
                'uncheck-all' : 'Uncheck all'
            },
            'icons' : {
                'arrow' : {
                    'desc' : 'icon arrow desc',
                    'asc' : 'icon arrow asc'
                }
            },
            'events' : {},
            'Com.Pagination' : {}
        }, o),
        API = {
            'onSort' : [],
            'onCheckAll' : [],
            'onUnCheckAll' : [],
            'onCheck' : [],
            'onUnCheck' : [],
            'onRenderStart' : [],
            'onRenderEnd' : []
        },
        nodes = {},
        coms = {},
        rows = [],
        sortBy,
        orderBy,
        isCheckedAll = false;
    
    var init = function(){
        // Convert events to API Events
        convertEvents();
        render();
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        var pagesCount;
        // Container
        config['container'].appendChild(
            nodes['container'] = cm.Node('div', {'class' : 'com-gridlist-container'})
        );
        // Counter
        if(config['showCounter']){
            nodes['container'].appendChild(
                cm.Node('div', {'class' : 'gridlist-counter'}, lang('counter') + config['data'].length)
            );
        }
        // Sort data array for first time
        config['sort'] && arraySort(config['sortBy']);
        // Pagination
        if(config['pagination']){
            pagesCount = config['perPage'] > 0? Math.ceil(config['data'].length / config['perPage']) : config['perPage'];
            coms['Pagination'] = new Com.Pagination(
                cm.merge(config['Com.Pagination'], {
                    'container' : nodes['container'],
                    'count' : pagesCount,
                    'events' : {
                        'onChange' : function(pagination, data){
                            renderTable(data['page'], data['container']);
                        }
                    }
                })
            );
        }else{
            renderTable(1, nodes['container']);
        }
    };

    var renderTable = function(page, container){
        var start, end;
        /*
        If pagination not exists we need to clean up table before render new one, cause on ech sort will be rendered new table.
        When pagination exists, ech rendered table will be have his own container, and no needs to clean up previous table.
        */
        if(!config['pagination']){
            cm.remove(nodes['table']);
        }
        // API onRenderEnd event
        executeEvent('onRenderStart', {
            'container' : container,
            'page' : page
        });
        // Render Table
        nodes['table'] = cm.Node('div', {'class' : 'com-gridlist bottom'},
            cm.Node('table',
                cm.Node('thead',
                    nodes['title'] = cm.Node('tr')
                ),
                nodes['content'] = cm.Node('tbody')
            )
        );
        // Render Table Title
        cm.forEach(config['cols'], renderTh);
        // Render Table Row
        if(config['pagination']){
            end = config['perPage'] * page;
            start = end - config['perPage'];
        }else{
            end = config['data'].length;
            start = 0;
        }
        for(var i = start, l = Math.min(end, config['data'].length); i < l; i++){
            renderRow(config['data'][i], i);
        }
        // Append
        container.appendChild(nodes['table']);
        // API onRenderEnd event
        executeEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : rows
        });
    };

    var renderTh = function(item, i){
        // Config
        item = config['cols'][i] = cm.merge({
            'width' : 'auto',           // number | % | auto
            'access' : true,            // Render column if is accessible
            'type' : 'text',		    // text | number | url | date | html | icon | checkbox | empty
            'key' : '',                 // Data array key
            'title' : '',               // Table th title
            'sort' : config['sort'],    // Sort this column or not
            'textOverflow' : false,     // Overflow long text to single line
            'class' : '',		        // Icon css class, for type="icon"
            'target' : '_blank',        // Link target, for type="url"
            'showTitle' : false,        // Show title on hover
            'titleText' : '',           // Alternative title text, if not specified - will be shown key text
            'altText' : '',             // Alternative column text
            'onClick' : false,          // Cell click handler
            'onRender' : false          // Cell onRender handler
        }, item);
        item['nodes'] = {};
        // Check access
        if(item['access']){
            // Structure
            nodes['title'].appendChild(
                item['nodes']['container'] = cm.Node('th', {'width' : item['width']},
                    item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
                )
            );
            // Insert specific specified content in th
            switch(item['type']){
                case 'checkbox' :
                    cm.addClass(item['nodes']['container'], 'control');
                    item['nodes']['inner'].appendChild(
                        item['nodes']['checkbox'] = cm.Node('input', {'type' : 'checkbox', 'title' : lang('check-all')})
                    );
                    item['nodes']['checkbox'].checked = isCheckedAll;
                    cm.addEvent(item['nodes']['checkbox'], 'click', function(){
                        if(isCheckedAll == true){
                            that.unCheckAll();
                        }else{
                            that.checkAll();
                        }
                    });
                    nodes['checkbox'] = item['nodes']['checkbox'];
                    break;

                default:
                    item['nodes']['inner'].appendChild(
                        cm.Node('span', item['title'])
                    );
                    break;
            }
            // Render sort arrow and set function on click to th
            if(!/icon|empty|checkbox/.test(item['type']) && item['sort']){
                cm.addClass(item['nodes']['container'], 'sort');
                if(item['key'] == sortBy){
                    item['nodes']['inner'].appendChild(
                        cm.Node('div', {'class' : config['icons']['arrow'][orderBy.toLowerCase()]})
                    );
                }
                cm.addEvent(item['nodes']['inner'], 'click', function(){
                    arraySort(item['key']);
                    if(config['pagination']){
                        coms['Pagination'].set();
                    }else{
                        renderTable(1, nodes['container']);
                    }
                });
            }
        }
    };

    var renderRow = function(row, i){
        // Config
        var item = {
            'index' : i,
            'data' : row,
            'isChecked' : row['_checked'] || false,
            'nodes' : {
                'cols' : []
            }
        };
        // Structure
        nodes['content'].appendChild(
            item['nodes']['container'] = cm.Node('tr')
        );
        // Render cells
        cm.forEach(config['cols'], function(col){
            renderCell(col, item);
        });
        // Push to rows array
        rows.push(item);
    };

    var renderCell = function(col, item){
        var myNodes = {},
            text,
            title;
        // Check access
        if(col['access']){
            text = typeof item['data'][col['key']] == 'undefined'? '' : item['data'][col['key']];
            title = cm.isEmpty(col['titleText'])? text : col['titleText'];
            // Structure
            item['nodes']['container'].appendChild(
                myNodes['container'] = cm.Node('td')
            );
            // Text overflow
            if(col['textOverflow']){
                myNodes['inner'] = cm.Node('div', {'class' : 'inner'});
                myNodes['container'].appendChild(myNodes['inner']);
            }else{
                myNodes['inner'] = myNodes['container'];
            }
            // Insert value by type
            switch(col['type']){
                case 'number' :
                    myNodes['inner'].innerHTML = cm.splitNumber(text);
                    break;

                case 'icon' :
                    myNodes['inner'].appendChild(
                        myNodes['node'] = cm.Node('div', {'class' : col['class']})
                    );
                    cm.addClass(myNodes['node'], 'icon linked inline');
                    break;

                case 'url' :
                    text = cm.decode(text);
                    myNodes['inner'].appendChild(
                        myNodes['node'] = cm.Node('a', {'target' : col['target'], 'href' : text}, !cm.isEmpty(col['altText'])? col['altText'] : text)
                    );
                    break;

                case 'checkbox' :
                    cm.addClass(myNodes['container'], 'control');
                    myNodes['inner'].appendChild(
                        myNodes['node'] = cm.Node('input', {'type' : 'checkbox'})
                    );
                    myNodes['node'].checked = item['isChecked'];
                    cm.addEvent(myNodes['node'], 'click', function(){
                        if(!item['isChecked']){
                            checkRow(item, true);
                        }else{
                            unCheckRow(item, true);
                        }
                    });
                    item['nodes']['checkbox'] = myNodes['node'];
                    break;

                case 'empty' :
                    break;

                default :
                    myNodes['inner'].innerHTML = text;
                    break;
            }
            // onHover Title
            if(col['showTitle']){
                if(myNodes['node']){
                    myNodes['node'].title = title;
                }else{
                    myNodes['inner'].title = title;
                }
            }
            // onClick handler
            if(col['onClick']){
                cm.addEvent(myNodes['node'] || myNodes['inner'], 'click', function(e){
                    e = cm.getEvent(e);
                    cm.preventDefault(e);
                    // Column onClick event
                    col['onClick'](that, item);
                });
            }
            // onCellRender handler
            if(col['onRender']){
                col['onRender'](that, {
                    'nodes' : myNodes,
                    'col' : col,
                    'row' : item
                });
            }
            // Push cell to row nodes array
            item['nodes']['cols'].push(myNodes);
        }
    };

    /* *** HELPING FUNCTIONS *** */

    var arraySort = function(key){
        sortBy = key;
        orderBy = !orderBy? config['orderBy'] : (orderBy == 'ASC' ? 'DESC' : 'ASC');
        // Get item
        var item, textA, textB, t1, t2, value;
        cm.forEach(config['cols'], function(col){
            if(col['key'] == key){
                item = col;
            }
        });
        // Sort
        if(config['data'].sort){
            config['data'].sort(function(a, b){
                textA = a[key];
                textB = b[key];
                switch(item['type']){
                    case 'html':
                        t1 = cm.getTextNodesStr(cm.strToHTML(textA));
                        t2 = cm.getTextNodesStr(cm.strToHTML(textB));
                        value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;

                    case 'date':
                        t1 = cm.parseDate(textA, config['dateFormat']);
                        t2 = cm.parseDate(textB, config['dateFormat']);
                        return (orderBy == 'ASC')? (t1 - t2) : (t2 - t1);
                        break;

                    case 'number':
                        value = textA - textB;
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;

                    default :
                        t1 = textA? textA.toLowerCase() : '';
                        t2 = textB? textB.toLowerCase() : '';
                        value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                        return (orderBy == 'ASC')? value : (-1 * value);
                        break;
                }
            });
        }
        // API onSort Event
        executeEvent('onSort', {
            'sortBy' : sortBy,
            'orderBy' : orderBy,
            'data' : config['data']
        });
    };

    var checkRow = function(row, execute){
        row['nodes']['checkbox'].checked = true;
        row['isChecked'] = true;
        row['data']['_checked'] = true;
        if(execute){
            // API onCheck Event
            executeEvent('onCheck', row);
        }
    };

    var unCheckRow = function(row, execute){
        row['nodes']['checkbox'].checked = false;
        row['isChecked'] = false;
        row['data']['_checked'] = false;
        if(execute){
            // API onUnCheck Event
            executeEvent('onUnCheck', row);
        }
    };

    /* *** MISC HANDLERS *** */

    var convertEvents = function(){
        cm.forEach(config['events'], function(item, key){
            that.addEvent(key, item);
        });
    };

    var lang = function(str){
        if(!config['langs'][str]){
            config['langs'][str] = str;
        }
        return config['langs'][str];
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

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

    that.check = function(index){
        if(config['data'][index]){
            config['data'][index]['_checked'] = true;
        }
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                checkRow(row, true);
            }
        });
        return that;
    };

    that.unCheck = function(index){
        if(config['data'][index]){
            config['data'][index]['_checked'] = false;
        }
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                unCheckRow(row, true);
            }
        });
        return that;
    };

    that.checkAll = function(){
        isCheckedAll = true;
        nodes['checkbox'].checked = true;
        cm.forEach(config['data'], function(row){
            row['_checked'] = true;
        });
        cm.forEach(rows, function(row){
            checkRow(row);
        });
        // API onUnCheckAll Event
        executeEvent('onCheckAll', config['data']);
        return that;
    };

    that.unCheckAll = function(){
        isCheckedAll = false;
        nodes['checkbox'].checked = false;
        cm.forEach(config['data'], function(row){
            row['_checked'] = false;
        });
        cm.forEach(rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        executeEvent('onUnCheckAll', config['data']);
        return that;
    };

    that.getChecked = function(){
        var checkedRows = [];
        cm.forEach(rows, function(row){
            row['isChecked'] && checkedRows.push(row);
        });
        return checkedRows;
    };

    that.getCheckedData = function(){
        var checkedRows = [];
        cm.forEach(config['data'], function(row){
            row['_checked'] && checkedRows.push(row);
        });
        return checkedRows;
    };

    init();
};