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
        'onRender',
        'onRenderStart',
        'onRenderEnd',
        'onLoadStart',
        'onLoadSuccess',
        'onLoadError',
        'onLoadEnd',
        'onPageRenderStart',
        'onPageRenderEnd',
        'onRenderTitleItem',
        'onRenderFilterItem',
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
        'groupBy' : false,                                          // Render child rows after parent, (WIP - doesn't work checking / uncheking rows and statuses for now)

        // Visibility
        'adaptive' : false,
        'showCounter' : false,
        'showBulkActions' : true,
        'showTitle' : false,
        'textOverflow' : false,
        'className' : '',
        'dateFormat' : 'cm._config.dateTimeFormat',                 // Input date format
        'visibleDateFormat' : 'cm._config.dateTimeFormat',          // Render date format

        // Pagination and ajax data request
        'renderEmptyMessage' : true,
        'renderEmptyTable' : false,
        'renderFilter' : false,
        'divideTableHeader' : false,
        'hideTableHeader' : false,
        'pagination' : true,
        'perPage' : 25,
        'responseKey' : 'data',                                     // Response data response key
        'responseCodeKey' : 'code',
        'responseErrorsKey' : 'errors',
        'responseMessageKey' : 'message',
        'responseCountKey' : 'count',                               // Response data count response key
        'showLoader' : true,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'url' : '',                                             // Request URL. Variables: %orderBy%, %orderByLower%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
            'params' : ''                                           // Params object. Variables: %orderBy%, %orderByLower%, %sortBy%, %page%, %offset%, %perPage%, %limit%, %callback% for JSONP.
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
        'autoSend' : true,
        'paginationConstructor' : 'Com.Pagination',
        'paginationParams' : {
            'renderStructure' : true,
            'embedStructureOnRender' : true,
            'animateSwitch' : true,
            'animatePrevious' : true
        },
        'Com.Toolbar' : {
            'embedStructure' : 'append'
        },
        'menuConstructor' : 'Com.Menu',
        'menuParams' : {
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
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.sortBy = that.params['sortBy'];
        that.orderBy = that.params['orderBy'];
        // ToDo: remove deprecated parameter name
        that.params['groupBy'] = !cm.isEmpty(that.params['childBy']) ? that.params['childsBy'] : that.params['groupBy'];
        // Ajax
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
            var paginationParams = [
                'autoSend',
                'showLoader',
                'responseKey',
                'responseCodeKey',
                'responseCountKey',
                'responseMessageKey',
                'responseErrorsKey',
                'ajax',
            ];
            cm.forEach(paginationParams, function(item){
                if(typeof that.params[item] !== 'undefined'){
                    that.params['paginationParams'][item] = that.params[item];
                }
            });
            that.params['pagination'] = true;
        }else{
            that.params['paginationParams']['count'] = that.params['data'].length;
        }
        // Pagination
        that.params['paginationParams']['perPage'] = that.params['perPage'];
        // Helper
        that.params['Com.GridlistHelper']['columns'] = that.params['columns'];
    };

    /* *** TABLE RENDER FUNCTION *** */

    var render = function(){
        // Container
        that.nodes['container'] = cm.node('div', {'class' : 'com__gridlist'});
        // Add css class
        cm.addClass(that.nodes['container'], that.params['className']);
        if(that.params['adaptive']){
            cm.addClass(that.nodes['container'], 'is-adaptive');
        }
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
        if(that.params['divideTableHeader']){
            renderTableHeader(that.nodes['container']);
        }
        if(that.isAjax){
            renderPagination();
        }else{
            renderStatic(that.params['data']);
        }
    };

    var renderStatic = function(data){
        if(!cm.isEmpty(data) && cm.isArray(data)){
            that.params['data'] = that.callbacks.filter(that, data);
            that.params['paginationParams']['count'] = that.params['data'].length;
        }
        if(!cm.isEmpty(that.params['data'])){
            removeEmptiness(that.nodes['container']);
            // Sort data array for first time
            that.params['sort'] && arraySort();
            // Counter
            if(that.params['showCounter']){
                renderCounter(that.params['data'].length);
            }
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
        cm.getConstructor(that.params['paginationConstructor'], function(classConstructor){
            that.components['pagination'] = new classConstructor(
                cm.merge(that.params['paginationParams'], {
                    'container' : that.nodes['container'],
                    'callbacks' : {
                        'afterPrepare' : function(pagination, config){
                            return that.callbacks.paginationAfterPrepare(that, pagination, config)
                        }
                    },
                    'events' : {
                        'onStart' : function(pagination){
                            that.triggerEvent('onLoadStart');
                        },
                        'onPageRenderError' : function(pagination, page){
                            that.triggerEvent('onLoadError', {'page' : page});
                            that.triggerEvent('onLoadEnd', {'page' : page});
                        },
                        'onPageRender' : function(pagination, page){
                            that.callbacks.renderPage(that, page);
                        },
                        'onPageRenderEnd' : function(pagination, page){
                            that.redraw();
                            that.triggerEvent('onLoadSuccess', {'page' : page});
                            that.triggerEvent('onLoadEnd', {'page' : page});
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
        if(!that.nodes['counter']){
            that.nodes['counter'] = cm.node('div', {'class' : 'pt__gridlist__counter'});
            cm.insertFirst(that.nodes['counter'], that.nodes['container']);
        }
        that.nodes['counter'].innerHTML = cm.strReplace(that.lang('counter'), {
            '%count%' : count
        });
    };

    var renderEmptiness = function(container, errors){
        errors = !cm.isEmpty(errors) ? errors : that.lang('empty');
        removeEmptiness(container);
        that.nodes['empty'] = cm.node('div', {'class' : 'cm__empty'}, errors);
        cm.appendChild(that.nodes['empty'], container);
    };

    var removeEmptiness = function(container){
        if(that.nodes['empty'] && cm.isParent(container, that.nodes['empty'])){
            cm.remove(that.nodes['empty']);
        }
    };

    var renderTableHeader = function(container){
        var nodes = {};
        that.nodes['header'] = nodes;
        // Render Table
        nodes['container'] = cm.node('div', {'class' : 'pt__gridlist pt__gridlist--header'},
            nodes['table'] = cm.node('table',
                nodes['head'] = cm.node('thead',
                    nodes['title'] = cm.node('tr')
                )
            )
        );
        if(that.params['adaptive']){
            cm.addClass(nodes['container'], 'is-adaptive');
        }
        // Render Table Title
        cm.forEach(that.params['cols'], function(item, i){
            renderTitleItem(item, i, nodes['title']);
        });
        // Render Table Filter
        if(that.params['renderFilter']){
            nodes['filter'] = cm.node('tr');
            cm.forEach(that.params['cols'], function(item, i){
                renderFilterItem(item, i, nodes['filter']);
            });
            cm.appendChild(nodes['filter'], nodes['head']);
        }
        // Append
        cm.appendChild(nodes['container'], container);
    };

    var renderTable = function(page, data, container){
        // API onRenderStart event
        that.triggerEvent('onRenderStart', {
            'container' : container,
            'page' : page,
            'data' : data
        });
        // Reset table
        resetTable();
        if(that.nodes['table'] && cm.isParent(container, that.nodes['table'])){
            cm.remove(that.nodes['table']);
        }
        // Render Table
        that.nodes['table'] = cm.node('div', {'class' : 'pt__gridlist'},
            that.nodes['tableInner'] = cm.node('table',
                that.nodes['head'] = cm.node('thead',
                    that.nodes['title'] = cm.node('tr')
                ),
                that.nodes['content'] = cm.node('tbody')
            )
        );
        if(that.params['adaptive']){
            cm.addClass(that.nodes['table'], 'is-adaptive');
        }
        if(!that.params['divideTableHeader']){
            // Render Table Title
            cm.forEach(that.params['cols'], function(item, i){
                renderTitleItem(item, i, that.nodes['title']);
            });
            // Render Table Filter
            if(that.params['renderFilter']) {
                that.nodes['filter'] = cm.node('tr');
                cm.forEach(that.params['cols'], function(item, i){
                    renderFilterItem(item, i, that.nodes['filter']);
                });
                cm.appendChild(that.nodes['filter'], that.nodes['head']);
            }
            if(that.params.hideTableHeader){
                cm.addClass(that.nodes['head'], 'is-hidden');
            }
        }else{
            // Render Table Title Placeholder
            cm.forEach(that.params['cols'], function(item, i){
                renderTitleItemPlaceholder(item, i, that.nodes['title']);
            });
            cm.addClass(that.nodes['head'], 'is-hidden');
        }
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
            'data' : data,
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

    var renderTitleItem = function(item, i, container){
        // Merge cell parameters
        item = that.params['cols'][i] = cm.merge({
            '_component' : null,            // System attribute
            'width' : 'auto',               // number | % | auto
            'access' : true,                // Render column if is accessible
            'type' : 'text',		        // text | number | url | date | html | icon | checkbox | empty | actions | links
            'key' : '',                     // Data array key
            'title' : '',                   // Table th title
            'sort' : that.params['sort'],   // Sort this column or not
            'sortKey' : '',                 // Sort key
            'filterKey' : null,
            'classes' : [],                 // Cell css class
            'class' : '',		            // Item css class
            'target' : '_blank',            // Link target, for type="url|icon"
            'rel' : null,                   // Link rel, for type="url|icon"
            'textOverflow' : null,          // Overflow long text to single line
            'showTitle' : null,             // Show title on hover
            'titleText' : '',               // Alternative title text, if not specified - will be shown key text
            'altText' : '',                 // Alternative column text
            'urlKey' : false,               // Alternative link href, for type="url|icon"
            'links' : [],                   // Render links menu, for type="links"
            'linksParams' : {
                'align': 'left',
            },
            'actions' : [],                 // Render actions menu, for type="actions"
            'actionsParams' : {
                'align': 'right',
            },
            'preventDefault' : true,
            'onClick' : false,              // Cell click handler
            'onRender' : false              // Cell onRender handler
        }, item);

        // Validate
        item['nodes'] = {};
        item['showTitle'] = cm.isBoolean(item['showTitle'])? item['showTitle'] : that.params['showTitle'];
        item['textOverflow'] = cm.isBoolean(item['textOverflow'])? item['textOverflow'] : that.params['textOverflow'];

        // Check access
        if(!item['access']){
            return;
        }

        // Structure
        item['nodes']['container'] = cm.node('th', {'classes' : item['classes']},
            item['nodes']['inner'] = cm.node('div', {'class' : 'inner'})
        );
        // Set column width
        if(/%|px|auto/.test(item['width'])){
            item['nodes']['container'].style.width = item['width'];
        }else{
            item['nodes']['container'].style.width = parseFloat(item['width']) + 'px';
        }
        // Embed
        cm.appendChild(item['nodes']['container'], container);
        // Insert specific specified content in th
        switch(item['type']){
            case 'checkbox' :
                cm.addClass(item['nodes']['container'], 'control');
                item['nodes']['inner'].appendChild(
                    item['nodes']['checkbox'] = cm.node('input', {'type' : 'checkbox', 'title' : that.lang('check_all')})
                );
                item['nodes']['checkbox'].checked = that.isCheckedAll;
                cm.addEvent(item['nodes']['checkbox'], 'click', function(){
                    if(that.isCheckedAll){
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
            setTableHeaderItemSort(item, i);
            cm.addEvent(item['nodes']['inner'], 'click', function(){
                that.sortBy = !cm.isEmpty(item['sortKey']) ? item['sortKey'] : item['key'];
                that.orderBy = that.orderBy === 'ASC' ? 'DESC' : 'ASC';
                if(!that.isAjax){
                    arraySort();
                }
                if(that.params['divideTableHeader']){
                    cm.forEach(that.params['cols'], setTableHeaderItemSort);
                }
                if(that.params['pagination']){
                    that.components['pagination'].rebuild();
                }else{
                    renderTable(1, that.params['data'], that.nodes['container']);
                }
            });
        }
        // Trigger event
        that.triggerEvent('onRenderTitleItem', {
            'nodes' : item['nodes'],
            'item' : item,
            'i' : i
        });
    };

    var setTableHeaderItemSort = function(item, i){
        if(!item['access'] || /icon|empty|actions|links|checkbox/.test(item['type'])){
            return;
        }
        cm.removeClass(item['nodes']['container'], 'sort');
        if(item['sort']){
            cm.addClass(item['nodes']['container'], 'sort');
            cm.remove(item['nodes']['sort']);
            if(item['sortKey'] === that.sortBy || item['key'] === that.sortBy){
                item['nodes']['sort'] = cm.node('div', {'class' : that.params['icons']['arrow'][that.orderBy.toLowerCase()]});
                cm.appendChild(item['nodes']['sort'], item['nodes']['inner']);
            }
        }
    };

    var renderTitleItemPlaceholder = function(item, i, container){
        item['nodes']['placeholder'] = {};
        // Check access
        if(item['access']){
            // Structure
            item['nodes']['placeholder']['container'] = cm.node('th',
                item['nodes']['placeholder']['inner'] = cm.node('div', {'class' : 'inner'})
            )
            // Set column width
            if(/%|px|auto/.test(item['width'])){
                item['nodes']['placeholder']['container'].style.width = item['width'];
            }else{
                item['nodes']['placeholder']['container'].style.width = parseFloat(item['width']) + 'px';
            }
            // Embed
            cm.appendChild(item['nodes']['placeholder']['container'], container);
        }
    };

    var renderFilterItem = function(item, i, container){
        item['nodes']['filter'] = {};
        // Check access
        if(item['access']){
            // Structure
            item['nodes']['filter']['container'] = cm.node('td',
                item['nodes']['filter']['inner'] = cm.node('div', {'class' : 'inner'})
            )
            cm.appendChild(item['nodes']['filter']['container'], container);
            // Trigger event
            that.triggerEvent('onRenderFilterItem', {
                'nodes' : item['nodes']['filter'],
                'item' : item,
                'i' : i
            });
        }
    };

    var renderRow = function(parentRow, data, i){
        // Config
        var item = {
            'i' : i,
            'index' : data[that.params['uniqueKey']],
            'data' : data,
            'children' : [],
            'childrenData' : [],
            'isChecked' : false,
            'isParent' : false,
            'isFirstLevel' : true,
            'status' : data['_status'] || false,
            'classes' : [],
            'nodes' : {
                'cols' : []
            },
            'cells' : []
        };

        // Validate
        item.isFirstLevel = that.rows === parentRow;
        if(that.params['groupBy']){
            item.childrenData = item.data[that.params['groupBy']];
            item.isParent = !cm.isEmpty(item.childrenData);
        }
        item.classes.push(item.isFirstLevel ? 'is-first-level' : 'is-child-level');

        // Structure
        that.nodes['content'].appendChild(
            item['nodes']['container'] = cm.node('tr', {'classes' : item.classes})
        );

        // Render cells
        cm.forEach(that.params['cols'], function(config){
            item['cells'].push(
                renderCell(config, item)
            );
        });

        // Group children
        if(that.params['groupBy']){
            cm.forEach(item.childrenData, function(childData, childI){
                renderRow(item.children, childData, childI);
            });
        }

        // Push
        parentRow.push(item);
    };

    var renderCell = function(config, row){
        var item = {
            'nodes' : {}
        };

        // Check access
        if(!config['access']){
            return item;
        }

        // Validate
        item['data'] = cm.objectPath(config['key'], row['data']);
        item['text'] = cm.isEmpty(item['data'])? '' : item['data'];
        item['title']= cm.isEmpty(config['titleText'])? item['text'] : config['titleText'];
        if(cm.isString(config['classes'])){
            config['classes'] = [config['classes']];
        }

        // Structure
        row['nodes']['container'].appendChild(
            item['nodes']['container'] = cm.node('td', {'classes' : config['classes']})
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

        // Empty
        if(!item['nodes']['inner'].hasChildNodes()){
            cm.addClass(item['nodes']['container'], 'is-empty');
        }

        // Push
        return item;
    };

    /*** CELLS BY TYPES ***/

    var renderCellDefault = function(config, row, item){
        if(cm.isNode(item['text'])){
            cm.appendChild(item['text'], item['nodes']['inner']);
        }else{
            item['nodes']['inner'].innerHTML = item['text'];
        }
    };

    var renderCellNumber = function(config, row, item){
        item['nodes']['inner'].innerHTML = cm.splitNumber(item['text']);
    };

    var renderCellDate = function(config, row, item){
        if(that.params['dateFormat'] !== that.params['visibleDateFormat']){
            item['nodes']['inner'].innerHTML = cm.parseFormatDateTime(item['text'], that.params['dateFormat'], that.params['visibleDateFormat']);
        }else{
            item['nodes']['inner'].innerHTML = item['text'];
        }
    };

    var renderCellIcon = function(config, row, item){
        item['text'] = cm.decode(item['text']);
        item['href'] = config['urlKey'] && row['data'][config['urlKey']]? cm.decode(row['data'][config['urlKey']]) : item['text'];
        item['label'] = !cm.isEmpty(config['altText'])? config['altText'] : item['text'];
        if(!cm.isEmpty(item['href'])){
            item['nodes']['node'] = cm.node('a', {'class' : config['class'], 'title' : item['label'], 'target' : config['target'], 'rel' : config['rel'], 'href' : item['href']});
        }else{
            item['nodes']['node'] = cm.node('div', {'class' : config['class'], 'title' : item['label']})
        }
        cm.addClass(item['nodes']['node'], 'icon linked inline');
        item['nodes']['inner'].appendChild(item['nodes']['node']);
    };

    var renderCellURL = function(config, row, item){
        item['text'] = cm.decode(item['text']);
        item['href'] = config['urlKey'] && row['data'][config['urlKey']]? cm.decode(row['data'][config['urlKey']]) : item['text'];
        item['label'] = !cm.isEmpty(config['altText'])? config['altText'] : item['text'];
        if(!cm.isEmpty(item['href'])){
            item['nodes']['node'] = cm.node('a', {'target' : config['target'], 'rel' : config['rel'], 'href' : item['href']}, item['label']);
            item['nodes']['inner'].appendChild(item['nodes']['node']);
        }
    };

    var renderCellCheckbox = function(config, row, item){
        cm.addClass(item['nodes']['container'], 'control');
        item['nodes']['node'] = cm.node('input', {'type' : 'checkbox'})
        item['nodes']['inner'].appendChild(item['nodes']['node']);
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
        // Config
        item['classes'] = ['pt__links', ['pull', config['linksParams']['align']].join('-'), config['class']];
        // Structure
        item['nodes']['items'] = item['nodes']['links'] = [];
        item['nodes']['node'] = cm.node('div', {'class' : item['classes']},
            item['nodes']['itemsList'] = item['nodes']['linksList'] = cm.node('ul')
        )
        // Items
        item['links'] = renderCellActionItems(config, row, item, 'links');
        // Embed
        if(item['nodes']['links'].length){
            cm.appendChild(item['nodes']['node'], item['nodes']['inner']);
        }
    };

    var renderCellActions = function(config, row, item){
        // Config
        item['classes'] = ['pt__links', ['pull', config['actionsParams']['align']].join('-'), config['class']];
        // Structure
        item['nodes']['items'] = item['nodes']['actions'] = [];
        item['nodes']['node'] = cm.node('div', {'class' : item['classes']},
            cm.node('ul',
                item['nodes']['componentNode'] = cm.node('li', {'class' : 'com__menu', 'data-node' : 'ComMenu:{}:button'},
                    cm.node('a', {'class' : 'label'}, that.lang('actions')),
                    cm.node('span', {'class' : 'cm-i__chevron-down xx-small inline'}),
                    cm.node('div', {'class' : 'pt__menu', 'data-node' : 'ComMenu.target'},
                        item['nodes']['itemsList'] = item['nodes']['actionsList'] = cm.node('ul', {'class' : 'pt__menu-dropdown'})
                    )
                )
            )
        );
        // Items
        item['actions'] = renderCellActionItems(config, row, item, 'actions');
        // Embed
        if(item['nodes']['actions'].length){
            cm.appendChild(item['nodes']['node'], item['nodes']['inner']);
            // Render menu component
            cm.getConstructor(that.params['menuConstructor'], function(classConstructor){
                item['component'] = new classConstructor(
                    cm.merge(that.params['menuParams'], {
                        'node' : item['nodes']['componentNode']
                    })
                );
            });
        }
    };

    var renderCellActionItems = function(config, row, item, list){
        var isInArray,
            isEmpty,
            items = [];
        cm.forEach(config[list], function(actionItem, key){
            actionItem = cm.merge({
                'name' : '',
                'label' : '',
                'attr' : {},
                'events' : {},
                'preventDefault' : null,
                'constructor' : false,
                'constructorParams' : {},
                'callback' : null,
            }, actionItem);
            // Validate
            actionItem['preventDefault'] = cm.isBoolean(actionItem['preventDefault']) ? actionItem['preventDefault'] : config['preventDefault'];
            // Check access
            isEmpty = !cm.isArray(item['data']) || cm.isEmpty(actionItem['name']);
            isInArray = cm.isArray(item['data']) && cm.inArray(item['data'], actionItem['name']);
            if(isEmpty || isInArray){
                renderCellActionItem(config, row, item, actionItem);
            }
            // Export
            items.push(actionItem);
        });
        return items;
    }

    var renderCellActionItem = function(config, row, item, actionItem){
        // WTF is that? - that is attribute bindings, for example - href
        cm.forEach(row['data'], function(itemValue, itemKey){
            actionItem['attr'] = cm.replaceDeep(
                actionItem['attr'],
                new RegExp([cm.strWrap(itemKey, '%'), cm.strWrap(itemKey, '%25')].join('|'), 'g'),
                itemValue
            );
        });
        item['nodes']['itemsList'].appendChild(
            cm.node('li',
                actionItem['node'] = cm.node('a', actionItem['attr'], actionItem['label'])
            )
        );
        if(actionItem['constructor'] || cm.isFunction(actionItem['callback'])){
            actionItem['node'].setAttribute('role', 'button');
            actionItem['node'].setAttribute('tabindex', 0);
        }
        if(actionItem['constructor']){
            cm.getConstructor(actionItem['constructor'], function(classConstructor){
                actionItem['_constructorParams'] = cm.merge(actionItem['constructorParams'], {
                    'node' : actionItem['node'],
                    'data' : row['data'],
                    'rowItem' : row,
                    'cellItem' : item,
                    'actionItem' : actionItem
                });
                actionItem['controller'] = new classConstructor(actionItem['_constructorParams']);
                actionItem['controller'].addEvent('onRenderControllerEnd', function(){
                    item['component'] && item['component'].hide(false);
                });
            });
        }else{
            cm.addEvent(actionItem['node'], 'click', function(e){
                actionItem['preventDefault'] && cm.preventDefault(e);
                item['component'].hide(false);
                cm.isFunction(actionItem['callback']) && actionItem['callback'](e, actionItem, row);
            });
        }
        item['nodes']['items'].push(actionItem['node']);
    };

    /*** HELPING FUNCTIONS ***/

    var resetTable = function(container){
        cm.customEvent.trigger(that.nodes['table'], 'destruct', {
            'direction' : 'child',
            'self' : false
        });
        that.unCheckAll();
        that.rows = [];
        that.checked = [];
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

    that.callbacks.paginationAfterPrepare = function(that, pagination, config){
        config['url'] = cm.strReplace(config['url'], {
            '%sortBy%' : that.sortBy,
            '%orderBy%' : that.orderBy,
            '%orderByLower%' : that.orderBy.toLowerCase()
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%sortBy%' : that.sortBy,
            '%orderBy%' : that.orderBy,
            '%orderByLower%' : that.orderBy.toLowerCase()
        });
        return config;
    };

    that.callbacks.filter = function(that, data){
        return data;
    };

    that.callbacks.renderPage = function(that, page){
        that.triggerEvent('onPageRenderStart', {'page' : page});
        if(!that.isAjax){
            page.data = that.getStaticPageData(page.page);
        }
        if(!cm.isEmpty(page.data) && cm.isArray(page.data)){
            page.data = that.callbacks.filter(that, page.data);
        }
        that.renderPageTable(page);
        that.triggerEvent('onPageRenderEnd', {'page' : page});
    };

    /******* TABLE *******/

    that.renderPageTable = function(page){
        if(!cm.isEmpty(page['data'])){
            renderTable(page['page'], page['data'], page['container']);
        }else{
            if(that.params['renderEmptyTable']){
                renderTable(page['page'], page['data'], page['container']);
            }
            if(that.params['renderEmptyMessage']){
                renderEmptiness(page['container'], page['message']);
            }
        }
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

    that.setData = function(data){
        renderStatic(data);
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

    that.abort = function(){
        that.components['pagination'] && that.components['pagination'].abort();
        return that;
    };

    that.getRows = function(){
        return that.rows;
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

    that.getStaticPageData = function(page){
        var startIndex = that.params.perPage * (page - 1),
            endIndex = Math.min(that.params.perPage * page, that.params.data.length);
        return that.params.data.slice(startIndex, endIndex);
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
