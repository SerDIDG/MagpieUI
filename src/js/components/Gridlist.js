cm.define('Com.Gridlist', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Structure',
        'DataConfig',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onSort',
        'onCheckAll',
        'onUnCheckAll',
        'onCheck',
        'onUnCheck',
        'onRenderStart',
        'onRenderEnd',
        'onColumnsChange',
        'onColumnsResize'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'embedStructure' : 'append',
        'customEvents' : true,
        'name' : '',

        // Data
        'uniqueKey' : 'id',                                         // Unique data key
        'data' : [],                                                // Array for render static data
        'cols' : [],                                                // Table columns
        'actions' : [],                                             // Bulk action buttons
        'actionsGroups' : [],

        // Sorting
        'sort' : true,
        'sortBy' : 'id',                                            // Default sort by key in array
        'orderBy' : 'ASC',
        'childsBy' : false,                                         // Render child rows after parent, (WIP - doesn't work checking / uncheking rows and statuses for now)

        // Visibility
        'showCounter' : false,
        'showBulkActions' : true,
        'textOverflow' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',                 // Input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat',          // Render date format

        // Pagination and ajax data request
        'pagination' : true,
        'perPage' : 25,
        'responseKey' : 'data',                                     // Response data response key
        'responseCountKey' : 'count',                               // Response data count response key
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. Variables: %orderBy%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
        },

        // Columns manipulation
        'columns' : {
            'editable' : false,
            'local' : false,                                        // Save sizes in local storage (TBD)
            'ajax' : {
                'type' : 'json',
                'method' : 'post',
                'url' : '',                                         // Request URL. Variables: %items%, %callback% for JSONP.
                'params' : ''                                       // Params object. %items%, %callback% for JSONP.
            }
        },

        // Strings and classes
        'statuses' : ['active', 'success', 'danger', 'warning'],
        'icons' : {
            'arrow' : {
                'desc' : 'icon arrow desc',
                'asc' : 'icon arrow asc'
            }
        },

        // Components
        'Com.GridlistHelper' : {
            'customEvents' : false
        },
        'Com.Pagination' : {
            'renderStructure' : true,
            'animateSwitch' : true,
            'animatePrevious' : true
        },
        'Com.Toolbar' : {
            'embedStructure' : 'append'
        },
        'Com.Menu' : {
            'left' : '-(selfWidth-targetWidth)'
        }
    },
    'strings' : {
        'counter' : 'Count: %count%',
        'check_all' : 'Check all',
        'uncheck_all' : 'Uncheck all',
        'empty' : 'No items',
        'actions' : 'Actions'
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.rows = [];
    that.checked = [];
    that.actions = [];
    that.isAjax = false;
    that.isCheckedAll = false;
    that.sortBy = null;
    that.orderBy = 'ASC';
    that.isActionsDisabled = true;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
    };

    var validateParams = function(){
        that.sortBy = that.params['sortBy'];
        that.orderBy = that.params['orderBy'];
        // Data
        that.params['data'] = that.callbacks.filter(that, that.params['data']);
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
        // Helper
        that.params['Com.GridlistHelper']['columns'] = that.params['columns'];
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        // Container
        that.nodes['container'] = cm.node('div', {'class' : 'com__gridlist'});
        // Add css class
        cm.addClass(that.nodes['container'], that.params['className']);
        // Append
        that.embedStructure(that.nodes['container']);
        // Render bulk actions
        if(that.params['showBulkActions'] && that.params['actions'].length){
            renderBulkActions();
        }
        // Render table page
        renderInitialTable();
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.redraw();
            });
        }
    };

    var renderInitialTable = function(){
        if(that.isAjax){
            // Render dynamic pagination
            renderPagination();
        }else if(!cm.isEmpty(that.params['data'])){
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

    /**** BULK ACTIONS ****/

    var renderBulkActions = function(){
        var nodes = {};
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__gridlist__toolbar'});
        // Component
        cm.getConstructor('Com.Toolbar', function(classConstructor, className){
            that.components['toolbar'] = new classConstructor(
                cm.merge(that.params[className], {
                    'container' : nodes['container']
                })
            );
            renderBulkGroups();
        });
        // Render buttons
        cm.forEach(that.params['actions'], renderBulkAction);
        // Export
        cm.appendChild(nodes['container'], that.nodes['container']);
        that.nodes['bulk'] = nodes;
    };

    var renderBulkGroups = function(){
        if(!cm.isEmpty(that.params['actionsGroups'])){
            cm.forEach(that.params['actionsGroups'], renderBulkGroup);
        }else{
            renderBulkGroup({
                'name' : 'bulk',
                'position' : 'left'
            });
        }
    };

    var renderBulkGroup = function(config){
        var item = cm.merge({
            'name' : '',
            'position' : 'left'
        }, config);
        // Add
        that.components['toolbar'].addGroup(item);
    };

    var renderBulkAction = function(config){
        var item = cm.merge({
            'group' : 'bulk',
            'name' : '',
            'label' : '',
            'title' : '',
            'disabled' : true,
            'permanent' : false,            // Сan not be disabled
            'type' : 'primary',
            'attr' : {},
            'preventDefault' : true,
            'constructor' : false,
            'constructorParams' : {},
            'callback' : function(){}
        }, config);
        // Validate
        if(cm.isEmpty(item['name'])){
            item['name'] = item['label'];
        }
        // Check permanent status
        if(item['permanent']){
            item['disabled'] = false;
        }
        // Add
        that.components['toolbar'].addButton(item);
        that.actions.push(item);
    };

    var enableBulkActions = function(){
        if(that.isActionsDisabled){
            that.isActionsDisabled = false;
            cm.forEach(that.actions, function(item){
                if(!item['permanent']){
                    that.components['toolbar'] && that.components['toolbar'].enableButton(item['name'], item['group']);
                }
            });
        }
    };

    var disableBulkActions = function(){
        if(!that.isActionsDisabled){
            that.isActionsDisabled = true;
            cm.forEach(that.actions, function(item){
                if(!item['permanent']){
                    that.components['toolbar'] && that.components['toolbar'].disableButton(item['name'], item['group']);
                }
            });
        }
    };

    /*** PAGINATION AND TABLE ****/

    var renderPagination = function(){
        cm.getConstructor('Com.Pagination', function(classConstructor, className){
            that.components['pagination'] = new classConstructor(
                cm.merge(that.params[className], {
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
                            renderPaginationPage(data);
                        },
                        'onPageRenderEnd' : function(pagination, data){
                            that.redraw();
                        },
                        'onSetCount' : function(pagination, count){
                            that.params['showCounter'] && renderCounter(count);
                        }
                    }
                })
            );
        });
    };

    var renderPaginationPage = function(data){
        var startIndex, endIndex, dataArray;
        if(that.isAjax){
            if(!cm.isEmpty(data['data'])){
                data['data'] = that.callbacks.filter(that, data['data']);
            }
            if(!cm.isEmpty(data['data'])){
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
    };

    var renderCounter = function(count){
        if(!that.nodes['counter']){
            that.nodes['counter'] = cm.node('div', {'class' : 'pt__gridlist__counter'});
            cm.insertFirst(that.nodes['counter'], that.nodes['container']);
        }
        that.nodes['counter'].innerHTML = cm.strReplace(that.lang('counter'), {
            '%count%' : count
        });
    };

    var renderEmptiness = function(container){
        that.nodes['empty'] = cm.node('div', {'class' : 'cm__empty'}, that.lang('empty'));
        cm.appendChild(that.nodes['empty'], container);
    };

    var renderTable = function(page, data, container){
        // API onRenderStart event
        that.triggerEvent('onRenderStart', {
            'container' : container,
            'page' : page
        });
        // Reset table
        resetTable();
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
        // Render editable columns
        renderHelper(data);
        // API onRenderEnd event
        that.triggerEvent('onRenderEnd', {
            'container' : container,
            'page' : page,
            'rows' : that.rows
        });
    };

    var renderHelper = function(){
        if(that.params['columns']['editable']){
            cm.getConstructor('Com.GridlistHelper', function(classConstructor, className){
                that.components['helper'] = new classConstructor(
                    cm.merge(that.params[className], {
                        'node' : that.nodes['table'],
                        'events' : {
                            'onColumnsChange' : function(helper, data){
                                that.triggerEvent('onColumnsChange', data);
                            },
                            'onColumnsResize' : function(helper, data){
                                cm.forEach(that.params['cols'], function(column, i){
                                    if(data[i] && data[i]['width']){
                                        column['width'] = data[i]['width'];
                                    }
                                });
                                that.triggerEvent('onColumnsResize', that.params['cols']);
                            }
                        }
                    })
                );
            });
        }
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
            'textOverflow' : null,          // Overflow long text to single line
            'class' : '',		            // Icon css class, for type="icon"
            'target' : '_blank',            // Link target, for type="url"
            'showTitle' : false,            // Show title on hover
            'titleText' : '',               // Alternative title text, if not specified - will be shown key text
            'altText' : '',                 // Alternative column text
            'urlKey' : false,               // Alternative link href, for type="url"
            'links' : [],                   // Render links menu, for type="links"
            'actions' : [],                 // Render actions menu, for type="actions"
            'preventDefault' : true,
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);
        // Validate
        item['nodes'] = {};
        item['textOverflow'] = cm.isBoolean(item['textOverflow'])? item['textOverflow'] : that.params['textOverflow'];
        // Check access
        if(item['access']){
            // Structure
            that.nodes['title'].appendChild(
                item['nodes']['container'] = cm.node('th',
                    item['nodes']['inner'] = cm.node('div', {'class' : 'inner'})
                )
            );
            // Set column width
            if(/%|px|auto/.test(item['width'])){
                item['nodes']['container'].style.width = item['width'];
            }else{
                item['nodes']['container'].style.width = parseFloat(item['width']) + 'px';
            }
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
                    if(!that.isAjax){
                        arraySort();
                    }
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
            'i' : i,
            'index' : data[that.params['uniqueKey']],
            'data' : data,
            'childs' : [],
            'isChecked' : false,
            'status' : data['_status'] || false,
            'nodes' : {
                'cols' : []
            },
            'cells' : []
        };
        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.node('tr')
        );
        // Render cells
        cm.forEach(that.params['cols'], function(config){
            item['cells'].push(
                renderCell(config, item)
            );
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

    var renderCell = function(config, row){
        var item = {
            'nodes' : {}
        };
        // Check access
        if(config['access']){
            item['data'] = cm.objectPath(config['key'], row['data']);
            item['text'] = cm.isEmpty(item['data'])? '' : item['data'];
            item['title']= cm.isEmpty(config['titleText'])? item['text'] : config['titleText'];
            // Structure
            row['nodes']['container'].appendChild(
                item['nodes']['container'] = cm.node('td')
            );
            // Text overflow
            if(config['textOverflow']){
                item['nodes']['inner'] = cm.node('div', {'class' : 'inner'});
                item['nodes']['container'].appendChild(item['nodes']['inner']);
            }else{
                item['nodes']['inner'] = item['nodes']['container'];
            }
            // Insert value by type
            switch(config['type']){
                case 'number' :
                    renderCellNumber(config, row, item);
                    break;

                case 'date' :
                    renderCellDate(config, row, item);
                    break;

                case 'icon' :
                    renderCellIcon(config, row, item);
                    break;

                case 'url' :
                    renderCellURL(config, row, item);
                    break;

                case 'checkbox' :
                    renderCellCheckbox(config, row, item);
                    break;

                case 'links':
                    renderCellLinks(config, row, item);
                    break;

                case 'actions':
                    renderCellActions(config, row, item);
                    break;

                case 'empty' :
                    break;

                default :
                    renderCellDefault(config, row, item);
                    break;
            }
            // Statuses
            if(row['status']){
                setRowStatus(row, row['status']);
            }
            // onHover Title
            if(config['showTitle']){
                if(item['nodes']['node']){
                    item['nodes']['node'].title = item['title'];
                }else{
                    item['nodes']['inner'].title = item['title'];
                }
            }
            // onClick handler
            if(cm.isFunction(config['onClick'])){
                cm.addEvent(item['nodes']['node'] || item['nodes']['inner'], 'click', function(e){
                    config['preventDefault'] && cm.preventDefault(e);
                    // Column onClick event
                    config['onClick'](that, {
                        'nodes' : item['nodes'],
                        'col' : config,
                        'row' : row,
                        'cell' : item
                    });
                });
            }
            // onCellRender handler
            if(cm.isFunction(config['onRender'])){
                config['onRender'](that, {
                    'nodes' : item['nodes'],
                    'col' : config,
                    'row' : row,
                    'cell' : item
                });
            }
        }
        return item;
    };

    /*** CELLS BY TYPES ***/

    var renderCellDefault = function(config, row, item){
        item['nodes']['inner'].innerHTML = item['text'];
    };

    var renderCellNumber = function(config, row, item){
        item['nodes']['inner'].innerHTML = cm.splitNumber(item['text']);
    };

    var renderCellDate = function(config, row, item){
        if(that.params['dateFormat'] != that.params['visibleDateFormat']){
            item['nodes']['inner'].innerHTML = cm.dateFormat(
                cm.parseDate(item['text'], that.params['dateFormat']),
                that.params['visibleDateFormat']
            );
        }else{
            item['nodes']['inner'].innerHTML = item['text'];
        }
    };

    var renderCellIcon = function(config, row, item){
        item['nodes']['inner'].appendChild(
            item['nodes']['node'] = cm.node('div', {'class' : config['class']})
        );
        cm.addClass(item['nodes']['node'], 'icon linked inline');
    };

    var renderCellURL = function(config, row, item){
        item['text'] = cm.decode(item['text']);
        item['href'] = config['urlKey'] && row['data'][config['urlKey']]? cm.decode(row['data'][config['urlKey']]) : item['text'];
        item['nodes']['inner'].appendChild(
            item['nodes']['node'] = cm.node('a', {'target' : config['target'], 'href' : item['href']}, !cm.isEmpty(config['altText'])? config['altText'] : item['text'])
        );
    };

    var renderCellCheckbox = function(config, row, item){
        cm.addClass(item['nodes']['container'], 'control');
        item['nodes']['inner'].appendChild(
            item['nodes']['node'] = cm.node('input', {'type' : 'checkbox'})
        );
        row['nodes']['checkbox'] = item['nodes']['node'];
        if(row['data']['_checked']){
            checkRow(row, false);
        }
        cm.addEvent(item['nodes']['node'], 'click', function(){
            if(!row['isChecked']){
                checkRow(row, true);
            }else{
                unCheckRow(row, true);
            }
        });
    };

    var renderCellLinks = function(config, row, item){
        item['nodes']['links'] = [];
        item['nodes']['inner'].appendChild(
            item['nodes']['node'] = cm.node('div', {'class' : ['pt__links', config['class']].join(' ')},
                item['nodes']['linksList'] = cm.node('ul')
            )
        );
        cm.forEach(config['links'], function(actionItem){
            var actionNode;
            actionItem = cm.merge({
                'label' : '',
                'attr' : {},
                'events' : {}
            }, actionItem);
            cm.forEach(row['data'], function(itemValue, itemKey){
                actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
            });
            item['nodes']['linksList'].appendChild(
                cm.node('li',
                    actionNode = cm.node('a', actionItem['attr'], actionItem['label'])
                )
            );
            cm.forEach(actionItem['events'], function(actionEventHandler, actionEventName){
                cm.addEvent(actionNode, actionEventName, actionEventHandler);
            });
            item['nodes']['links'].push(actionNode);
        });
    };

    var renderCellActions = function(config, row, item){
        var isInArray, isEmpty;
        // Structure
        item['nodes']['actions'] = [];
        item['nodes']['node'] = cm.node('div', {'class' : ['pt__links', 'pull-right', config['class']].join(' ')},
            cm.node('ul',
                item['nodes']['componentNode'] = cm.node('li', {'class' : 'com__menu', 'data-node' : 'ComMenu:{}:button'},
                    cm.node('a', {'class' : 'label'}, that.lang('actions')),
                    cm.node('span', {'class' : 'cm-i__chevron-down xx-small inline'}),
                    cm.node('div', {'class' : 'pt__menu', 'data-node' : 'ComMenu.target'},
                        item['nodes']['actionsList'] = cm.node('ul', {'class' : 'pt__menu-dropdown'})
                    )
                )
            )
        );
        // Items
        cm.forEach(config['actions'], function(actionItem){
            actionItem = cm.merge({
                'name' : '',
                'label' : '',
                'attr' : {},
                'events' : {},
                'constructor' : false,
                'constructorParams' : {},
                'callback' : function(){}
            }, actionItem);
            // Check access
            isEmpty = !cm.isArray(item['data']) || cm.isEmpty(actionItem['name']);
            isInArray = cm.isArray(item['data']) && cm.inArray(item['data'], actionItem['name']);
            if(isEmpty || isInArray){
                renderCellActionItem(config, row, item, actionItem);
            }
        });
        // Embed
        if(item['nodes']['actions'].length){
            cm.appendChild(item['nodes']['node'], item['nodes']['inner']);
        }
    };

    var renderCellActionItem = function(config, row, item, actionItem){
        // WTF is that? - that is attribute bindings, for example - href
        cm.forEach(row['data'], function(itemValue, itemKey){
            actionItem['attr'] = cm.replaceDeep(actionItem['attr'], new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'), itemValue);
        });
        item['nodes']['actionsList'].appendChild(
            cm.node('li',
                actionItem['node'] = cm.node('a', actionItem['attr'], actionItem['label'])
            )
        );
        // Render menu component
        cm.getConstructor('Com.Menu', function(classConstructor, className){
            item['component'] = new classConstructor(
                cm.merge(that.params[className], {
                    'node' : item['nodes']['componentNode']
                })
            );
        });
        if(actionItem['constructor']){
            cm.getConstructor(actionItem['constructor'], function(classConstructor){
                actionItem['controller'] = new classConstructor(
                    cm.merge(actionItem['constructorParams'], {
                        'node' : actionItem['node'],
                        'data' : row['data'],
                        'rowItem' : row,
                        'cellItem' : item,
                        'actionItem' : actionItem
                    })
                );
                actionItem['controller'].addEvent('onRenderControllerEnd', function(){
                    item['component'].hide(false);
                });
            });
        }else{
            cm.addEvent(actionItem['node'], 'click', function(e){
                config['preventDefault'] && cm.preventDefault(e);
                item['component'].hide(false);
                actionItem['callback'](e, actionItem, row);
            });
        }
        item['nodes']['actions'].push(actionItem['node']);
    };

    /*** HELPING FUNCTIONS ***/

    var resetTable = function(){
        that.unCheckAll();
        that.rows = [];
        that.checked = [];
        if(!that.params['pagination']){
            cm.remove(that.nodes['table']);
        }
    };

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
        if(!row['isChecked']){
            if(row['nodes']['checkbox']){
                row['nodes']['checkbox'].checked = true;
            }
            row['isChecked'] = true;
            row['data']['_checked'] = true;
            if(row['status']){
                cm.removeClass(row['nodes']['container'], row['status']);
            }
            cm.addClass(row['nodes']['container'], 'active');
            // Set
            that.checked.push(row);
            if(that.checked.length){
                enableBulkActions();
            }else{
                disableBulkActions();
            }
            // Events
            if(execute){
                // API onCheck Event
                that.triggerEvent('onCheck', row);
            }
        }
    };

    var unCheckRow = function(row, execute){
        if(row['isChecked']){
            if(row['nodes']['checkbox']){
                row['nodes']['checkbox'].checked = false;
            }
            row['isChecked'] = false;
            row['data']['_checked'] = false;
            cm.removeClass(row['nodes']['container'], 'active');
            if(row['status']){
                cm.addClass(row['nodes']['container'], row['status']);
            }
            // Set
            cm.arrayRemove(that.checked, row);
            if(that.checked.length){
                enableBulkActions();
            }else{
                disableBulkActions();
            }
            // Events
            if(execute){
                // API onUnCheck Event
                that.triggerEvent('onUnCheck', row);
            }
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

    /******* CALLBACKS *******/

    that.callbacks.filter = function(that, data){
        return data;
    };

    /******* MAIN *******/

    that.rebuild = function(){
        that.components['pagination'] && that.components['pagination'].rebuild();
        return that;
    };

    that.redraw = function(){
        that.components['helper'] && that.components['helper'].redraw();
        return that;
    };

    that.setAction = function(o, mode, update){
        that.components['pagination'] && that.components['pagination'].setAction(o, mode, update);
        return that;
    };

    that.getAction = function(){
        return that.components['pagination'] && that.components['pagination'].getAction() || {};
    };

    that.getCurrentAction = function(){
        return that.components['pagination'] && that.components['pagination'].getCurrentAction() || {};
    };

    that.check = function(id){
        cm.forEach(that.rows, function(row){
            if(row['index'] == id){
                checkRow(row, true);
            }
        });
        return that;
    };

    that.unCheck = function(id){
        cm.forEach(that.rows, function(row){
            if(row['index'] == id){
                unCheckRow(row, true);
            }
        });
        return that;
    };

    that.checkAll = function(){
        if(that.nodes['checkbox']){
            that.nodes['checkbox'].checked = true;
        }
        cm.forEach(that.rows, function(row){
            checkRow(row);
        });
        // API onUnCheckAll Event
        if(!that.isCheckedAll){
            that.isCheckedAll = true;
            that.triggerEvent('onCheckAll');
        }
        return that;
    };

    that.unCheckAll = function(){
        if(that.nodes['checkbox']){
            that.nodes['checkbox'].checked = false;
        }
        cm.forEach(that.rows, function(row){
            unCheckRow(row);
        });
        // API onUnCheckAll Event
        if(that.isCheckedAll){
            that.isCheckedAll = false;
            that.triggerEvent('onUnCheckAll');
        }
        return that;
    };

    that.getChecked = function(){
        return that.checked;
    };

    that.getCheckedData = function(){
        var rows = [];
        cm.forEach(that.checked, function(item){
            rows.push(item['data']);
        });
        return rows;
    };

    that.getCheckedIndexes = function(){
        var rows = [];
        cm.forEach(that.checked, function(item){
            rows.push(item['data'][that.params['uniqueKey']]);
        });
        return rows;
    };

    that.setRowStatus = function(id, status){
        cm.forEach(that.rows, function(row){
            if(row['index'] == id){
                setRowStatus(row, status);
            }
        });
        return that;
    };

    that.clearRowStatus = function(id){
        cm.forEach(that.rows, function(row){
            if(row['index'] == id){
                clearRowStatus(row);
            }
        });
        return that;
    };

    that.getRowsByStatus = function(status){
        var rows = [];
        cm.forEach(that.rows, function(row){
            if(row['status'] == status){
                rows.push(row);
            }
        });
        return rows;
    };

    that.getToolbar = function(){
        return that.components['toolbar'];
    };

    init();
});