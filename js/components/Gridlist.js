cm.define('Com.Gridlist', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onSort',
        'onCheckAll',
        'onUnCheckAll',
        'onCheck',
        'onUnCheck',
        'onRenderStart',
        'onRenderEnd'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'container' : false,
        'data' : [],
        'cols' : [],
        'sort' : true,
        'sortBy' : 'id',                                    // default sort by key in array
        'orderBy' : 'ASC',
        'childBy' : false,
        'pagination' : true,
        'perPage' : 25,
        'showCounter' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',        // input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat', // render date format
        'langs' : {
            'counter' : 'Count: ',
            'check-all' : 'Check all',
            'uncheck-all' : 'Uncheck all',
            'empty' : 'Items does not found'
        },
        'icons' : {
            'arrow' : {
                'desc' : 'icon arrow desc',
                'asc' : 'icon arrow asc'
            }
        },
        'statuses' : ['active', 'success', 'danger', 'warning'],
        'Com.Pagination' : {}
    }
},
function(params){
    var that = this,
        rows = [],
        sortBy,
        orderBy;

    that.nodes = {};
    that.components = {};
    that.isCheckedAll = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
    };

    var validateParams = function(){
        if(!that.params['container']){
            that.params['container'] = that.params['node'];
        }
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        var pagesCount;
        // Container
        that.params['container'].appendChild(
            that.nodes['container'] = cm.Node('div', {'class' : 'com__gridlist'})
        );
        // Add css class
        !cm.isEmpty(that.params['className']) && cm.addClass(that.nodes['container'], that.params['className']);
        // Counter
        if(that.params['showCounter']){
            that.nodes['container'].appendChild(
                cm.Node('div', {'class' : 'pt__gridlist__counter'}, that.lang('counter') + that.params['data'].length)
            );
        }
        // Sort data array for first time
        that.params['sort'] && arraySort(that.params['sortBy']);
        // Render table
        if(that.params['data'].length){
            if(that.params['pagination']){
                pagesCount = that.params['perPage'] > 0? Math.ceil(that.params['data'].length / that.params['perPage']) : that.params['perPage'];
                that.components['Pagination'] = new Com.Pagination(
                    cm.merge(that.params['Com.Pagination'], {
                        'container' : that.nodes['container'],
                        'count' : pagesCount,
                        'events' : {
                            'onChange' : function(pagination, data){
                                renderTable(data['page'], data['container']);
                            }
                        }
                    })
                );
            }else{
                renderTable(1, that.nodes['container']);
            }
        }else{
            that.nodes['container'].appendChild(
                cm.Node('div', {'class' : 'cm__empty'}, that.lang('empty'))
            );
        }
    };

    var renderTable = function(page, container){
        var start, end;
        /*
        If pagination not exists we need to clean up table before render new one, cause on ech sort will be rendered new table.
        When pagination exists, ech rendered table will be have his own container, and no needs to clean up previous table.
        */
        if(!that.params['pagination']){
            cm.remove(that.nodes['table']);
        }
        // API onRenderStart event
        that.triggerEvent('onRenderStart', {
            'container' : container,
            'page' : page
        });
        // Render Table
        that.nodes['table'] = cm.Node('div', {'class' : 'pt__gridlist'},
            cm.Node('table',
                cm.Node('thead',
                    that.nodes['title'] = cm.Node('tr')
                ),
                that.nodes['content'] = cm.Node('tbody')
            )
        );
        // Render Table Title
        cm.forEach(that.params['cols'], renderTh);
        // Render Table Row
        if(that.params['pagination']){
            end = that.params['perPage'] * page;
            start = end - that.params['perPage'];
        }else{
            end = that.params['data'].length;
            start = 0;
        }
        for(var i = start, l = Math.min(end, that.params['data'].length); i < l; i++){
            renderRow(rows, that.params['data'][i], i);
        }
        // Append
        container.appendChild(that.nodes['table']);
        // API onRenderEnd event
        that.triggerEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : rows
        });
    };

    var renderTh = function(item, i){
        // Config
        item = that.params['cols'][i] = cm.merge({
            'width' : 'auto',               // number | % | auto
            'access' : true,                // Render column if is accessible
            'type' : 'text',		        // text | number | url | date | html | icon | checkbox | empty | actions
            'key' : '',                     // Data array key
            'title' : '',                   // Table th title
            'sort' : that.params['sort'],   // Sort this column or not
            'textOverflow' : false,         // Overflow long text to single line
            'class' : '',		            // Icon css class, for type="icon"
            'target' : '_blank',            // Link target, for type="url"
            'showTitle' : false,            // Show title on hover
            'titleText' : '',               // Alternative title text, if not specified - will be shown key text
            'altText' : '',                 // Alternative column text
            'urlKey' : false,               // Alternative link href, for type="url"
            'actions' : [],                 // Render actions menu, for type="actions"
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);
        item['nodes'] = {};
        // Check access
        if(item['access']){
            // Structure
            that.nodes['title'].appendChild(
                item['nodes']['container'] = cm.Node('th', {'width' : item['width']},
                    item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
                )
            );
            // Insert specific specified content in th
            switch(item['type']){
                case 'checkbox' :
                    cm.addClass(item['nodes']['container'], 'control');
                    item['nodes']['inner'].appendChild(
                        item['nodes']['checkbox'] = cm.Node('input', {'type' : 'checkbox', 'title' : that.lang('check-all')})
                    );
                    item['nodes']['checkbox'].checked = that.isCheckedAll;
                    cm.addEvent(item['nodes']['checkbox'], 'click', function(){
                        if(that.isCheckedAll == true){
                            that.unCheckAll();
                        }else{
                            that.checkAll();
                        }
                    });
                    that.nodes['checkbox'] = item['nodes']['checkbox'];
                    break;

                default:
                    item['nodes']['inner'].appendChild(
                        cm.Node('span', item['title'])
                    );
                    break;
            }
            // Render sort arrow and set function on click to th
            if(!/icon|empty|actions|checkbox/.test(item['type']) && item['sort']){
                cm.addClass(item['nodes']['container'], 'sort');
                if(item['key'] == sortBy){
                    item['nodes']['inner'].appendChild(
                        cm.Node('div', {'class' : that.params['icons']['arrow'][orderBy.toLowerCase()]})
                    );
                }
                cm.addEvent(item['nodes']['inner'], 'click', function(){
                    arraySort(item['key']);
                    if(that.params['pagination']){
                        that.components['Pagination'].set();
                    }else{
                        renderTable(1, that.nodes['container']);
                    }
                });
            }
        }
    };

    var renderRow = function(parent, row, i){
        // Config
        var item = {
            'index' : i,
            'data' : row,
            'childs' : [],
            'isChecked' : row['_checked'] || false,
            'status' : row['_status'] || false,
            'nodes' : {
                'cols' : []
            }
        };
        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.Node('tr')
        );
        // Render cells
        cm.forEach(that.params['cols'], function(col){
            renderCell(col, item);
        });
        // Render childs
        if(that.params['childsBy']){
            cm.forEach(row[that.params['childsBy']], function(child, childI){
                renderRow(item['childs'], child, childI);
            });
        }
        // Push to rows array
        rows.push(item);
    };

    var renderCell = function(col, item){
        var nodes = {},
            text,
            title,
            href;
        // Check access
        if(col['access']){
            text = cm.isEmpty(item['data'][col['key']])? '' : item['data'][col['key']];
            title = cm.isEmpty(col['titleText'])? text : col['titleText'];
            // Structure
            item['nodes']['container'].appendChild(
                nodes['container'] = cm.Node('td')
            );
            // Text overflow
            if(col['textOverflow']){
                nodes['inner'] = cm.Node('div', {'class' : 'inner'});
                nodes['container'].appendChild(nodes['inner']);
            }else{
                nodes['inner'] = nodes['container'];
            }
            // Insert value by type
            switch(col['type']){
                case 'number' :
                    nodes['inner'].innerHTML = cm.splitNumber(text);
                    break;

                case 'date' :
                    if(that.params['dateFormat'] != that.params['visibleDateFormat']){
                        nodes['inner'].innerHTML = cm.dateFormat(
                            cm.parseDate(text, that.params['dateFormat']),
                            that.params['visibleDateFormat']
                        );
                    }else{
                        nodes['inner'].innerHTML = text;
                    }
                    break;

                case 'icon' :
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('div', {'class' : col['class']})
                    );
                    cm.addClass(nodes['node'], 'icon linked inline');
                    break;

                case 'url' :
                    text = cm.decode(text);
                    href = col['urlKey'] && item['data'][col['urlKey']]? cm.decode(item['data'][col['urlKey']]) : text;
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('a', {'target' : col['target'], 'href' : href}, !cm.isEmpty(col['altText'])? col['altText'] : text)
                    );
                    break;

                case 'checkbox' :
                    cm.addClass(nodes['container'], 'control');
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('input', {'type' : 'checkbox'})
                    );
                    item['nodes']['checkbox'] = nodes['node'];
                    if(item['isChecked']){
                        checkRow(item, false);
                    }
                    cm.addEvent(nodes['node'], 'click', function(){
                        if(!item['isChecked']){
                            checkRow(item, true);
                        }else{
                            unCheckRow(item, true);
                        }
                    });
                    break;

                case 'actions':
                    nodes['actions'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.Node('div', {'class' : ['pt__links', col['class']].join(' ')},
                            nodes['actionsList'] = cm.Node('ul')
                        )
                    );
                    cm.forEach(col['actions'], function(actionItem){
                        var actionNode;
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {}
                        }, actionItem);
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['actionsList'].appendChild(
                            cm.Node('li',
                                actionNode = cm.Node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        cm.forEach(actionItem['events'], function(actionEventHandler, actionEventName){
                            cm.addEvent(actionNode, actionEventName, actionEventHandler);
                        });
                        nodes['actions'].push(actionNode);
                    });
                    break;

                case 'empty' :
                    break;

                default :
                    nodes['inner'].innerHTML = text;
                    break;
            }
            // Statuses
            if(item['status']){
                setRowStatus(item, item['status']);
            }
            // onHover Title
            if(col['showTitle']){
                if(nodes['node']){
                    nodes['node'].title = title;
                }else{
                    nodes['inner'].title = title;
                }
            }
            // onClick handler
            if(col['onClick']){
                cm.addEvent(nodes['node'] || nodes['inner'], 'click', function(e){
                    e = cm.getEvent(e);
                    cm.preventDefault(e);
                    // Column onClick event
                    col['onClick'](that, item);
                });
            }
            // onCellRender handler
            if(col['onRender']){
                col['onRender'](that, {
                    'nodes' : nodes,
                    'col' : col,
                    'row' : item
                });
            }
            // Push cell to row nodes array
            item['nodes']['cols'].push(nodes);
        }
    };

    /* *** HELPING FUNCTIONS *** */

    var arraySort = function(key){
        sortBy = key;
        orderBy = !orderBy? that.params['orderBy'] : (orderBy == 'ASC' ? 'DESC' : 'ASC');
        // Get item
        var item, textA, textB, t1, t2, value;
        cm.forEach(that.params['cols'], function(col){
            if(col['key'] == key){
                item = col;
            }
        });
        // Sort
        if(that.params['data'].sort){
            that.params['data'].sort(function(a, b){
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
                        t1 = cm.parseDate(textA, that.params['dateFormat']);
                        t2 = cm.parseDate(textB, that.params['dateFormat']);
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
        that.triggerEvent('onSort', {
            'sortBy' : sortBy,
            'orderBy' : orderBy,
            'data' : that.params['data']
        });
    };

    var checkRow = function(row, execute){
        if(row['nodes']['checkbox']){
            row['nodes']['checkbox'].checked = true;
        }
        row['isChecked'] = true;
        row['data']['_checked'] = true;
        if(row['status']){
            cm.removeClass(row['nodes']['container'], row['status']);
        }
        cm.addClass(row['nodes']['container'], 'active');
        if(execute){
            // API onCheck Event
            that.triggerEvent('onCheck', row);
        }
    };

    var unCheckRow = function(row, execute){
        if(row['nodes']['checkbox']){
            row['nodes']['checkbox'].checked = false;
        }
        row['isChecked'] = false;
        row['data']['_checked'] = false;
        cm.removeClass(row['nodes']['container'], 'active');
        if(row['status']){
            cm.addClass(row['nodes']['container'], row['status']);
        }
        if(execute){
            // API onUnCheck Event
            that.triggerEvent('onUnCheck', row);
        }
    };

    var setRowStatus = function(row, status){
        row['status'] = status;
        row['data']['_status'] = status;
        cm.removeClass(row['nodes']['container'], that.params['statuses'].join(' '));
        if(row['isChecked']){
            cm.addClass(row['nodes']['container'], 'active');
        }else if(cm.inArray(that.params['statuses'], status)){
            cm.addClass(row['nodes']['container'], status);
        }
    };

    var clearRowStatus = function(row){
        row['status'] = null;
        row['data']['_status'] = null;
        cm.removeClass(row['nodes']['container'], that.params['statuses'].join(' '));
    };

    /* ******* MAIN ******* */

    that.check = function(index){
        if(that.params['data'][index]){
            that.params['data'][index]['_checked'] = true;
        }
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                checkRow(row, true);
            }
        });
        return that;
    };

    that.unCheck = function(index){
        if(that.params['data'][index]){
            that.params['data'][index]['_checked'] = false;
        }
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                unCheckRow(row, true);
            }
        });
        return that;
    };

    that.checkAll = function(){
        that.isCheckedAll = true;
        that.nodes['checkbox'].checked = true;
        cm.forEach(that.params['data'], function(row){
            row['_checked'] = true;
        });
        cm.forEach(rows, function(row){
            checkRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onCheckAll', that.params['data']);
        return that;
    };

    that.unCheckAll = function(){
        that.isCheckedAll = false;
        that.nodes['checkbox'].checked = false;
        cm.forEach(that.params['data'], function(row){
            row['_checked'] = false;
        });
        cm.forEach(rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onUnCheckAll', that.params['data']);
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
        cm.forEach(that.params['data'], function(row){
            row['_checked'] && checkedRows.push(row);
        });
        return checkedRows;
    };

    that.setRowStatus = function(index, status){
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                setRowStatus(row, status);
            }
        });
        return that;
    };

    that.clearRowStatus = function(index){
        cm.forEach(rows, function(row){
            if(row['index'] == index){
                clearRowStatus(row);
            }
        });
        return that;
    };

    init();
});