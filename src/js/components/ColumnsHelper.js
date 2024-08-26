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
        'onDragStop',
        'onEnableEditing',
        'onEnableEditable',
        'onDisableEditing',
        'onDisableEditable',
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'items' : [],
        'showDrag' : true,
        'minColumnWidth' : 48,              // in px
        'isEditing' : true,
        'customEvents' : true,
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
    that.pointerType = null;
    that.isEditing = null;
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
    };

    var render = function(){
        renderChassis();
        // Add window event
        cm.addEvent(window, 'resize', function(){
            that.redraw();
        });
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', function(){
                that.redraw();
            });
            cm.customEvent.add(that.params['node'], 'enableEditable', function(){
                that.enableEditing();
            });
            cm.customEvent.add(that.params['node'], 'disableEditable', function(){
                that.disableEditing();
            });
        }
        // Editing
        that.params['isEditing'] && that.enableEditing();
    };

    var renderChassis = function(){
        if(that.isEditing && !that.isRendered){
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
        var chassis = {
            'index' : i
        };
        // Structure
        chassis['container'] = cm.node('div', {'class' : 'com__columns__chassis'},
            chassis['inner'] = cm.node('div', {'class' : 'pt__drag is-horizontal'},
                cm.node('div', {'class' : 'line'})
            )
        );
        if(that.params['showDrag']){
            chassis['inner'].appendChild(
                cm.node('div', {'class' : 'drag'},
                    cm.node('div', {'class' : 'icon draggable'})
                )
            );
        }else{
            chassis['inner'].appendChild(
                cm.node('div', {'class' : 'helper'})
            );
        }
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
        that.params['node'].appendChild(chassis['container']);
    };

    var redrawChassisItem = function(chassis){
        var ratio = that.params['node'].offsetWidth / 100,
            i = chassis['index'],
            left = ((cm.getRealX(that.items[i]['container']) - cm.getRealX(that.params['node']) + that.items[i]['container'].offsetWidth) / ratio).toFixed(2);
        chassis['container'].style.left = [left, '%'].join('');
    };

    var redrawChassis = function(){
        cm.forEach(that.chassis, function(item){
            redrawChassisItem(item);
        });
    };

    var removeChassis = function(){
        cm.forEach(that.chassis, function(item){
            cm.remove(item['container']);
        });
        that.items = [];
        that.chassis = [];
        that.isRendered = false;
    };

    /* *** DRAG FUNCTIONS *** */

    var start = function(e, chassis){
        cm.preventDefault(e);
        if(e.button){
            return;
        }
        if(that.current){
            return;
        }
        that.pointerType = e.type;
        // Abort ajax handler
        if(that.isProcess){
            that.abort();
        }
        // Hide IFRAMES and EMBED tags
        cm.hideSpecialTags();
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
        cm.addClass(that.current['chassis']['inner'], 'is-active');
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
        that.triggerEvent('onDragStart', that.current);
        return true;
    };

    var move = function(e){
        cm.preventDefault(e);
        // Calculate sizes and positions
        var position = cm.getEventClientPosition(e),
            leftWidth = position['left'] - that.current['left']['offset'],
            rightWidth = that.current['right']['offset'] - position['left'];
        // Apply sizes and positions
        if(leftWidth > that.params['minColumnWidth'] && rightWidth > that.params['minColumnWidth']){
            that.current['left']['column']['width'] = [(leftWidth / that.current['ratio']).toFixed(2), '%'].join('');
            that.current['right']['column']['width'] = [(rightWidth / that.current['ratio']).toFixed(2), '%'].join('');

            that.current['left']['column']['container'].style.width = that.current['left']['column']['width'];
            that.current['right']['column']['container'].style.width = that.current['right']['column']['width'];
            that.current['chassis']['container'].style.left = [((position['left'] - that.current['offset']) / that.current['ratio']).toFixed(2), '%'].join('');
        }
        // API onResize event
        that.triggerEvent('onChange', that.items);
        that.triggerEvent('onDragMove', that.current);
    };

    var stop = function(){
        var config;
        // Remove move event from document
        cm.removeClass(that.params['node'], 'is-chassis-active');
        cm.removeClass(that.current['chassis']['inner'], 'is-active');
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
        // Show IFRAMES and EMBED tags
        cm.showSpecialTags();
        // API onResize event
        that.triggerEvent('onResize', that.items);
        that.triggerEvent('onDragStop', that.current);
        that.current = null;
        // Ajax
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

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            renderChassis();
            that.triggerEvent('onEnableEditing');
            that.triggerEvent('onEnableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            removeChassis();
            that.triggerEvent('onDisableEditing');
            that.triggerEvent('onDisableEditable');
        }
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.redraw = function(){
        if(that.isEditing){
            redrawChassis();
        }
        return that;
    };

    init();
});