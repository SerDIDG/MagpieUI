cm.define('Com.AbstractFormField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onChange',
        'onSelect',
        'onReset',
        'onRequestStart',
        'onRequestEnd',
        'onRequestSuccess',
        'onRequestError',
        'onRequestAbort'
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
        'icon' : false,
        'placeholder' : '',
        'visible' : true,
        'options' : [],
        'constraints' : [
            /* cm.constraintsPattern(/^\s*$/g, false, message), */
            /* cm.constraintsPattern(10, false, message) */
        ],
        'required' : false,
        'constructor' : false,
        'constructorParams' : {
            'formData' : true
        },
        'preload' : false,
        'responseKey' : 'data',
        'ajax' : {
            'type' : 'json',
            'method' : 'get'
        },
        'Com.HelpBubble' : {
            'renderStructure' : true
        }
    },
    'strings' : {
        'required' : 'This field is required.',
        '*' : '*'
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
        that.isAjax = false;
        that.isProcess = false;
        that.isPreloaded = false;
        that.nodeTagName = null;
    };

    classProto.onConstructEnd = function(){
        var that = this;
        if(that.isAjax){
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        }
    };

    classProto.onDestruct = function(){
        var that = this;
        if(that.isAjax){
            that.ajaxHandler.abort();
        }
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
        that.params['constructorParams']['placeholder'] = that.params['placeholder'];
        that.params['constructorParams']['ajax'] = that.params['ajax'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.components['form'] = that.params['form'];
        that.nodeTagName = that.params['node'].tagName.toLowerCase();
        if(that.params['preload'] && !cm.isEmpty(that.params['ajax']) && !cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
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
            that.nodes['label'] = cm.node('dt'),
            that.nodes['value'] = cm.node('dd')
        );
        // Label
        if(!cm.isEmpty(that.params['label'])){
            that.nodes['labelText'] = cm.node('label', that.params['label']);
            cm.appendChild(that.nodes['labelText'], that.nodes['label']);
        }
        // Required
        if(that.params['required']){
            that.nodes['required'] = cm.node('span', {'class' : 'required'}, that.lang('*'));
            cm.appendChild(that.nodes['required'], that.nodes['label']);
        }
    };

    classProto.renderContent = function(){
        var that = this,
            nodes = {};
        that.nodes['content'] = nodes;
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'pt__field__content'},
            nodes['input'] = that.params['node']
        );
        // Icon
        if(that.params['icon']){
            nodes['field'] = cm.node('div', {'class' : 'pt__input'},
                nodes['input'],
                cm.node('div', {'class' : that.params['icon']})
            );
            cm.appendChild(nodes['field'], nodes['container']);
        }
        // Options
        if(!cm.isEmpty(that.params['options'])){
            that.renderOptions(that.params['options']);
        }
        // Export
        return nodes['container'];
    };

    classProto.renderOptions = function(options){
        var that = this,
            option;
        switch(that.nodeTagName){
            case 'select' :
                cm.forEach(options, function(item){
                    option = cm.node('option', {'value' : item['value'], 'innerHTML' : item['text']});
                    cm.appendChild(option, that.nodes['content']['input']);
                });
                cm.setSelect(that.nodes['content']['input'], that.params['value']);
                break;
        }
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
        if(!that.isAjax || that.isPreloaded){
            that.renderController();
        }
        return that;
    };

    classProto.renderController = function(){
        var that = this;
        if(that.params['constructor']){
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
        }
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

    classProto.focus = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].focus) ? that.components['controller'].focus() : null;
    };

    classProto.validateValue = function(){
        var that = this,
            isValid = true,
            value = that.get();
        if(that.params['required']){
            if(that.components['controller'] && cm.isFunction(that.components['controller'].validate)){
                isValid = that.components['controller'].validate();
            }else{
                isValid = !cm.isEmpty(value);
            }
        }
        /*
        var test;
        if(!cm.isEmpty(that.params['constraints'])){
            if(that.components['controller'] && cm.isFunction(that.components['controller'].validate)){
                isValid = that.components['controller'].validate(that.params['constraints']);
            }else{
                cm.forEach(that.params['constraints'], function(item){
                    test = item(value);
                    if(!test){
                        isValid = false;
                    }
                });
            }
        }
        */
        return isValid;
    };

    classProto.validate = function(){
        var that = this,
            message = that.lang('required'),
            isValid = that.validateValue();
        if(isValid){
            that.clearError();
        }else{
            that.renderError(message);
        }
        return isValid;
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

    /******* CALLBACKS *******/

    classProto.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl
        });
        return config;
    };

    classProto.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that, config);
                },
                'onSuccess' : function(response){
                    that.callbacks.response(that, config, response);
                },
                'onError' : function(){
                    that.callbacks.error(that, config);
                },
                'onAbort' : function(){
                    that.callbacks.abort(that, config);
                },
                'onEnd' : function(response){
                    that.callbacks.end(that, config, response);
                }
            })
        );
    };

    classProto.callbacks.start = function(that, config){
        that.isProcess = true;
        that.triggerEvent('onRequestStart');
    };

    classProto.callbacks.end = function(that, config){
        that.isProcess = false;
        that.isPreloaded = true;
        that.renderController();
        that.triggerEvent('onRequestEnd');
    };

    classProto.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, that.callbacks.convert(that, response));
        }else{
            that.callbacks.error(that, config);
        }
    };

    /*** DATA ***/

    classProto.callbacks.filter = function(that, config, response){
        var data = [],
            dataItem = cm.objectPath(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
    };

    classProto.callbacks.convert = function(that, data){
        return data.map(function(item){
            return that.callbacks.convertItem(that, item);
        });
    };

    classProto.callbacks.convertItem = function(that, item){
        if(cm.isEmpty(item)){
            return null
        }else if(!cm.isObject(item)){
            return {'text' : item, 'value' : item};
        }else{
            if(cm.isUndefined(item['value'])){
                item['value'] = item['text']
            }
            return item;
        }
    };

    /*** EVENTS ***/

    classProto.callbacks.success = function(that, response){
        that.renderOptions(response);
        that.triggerEvent('onRequestSuccess', response);
    };

    classProto.callbacks.error = function(that, config){
        that.triggerEvent('onRequestError');
    };

    classProto.callbacks.abort = function(that, config){
        that.triggerEvent('onRequestAbort');
    };
});