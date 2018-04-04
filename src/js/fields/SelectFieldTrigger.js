cm.define('Com.SelectFieldTrigger', {
    'extend' : 'Com.AbstractController',
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'controllerEvents' : true,
        'triggerName' : null,
        'triggerFieldSize' : null,
        'options' : [],
        'Com.Toolbar' : {
            'embedStructure' : 'append'
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.SelectFieldTrigger', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    /******* SYSTEM *******/

    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that.fields = {};
        // Bind context
        that.changeEventHandler = that.changeEvent.bind(that);
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.components['form'] = that.params['form'];
        that.components['formField'] = that.params['formField'];
    };

    classProto.onRender = function(){
        var that = this;
        that.toggle();
    };

    /******* VIEW MODEL *******/

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('div', {'class' : 'app__select-trigger'});
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
        return that;
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Collect Fields
        that.getTriggerField();
        that.getFields();
        // Render Toolbar
        that.renderToolbar();
    };

    classProto.getTriggerField = function(){
        var that = this;
        var field = that.components['form'].getField(that.params['triggerName']);
        if(field){
            that.components['trigger'] = field['controller'];
            that.components['trigger'].addEvent('onChange', that.changeEventHandler);
        }
    };

    classProto.getFields = function(){
        var that = this;
        cm.forEach(that.params['options'], function(option){
            cm.forEach(option['fields'], function(field){
                if(cm.isObject(field)){
                    that.processField(option['value'], field);
                }else{
                    that.processField(option['value'], {'name' : field});
                }
            });
        });
    };

    classProto.processField = function(value, data){
        var that = this;
        data = cm.merge({
            'value' : value,
            'name' : null,
            'size' : null,
            'field' : null,
            'controller' : null,
            'container' : null
        }, data);
        // Controller
        data['field'] = that.components['form'].getField(data['name']);
        if(data['field']){
            data['controller'] = data['field']['controller'];
            data['container'] = data['controller'].getContainer();
        }
        // Export
        that.fields[data['name']] = data;
    };

    classProto.renderToolbar = function(){
        var that = this;
        // Toolbar
        cm.getConstructor('Com.Toolbar', function(classConstructor, className){
            that.components['toolbar'] = new classConstructor(
                cm.merge(that.params[className], {
                    'container' : that.nodes['container']
                })
            );
            that.components['toolbar']
                .addGroup({
                    'name' : 'trigger',
                    'position' : 'left'
                })
                .addGroup({
                    'name' : 'fields',
                    'position' : 'left'
                })
                .addField({
                    'group' : 'trigger',
                    'name' : 'trigger',
                    'node' : that.components['trigger'].getContainer(),
                    'size' : that.params['triggerFieldSize']
                })
        });
        // Fields
        cm.forEach(that.fields, function(field, name){
            that.components['toolbar'].addField({
                'group' : 'fields',
                'name' : field['name'],
                'node' : field['container'],
                'size' : field['size'],
                'hidden' : true
            });
        })
    };

    /******* HANDLERS *******/

    classProto.changeEvent = function(){
        var that = this;
        that.toggle();
    };

    classProto.toggle = function(){
        var that = this;
        var value = that.components['trigger'].get();
        cm.forEach(that.fields, function(field, name){
            if(field['value'] == value){
                that.components['toolbar'].showField(field['name'], 'fields');
            }else{
                that.components['toolbar'].hideField(field['name'], 'fields');
            }
        });
    };
});

/* ****** FORM FIELD COMPONENT ******* */

Com.FormFields.add('select-field-trigger', {
    'field' : false,
    'fieldConstructor' : 'Com.AbstractFormField',
    'constructor' : 'Com.SelectFieldTrigger'
});