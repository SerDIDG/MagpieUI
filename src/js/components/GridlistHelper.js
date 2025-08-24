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
        'onColumnsChange',
        'onColumnsResize',
        'onEnableEditing',
        'onEnableEditable',
        'onDisableEditing',
        'onDisableEditable',
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'isEditing' : true,
        'customEvents' : true,
        'columns' : {
            'isEditing' : false,
            'customEvents' : false,
            'showDrag' : false,
            'ajax' : {
                'type' : 'json',
                'method' : 'post',
                'url' : '',                                             // Request URL. Variables: %items%, %callback% for JSONP.
                'params' : ''                                           // Params object. %items%, %callback% for JSONP.
            }
        }
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
    that.isEditing = null;

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
    };

    var render = function(){
        // Get Nodes
        that.nodes['thead'] = that.nodes['container'].getElementsByTagName('thead')[0] || that.nodes['thead'];
        that.nodes['items'] = that.nodes['thead'].getElementsByTagName('th');
        // Init Columns
        cm.getConstructor('Com.ColumnsHelper', function(classConstructor){
            that.components['columns'] = new classConstructor(
                cm.merge(that.params['columns'], {
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
                            that.triggerEvent('onColumnsChange', items);
                        },
                        'onResize' : function(my, items){
                            that.triggerEvent('onColumnsResize', items);
                        }
                    }
                })
            );
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

    /* ******* PUBLIC ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.components['columns'] && that.components['columns'].enableEditing();
            that.triggerEvent('onEnableEditing');
            that.triggerEvent('onEnableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.components['columns'] && that.components['columns'].disableEditing();
            that.triggerEvent('onDisableEditing');
            that.triggerEvent('onDisableEditable');
        }
        return that;
    };

    that.redraw = function(){
        that.components['columns'] && that.components['columns'].redraw();
        return that;
    };

    init();
});
