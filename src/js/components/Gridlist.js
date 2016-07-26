cm.define('Com.Gridlist', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Stack'
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
        'node' : cm.node('div'),
        'container' : null,
        'embedStructure' : 'append',
        'name' : '',
        'data' : [],
        'cols' : [],
        'sort' : true,
        'sortBy' : 'id',                                            // Default sort by key in array
        'orderBy' : 'ASC',
        'childsBy' : false,                                         // Render child rows after parent, WIP - doesn't work checking / uncheking rows and statuses
        'pagination' : true,
        'perPage' : 25,
        'showCounter' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',                 // Input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat',          // Render date format
        'responseCountKey' : 'count',                               // Ajax data count response key
        'responseKey' : 'data',                                     // Ajax data response key
        'ajax' : {                                                  // Ajax, WIP - doesn't work checking / uncheking rows and statuses
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
        },
        'langs' : {
            'counter' : 'Count: ',
            'check_all' : 'Check all',
            'uncheck_all' : 'Uncheck all',
            'empty' : 'Items does not found',
            'actions' : 'Actions'
        },
        'icons' : {
            'arrow' : {
                'desc' : 'icon arrow desc',
                'asc' : 'icon arrow asc'
            }
        },
        'statuses' : ['active', 'success', 'danger', 'warning'],
        'Com.Pagination' : {
            'renderStructure' : true,
            'animateSwitch' : true,
            'animatePrevious' : true
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.isAjax = false;
    that.isCheckedAll = false;
    that.sortBy = null;
    that.orderBy = 'ASC';
    that.rows = [];

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
    };

    var validateParams = function(){
        that.sortBy = that.params['sortBy'];
        that.orderBy = that.params['orderBy'];
        // Ajax
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
            that.params['pagination'] = true;
            that.params['Com.Pagination']['ajax'] = that.params['ajax'];
            that.params['Com.Pagination']['responseCountKey'] = that.params['responseCountKey'];
            that.params['Com.Pagination']['responseKey'] = that.params['responseKey'];
        }else{
            that.params['Com.Pagination']['count'] = that.params['data'].length;
        }
        // Pagination
        that.params['Com.Pagination']['perPage'] = that.params['perPage'];
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        // Container
        that.nodes['container'] = cm.node('div', {'class' : 'com__gridlist'});
        // Add css class
        cm.addClass(that.nodes['container'], that.params['className']);
        // Append
        that.embedStructure(that.nodes['container']);
        // Render table page
        if(that.isAjax){
            // Render dynamic pagination
            renderPagination();
        }else if(that.params['data'].length){
            // Counter
            if(that.params['showCounter']){
                renderCounter(that.params['data'].length);
            }
            // Sort data array for first time
            that.params['sort'] && arraySort();
            if(that.params['pagination']){
                // Render static pagination
                renderPagination();
            }else{
                // Render all data items
                renderTable(1, that.params['data'], that.nodes['container']);
            }
        }else{
            renderEmptiness(that.nodes['container']);
        }
    };

    var renderPagination = function(){
        var startIndex, endIndex, dataArray;
        cm.getConstructor('Com.Pagination', function(classConstructor){
            that.components['pagination'] = new classConstructor(
                cm.merge(that.params['Com.Pagination'], {
                    'container' : that.nodes['container'],
                    'callbacks' : {
                        'afterPrepare' : function(pagination, config){
                            config['url'] = cm.strReplace(config['url'], {
                                '%sortBy%' : that.sortBy,
                                '%orderBy%' : that.orderBy
                            });
                            config['params'] = cm.objectReplace(config['params'], {
                                '%sortBy%' : that.sortBy,
                                '%orderBy%' : that.orderBy
                            });
                            return config;
                        }
                    },
                    'events' : {
                        'onPageRender' : function(pagination, data){
                            if(that.isAjax){
                                if(data.isError){

                                }else if(data['data'].length){
                                    renderTable(data['page'], data['data'], data['container']);
                                }else{
                                    renderEmptiness(data['container']);
                                }
                            }else{
                                startIndex = that.params['perPage'] * (data['page'] - 1);
                                endIndex = Math.min(that.params['perPage'] * data['page'], that.params['data'].length);
                                dataArray = that.params['data'].slice(startIndex, endIndex);
                                renderTable(data['page'], dataArray, data['container']);
                            }
                        },
                        'onSetCount' : function(pagination, count){
                            that.params['showCounter'] && renderCounter(count);
                        }
                    }
                })
            );
        });
    };

    var renderCounter = function(count){
        if(that.nodes['counter']){
            that.nodes['counter'].innerHTML = that.lang('counter') + count;
        }else{
            that.nodes['counter'] = cm.node('div', {'class' : 'pt__gridlist__counter'}, that.lang('counter') + count);
            cm.insertFirst(that.nodes['counter'], that.nodes['container']);
        }
    };

    var renderEmptiness = function(container){
        that.nodes['empty'] = cm.node('div', {'class' : 'cm__empty'}, that.lang('empty'));
        cm.appendChild(that.nodes['empty'], container);
    };

    var renderTable = function(page, data, container){
        /*
            If pagination not exists we need to clean up table before render new one, cause on each sort will be rendered new table.
            When pagination exists, each rendered table will be have his own container, and no needs to clean up previous table.
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
        that.nodes['table'] = cm.node('div', {'class' : 'pt__gridlist'},
            cm.node('table',
                cm.node('thead',
                    that.nodes['title'] = cm.node('tr')
                ),
                that.nodes['content'] = cm.node('tbody')
            )
        );
        // Render Table Title
        cm.forEach(that.params['cols'], renderTh);
        // Render Table Row
        cm.forEach(data, function(item, i){
            renderRow(that.rows, item, (i + (page -1)));
        });
        // Append
        cm.appendChild(that.nodes['table'], container);
        // API onRenderEnd event
        that.triggerEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : that.rows
        });
    };

    var renderTh = function(item, i){
        // Merge cell parameters
        item = that.params['cols'][i] = cm.merge({
            '_component' : null,            // System attribute
            'width' : 'auto',               // number | % | auto
            'access' : true,                // Render column if is accessible
            'type' : 'text',		        // text | number | url | date | html | icon | checkbox | empty | actions | links
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
            'links' : [],                   // Render links menu, for type="links"
            'actions' : [],                 // Render actions menu, for type="actions"
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);
        item['nodes'] = {};
        // Check access
        if(item['access']){
            // Structure
            that.nodes['title'].appendChild(
                item['nodes']['container'] = cm.node('th', {'width' : item['width']},
                    item['nodes']['inner'] = cm.node('div', {'class' : 'inner'})
                )
            );
            // Insert specific specified content in th
            switch(item['type']){
                case 'checkbox' :
                    cm.addClass(item['nodes']['container'], 'control');
                    item['nodes']['inner'].appendChild(
                        item['nodes']['checkbox'] = cm.node('input', {'type' : 'checkbox', 'title' : that.lang('check_all')})
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
                        cm.node('span', item['title'])
                    );
                    break;
            }
            // Render sort arrow and set function on click to th
            if(item['sort'] && !/icon|empty|actions|links|checkbox/.test(item['type'])){
                cm.addClass(item['nodes']['container'], 'sort');
                if(item['key'] == that.sortBy){
                    item['nodes']['inner'].appendChild(
                        cm.node('div', {'class' : that.params['icons']['arrow'][that.orderBy.toLowerCase()]})
                    );
                }
                cm.addEvent(item['nodes']['inner'], 'click', function(){
                    that.sortBy = item['key'];
                    that.orderBy = that.orderBy == 'ASC' ? 'DESC' : 'ASC';
                    !that.isAjax && arraySort();
                    if(that.params['pagination']){
                        that.components['pagination'].rebuild();
                    }else{
                        renderTable(1, that.params['data'], that.nodes['container']);
                    }
                });
            }
        }
    };

    var renderRow = function(parentRow, data, i){
        // Config
        var item = {
            'index' : i,
            'data' : data,
            'childs' : [],
            'isChecked' : data['_checked'] || false,
            'status' : data['_status'] || false,
            'nodes' : {
                'cols' : []
            }
        };
        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.node('tr')
        );
        // Render cells
        cm.forEach(that.params['cols'], function(col){
            renderCell(col, item);
        });
        // Render childs
        if(that.params['childsBy']){
            cm.forEach(data[that.params['childsBy']], function(child, childI){
                renderRow(item['childs'], child, childI);
            });
        }
        // Push to rows array
        parentRow.push(item);
    };

    var renderCell = function(col, item){
        var nodes = {},
            text,
            title,
            href;
        // Check access
        if(col['access']){
            text = cm.isEmpty(cm.objectSelector(col['key'], item['data']))? '' : cm.objectSelector(col['key'], item['data']);
            title = cm.isEmpty(col['titleText'])? text : col['titleText'];
            // Structure
            item['nodes']['container'].appendChild(
                nodes['container'] = cm.node('td')
            );
            // Text overflow
            if(col['textOverflow']){
                nodes['inner'] = cm.node('div', {'class' : 'inner'});
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
                        nodes['node'] = cm.node('div', {'class' : col['class']})
                    );
                    cm.addClass(nodes['node'], 'icon linked inline');
                    break;

                case 'url' :
                    text = cm.decode(text);
                    href = col['urlKey'] && item['data'][col['urlKey']]? cm.decode(item['data'][col['urlKey']]) : text;
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('a', {'target' : col['target'], 'href' : href}, !cm.isEmpty(col['altText'])? col['altText'] : text)
                    );
                    break;

                case 'checkbox' :
                    cm.addClass(nodes['container'], 'control');
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('input', {'type' : 'checkbox'})
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

                case 'links':
                    nodes['links'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('div', {'class' : ['pt__links', col['class']].join(' ')},
                            nodes['linksList'] = cm.node('ul')
                        )
                    );
                    cm.forEach(col['links'], function(actionItem){
                        var actionNode;
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {}
                        }, actionItem);
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['linksList'].appendChild(
                            cm.node('li',
                                actionNode = cm.node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        cm.forEach(actionItem['events'], function(actionEventHandler, actionEventName){
                            cm.addEvent(actionNode, actionEventName, actionEventHandler);
                        });
                        nodes['links'].push(actionNode);
                    });
                    break;

                case 'actions':
                    nodes['actions'] = [];
                    nodes['inner'].appendChild(
                        nodes['node'] = cm.node('div', {'class' : ['pt__links', 'pull-right', col['class']].join(' ')},
                            cm.node('ul',
                                nodes['componentNode'] = cm.node('li', {'class' : 'com__menu', 'data-node' : 'ComMenu:{}:button'},
                                    cm.node('a', {'class' : 'label'}, that.lang('actions')),
                                    cm.node('span', {'class' : 'cm-i__chevron-down xx-small inline'}),
                                    cm.node('div', {'class' : 'pt__menu', 'data-node' : 'ComMenu.target'},
                                        nodes['actionsList'] = cm.node('ul', {'class' : 'pt__menu-dropdown'})
                                    )
                                )
                            )
                        )
                    );
                    cm.forEach(col['actions'], function(actionItem){
                        actionItem = cm.merge({
                            'label' : '',
                            'attr' : {},
                            'events' : {},
                            'constructor' : false,
                            'constructorParams' : {},
                            'callback' : function(){}
                        }, actionItem);
                        // WTF is that?
                        cm.forEach(item['data'], function(itemValue, itemKey){
                            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
                        });
                        nodes['actionsList'].appendChild(
                            cm.node('li',
                                actionItem['_node'] = cm.node('a', actionItem['attr'], actionItem['label'])
                            )
                        );
                        if(actionItem['constructor']){
                            cm.getConstructor(actionItem['constructor'], function(classConstructor){
                                actionItem['controller'] = new classConstructor(
                                    cm.merge(actionItem['constructorParams'], {
                                        'node' : actionItem['_node'],
                                        'data' : item['data'],
                                        'cellItem' : item,
                                        'actionItem' : actionItem
                                    })
                                );
                            });
                        }else{
                            cm.addEvent(actionItem['_node'], 'click', function(e){
                                cm.preventDefault(e);
                                actionItem['callback'](e, actionItem, item);
                            });
                        }
                        nodes['actions'].push(actionItem['_node']);
                    });
                    cm.getConstructor('Com.Menu', function(classConstructor){
                        col['_component'] = new classConstructor({
                            'node' : nodes['componentNode']
                        });
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

    var arraySort = function(){
        // Get item
        var item, textA, textB, t1, t2, value;
        cm.forEach(that.params['cols'], function(col){
            if(col['key'] == that.sortBy){
                item = col;
            }
        });
        // Sort
        that.params['data'].sort(function(a, b){
            textA = a[that.sortBy];
            textB = b[that.sortBy];
            switch(item['type']){
                case 'html':
                    t1 = cm.getTextNodesStr(cm.strToHTML(textA));
                    t2 = cm.getTextNodesStr(cm.strToHTML(textB));
                    value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;

                case 'date':
                    t1 = cm.parseDate(textA, that.params['dateFormat']);
                    t2 = cm.parseDate(textB, that.params['dateFormat']);
                    return (that.orderBy == 'ASC')? (t1 - t2) : (t2 - t1);
                    break;

                case 'number':
                    value = textA - textB;
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;

                default :
                    t1 = textA? textA.toLowerCase() : '';
                    t2 = textB? textB.toLowerCase() : '';
                    value = (t1 < t2)? -1 : ((t1 > t2)? 1 : 0);
                    return (that.orderBy == 'ASC')? value : (-1 * value);
                    break;
            }
        });
        // API onSort Event
        that.triggerEvent('onSort', {
            'sortBy' : that.sortBy,
            'orderBy' : that.orderBy
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

    that.rebuild = function(){
        if(that.isAjax){
            that.components['pagination'].rebuild();
        }
        return that;
    };

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
        cm.forEach(that.rows, function(row){
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
        cm.forEach(that.rows, function(row){
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
        cm.forEach(that.rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        that.triggerEvent('onUnCheckAll', that.params['data']);
        return that;
    };

    that.getChecked = function(){
        var checkedRows = [];
        cm.forEach(that.rows, function(row){
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
        cm.forEach(that.rows, function(row){
            if(row['index'] == index){
                setRowStatus(row, status);
            }
        });
        return that;
    };

    that.clearRowStatus = function(index){
        cm.forEach(that.rows, function(row){
            if(row['index'] == index){
                clearRowStatus(row);
            }
        });
        return that;
    };

    init();
});