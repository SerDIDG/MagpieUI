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
        'onChange'
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
        // Structure
        that.nodes['chassis'] = cm.Node('div', {'class' : 'com__spacer__chassis'},
            that.nodes['drag'] = cm.Node('div', {'class' : 'pt__drag is-vertical'},
                cm.Node('div', {'class' : 'line'}),
                cm.Node('div', {'class' : 'drag'},
                    cm.Node('div', {'class' : 'icon draggable'})
                )
            )
        );
        // Embed
        that.params['node'].appendChild(that.nodes['chassis']);
    };

    var setLogic = function(){
        that.components['draggable'] = new Com.Draggable(
            cm.merge(that.params['Com.Draggable'], {
                'node': that.nodes['chassis'],
                'target' : that.params['node'],
                'events' : {
                    'onStart' : start,
                    'onSet' : function(my, data){
                        set(data['posY'], true);
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
    };

    var set = function(height, triggerEvents){
        that.params['node'].style.height = [height, 'px'].join('');
        if(triggerEvents){
            that.triggerEvent('onChange', {
                'height' : height
            });
        }
    };

    var stop = function(){
        cm.removeClass(document.body, 'pt__drag__body--vertical');
        cm.removeClass(that.params['node'], 'is-active');
        cm.removeClass(that.nodes['drag'], 'is-active');
    };

    /* ******* MAIN ******* */

    that.redraw = function(){
        that.nodes['chassis'].style.top = [that.params['node'].offsetHeight, 'px'].join('');
        return that;
    };

    that.set = function(height, triggerEvents){
        triggerEvents = typeof triggerEvents != 'undefined'? triggerEvents : true;
        if(!isNaN(height)){
            set(height, triggerEvents);
            that.redraw();
        }
        return that;
    };

    init();
});