cm.define('Com.Form', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Storage',
        'Callbacks',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'renderStructure' : true,
        'embedStructure' : 'append',
        'renderButtons' : true,
        'renderButtonsSeparator' : true,
        'buttonsAlign' : 'right',
        'showLoader' : true,
        'loaderCoverage' : 'fields',                                // fields, all
        'loaderDelay' : 'cm._config.loadDelay',
        'showNotifications' : true,
        'responseErrorsKey': 'errors',
        'data' : {},
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'formData' : true,
            'url' : '',                                             // Request URL. Variables: %baseUrl%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseUrl%, %callback% for JSONP.
        },
        'Com.Notifications' : {},
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        },
        'langs' : {
            'server_error' : 'An unexpected error has occurred. Please try again later.'
        }
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.components = {};
    that.fields = {};
    that.buttons = {};
    that.ajaxHandler = null;
    that.loaderDelay = null;

    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['buttonsAlign'] = cm.inArray(['left', 'center', 'right', 'justify'], that.params['buttonsAlign']) ? that.params['buttonsAlign'] : 'right';
        that.params['loaderCoverage'] = cm.inArray(['fields', 'all'], that.params['loaderCoverage']) ? that.params['loaderCoverage'] : 'all';
    };

    var render = function(){
        var overlayContainer;
        // Structure
        if(that.params['renderStructure']){
            that.nodes['container'] = cm.node('div', {'class' : 'com__form'},
                that.nodes['fieldsContainer'] = cm.node('div', {'class' : 'com__form__fields'},
                    that.nodes['fields'] = cm.node('div', {'class' : 'inner'})
                )
            );
            // Notifications
            that.nodes['notifications'] = cm.node('div', {'class' : 'com__form__notifications'});
            // Buttons
            that.nodes['buttonsSeparator'] = cm.node('hr');
            that.nodes['buttonsContainer'] = cm.node('div', {'class' : 'com__form__buttons'},
                that.nodes['buttons'] = cm.node('div', {'class' : 'btn-wrap'})
            );
            cm.addClass(that.nodes['buttons'], ['pull', that.params['buttonsAlign']].join('-'));
            // Embed
            that.params['renderButtonsSeparator'] && cm.insertFirst(that.nodes['buttonsSeparator'], that.nodes['buttonsContainer']);
            that.params['renderButtons'] && cm.appendChild(that.nodes['buttonsContainer'], that.nodes['container']);
            that.params['showNotifications'] && cm.insertFirst(that.nodes['notifications'], that.nodes['container']);
            that.embedStructure(that.nodes['container']);
        }
        // Notifications
        if(that.params['showNotifications']){
            cm.getConstructor('Com.Notifications', function(classConstructor, className){
                that.components['notifications'] = new classConstructor(
                    cm.merge(that.params[className], {
                        'container' : that.nodes['notifications']
                    })
                );
                that.components['notifications'].addEvent('onAdd', function(my){
                    cm.addClass(that.nodes['notifications'], 'is-show', true);
                });
                that.components['notifications'].addEvent('onRemove', function(my){
                    if(that.components['notifications'].getLength() === 0){
                        cm.removeClass(that.nodes['notifications'], 'is-show', true);
                    }
                });
            });
        }
        // Overlay Loader
        if(that.params['showLoader']){
            cm.getConstructor('Com.Overlay', function(classConstructor, className){
                switch(that.params['loaderCoverage']){
                    case 'fields':
                        overlayContainer = that.nodes['fieldsContainer'];
                        break;
                    case 'all':
                    default:
                        overlayContainer = that.nodes['container'];
                        break;
                }
                that.components['loader'] = new classConstructor(
                    cm.merge(that.params[className], {
                        'container' : overlayContainer
                    })
                );
            });
        }
    };

    var renderField = function(type, params){
        var field, controller;
        // Merge params
        params = cm.merge({
            'name' : '',
            'label' : '',
            'options' : [],
            'container' : that.nodes['fields'],
            'form' : that
        }, params);
        field = Com.FormFields.get(type);
        params = cm.merge(cm.clone(field, true), params);
        // Get value
        params['value'] = that.params['data'][params['name']] || params['value'];
        params['dataValue'] = that.params['data'][params['dataName']] || params['dataValue'];
        // Render
        if(field && !that.fields[params['name']]){
            cm.getConstructor('Com.FormField', function(classConstructor){
                controller = new classConstructor(params);
                if(params['field']){
                    that.fields[params['name']] = controller;
                }
            });
        }
    };

    var renderButton = function(params){
        params = cm.merge({
            'name' : '',
            'label' : '',
            'class' : '',
            'action' : 'submit',          // submit | reset | clear | custom
            'handler' : function(){}
        }, params);
        // Render
        if(!that.buttons[params['name']]){
            params['node'] = cm.node('button', {'name' : params['name']}, params['label']);
            switch(params['action']){
                case 'submit':
                    params['node'].type = 'submit';
                    cm.addClass(params['node'], 'button-primary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(that.isProcess){
                            that.abort();
                        }else{
                            that.send();
                        }
                    });
                    break;

                case 'reset':
                    params['node'].type = 'reset';
                    cm.addClass(params['node'], 'button-secondary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(!that.isProcess){
                            that.reset();
                        }
                    });
                    break;

                case 'clear':
                    cm.addClass(params['node'], 'button-secondary');
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        if(!that.isProcess){
                            that.clear();
                        }
                    });
                    break;

                case 'custom':
                default:
                    cm.addClass(params['node'], params['class']);
                    cm.addEvent(params['node'], 'click', function(e){
                        cm.preventDefault(e);
                        cm.isFunction(params['handler']) && params['handler'](that, params, e);
                    });
                    break;
            }
            cm.appendChild(params['node'], that.nodes['buttons']);
        }
    };

    var renderSeparator = function(){
        var node = cm.node('hr');
        cm.appendChild(node, that.nodes['fields']);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl
        });
        // Get Params
        config['params'] = cm.merge(config['params'], that.getAll());
        return config;
    };

    that.callbacks.request = function(that, config){
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
                'onEnd' : function(){
                    that.callbacks.end(that, config);
                }
            })
        );
    };

    that.callbacks.start = function(that, config){
        that.isProcess = true;
        // Show Loader
        if(that.params['showLoader']){
            that.loaderDelay = setTimeout(function(){
                if(that.components['loader'] && !that.components['loader'].isOpen){
                    that.components['loader'].open();
                }
            }, that.params['loaderDelay']);
        }
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config){
        that.isProcess = false;
        // Hide Loader
        if(that.params['showLoader']){
            that.loaderDelay && clearTimeout(that.loaderDelay);
            if(that.components['loader'] && that.components['loader'].isOpen){
                that.components['loader'].close();
            }
        }
        that.triggerEvent('onSendEnd');
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            var errors = cm.objectSelector(that.params['responseErrorsKey'], response);
            if(!cm.isEmpty(errors)){
                that.callbacks.error(that, config, errors);
            }else{
                that.callbacks.success(that, response);
            }
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config, message){
        that.callbacks.renderError(that, config, message);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderError = function(that, config, errors){
        var field;
        // Clear old errors messages
        if(that.params['showNotifications']){
            cm.removeClass(that.nodes['notifications'], 'is-show', true);
            that.components['notifications'].clear();
        }
        cm.forEach(that.fields, function(field){
            field.clearError();
        });
        // Render new errors messages
        if(cm.isArray(errors)){
            cm.forEach(errors, function(item){
                if(that.params['showNotifications']){
                    cm.addClass(that.nodes['notifications'], 'is-show', true);
                    that.components['notifications'].add({
                        'label' : that.lang(item['message']),
                        'type' : 'danger'
                    });
                }
                if(field = that.getField(item['field'])){
                    field.renderError(item['message']);
                }
            });
        }else{
            if(that.params['showNotifications']){
                cm.addClass(that.nodes['notifications'], 'is-show', true);
                that.components['notifications'].add({
                    'label' : that.lang('server_error'),
                    'type' : 'danger'
                });
            }
        }
    };

    /* ******* PUBLIC ******* */

    that.destruct = function(){
        if(!that._isDestructed){
            that._isDestructed = true;
            cm.forEach(that.fields, function(field){
                field.destruct();
            });
            that.removeFromStack();
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.add = function(type, params){
        renderField(type, params);
        return that;
    };

    that.addButton = function(o){
        renderButton(o);
        return that;
    };

    that.addButtons = function(o){
        if(cm.isArray(o)){
            cm.forEach(o, function(item){
                renderButton(item);
            });
        }
        return that;
    };

    that.addSeparator = function(){
        renderSeparator();
        return that;
    };

    that.appendChild = function(node){
        cm.appendChild(node, that.nodes['fields']);
        return that;
    };

    that.getField = function(name){
        return that.fields[name];
    };

    that.get = that.getAll = function(){
        var o = {},
            value;
        cm.forEach(that.fields, function(field, name){
            value = field.get();
            if(value !== null){
                o[name] = value;
            }
        });
        return o;
    };

    that.set = function(data){
        cm.forEach(data, function(value, name){
            if(that.fields[name]){
                that.fields[name].set(value);
            }
        });
        return that;
    };

    that.getButtonsContainer = function(){
        return that.nodes['buttonsContainer'];
    };

    that.clear = function(){
        cm.forEach(that.fields, function(field){
            field.destruct();
        });
        that.fields = {};
        cm.clearNode(that.nodes['fields']);
        cm.forEach(that.buttons, function(button){
            cm.remove(button.node);
        });
        that.buttons = {};
        cm.clearNode(that.nodes['buttons']);
        return that;
    };

    that.reset = function(){
        cm.removeClass(that.nodes['notificationsContainer'], 'is-show');
        cm.forEach(that.fields, function(field){
            field.reset();
        });
        return that;
    };

    that.send = function(){
        that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.setAction = function(o, mode, update){
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params['ajax'] = cm.merge(that._raw.params['ajax'], o);
                break;
            case 'current':
                that.params['ajax'] = cm.merge(that.params['ajax'], o);
                break;
            case 'update':
                that.params['ajax'] = cm.merge(that._update.params['ajax'], o);
                break;
        }
        if(update){
            that._update.params['ajax'] = cm.clone(that.params['ajax']);
        }
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD ******* */

Com.FormFields = (function(){
    var stack = {};

    return {
        'add' : function(type, params){
            stack[type] = cm.merge({
                'node' : cm.node('div'),
                'type' : type,
                'field' : true
            }, params);
        },
        'get' : function(type){
            return stack[type]? cm.clone(stack[type], true) : null;
        }
    };
})();

cm.define('Com.FormField', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'Stack',
        'Callbacks'
    ],
    'events' : [
        'onRender'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : cm.node('div'),
        'form' : false,
        'name' : '',
        'value' : null,
        'dataValue' : null,
        'type' : false,
        'label' : '',
        'help' : null,
        'placeholder' : '',
        'visible' : true,
        'options' : [],
        'className' : '',                   // is-box
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

    that.nodes = {};
    that.components = {};
    that.form = null;
    that.controller = null;
    that.value = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        render();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(that.params['constructor']){
            cm.getConstructor(that.params['constructor'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
        that.params['constructorParams']['node'] = that.params['node'];
        that.params['constructorParams']['name'] = that.params['name'];
        that.params['constructorParams']['options'] = that.params['options'];
        that.params['constructorParams']['value'] = that.params['dataValue'] || that.params['value'];
        that.params['Com.HelpBubble']['content'] = that.params['help'];
        that.params['Com.HelpBubble']['name'] = that.params['name'];
        that.form = that.params['form'];
    };

    var render = function(){
        // Render structure
        that.nodes = that.callbacks.render(that) || {};
        // Append
        that.params['container'].appendChild(that.nodes['container']);
        // Construct
        that.callbacks.construct(that);
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.construct = function(that){
        that.controller = that.callbacks.controller(that, that.params['constructorParams']);
    };

    that.callbacks.controller = function(that, params){
        if(that.params['constructor']){
            return new that.params['constructor'](params);
        }
    };

    that.callbacks.render = function(that){
        var nodes = {};
        // Structure
        nodes['container'] = cm.node('dl', {'class' : 'pt__field'},
            nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        !that.params['visible'] && cm.addClass(nodes['container'], 'is-hidden');
        // Style
        cm.addClass(nodes['container'], that.params['className']);
        // Attributes
        if(!cm.isEmpty(that.params['name'])){
            that.params['node'].setAttribute('name', that.params['name']);
        }
        if(!cm.isEmpty(that.params['value'])){
            that.params['node'].setAttribute('value', that.params['value']);
        }
        if(!cm.isEmpty(that.params['dataValue'])){
            that.params['node'].setAttribute('data-value', JSON.stringify(that.params['dataValue']));
        }
        if(!cm.isEmpty(that.params['placeholder'])){
            that.params['node'].setAttribute('placeholder', that.params['placeholder']);
        }
        if(!cm.isEmpty(that.params['help'])){
            cm.getConstructor('Com.HelpBubble', function(classConstructor){
                that.components['help'] = new classConstructor(
                    cm.merge(that.params['Com.HelpBubble'], {
                        'container' : nodes['label']
                    })
                );
            });
        }
        return nodes;
    };

    that.callbacks.clearError = function(that){
        cm.removeClass(that.nodes['container'], 'error');
        cm.remove(that.nodes['errors']);
    };

    that.callbacks.renderError = function(that, message){
        that.callbacks.clearError(that);
        cm.addClass(that.nodes['container'], 'error');
        that.nodes['errors'] = cm.node('ul', {'class' : 'pt__field__hint'},
            cm.node('li', {'class' : 'error'}, message)
        );
        cm.appendChild(that.nodes['errors'], that.nodes['value']);
    };

    that.callbacks.set = function(that, value){
        that.controller && cm.isFunction(that.controller.set) && that.controller.set(value);
        return value;
    };

    that.callbacks.get = function(that){
        return that.controller && cm.isFunction(that.controller.get) ? that.controller.get() : null;
    };

    that.callbacks.reset = function(that){
        that.controller && cm.isFunction(that.controller.reset) && that.controller.reset();
    };

    that.callbacks.destruct = function(that){
        that.controller && cm.isFunction(that.controller.destruct) && that.controller.destruct();
    };

    /* ******* PUBLIC ******* */

    that.set = function(value){
        that.value = that.callbacks.set(that, value);
        return that;
    };

    that.get = function(){
        that.value = that.callbacks.get(that);
        return that.value;
    };

    that.reset = function(){
        that.callbacks.reset(that);
        return that;
    };

    that.destruct = function(){
        that.callbacks.destruct(that);
        that.removeFromStack();
        return that;
    };

    that.renderError = function(message){
        that.callbacks.renderError(that, message);
        return that;
    };

    that.clearError = function(){
        that.callbacks.clearError(that);
        return that;
    };

    init();
});

/* ******* COMPONENT: FORM FIELD: DECORATORS ******* */

Com.FormFields.add('input', {
    'node' : cm.node('input', {'type' : 'text'}),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('email', {
    'node' : cm.node('input', {'type' : 'email'}),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('password', {
    'node' : cm.node('input', {'type' : 'password'}),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('hidden', {
    'node' : cm.node('input', {'type' : 'hidden'}),
    'visible' : false,
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('textarea', {
    'node' : cm.node('textarea'),
    'callbacks' : {
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('select', {
    'node' : cm.node('select'),
    'callbacks' : {
        'controller' : function(that){
            var nodes,
                items = [];
            cm.forEach(that.params['options'], function(item){
                nodes = {};
                nodes['container'] = cm.node('option', {'value' : item['value']}, item['text']);
                that.params['node'].appendChild(nodes['container']);
                items.push(nodes);
            });
            return items;
        },
        'set' : function(that, value){
            that.params['node'].value = value;
            return value;
        },
        'get' : function(that){
            return that.params['node'].value;
        },
        'reset' : function(that){
            that.params['node'].value = '';
        }
    }
});

Com.FormFields.add('checkbox', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'controller' : function(that){
            var nodes = {};
            nodes['container'] = cm.node('label',
                nodes['input'] = cm.node('input', {'type' : 'checkbox', 'name' : that.params['name']}),
                nodes['label'] = cm.node('span', {'class' : 'label'})
            );
            var value = typeof that.params['value'] != 'undefined' ? that.params['value'] : that.params['defaultValue'];
            nodes['input'].checked = !!value;
            that.params['node'].appendChild(nodes['container']);
            return nodes;
        },
        'set' : function(that, value){
            that.controller['input'].checked = !!value;
            return value;
        },
        'get' : function(that){
            return that.controller['input'].checked ? 1 : 0;
        },
        'reset' : function(that){
            var value = typeof that.params['value'] != 'undefined' ? that.params['value'] : that.params['defaultValue'];
            that.controller['input'].checked = !!value;
        }
    }
});

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'controller' : function(that){
            var items = [],
                item;
            cm.forEach(that.params['options'], function(option){
                item = {
                    'config' : option,
                    'nodes' : {}
                };
                item.nodes['container'] = cm.node('label',
                    item.nodes['input'] = cm.node('input', {'type' : 'radio', 'name' : that.params['name'], 'value' : option['value']}),
                    item.nodes['label'] = cm.node('span', {'class' : 'label'}, option['text'])
                );
                item.nodes['input'].checked = item.config['value'] == that.params['value'];
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = item.config['value'] == value;
            });
            return value;
        },
        'get' : function(that){
            var value = null;
            cm.forEach(that.controller, function(item){
                if(item.nodes['input'].checked){
                    value = item.config['value'];
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'controller' : function(that){
            var items = [],
                item;
            cm.forEach(that.params['options'], function(option){
                item = {
                    'config' : option,
                    'nodes' : {}
                };
                item.nodes['container'] = cm.node('label',
                    item.nodes['input'] = cm.node('input', {'type' : 'checkbox', 'name' : that.params['name'], 'value' : option['value']}),
                    item.nodes['label'] = cm.node('span', {'class' : 'label'}, option['text'])
                );
                item.nodes['input'].checked = cm.inArray(that.params['value'], item.config['value']);
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = cm.inArray(value, item.config['value']);
            });
            return value;
        },
        'get' : function(that){
            var value = [];
            cm.forEach(that.controller, function(item){
                if(item.nodes['input'].checked){
                    value.push(item.config['value']);
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.controller, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('buttons', {
    'node' : cm.node('div', {'class' : 'btn-wrap'}),
    'field' : false,
    'callbacks' : {
        'render' : function(that){
            var nodes = {};
            nodes['container'] = that.params['node'];
            return nodes;
        },
        'controller' : function(that){
            var buttons = {},
                node;
            cm.forEach(that.params['options'], function(item){
                node = cm.node('button', item['text']);
                switch(item['value']){
                    case 'submit':
                        node.type = 'submit';
                        cm.addClass(node, 'button-primary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.send();
                        });
                        break;

                    case 'reset':
                        node.type = 'reset';
                        cm.addClass(node, 'button-secondary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.reset();
                        });
                        break;

                    case 'clear':
                        cm.addClass(node, 'button-secondary');
                        cm.addEvent(node, 'click', function(e){
                            cm.preventDefault(e);
                            that.form.clear();
                        });
                        break;

                    default:
                        break;
                }
                buttons[item['value']] = node;
                that.params['node'].appendChild(node);
            });
            return buttons;
        }
    }
});