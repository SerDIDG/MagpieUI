cm.define('Com.AbstractFormField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onChange',
        'onSelect',
        'onReset'
    ],
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'controllerEvents' : true,
        'renderStructureField' : true,
        'renderStructureContent' : true,
        'form' : false,
        'value' : null,
        'dataValue' : null,
        'maxlength' : 0,
        'type' : false,
        'label' : '',
        'help' : null,
        'placeholder' : '',
        'visible' : true,
        'options' : [],
        'constructor' : false,
        'constructorParams' : {
            'formData' : true
        },
        'Com.HelpBubble' : {
            'renderStructure' : true
        }
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFormField', function(classConstructor, className, classProto){
    var _inherit = classProto._inherit;

    /******* SYSTEM *******/

    classProto.onConstructStart = function(){
        var that = this;
        that.nodeTagName = null;
    };

    classProto.onDestruct = function(){
        var that = this;
        that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
        that.params['constructorParams']['name'] = that.params['name'];
        that.params['constructorParams']['options'] = !cm.isEmpty(that.params['options']) ? that.params['options'] : that.params['constructorParams']['options'];
        that.params['constructorParams']['value'] = !cm.isEmpty(that.params['dataValue']) ? that.params['dataValue'] : that.params['value'];
        that.params['constructorParams']['defaultValue'] = that.params['defaultValue'];
        that.params['constructorParams']['maxlength'] = that.params['maxlength'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.components['form'] = that.params['form'];
        that.nodeTagName = that.params['node'].tagName.toLowerCase();
    };

    /******* VIEW - MODEL *******/

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        // Render field structure
        if(that.params['renderStructureField']){
            that.renderFiled();
        }
        // Render custom structure
        if(that.params['renderStructureContent']){
            that.nodes['contentContainer'] = that.renderContent();
        }
        // Embed
        if(that.params['renderStructureField']){
            cm.appendChild(that.nodes['contentContainer'], that.nodes['value']);
        }else{
            that.nodes['container'] = that.nodes['contentContainer'];
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderFiled = function(){
        var that = this;
        that.nodes['container'] = cm.node('dl', {'class' : 'pt__field'},
            that.nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            that.nodes['value'] = cm.node('dd')
        );
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__field__content'},
            nodes['input'] = that.params['node']
        );
        // Options
        if(!cm.isEmpty(that.params['options'])){
            switch(that.nodeTagName){
                case 'select' :
                    cm.forEach(that.params['options'], function(item){
                        cm.appendChild(
                            cm.node('option', {'value' : item['value'], 'innerHTML' : item['text']}),
                            nodes['input']
                        );
                    });
                    break;
            }
        }
        // Export
        return nodes['container'];
    };

    classProto.setAttributes = function(){
        var that = this;
        // Call parent method
        _inherit.prototype.setAttributes.apply(that, arguments);
        // Attributes
        if(!cm.isEmpty(that.params['name'])){
            that.nodes['content']['input'].setAttribute('name', that.params['name']);
        }
        if(!cm.isEmpty(that.params['value'])){
            switch(that.nodeTagName){
                case 'select' :
                    cm.setSelect(that.nodes['content']['input'], that.params['value']);
                    break;
                default :
                    that.nodes['content']['input'].setAttribute('value', that.params['value']);
                    break;
            }
        }
        if(!cm.isEmpty(that.params['dataValue'])){
            that.nodes['content']['input'].setAttribute('data-value', JSON.stringify(that.params['dataValue']));
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.nodes['content']['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        if(!cm.isEmpty(that.params['maxlength']) && that.params['maxlength'] > 0){
            that.nodes['content']['input'].setAttribute('maxlength', that.params['maxlength']);
        }
        // Classes
        if(!that.params['visible']){
            cm.addClass(that.nodes['container'], 'is-hidden');
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        _inherit.prototype.renderViewModel.apply(that, arguments);
        // Help Bubble
        if(!cm.isEmpty(that.params['help'])){
            cm.getConstructor('Com.HelpBubble', function(classConstructor){
                that.components['help'] = new classConstructor(
                    cm.merge(that.params['Com.HelpBubble'], {
                        'container' : that.nodes['label']
                    })
                );
            });
        }
        // Controller component
        if(that.params['constructor']){
            that.renderController();
        }
        return that;
    };

    classProto.renderController = function(){
        var that = this;
        cm.getConstructor(that.params['constructor'], function(classObject){
            that.components['controller'] = new classObject(
                cm.merge(that.params['constructorParams'], {
                    'node' : that.nodes['content']['input'],
                    'form' : that.components['form'],
                    'formField' : that
                })
            );
            that.renderControllerEvents();
        });
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onSelect', function(controller, data){
            that.triggerEvent('onSelect', data);
        });
        that.components['controller'].addEvent('onChange', function(controller, data){
            that.triggerEvent('onChange', data);
        });
        that.components['controller'].addEvent('onReset', function(controller, data){
            that.triggerEvent('onReset', data);
        });
        return that;
    };

    /******* DATA *******/

    classProto.set = function(value){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].set) && that.components['controller'].set(value);
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].get) ? that.components['controller'].get() : null;
    };

    classProto.getRaw = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].getRaw) ? that.components['controller'].getRaw() : that.get();
    };

    classProto.reset = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].reset) && that.components['controller'].reset();
        return that;
    };

    classProto.enable = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].enable) ? that.components['controller'].enable() : null;
    };

    classProto.disable = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].disable) ? that.components['controller'].disable() : null;
    };

    /******* MESSAGES *******/

    classProto.renderError = function(message){
        var that = this;
        that.clearError();
        cm.addClass(that.nodes['container'], 'error');
        that.nodes['errors'] = cm.node('ul', {'class' : 'pt__field__error pt__field__hint'},
            cm.node('li', {'class' : 'error'}, message)
        );
        cm.appendChild(that.nodes['errors'], that.nodes['value']);
        return that;
    };

    classProto.clearError = function(){
        var that = this;
        cm.removeClass(that.nodes['container'], 'error');
        cm.remove(that.nodes['errors']);
        return that;
    };

    /******* OTHER *******/

    classProto.getName = function(){
        var that = this;
        return that.params['name'];
    };

    classProto.getContainer = function(){
        var that = this;
        return that.nodes['container'];
    };
});