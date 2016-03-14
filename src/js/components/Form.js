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
        'ajax' : {
            'type' : 'json',
            'method' : 'post',
            'formData' : true,
            'url' : '',                                             // Request URL. Variables: %baseurl%, %callback% for JSONP.
            'params' : ''                                           // Params object. %baseurl%, %callback% for JSONP.
        },
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
                that.nodes['form'] = cm.node('form', {'class' : 'form'},
                    that.nodes['fields'] = cm.node('div', {'class' : 'com__form__fields'}))
            );
            // Notifications
            that.nodes['notificationsContainer'] = cm.node('div', {'class' : 'com__form__notifications'},
                cm.node('div', {'class' : 'com-notification'},
                    that.nodes['notifications'] = cm.node('ul')
                )
            );
            // Buttons
            that.nodes['buttonsSeparator'] = cm.node('hr');
            that.nodes['buttonsContainer'] = cm.node('div', {'class' : 'com__form__buttons'},
                that.nodes['buttons'] = cm.node('div', {'class' : 'btn-wrap'})
            );
            cm.addClass(that.nodes['buttons'], ['pull', that.params['buttonsAlign']].join('-'));
            // Embed
            that.params['renderButtonsSeparator'] && cm.insertFirst(that.nodes['buttonsSeparator'], that.nodes['buttonsContainer']);
            that.params['renderButtons'] && cm.appendChild(that.nodes['buttonsContainer'], that.nodes['form']);
            that.params['showNotifications'] && cm.insertFirst(that.nodes['notificationsContainer'], that.nodes['form']);
            that.embedStructure(that.nodes['container']);
        }
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            switch(that.params['loaderCoverage']){
                case 'fields':
                    overlayContainer = that.nodes['fields'];
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
        // Events
        cm.addEvent(that.nodes['form'], 'submit', function(e){
            cm.preventDefault(e);
            if(!that.isProcess){
                that.send();
            }
        });
    };

    var renderField = function(type, params){
        var fieldParams, field;
        // Merge params
        params = cm.merge({
            'name' : '',
            'label' : '',
            'options' : [],
            'container' : that.nodes['fields'],
            'form' : that
        }, params);
        // Render
        if(!that.fields[params['name']] && (fieldParams = Com.FormFields.get(type))){
            cm.getConstructor('Com.FormField', function(classConstructor){
                params = cm.merge(fieldParams, params);
                field = new classConstructor(params);
                if(params['field']){
                    that.fields[params['name']] = field;
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

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config){
        // Prepare
        config['url'] = cm.strReplace(config['url'], {
            '%baseurl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseurl%' : cm._baseUrl
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
        // Clear old errors
        cm.clearNode(that.nodes['notifications']);
        cm.forEach(that.fields, function(field){
            field.clearError();
        });
        // Render new errors
        if(cm.isArray(errors)){
            cm.forEach(errors, function(item){
                that.callbacks.renderErrorItem(that, config, item);
                if(field = that.getField(item['field'])){
                    field.renderError(item['message']);
                }
            });
        }else{
            that.callbacks.renderErrorItem(that, config, {
                'message' : 'server_error'
            });
        }
    };

    that.callbacks.renderErrorItem = function(that, config, item){
        that.nodes['notifications'].appendChild(
            cm.node('li', {'class' : 'error'},
                cm.node('div', {'class' : 'descr'}, that.lang(item['message']))
            )
        );
        cm.addClass(that.nodes['notificationsContainer'], 'is-show', true);
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

    that.getField = function(name){
        return that.fields[name];
    };

    that.getAll = function(){
        var o = {};
        cm.forEach(that.fields, function(field, name){
            o[name] = field.get();
        });
        return o;
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

    that.setAction = function(o){
        o = cm.merge(that._raw.params['ajax'], o);
        that.params['ajax'] = o;
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
        'type' : false,
        'label' : '',
        'help' : null,
        'placeholder' : '',
        'options' : [],
        'component' : false,
        'componentParams' : {},
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
    that.component = null;
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
        if(that.params['component']){
            cm.getConstructor(that.params['component'], function(classConstructor){
                that.params['constructor'] = classConstructor;
            });
        }
        that.params['componentParams']['node'] = that.params['node'];
        that.params['componentParams']['name'] = that.params['name'];
        that.params['componentParams']['options'] = that.params['options'];
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
        that.component = that.callbacks.component(that, that.params['componentParams']);
    };

    that.callbacks.component = function(that, params){
        if(that.params['component']){
            return new that.params['constructor'](params);
        }
    };

    that.callbacks.render = function(that){
        var nodes = {};
        nodes['container'] = cm.node('dl',
            nodes['label'] = cm.node('dt',
                cm.node('label', that.params['label'])
            ),
            nodes['value'] = cm.node('dd', that.params['node'])
        );
        if(!cm.isEmpty(that.params['name'])){
            that.params['node'].setAttribute('name', that.params['name']);
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
        that.nodes['errors'] = cm.node('ul', {'class' : 'hint'},
            cm.node('li', {'class' : 'error'}, message)
        );
        cm.appendChild(that.nodes['errors'], that.nodes['value']);
    };

    that.callbacks.set = function(that, value){
        that.component && cm.isFunction(that.component.set) && that.component.set(value);
        return value;
    };

    that.callbacks.get = function(that){
        return that.component && cm.isFunction(that.component.get) ? that.component.get() : null;
    };

    that.callbacks.reset = function(that){
        that.component && cm.isFunction(that.component.reset) && that.component.reset();
    };

    that.callbacks.destruct = function(that){
        that.component && cm.isFunction(that.component.destruct) && that.component.destruct();
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
        'component' : function(that){
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

Com.FormFields.add('radio', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'component' : function(that){
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
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = item.config['value'] == value;
            });
            return value;
        },
        'get' : function(that){
            var value = null;
            cm.forEach(that.component, function(item){
                if(item.nodes['input'].checked){
                    value = item.config['value'];
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = false;
            });
        }
    }
});

Com.FormFields.add('check', {
    'node' : cm.node('div', {'class' : 'form__check-line'}),
    'callbacks' : {
        'component' : function(that){
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
                that.params['node'].appendChild(item.nodes['container']);
                items.push(item);
            });
            return items;
        },
        'set' : function(that, value){
            cm.forEach(that.component, function(item){
                item.nodes['input'].checked = cm.inArray(value, item.config['value']);
            });
            return value;
        },
        'get' : function(that){
            var value = [];
            cm.forEach(that.component, function(item){
                if(item.nodes['input'].checked){
                    value.push(item.config['value']);
                }
            });
            return value;
        },
        'reset' : function(that){
            cm.forEach(that.component, function(item){
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
        'component' : function(that){
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