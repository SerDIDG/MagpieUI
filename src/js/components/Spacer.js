cm.define('Com.Spacer', {
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
        'onChange',
        'onResize',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'height' : 0,
        'minHeight' : 0,
        'isEditing' : true,
        'customEvents' : true,
        'Com.Draggable' : {
            'direction' : 'vertical'
        }
    }
},
function(params){
    var that = this;

    that.isEditing = null;
    that.components = {};
    that.nodes = {};
    that.value = 0;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        setLogic();
        set(parseFloat(that.params['height']), false);
        that.params['isEditing'] && that.enableEditing();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.params['Com.Draggable']['minY'] = that.params['minHeight'];
    };

    var render = function(){
        // Chassis Structure
        that.nodes['dragContainer'] = cm.Node('div', {'class' : 'com__spacer__chassis'},
            that.nodes['drag'] = cm.Node('div', {'class' : 'pt__drag is-vertical'},
                cm.Node('div', {'class' : 'line'}),
                cm.Node('div', {'class' : 'drag'},
                    cm.Node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Ruler Structure
        that.nodes['rulerContainer'] = cm.Node('div', {'class' : 'com__spacer__ruler'},
            that.nodes['ruler'] = cm.Node('div', {'class' : 'pt__ruler is-vertical is-small'},
                cm.Node('div', {'class' : 'line line-top'}),
                that.nodes['rulerCounter'] = cm.Node('div', {'class' : 'counter'}),
                cm.Node('div', {'class' : 'line line-bottom'})
            )
        );
        // Embed
        that.params['node'].appendChild(that.nodes['dragContainer']);
        that.params['node'].appendChild(that.nodes['rulerContainer']);
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
    };

    var setLogic = function(){
        that.components['draggable'] = new Com.Draggable(
            cm.merge(that.params['Com.Draggable'], {
                'node': that.nodes['dragContainer'],
                'events' : {
                    'onStart' : start,
                    'onSelect' : function(my, data){
                        that.value = data['top'];
                        move();
                    },
                    'onStop' : stop
                }
            })
        );
    };

    var start = function(){
        cm.addClass(document.body, 'pt__drag__body--vertical');
        cm.addClass(that.params['node'], 'is-active');
        cm.addClass(that.nodes['drag'], 'is-active');
        cm.addClass(that.nodes['ruler'], 'is-active');
    };

    var move = function(){
        that.params['node'].style.height = [that.value, 'px'].join('');
        setRulerCounter();
        that.triggerEvent('onChange', {
            'height' : that.value
        });
    };

    var stop = function(){
        cm.removeClass(document.body, 'pt__drag__body--vertical');
        cm.removeClass(that.params['node'], 'is-active');
        cm.removeClass(that.nodes['drag'], 'is-active');
        cm.removeClass(that.nodes['ruler'], 'is-active');
        that.triggerEvent('onResize', {
            'height' : that.value
        });
    };

    var set = function(height, triggerEvents){
        that.value = Math.max(height, that.params['minHeight']);
        setHeight();
        setRulerCounter();
        if(triggerEvents){
            that.triggerEvent('onChange', {
                'height' : that.value
            });
            that.triggerEvent('onResize', {
                'height' : that.value
            });
        }
    };

    var setRulerCounter = function(){
        that.nodes['rulerCounter'].innerHTML = [that.value, ' px'].join('');
    };

    var setHeight = function(){
        that.params['node'].style.height = [that.value, 'px'].join('');
        that.nodes['dragContainer'].style.top = [that.params['node'].offsetHeight, 'px'].join('');
    };

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.redraw();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.redraw = function(){
        setHeight();
        return that;
    };

    that.set = function(height, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(!isNaN(height)){
            set(height, triggerEvents);
        }
        return that;
    };

    that.get = function(){
        return that.value;
    };

    init();
});