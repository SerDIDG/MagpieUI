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
        'onResize'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'Com.Draggable' : {
            'direction' : 'vertical',
            'minY' : 24
        }
    }
},
function(params){
    var that = this;

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
        that.redraw();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
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
    };

    var setLogic = function(){
        that.components['draggable'] = new Com.Draggable(
            cm.merge(that.params['Com.Draggable'], {
                'node': that.nodes['dragContainer'],
                'target' : that.params['node'],
                'events' : {
                    'onStart' : start,
                    'onSet' : function(my, data){
                        that.value = data['posY'];
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
        that.value = height;
        that.nodes['dragContainer'].style.top = [that.params['node'].offsetHeight, 'px'].join('');
        that.params['node'].style.height = [that.value, 'px'].join('');
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
        that.nodes['rulerCounter'].innerHTML = [that.value, ' px'].join('');;
    };

    /* ******* MAIN ******* */

    that.redraw = function(){
        set(that.params['node'].offsetHeight, false);
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