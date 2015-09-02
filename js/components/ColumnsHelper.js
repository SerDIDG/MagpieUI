cm.define('Com.ColumnsHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onChange',
        'onResize',
        'onDragStart',
        'onDragMove',
        'onDragStop'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'isEditMode' : true,
        'items' : [],
        'minColumnWidth' : 48,              // in px
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'url' : '',                                             // Request URL. Variables: %items%, %callback% for JSONP.
            'params' : ''                                           // Params object. %items%, %callback% for JSONP.
        }
    }
},
function(params){
    var that = this;

    that.items = [];
    that.chassis = [];
    that.current = null;
    that.isEditMode = false;
    that.isRendered = false;
    that.isAjax = false;
    that.isProcess = false;
    that.ajaxHandler = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(!cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
        that.isEditMode = that.params['isEditMode'];
    };

    var render = function(){
        if(that.isEditMode && !that.isRendered){
            that.items = [];
            that.chassis = [];
            cm.forEach(that.params['items'], function(item, i){
                that.items.push({
                    'container' : item
                });
                if(i < that.params['items'].length - 1){
                    renderChassisItem(i);
                }
            });
            that.isRendered = true;
        }
    };

    var renderChassisItem = function(i){
        var chassis = {},
            ratio = that.params['node'].offsetWidth / 100,
            left = ((cm.getRealX(that.items[i]['container']) - cm.getRealX(that.params['node']) + that.items[i]['container'].offsetWidth) / ratio).toFixed(2);
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
        chassis['container'].style.left = [left, '%'].join('');
        // Push to chassis array
        that.chassis.push(chassis);
        // Add events
        cm.addEvent(chassis['container'], 'mousedown', function(e){
            start(e, chassis);
        });
        // Embed
        that.params['node'].appendChild(chassis['container']);
    };

    var remove = function(){
        cm.forEach(that.chassis, function(item){
            cm.remove(item['container']);
        });
        that.isRendered = false;
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        // If current exists, we don't need to start another drag event until previous will not stop
        if(that.current){
            return false;
        }
        // Abort ajax handler
        if(that.isProcess){
            that.abort();
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
        var index = that.chassis.indexOf(chassis),
            leftColumn = that.items[index],
            rightColumn = that.items[index + 1];

        that.current = {
            'index' : index,
            'offset' : cm.getRealX(that.params['node']),
            'ratio' : that.params['node'].offsetWidth / 100,
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
        cm.addClass(that.params['node'], 'is-chassis-active');
        cm.addClass(that.current['chassis']['drag'], 'is-active');
        cm.addClass(document.body, 'pt__drag__body--horizontal');
        cm.addEvent(window, 'mousemove', move);
        cm.addEvent(window, 'mouseup', stop);
        that.triggerEvent('onDragStart', that.current);
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
        leftWidth = x - that.current['left']['offset'];
        rightWidth = that.current['right']['offset'] - x;
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            that.current['left']['column']['width'] = [(leftWidth / that.current['ratio']).toFixed(2), '%'].join('');
            that.current['right']['column']['width'] = [(rightWidth / that.current['ratio']).toFixed(2), '%'].join('');

            that.current['left']['column']['container'].style.width = that.current['left']['column']['width'];
            that.current['right']['column']['container'].style.width = that.current['right']['column']['width'];
            that.current['chassis']['container'].style.left = [((x - that.current['offset']) / that.current['ratio']).toFixed(2), '%'].join('');
        }
        // API onResize event
        that.triggerEvent('onChange', that.items);
        that.triggerEvent('onDragMove', that.current);
    };

    var stop = function(){
        var config;
        // Remove move event from document
        cm.removeClass(that.params['node'], 'is-chassis-active');
        cm.removeClass(that.current['chassis']['drag'], 'is-active');
        cm.removeClass(document.body, 'pt__drag__body--horizontal');
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mousemove', move);
        cm.removeEvent((cm.is('IE') && cm.isVersion() < 9? document.body : window), 'mouseup', stop);
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', that.items);
        that.triggerEvent('onDragStop', that.current);
        that.current = null;
        // Ajax
        cm.log(that.items);
        if(that.isAjax){
            config = cm.clone(that.params['ajax']);
            that.ajaxHandler = that.callbacks.request(that, config);
        }
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        var items = [];
        cm.forEach(that.items, function(item){
            items.push(item['width']);
        });
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%items%' : items
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%items%' : items
        });
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
                },
                'onEnd' : function(){
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.start = function(that){
        that.isProcess = true;
    };

    that.callbacks.end = function(that){
        that.isProcess = false;
    };

    /* ******* PUBLIC ******* */

    that.enableEditMode = function(){
        that.isEditMode = true;
        render();
        return that;
    };

    that.disableEditMode = function(){
        that.isEditMode = false;
        remove();
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});