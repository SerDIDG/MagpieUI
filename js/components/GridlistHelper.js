cm.define('Com.GridlistHelper', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onChange',
        'onResize'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'isEditMode' : true,
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'url' : '',                                             // Request URL. Variables: %items%, %callback% for JSONP.
            'params' : ''                                           // Params object. %items%, %callback% for JSONP.
        },
        'Com.ColumnsHelper' : {}
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'thead' : cm.node('thead'),
        'items' : []
    };
    that.components = {};
    that.isEditMode = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.nodes['container'] = that.params['node'];
        that.isEditMode = that.params['isEditMode'];
        that.params['Com.ColumnsHelper']['ajax'] = that.params['ajax'];
    };

    var render = function(){
        // Get Nodes
        that.nodes['thead'] = that.nodes['container'].getElementsByTagName('thead')[0] || that.nodes['thead'];
        that.nodes['items'] = that.nodes['thead'].getElementsByTagName('th');
        // Init Columns
        cm.getConstructor('Com.ColumnsHelper', function(classConstructor){
            that.components['columns'] = new classConstructor(
                cm.merge(that.params['Com.ColumnsHelper'], {
                    'isEditMode' : false,
                    'node' : that.nodes['container'],
                    'items' : that.nodes['items'],
                    'events' : {
                        'onDragStart' : function(){
                            cm.addClass(that.nodes['container'], 'is-active');
                        },
                        'onDragStop' : function(){
                            cm.removeClass(that.nodes['container'], 'is-active');
                        },
                        'onChange' : function(my, items){
                            that.triggerEvent('onChange', items);
                        },
                        'onResize' : function(my, items){
                            that.triggerEvent('onResize', items);
                        }
                    }
                })
            );
        });
        // Edit mode
        if(that.isEditMode){
            that.enableEditMode();
        }
    };

    /* ******* PUBLIC ******* */

    that.enableEditMode = function(){
        that.isEditMode = true;
        cm.addClass(that.nodes['container'], 'is-editable');
        if(that.components['columns']){
            that.components['columns'].enableEditMode();
        }
        return that;
    };

    that.disableEditMode = function(){
        that.isEditMode = false;
        cm.removeClass(that.nodes['container'], 'is-editable');
        if(that.components['columns']){
            that.components['columns'].disableEditMode();
        }
        return that;
    };

    init();
});