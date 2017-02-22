cm.define('Com.AbstractFormField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onRenderContent',
        'onRenderContentStart',
        'onRenderContentProcess',
        'onRenderContentEnd'
    ],
    'params' : {
        'renderStructure' : true,
        'embedStructureOnRender' : true,
        'controllerEvents' : true,
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

    classProto.onDestruct = function(){
        var that = this;
        that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
    };

    classProto.onValidateParams = function(){
        var that = this;
        that.params['constructorParams']['name'] = that.params['name'];
        that.params['constructorParams']['options'] = that.params['options'];
        that.params['constructorParams']['value'] = that.params['dataValue'] || that.params['value'];
        that.params['constructorParams']['maxlength'] = that.params['maxlength'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.components['form'] = that.params['form'];
    };

    /******* VIEW - MODEL *******/

    classProto.renderView = function(){
        var that = this;
        that.triggerEvent('onRenderViewStart');
        that.nodes['container'] = cm.node('dl', {'class' : 'pt__field'},
            that.nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            that.nodes['value'] = cm.node('dd', that.params['node'])
        );
        // Render custom structure
        if(that.params['renderStructureContent']){
            that.nodes['contentContainer'] = that.renderContent();
            cm.appendChild(that.nodes['contentContainer'], that.nodes['value']);
        }
        that.triggerEvent('onRenderViewProcess');
        that.triggerEvent('onRenderViewEnd');
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.triggerEvent('onRenderContentStart');
        nodes['container'] = cm.node('div', {'class' : 'input__content'},
            nodes['input'] = that.params['node']
        );
        that.triggerEvent('onRenderContent');
        that.triggerEvent('onRenderContentProcess');
        that.triggerEvent('onRenderContentEnd');
        // Export
        that.nodes['content'] = nodes;
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
            that.nodes['content']['input'].setAttribute('value', that.params['value']);
        }
        if(!cm.isEmpty(that.params['dataValue'])){
            that.nodes['content']['input'].setAttribute('data-value', JSON.stringify(that.params['dataValue']));
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.nodes['content']['input'].setAttribute('placeholder', that.params['placeholder']);
        }
        if(!cm.isEmpty(that.params['maxlength'])){
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
                    'node' : that.nodes['content']['input']
                })
            );
        });
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
        that.nodes['errors'] = cm.node('ul', {'class' : 'pt__field__hint'},
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
});