cm.define('Com.AbstractFormField', {
    'extend' : 'Com.AbstractController',
    'events' : [
        'onShow',
        'onHide',
        'onFocus',
        'onBlur',
        'onValidate',
        'onChange',
        'onInput',
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
        'removeOnDestruct' : false,
        'controllerEvents' : true,
        'renderStructureField' : true,
        'renderStructureContent' : true,
        'renderError' : true,
        'form' : false,
        'rawValue' : false,
        'value' : null,
        'defaultValue' : null,
        'dataValue' : null,
        'isOptionValue' : false,
        'setHiddenValue' : true,
        'minLength' : 0,
        'maxLength' : 0,
        'min' : 0,
        'max' : 0,
        'type' : false,
        'label' : '',
        'help' : null,
        'helpType' : 'tooltip', // tooltip | container
        'icon' : false,
        'placeholder' : '',
        'showPlaceholderAbove' : false,
        'title' : '',
        'hint' : '',
        'visible' : true,
        'renderName' : false,
        'options' : [],
        'constraints' : [
            /* cm.constraintsPattern(/^\s*$/g, false, message), */
            /* cm.constraintsPattern(10, false, message) */
            /* cm.constraintsPattern(function, true, message) */
        ],
        'required' : false,
        'requiredAsterisk' : true,
        'constructor' : false,
        'constructorParams' : {
            'removeOnDestruct' : false,
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
        'too_short' : 'Value should be at least %count% characters.',
        'too_long' : 'Value should be less than %count% characters.',
        '*' : '*'
    }
},
function(params){
    var that = this;
    // Call parent class construct
    Com.AbstractController.apply(that, arguments);
});

cm.getConstructor('Com.AbstractFormField', function(classConstructor, className, classProto, classInherit){
    /******* SYSTEM *******/

    classProto.onConstructStart = function(){
        var that = this;
        // Variables
        that._name = null;
        that.isVisible = null;
        that.isAjax = false;
        that.isProcess = false;
        that.isPreloaded = false;
        that.isFocus = false;
        that.nodeTagName = null;
        // Bind context
        that.focusHandler = that.focus.bind(that);
        that.blurHandler = that.blur.bind(that);
        that.focusEventHandler = that.focusEvent.bind(that);
        that.blurEventHandler = that.blurEvent.bind(that);
        that.inputEventHandler = that.inputEvent.bind(that);
        that.selectEventHandler = that.selectEvent.bind(that);
        that.changeEventHandler = that.changeEvent.bind(that);
        that.resetEventHandler = that.resetEvent.bind(that);
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
        that.validateParamsValue();
        that._name = that.params['formName'] + '[' + that.params['name'] + ']';
        // Validate
        if(that.params['required'] && that.params['requiredAsterisk'] && !cm.isEmpty(that.params['placeholder'])){
            that.params['placeholder'] += ' *';
        }
        // Constructor params
        that.params['constructorParams']['id'] = that.params['id'];
        that.params['constructorParams']['name'] = that.params['name'];
        that.params['constructorParams']['visibleName'] = that.params['visibleName'];
        that.params['constructorParams']['renderName'] = that.params['renderName'];
        that.params['constructorParams']['options'] = !cm.isEmpty(that.params['options']) ? that.params['options'] : that.params['constructorParams']['options'];
        that.params['constructorParams']['value'] = !cm.isEmpty(that.params['dataValue']) ? that.params['dataValue'] : that.params['value'];
        that.params['constructorParams']['defaultValue'] = that.params['defaultValue'];
        that.params['constructorParams']['required'] = that.params['required'];
        that.params['constructorParams']['minLength'] = that.params['minLength'];
        that.params['constructorParams']['maxLength'] = that.params['maxLength'];
        that.params['constructorParams']['min'] = that.params['min'];
        that.params['constructorParams']['max'] = that.params['max'];
        that.params['constructorParams']['placeholder'] = !that.params['showPlaceholderAbove'] ? that.params['placeholder'] : '';
        that.params['constructorParams']['title'] = that.params['title'];
        that.params['constructorParams']['ajax'] = that.params['ajax'];
        // Components
        that.params['Com.HelpBubble']['title'] = that.params['label'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.params['Com.HelpBubble']['type'] = that.params['helpType'];
        that.components['form'] = that.params['form'];
        that.nodeTagName = that.params['node'].tagName.toLowerCase();
        // Ajax
        if(that.params['preload'] && !cm.isEmpty(that.params['ajax']) && !cm.isEmpty(that.params['ajax']['url'])){
            that.isAjax = true;
        }
    };

    classProto.validateParamsValue = function(){
        var that = this;
        that.params['value'] = that.validateParamsValueHelper(that.params['value']);
        that.params['defaultValue'] = that.validateParamsValueHelper(that.params['defaultValue']);
        that.params['value'] = !cm.isEmpty(that.params['value']) ? that.params['value'] : that.params['defaultValue'];
        that.params['dataValue'] = !cm.isEmpty(that.params['dataValue']) ? that.params['dataValue'] : that.params['isOptionValue'] ? that.params['value'] : null;
    };

    classProto.validateParamsValueHelper = function(value){
        var that = this;
        if(that.params['isValueOption'] && !cm.isEmpty(value)){
            if(cm.isObject(value)){
                value['value'] = !cm.isEmpty(value['value']) ? value['value'] : value['text'];
                value['text'] = !cm.isEmpty(value['text']) ? value['text'] : value['value'];
            }else{
                value = {
                    'value' : value,
                    'text' : value
                };
            }
        }
        return value;
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
            cm.insertFirst(that.nodes['contentContainer'], that.nodes['value']);
        }else if(that.params['renderStructureContent']){
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
            that.nodes['labelText'] = cm.node('label', {'for' : that._name}, that.params['label']);
            cm.appendChild(that.nodes['labelText'], that.nodes['label']);
        }
        // Required
        if(that.params['required'] && that.params['requiredAsterisk']){
            that.nodes['required'] = cm.node('span', {'class' : 'required'}, that.lang('*'));
            cm.appendChild(that.nodes['required'], that.nodes['label']);
        }
        // Hints
        if(!cm.isEmpty(that.params['hint'])){
            that.renderHint(that.params['hint']);
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
                nodes['icon'] = cm.node('div', {'class' : that.params['icon']})
            );
            cm.addEvent(nodes['icon'], 'click', that.focusHandler);
            cm.appendChild(nodes['field'], nodes['container']);
        }
        // Placeholder
        if(that.params['showPlaceholderAbove'] && !cm.isEmpty(that.params['placeholder'])){
            nodes['placeholder'] = cm.node('label', {'class' : 'placeholder', 'for' : that._name},
                cm.node('span', {'innerHTML' : that.params['placeholder']})
            );
            cm.appendChild(nodes['placeholder'], nodes['container']);
            cm.addClass(nodes['container'], 'is-placeholder-above');
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
        var that = this,
            value;
        // Call parent method
        classInherit.prototype.setAttributes.apply(that, arguments);
        // Attributes
        if(!cm.isEmpty(that._name)){
            that.nodes['content']['input'].setAttribute('id', that._name);
        }
        if(!cm.isEmpty(that.params['name'])){
            that.nodes['content']['input'].setAttribute('name', that.params['name']);
        }
        if(!cm.isEmpty(that.params['value']) && that.params['setHiddenValue']){
            if(that.params['isOptionValue']){
                value = that.params['value']['value'];
            }else{
                value = that.params['value'];
            }
            switch(that.nodeTagName){
                case 'select' :
                    cm.setSelect(that.nodes['content']['input'], value);
                    break;
                default :
                    that.nodes['content']['input'].setAttribute('value', value);
                    break;
            }
        }
        if(!cm.isEmpty(that.params['dataValue'])){
            that.nodes['content']['input'].setAttribute('data-value', JSON.stringify(that.params['dataValue']));
        }
        if(!cm.isEmpty(that.params['placeholder']) && !that.params['showPlaceholderAbove']){
            that.nodes['content']['input'].setAttribute('placeholder', that.params['placeholder']);
            if(cm.isEmpty(that.params['label']) && cm.isEmpty(that.params['title'])){
                that.nodes['content']['input'].setAttribute('aria-label', that.params['placeholder']);
            }
        }
        if(!cm.isEmpty(that.params['title'])){
            that.nodes['content']['input'].setAttribute('title', that.params['title']);
        }
        // Classes
        if(!that.params['visible']){
            that.hide(false);
        }else{
            that.show(false);
        }
    };

    classProto.renderViewModel = function(){
        var that = this;
        // Call parent method - renderViewModel
        classInherit.prototype.renderViewModel.apply(that, arguments);
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
                that.togglePlaceholder();
            });
        }
    };

    classProto.renderControllerEvents = function(){
        var that = this;
        that.components['controller'].addEvent('onFocus', that.focusEventHandler);
        that.components['controller'].addEvent('onBlur', that.blurEventHandler);
        that.components['controller'].addEvent('onSelect', that.selectEventHandler);
        that.components['controller'].addEvent('onInput', that.inputEventHandler);
        that.components['controller'].addEvent('onChange', that.changeEventHandler);
        that.components['controller'].addEvent('onReset', that.resetEventHandler);
        return that;
    };

    classProto.togglePlaceholder = function(){
        var that = this;
        if(that.params['showPlaceholderAbove']){
            if(that.isFocus || !cm.isEmpty(that.getText())){
                cm.addClass(that.nodes['content']['placeholder'], 'pull-top');
            }else{
                cm.removeClass(that.nodes['content']['placeholder'], 'pull-top');
            }
        }
    };

    /******* EVENTS *******/

    classProto.focusEvent = function(controller, data){
        var that = this;
        that.isFocus = true;
        that.togglePlaceholder();
        that.triggerEvent('onFocus', data);
    };

    classProto.blurEvent = function(controller, data){
        var that = this;
        that.isFocus = false;
        that.togglePlaceholder();
        that.triggerEvent('onBlur', data);
    };

    classProto.inputEvent = function(controller, data){
        var that = this;
        that.triggerEvent('onInput', data);
    };

    classProto.selectEvent = function(controller, data){
        var that = this;
        that.triggerEvent('onSelect', data);
    };

    classProto.changeEvent = function(controller, data){
        var that = this;
        that.togglePlaceholder();
        that.triggerEvent('onChange', data);
    };

    classProto.resetEvent = function(controller, data){
        var that = this;
        that.togglePlaceholder();
        that.triggerEvent('onReset', data);
    };

    /******* DATA *******/

    classProto.set = function(value, triggerEvents){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].set) && that.components['controller'].set(value, triggerEvents);
        return that;
    };

    classProto.get = function(){
        var that = this;
        if(that.params['rawValue']){
            return that.getRaw();
        }
        return that.components['controller'] && cm.isFunction(that.components['controller'].get) ? that.components['controller'].get() : null;
    };

    classProto.getRaw = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].getRaw) ? that.components['controller'].getRaw() : that.get();
    };

    classProto.getText = function(){
        var that = this;
        return that.components['controller'] && cm.isFunction(that.components['controller'].getText) ? that.components['controller'].getText() : that.get();
    };

    classProto.reset = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].reset) && that.components['controller'].reset();
        return that;
    };

    classProto.validateValue = function(){
        var that = this,
            constraintsData,
            data = {
                'field' : that,
                'form' : that.components['form'],
                'valid' : true,
                'message' : null,
                'value' : that.get()
            };
        if(cm.isEmpty(data['value'])){
            data['valid'] = false;
            data['message'] = that.lang('required');
            return data;
        }
        if(that.params['minLength'] && data['value'].length < that.params['minLength']){
            data['valid'] = false;
            data['message'] = that.lang('too_short', {
                '%count%' : that.params['minLength']
            });
            return data;
        }
        if(that.params['maxLength'] && data['value'].length > that.params['maxLength']){
            data['valid'] = false;
            data['message'] = that.lang('too_long', {
                '%count%' : that.params['maxLength']
            });
            return data;
        }
        if(!cm.isEmpty(that.params['constraints']) && (constraintsData = that.validateConstraints(data))){
            return constraintsData;
        }
        if(that.components['controller'] && cm.isFunction(that.components['controller'].validate)){
            return that.components['controller'].validate(data);
        }
        return data;
    };

    classProto.validateConstraints = function(data){
        var that = this,
            constraintsTest,
            constraintsData;
        constraintsTest = that.params['constraints'].some(function(item){
            if(cm.isFunction(item)){
                constraintsData = item(data);
                return !constraintsData['valid'];
            }
        });
        if(constraintsTest){
            return constraintsData;
        }
        return false;
    };

    classProto.validate = function(){
        var that = this,
            data;
        if(!that.params['required']){
            return true;
        }
        data = that.validateValue();
        if(data['valid']){
            that.clearError();
        }else{
            that.renderError(data['message']);
        }
        that.triggerEvent('onValidate', data);
        return data['valid'];
    };

    /******* MESSAGES *******/

    classProto.renderHint = function(message){
        var that = this;
        that.clearHint();
        that.nodes['hints'] = cm.node('ul', {'class' : 'pt__field__hint'},
            cm.node('li', {'innerHTML' : message})
        );
        if(that.params['renderError'] && that.nodes['errors']){
            cm.insertBefore(that.nodes['hints'], that.nodes['errors']);
        }else{
            cm.appendChild(that.nodes['hints'], that.nodes['value']);
        }
        return that;
    };

    classProto.clearHint = function(){
        var that = this;
        cm.remove(that.nodes['hints']);
        return that;
    };

    classProto.renderError = function(message){
        var that = this;
        that.clearError();
        if(that.params['renderError']){
            cm.addClass(that.nodes['container'], 'error');
            if(!cm.isEmpty(message)){
                that.nodes['errors'] = cm.node('ul', {'class' : 'pt__field__error pt__field__hint'},
                    cm.node('li', {'class' : 'error', 'innerHTML' : message})
                );
                cm.insertLast(that.nodes['errors'], that.nodes['value']);
            }
        }
        return that;
    };

    classProto.clearError = function(){
        var that = this;
        cm.removeClass(that.nodes['container'], 'error');
        cm.remove(that.nodes['errors']);
        return that;
    };

    /******* PUBLIC *******/

    classProto.show = function(triggerEvent){
        var that = this;
        triggerEvent = cm.isUndefined(triggerEvent) ? true : triggerEvent;
        if(!cm.isBoolean(that.isVisible) || !that.isVisible){
            that.isVisible = true;
            cm.removeClass(that.nodes['container'], 'is-hidden');
            triggerEvent && that.triggerEvent('onShow', that.get());
        }
        return that;
    };

    classProto.hide = function(triggerEvent){
        var that = this;
        triggerEvent = cm.isUndefined(triggerEvent) ? true : triggerEvent;
        if(!cm.isBoolean(that.isVisible) || that.isVisible){
            that.isVisible = false;
            cm.addClass(that.nodes['container'], 'is-hidden');
            triggerEvent && that.triggerEvent('onHide', that.get());
        }
        return that;
    };

    classProto.enable = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].enable) && that.components['controller'].enable();
        return that;
    };

    classProto.disable = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].disable) && that.components['controller'].disable();
        return that;
    };

    classProto.focus = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].focus) && that.components['controller'].focus();
        return that;
    };

    classProto.blur = function(){
        var that = this;
        that.components['controller'] && cm.isFunction(that.components['controller'].blur) && that.components['controller'].blur();
        return that;
    };

    classProto.setRequired = function(){
        var that = this;
        that.params['required'] = true;
        return that;
    };

    classProto.unsetRequired = function(){
        var that = this;
        that.params['required'] = false;
        return that;
    };

    classProto.getController = function(){
        var that = this;
        return that.components['controller'];
    };

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