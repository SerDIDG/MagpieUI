cm.define('Com.Form', {
    'modules': [
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
    'events': [
        'onRenderStart',
        'onRender',
        'onValidate',
        'onRequestError',
        'onRequestSuccess',
        'onProgress',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSend',
        'onSendEnd',
        'onSet',
        'onChange',
        'onInput',
        'onClear',
        'onReset',
        'onEnable',
        'onDisable'
    ],
    'params': {
        'node': cm.node('div'),
        'container': null,
        'name': '',
        'renderStructure': true,
        'embedStructure': 'append',
        'removeOnDestruct': true,

        'renderButtons': true,
        'renderButtonsSeparator': true,
        'buttonsContainerClasses': [],
        'buttonsClasses': [],
        'buttonsAlign': 'right',
        'buttonsAdaptive': true,
        'renderNames': false,                                      // Render visual input name attribute

        'validate': false,
        'validateOnChange': false,
        'validateOnInput': false,

        'showNotifications': true,
        'showNotificationsMessages': true,
        'showSuccessNotification': false,
        'showValidationNotification': false,
        'showValidationMessages': true,
        'notificationsConstructor': 'Com.Notifications',
        'notificationsParams': {
            'closable': true,
        },

        'data': {},
        'mergeData': false,
        'statusDetails': {},
        'sendable': true,
        'autoSend': false,
        'sendOnChange': false,
        'sendEmptyForm': true,
        'sendEmptyFields': false,
        'sendOnlyChangedFields': false,
        'abortPreviousRequest': false,
        'successOnEmptyData': false,
        'responseKey': 'data',
        'responseErrorsKey': 'errors',
        'responseMessageKey': 'message',
        'responseMessageCodeKey': false,
        'responseMessageDetailsKey': false,
        'responseCodeKey': 'code',
        'ajax': {
            'type': 'json',
            'method': 'post',
            'paramsType': 'json',
            'url': '',                                             // Request URL. Variables: %baseUrl%, %callback% for JSONP.
            'params': ''                                           // Params object. %baseUrl%, %callback% for JSONP.
        },

        'showLoader': true,
        'loaderCoverage': 'fields',                                // fields, all
        'overlayConstructor': 'Com.Overlay',
        'overlayParams': {
            'position': 'absolute',
            'autoOpen': false,
            'removeOnClose': true,
            'lazy': true
        }
    },
    'strings': {
        'form_error': 'Form is not filled correctly.',
        'server_error': '{#var:cm._strings.common.server_error}',
        'success_message': 'Form successfully sent',
        'error_codes': {},
    }
},
function(params) {
    var that = this;

    that.nodes = {};
    that.components = {};
    that.fields = {};
    that.buttons = {};
    that.constraints = [];
    that.ajaxHandler = null;

    that.isAjax = false;
    that.isProcess = false;
    that.isEnabled = true;

    var init = function() {
        that.renderComponent();
        that.setParams(params);
        that.convertEvents(that.params.events);
        that.getDataNodes(that.params.node);
        that.getDataConfig(that.params.node);
        that.callbacksProcess();
        that.addToStack(that.params.node);
        that.triggerEvent('onRenderStart');
        validateParams();
        render();
        that.addToStack(that.nodes.container);
        that.triggerEvent('onRender');
    };

    var validateParams = function() {
        // Legacy
        that.params.notificationsParams = cm.merge(that.params.notificationsParams, that.params['Com.Notifications']);

        that.params.buttonsAlign = cm.inArray(['left', 'center', 'middle', 'right', 'justify'], that.params.buttonsAlign) ? that.params.buttonsAlign : 'right';
        that.params.loaderCoverage = cm.inArray(['fields', 'all'], that.params.loaderCoverage) ? that.params.loaderCoverage : 'all';

        // Ajax
        that.isAjax = that.params.ajax && !cm.isEmpty(that.params.ajax.url) && that.params.sendable;
    };

    var render = function() {
        // Structure
        if (that.params.renderStructure) {
            that.nodes.container = cm.node('div', {'class': 'com__form'},
                that.nodes.fieldsContainer = cm.node('div', {'class': 'com__form__fields'},
                    that.nodes.fields = cm.node('div', {'class': 'inner'})
                )
            );

            // Notifications
            that.nodes.notifications = cm.node('div', {'class': 'com__form__notifications'});

            // Buttons
            that.nodes.buttonsSeparator = cm.node('hr');
            that.nodes.buttonsContainer = cm.node('div', {'class': 'com__form__buttons'},
                that.nodes.buttons = cm.node('div', {'class': 'pt__buttons'},
                    that.nodes.buttonsHolder = cm.node('div', {'class': 'inner'})
                )
            );
            cm.addClass(that.nodes.buttonsContainer, that.params.buttonsContainerClasses);
            cm.addClass(that.nodes.buttons, ['pull', that.params.buttonsAlign].join('-'));
            cm.addClass(that.nodes.buttons, that.params.buttonsClasses);
            that.params.buttonsAdaptive && cm.addClass(that.nodes.buttons, 'is-adaptive');

            // Append
            that.params.renderButtonsSeparator && cm.insertFirst(that.nodes.buttonsSeparator, that.nodes.buttonsContainer);
            that.params.renderButtons && cm.appendChild(that.nodes.buttonsContainer, that.nodes.container);
            cm.insertFirst(that.nodes.notifications, that.nodes.container);
            that.embedStructure(that.nodes.container);
        }

        // Notifications
        cm.getConstructor(that.params.notificationsConstructor, function(classConstructor) {
            that.components.notifications = new classConstructor(
                cm.merge(that.params.notificationsParams, {
                    'container': that.nodes.notifications
                })
            );
            that.components.notifications.addEvent('onAdd', function() {
                cm.addClass(that.nodes.notifications, 'is-show', true);
            });
            that.components.notifications.addEvent('onRemove', function() {
                if (that.components.notifications.getLength() === 0) {
                    cm.removeClass(that.nodes.notifications, 'is-show', true);
                }
            });
        });

        // Overlay Loader
        var overlayContainer;
        if (that.params.showLoader) {
            cm.getConstructor(that.params.overlayConstructor, function(classConstructor) {
                switch (that.params.loaderCoverage) {
                    case 'fields':
                        overlayContainer = that.nodes.fieldsContainer;
                        break;
                    case 'all':
                    default:
                        overlayContainer = that.nodes.container;
                        break;
                }
                that.components.loader = new classConstructor(
                    cm.merge({'container': overlayContainer}, that.params.overlayParams)
                );
            });
        }
        // Auto Send
        that.params.autoSend && that.send();
    };

    var renderField = function(type, params) {
        var field = Com.FormFields.get(type);
        // Merge params
        params = cm.merge({
            'form': that,
            'formName': that.params.name,
            'system': false,
            'name': '',
            'dataName': null,
            'dataPath': null,
            'label': '',
            'originValue': null,
            'required': false,
            'validate': false,
            'send': true,
            'sendEmpty': true,
            'sendAlways': false,
            'sendPath': null,
            'sendCallback': null,
            'preventReset': false,
            'options': [],
            'container': that.nodes.fields,
            'render': true,
            'renderName': null,
            'renderEvents': true,
            'renderErrorMessage': that.params.showValidationMessages
        }, params);
        params = cm.merge(cm.clone(field, true), params);
        // Validate
        params.fieldConstructor = !cm.isEmpty(params.fieldConstructor) ? params.fieldConstructor : 'Com.FormField';
        params.renderName = cm.isBoolean(params.renderName) ? params.renderName : that.params.renderNames;
        // Value
        if (params.dataPath) {
            var value = cm.reducePath(params.dataPath, that.params.data);
            params.value = !cm.isEmpty(value) ? value : params.value;
        } else {
            params.value = !cm.isEmpty(that.params.data[params.name]) ? that.params.data[params.name] : params.value;
        }
        params.dataValue = !cm.isEmpty(that.params.data[params.dataName]) ? that.params.data[params.dataName] : params.dataValue;
        // Render controller
        if (params.render && field && !that.fields[params.name]) {
            renderFieldController(params);
        }
    };

    var renderFieldController = function(params) {
        cm.getConstructor(params.fieldConstructor, function(classConstructor) {
            params.fieldController = params.controller = new classConstructor(params);
            params.inputController = params.constructorController = cm.isFunction(params.fieldController.getController) && params.fieldController.getController();

            // Events
            if (params.renderEvents) {
                params.fieldController.addEvent('onBlur', function(field) {
                    fieldBlurEvent(field, params);
                });
                params.fieldController.addEvent('onChange', function(field) {
                    fieldChangeEvent(field, params);
                });
                params.fieldController.addEvent('onInput', function(field) {
                    fieldInputEvent(field, params);
                });
            }

            // Save processed origin data to compare before send
            // Use clone to prevent linking
            params.originValue = cm.clone(params.fieldController.get());

            // Save
            that.fields[params.name] = params;
            params.fieldController.triggerEvent('onFieldConstructed');
        });
    };

    var fieldBlurEvent = function(field, params) {
        if (
            that.isEnabled && that.params.validate && that.params.validateOnChange &&
            (field.params.required || field.params.validate)
        ) {
            params.fieldController.validate();
        }
    };

    var fieldChangeEvent = function(field, params) {
        if (
            that.isEnabled && that.params.validate && that.params.validateOnChange &&
            (field.params.required || field.params.validate)
        ) {
            params.fieldController.validate();
        }
        if (that.params.sendOnChange && !field.params.system) {
            that.send();
        }
        that.triggerEvent('onChange');
    };

    var fieldInputEvent = function(field, params) {
        if (
            that.isEnabled && that.params.validate && that.params.validateOnInput &&
            (field.params.required || field.params.validate)
        ) {
            params.fieldController.validate();
        }
        that.triggerEvent('onInput');
    };

    var renderButton = function(params) {
        params = cm.merge({
            'node': null,
            'name': '',
            'label': '',
            'class': '',                // ToDo: deprecated
            'classes': [],
            'spinner': false,
            'spinnerClass': '',         // ToDo: deprecated
            'spinnerClasses': [],
            'action': 'submit',         // submit | reset | clear | custom
            'container': that.nodes.buttonsHolder,
            'handler': null,
        }, params);

        if (that.buttons[params.name]) {
            return;
        }

        // Structure
        if (!cm.isNode(params.node)) {
            params.classes = cm.merge(['button', params.class], params.classes);
            params.node = cm.node('button', {name: params.name, classes: params.classes},
                params.labelNode = cm.node('div', {classes: 'label is-show'}, params.label)
            );
        }

        // Spinner
        if (params.spinner) {
            params.spinnerClasses = cm.merge(['icon', params.spinnerClass], params.spinnerClasses);
            params.spinnerNode = cm.node('div', {classes: params.spinnerClasses});
            cm.appendChild(params.spinnerNode, params.node);
            cm.addClass(params.node, 'button-spinner');
        }

        // Actions
        switch (params.action) {
            case 'submit':
                params.node.type = 'submit';
                cm.addClass(params.node, 'button-primary');
                cm.click.add(params.node, function(event) {
                    cm.preventDefault(event);
                    if (cm.isFunction(params.handler)) {
                        params.handler(that, params, event);
                        return;
                    }
                    if (that.isProcess) {
                        that.abort();
                    } else {
                        that.send();
                    }
                });
                break;

            case 'reset':
                params.node.type = 'reset';
                cm.addClass(params.node, 'button-transparent');
                cm.click.add(params.node, function(event) {
                    cm.preventDefault(event);
                    if (cm.isFunction(params.handler)) {
                        params.handler(that, params, event);
                        return;
                    }
                    if (!that.isProcess) {
                        that.reset();
                    }
                });
                break;

            case 'clear':
                cm.addClass(params.node, 'button-transparent');
                cm.click.add(params.node, function(event) {
                    cm.preventDefault(event);
                    if (cm.isFunction(params.handler)) {
                        params.handler(that, params, event);
                        return;
                    }
                    if (!that.isProcess) {
                        that.clear();
                    }
                });
                break;

            case 'custom':
            default:
                cm.click.add(params.node, function(event) {
                    cm.preventDefault(event);
                    if (cm.isFunction(params.handler)) {
                        params.handler(that, params, event);
                    }
                });
                break;
        }

        // Append
        that.buttons[params.name] = params;
        cm.appendChild(params.node, params.container);
    };

    var toggleButtons = function(value) {
        cm.forEach(that.buttons, function(item) {
            if (item.spinner) {
                if (value) {
                    cm.replaceClass(item.labelNode, 'is-show', 'is-hide');
                    cm.replaceClass(item.spinnerNode, 'is-hide', 'is-show');
                } else {
                    cm.replaceClass(item.labelNode, 'is-hide', 'is-show');
                    cm.replaceClass(item.spinnerNode, 'is-show', 'is-hide');
                }
            }
        });
    };

    var renderSeparator = function(params) {
        params = cm.merge({
            'node': cm.node('hr'),
            'container': that.nodes.fields,
            'classes': []
        }, params);
        cm.addClass(params.node, params.classes);
        cm.appendChild(params.node, params.container);
    };

    var removeField = function(name) {
        var item = that.getField(name);
        if (item) {
            item.fieldController && cm.isFunction(item.fieldController.remove) && item.fieldController.remove();
            delete that.fields[name];
        }
    };

    /* *** VALIDATE *** */

    var validateHelper = function(options) {
        var fieldParams,
            isFieldValidatable,
            constraintsData,
            testData,
            data = {
                'form': that,
                'valid': true,
                'message': null
            };
        // Fields
        cm.forEach(that.fields, function(field, name) {
            fieldParams = field.controller.getParams();
            isFieldValidatable = field.field && !field.system
                && (fieldParams.required || fieldParams.validate)
                && cm.isFunction(field.controller.validate);
            if (isFieldValidatable && !field.controller.validate(options)) {
                data.message = that.msg('form_error');
                data.valid = false;
            }
        });
        // Constraints
        if (!cm.isEmpty(that.constraints)) {
            testData = cm.clone(data);
            constraintsData = validateConstraints(testData);
            if (constraintsData) {
                data = cm.merge(data, constraintsData);
            }
        }
        return data;
    };

    var validateConstraints = function(data) {
        var constraintsTest,
            constraintsData;
        constraintsTest = that.constraints.some(function(item) {
            if (cm.isFunction(item)) {
                constraintsData = item(data);
                return !constraintsData.valid;
            }
            return false;
        });
        if (constraintsTest) {
            return constraintsData;
        }
        return false;
    };

    /* ******* HELPERS ******* */

    var getHelper = function(type, o, field, name) {
        var value = field.controller.get();

        // Process send callback function if specified
        if (cm.isFunction(field.sendCallback)) {
            value = field.sendCallback(field, value);
        }

        // To send only changed values we need to make diff between original and current values
        if (
            cm.inArray(['send', 'sendPath'], type) &&
            that.params.sendOnlyChangedFields &&
            !field.sendAlways
        ) {
            value = cm.getDiffCompare(field.originValue, value);
        }
        if (
            !cm.isUndefined(value) &&
            (that.params.sendEmptyFields || !that.params.sendEmptyFields && !cm.isEmpty(value)) &&
            (field.sendEmpty || !field.sendEmpty && !cm.isEmpty(value))
        ) {
            if (type === 'sendPath' && !cm.isEmpty(field.sendPath)) {
                var path = cm.objectFormPath(field.sendPath, value, '');
                // Use extend instead of merge, because merge will make deep copy of objects without custom properties
                o = cm.extend(o, path, true, false);
            } else {
                o[name] = value;
            }
        }

        return o;
    };

    var sendPlaceholderHelper = function() {
        var data = that.get('sendPath');
        sendCompleteHelper(data);
        that.clearError(that);
        that.triggerEvent('onSendStart', data);
        that.triggerEvent('onSend', data);
        that.triggerEvent('onSuccess', data);
        that.triggerEvent('onSendEnd', data);
    };

    var sendCompleteHelper = function(data) {
        data = !cm.isEmpty(data) ? data : that.get('sendPath');
        that.set(data, {
            triggerEvents: false,
            setFields: false,
            setOrigin: true
        });
    };

    /* ******* CALLBACKS ******* */

    that.callbacks.prepare = function(that, config) {
        config = that.callbacks.beforePrepare(that, config);
        config.url = cm.strReplace(config.url, {
            '%baseUrl%': cm._baseUrl
        });
        config.params = cm.objectReplace(config.params, {
            '%baseUrl%': cm._baseUrl
        });
        config.params = cm.merge(config.params, that.get('sendPath', that.params.mergeData));
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.filterData = function(that, data) {
        return data;
    };

    that.callbacks.beforePrepare = function(that, config) {
        return config;
    };

    that.callbacks.afterPrepare = function(that, config) {
        return config;
    };

    that.callbacks.request = function(that, config) {
        config = that.callbacks.prepare(that, config);
        that.callbacks.clearError(that);

        if (!that.params.sendEmptyForm && cm.isEmpty(config.params)) {
            sendPlaceholderHelper();
            return;
        }

        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart': function() {
                    that.callbacks.start(that, config);
                },
                'onProgress': function(event) {
                    that.callbacks.progress(that, config, event);
                },
                'onSuccess': function(response, event) {
                    event = response instanceof ProgressEvent ? response : event;
                    that.callbacks.response(that, config, response, event);
                },
                'onError': function(response, event) {
                    event = response instanceof ProgressEvent ? response : event;
                    that.callbacks.error(that, config, response, event);
                },
                'onAbort': function() {
                    that.callbacks.abort(that, config);
                },
                'onEnd': function(response) {
                    that.callbacks.end(that, config, response);
                }
            })
        );
    };

    that.callbacks.start = function(that, config) {
        that.isProcess = true;
        that.sendStart();
        that.triggerEvent('onSendStart');
    };

    that.callbacks.end = function(that, config) {
        that.isProcess = false;
        that.sendEnd();
        that.triggerEvent('onSendEnd');
    };

    that.callbacks.progress = function(that, config, event) {
        that.sendProgress(event);
        that.triggerEvent('onProgress', event);
    };

    that.callbacks.response = function(that, config, response, event) {
        if (that.params.successOnEmptyData || !cm.isEmpty(response)) {
            const errors = cm.reducePath(that.params.responseErrorsKey, response);
            const data = cm.reducePath(that.params.responseKey, response);
            if (!cm.isEmpty(errors)) {
                that.callbacks.error(that, config, response, event);
            } else {
                that.callbacks.success(that, data, response, event);
            }
        } else {
            that.callbacks.error(that, config, response, event);
        }
    };

    that.callbacks.responseParams = function(that, response) {
        const params = {
            response: response,
        };

        if (!cm.isEmpty(response)) {
            params.code = cm.reducePath(that.params.responseCodeKey, response);
            params.errors = cm.reducePath(that.params.responseErrorsKey, response);
            params.message = cm.reducePath(that.params.responseMessageKey, response);
            params.messageCode = cm.reducePath(that.params.responseMessageCodeKey, response);
            params.messageDetails = cm.reducePath(that.params.responseMessageDetailsKey, response);
        }
        if (!cm.isEmpty(params.messageDetails)) {
            params.messageDetails = that.callbacks.filterMessageDetails(that, params.messageDetails);
        }

        // Process error message codes
        const message = that.getErrorMessage(params.messageCode, params.messageDetails);
        if (!cm.isEmpty(message)) {
            params.message = message;
        }

        return params;
    };

    that.callbacks.error = function(that, config, response, event) {
        const params = that.callbacks.responseParams(that, response, event);
        params.target = event instanceof ProgressEvent ? event.target : null;

        // Process error status codes
        if (cm.isEmpty(params.message)) {
            params.statusDetails = that.callbacks.filterStatusDetails(that, that.params.statusDetails);
            params.message = that.getStatusMessage( params.target.status, params.statusDetails );
        }

        that.callbacks.renderError(that, params);
        that.triggerEvent('onError', params);
        that.triggerEvent('onRequestError', params);
    };

    that.callbacks.success = function(that, data, response, event) {
        if (that.params.showNotifications && that.params.showSuccessNotification) {
            that.callbacks.renderNotification(that, {
                type: 'success',
                label: that.msg('success_message'),
            });
        }

        const params = that.callbacks.responseParams(that, response, event);
        params.target = event instanceof ProgressEvent ? event.target : null;
        params.data = data;

        sendCompleteHelper(params.data);
        that.triggerEvent('onSuccess', params.data);
        that.triggerEvent('onRequestSuccess', params);
    };

    that.callbacks.abort = function(that, config) {
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.clearError = function(that) {
        // Clear notification
        that.clearNotification();
        // Clear field errors
        cm.forEach(that.fields, function(field) {
            field.controller.clearError();
        });
    };

    that.callbacks.renderError = function(that, errors, message) {
        const params = {
            label: that.msg('form_error'),
            type: 'danger',
        };

        // Process message from the response
        let hasMessage = false;
        if (!cm.isEmpty(message) && cm.isString(message)) {
            hasMessage = true;
            params.label = message;
        }

        if (cm.isArray(errors) || cm.isObject(errors)) {
            if (that.params.showNotificationsMessages) {
                params.messages = that.callbacks.renderErrorMessages(that, errors);
                params.collapsed = true;
            }
        } else if ( !hasMessage ) {
            params.label = that.msgParse('server_error');
        }

        // Clear old errors messages
        that.callbacks.clearError(that);

        // Render new errors messages
        if (that.params.showNotifications) {
            that.callbacks.renderNotification(that, params);
        }
    };

    that.callbacks.renderErrorMessages = function(that, errors) {
        var field,
            fieldName,
            fieldMessage,
            fieldLabel,
            messages = [];

        // Filter errors data
        errors = that.callbacks.filterErrors(that, errors);

        // Render error messages
        cm.forEach(errors, function(item, key) {
            // Get field
            fieldName = item && item.field ? item.field : key;
            field = that.getField(fieldName);
            fieldLabel = that.getFieldLabel(fieldName) || fieldName;
            // Render field messages
            if (cm.isObject(item)) {
                if (cm.isArray(item.message)) {
                    cm.forEach(item.message, function(messageItem) {
                        fieldMessage = that.callbacks.renderErrorMessage(that, field, messageItem, fieldLabel);
                        messages.push(fieldMessage);
                    })
                } else if (!cm.isEmpty(item.message)) {
                    fieldMessage = that.callbacks.renderErrorMessage(that, field, item.message, fieldLabel);
                    messages.push(fieldMessage);
                }
            } else if (cm.isArray(item)) {
                cm.forEach(item, function(messageItem) {
                    fieldMessage = that.callbacks.renderErrorMessage(that, field, messageItem, fieldLabel);
                    messages.push(fieldMessage);
                });
            } else if (!cm.isEmpty(item)) {
                fieldMessage = that.callbacks.renderErrorMessage(that, field, item, fieldLabel);
                messages.push(fieldMessage);
            }
        });
        return messages;
    };

    that.callbacks.renderErrorMessage = function(that, field, message, label) {
        var messagePath = ['errors', message].join('.'),
            messageString = that.getMsg(messagePath);
        message = !cm.isEmpty(messageString) ? that.msg(messagePath) : message;
        if (field) {
            field.controller.renderError(message);
        }
        if (!cm.isEmpty(label)) {
            message = [label, message].join(': ');
        }
        return message
    };

    that.callbacks.renderNotification = function(that, o) {
        cm.addClass(that.nodes.notifications, 'is-show', true);
        that.components.notifications.add(o);
    };

    /* *** FILTERS *** */

    that.callbacks.filterMessageDetails = function(that, data) {
        return data;
    };

    that.callbacks.filterStatusDetails = function(that, data) {
        return data;
    };

    that.callbacks.filterErrors = function(that, errors) {
        return errors;
    };

    /* ******* PUBLIC ******* */

    that.destruct = function() {
        if (!that._isDestructed) {
            that._isDestructed = true;
            cm.forEach(that.fields, function(field) {
                field.controller.destruct();
            });
            that.removeFromStack();
            that.params.removeOnDestruct && cm.remove(that.nodes.container);
        }
        return that;
    };

    that.add = function(type, params) {
        renderField(type, params);
        return that;
    };

    that.addButton = function(o) {
        renderButton(o);
        return that;
    };

    that.addButtons = function(o) {
        if (cm.isArray(o)) {
            cm.forEach(o, function(item) {
                renderButton(item);
            });
        }
        return that;
    };

    that.toggleButtons = function(value) {
        toggleButtons(value);
        return that;
    };

    that.addSeparator = function(params) {
        renderSeparator(params);
        return that;
    };

    that.addConstraint = function(constraint) {
        if (cm.isFunction(constraint)) {
            cm.arrayAdd(that.constraints, constraint);
        }
        return that;
    };

    that.removeConstraint = function(constraint) {
        if (cm.isFunction(constraint)) {
            cm.arrayRemove(that.constraints, constraint);
        }
        return that;
    };

    that.appendChild = function(node, insertMethod) {
        insertMethod = cm.isUndefined(insertMethod) ? 'appendChild' : insertMethod;
        cm[insertMethod](node, that.nodes.fields);
        return that;
    };

    that.getField = function(name) {
        return that.fields[name];
    };

    that.getFields = function(names) {
        var fields = {};
        cm.forEach(names, function(name) {
            fields[name] = that.getField(name);
        });
        return fields;
    };

    that.getFieldLabel = function(name) {
        var field = that.getField(name);
        if (!field) {
            return;
        }
        if (!cm.isEmpty(field.label)) {
            return field.label;
        }
        if (!cm.isEmpty(field.placeholder)) {
            return field.placeholder;
        }
    };

    that.setFieldParams = function(name, params) {
        var field = that.getField(name);
        if (field) {
            field = cm.merge(field, params);
            // Save
            that.fields[name] = field;
        }
        return field;
    };

    that.removeField = function(name) {
        removeField(name);
        return that;
    };

    that.get = function(type, mergeData) {
        var data = {};
        // Validate
        type = cm.inArray(['all', 'fields', 'send', 'sendPath', 'system'], type) ? type : 'fields';
        mergeData = cm.isUndefined(mergeData) ? that.params.mergeData : mergeData;
        // Get
        cm.forEach(that.fields, function(field, name) {
            switch (type) {
                case 'all':
                    data = getHelper('all', data, field, name);
                    break;
                case 'fields':
                    if (!field.system) {
                        data = getHelper('fields', data, field, name);
                    }
                    break;
                case 'send':
                    if (field.send && !field.system) {
                        data = getHelper('send', data, field, name);
                    }
                    break;
                case 'sendPath':
                    if (field.send && !field.system) {
                        data = getHelper('sendPath', data, field, name);
                    }
                    break;
                case 'system':
                    if (field.system) {
                        data = getHelper('system', data, field, name);
                    }
                    break;
            }
        });
        // Merge data with origin
        if (mergeData) {
            data = cm.merge(that.params.data, data);
        }
        // Filter data
        data = that.callbacks.filterData(that, data);
        return data;
    };

    that.getAll = function() {
        return that.get('all');
    };

    that.set = function(data, params) {
        // Validate params
        params = cm.merge({
            triggerEvents: true,
            setFields: true,
            setOrigin: false,
            setData: false,
        }, params);
        // Set data
        if (params.setData) {
            that.params.data = data;
        }
        // Set values
        var value;
        cm.forEach(that.fields, function(field, name) {
            if (field.dataPath) {
                value = cm.reducePath(field.dataPath, data);
            } else {
                value = !cm.isUndefined(data[field.dataName]) ? data[field.dataName] : data[name];
            }
            if (!cm.isUndefined(value)) {
                if (params.setOrigin) {
                    that.setFieldParams(name, {originValue: value});
                }
                if (params.setFields) {
                    field.controller.set(value, params.triggerEvents);
                }
            }
        });
        if (params.triggerEvents) {
            that.triggerEvent('onSet');
        }
        return that;
    };

    that.clear = function() {
        cm.forEach(that.fields, function(field) {
            field.controller.destruct();
        });
        that.fields = {};
        cm.clearNode(that.nodes.fields);
        cm.forEach(that.buttons, function(button) {
            cm.remove(button.node);
        });
        that.buttons = {};
        cm.clearNode(that.nodes.buttonsHolder);
        that.clearError();
        that.triggerEvent('onClear');
        return that;
    };

    that.reset = function() {
        cm.forEach(that.fields, function(field) {
            if (!field.preventReset) {
                field.controller.reset();
            }
        });
        that.clearError();
        that.triggerEvent('onReset');
        return that;
    };

    that.enable = function() {
        if (!that.isEnabled) {
            that.isEnabled = true;
            cm.forEach(that.fields, function(field) {
                field.controller.enable();
            });
            cm.forEach(that.buttons, function(button) {
                cm.removeClass(button.node, 'button-disabled');
            });
            that.triggerEvent('onEnable');
        }
        return that;
    };

    that.disable = function() {
        if (that.isEnabled) {
            that.isEnabled = false;
            cm.forEach(that.fields, function(field) {
                field.controller.disable();
            });
            cm.forEach(that.buttons, function(button) {
                cm.addClass(button.node, 'button-disabled');
            });
            that.triggerEvent('onDisable');
        }
        return that;
    };

    that.validate = function(options) {
        options = cm.merge({
            'silent': false,
            'triggerEvents': true
        }, options);
        // Clear previous notifications
        that.clearNotification();
        // Show new notifications if exists
        var data = validateHelper(options);
        if (!data.valid && !options.silent) {
            if (that.params.showNotifications && that.params.showValidationNotification) {
                that.renderNotification({
                    'label': data.message,
                    'type': 'danger'
                });
            }
        }
        // Trigger events
        if (options.triggerEvents && !options.silent) {
            that.triggerEvent('onValidate', data);
        }
        return data;
    };

    that.send = function() {
        if (!that.isEnabled) {
            return that;
        }
        if (that.isProcess && that.params.abortPreviousRequest) {
            that.abort();
        }

        var data = {
            'valid': true
        };
        // Validate
        if (that.params.validate) {
            data = that.validate();
        }
        // Send
        if (data.valid) {
            if (that.isAjax) {
                that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params.ajax));
            } else {
                sendPlaceholderHelper();
            }
        }
        return that;
    };

    that.sendStart = function() {
        cm.addClass(that.nodes.container, 'is-submitting');
        // Toggle buttons
        toggleButtons(true);
        // Show Loader
        if (that.params.showLoader) {
            that.showLoader();
        }
        return that;
    };

    that.sendProgress = function(event) {
        // Hide Loader
        if (that.params.showLoader) {
            if (event.lengthComputable) {
                that.setLoaderProgress(event.total, event.loaded);
            } else {
                that.hideLoaderProgress();
            }
        }
        return that;
    };

    that.sendEnd = function() {
        cm.removeClass(that.nodes.container, 'is-submitting');
        // Toggle buttons
        toggleButtons(false);
        // Hide Loader
        if (that.params.showLoader) {
            that.hideLoader();
        }
        return that;
    };

    that.sendPlaceholder = function() {
        sendPlaceholderHelper();
        return that;
    };

    that.abort = function() {
        if (that.ajaxHandler && that.ajaxHandler.abort) {
            that.ajaxHandler.abort();
        }
        return that;
    };

    that.setAction = function(o, mode, update) {
        mode = cm.inArray(['raw', 'update', 'current'], mode) ? mode : 'current';
        switch (mode) {
            case 'raw':
                that.params.ajax = cm.merge(that._raw.params.ajax, o);
                break;
            case 'current':
                that.params.ajax = cm.merge(that.params.ajax, o);
                break;
            case 'update':
                that.params.ajax = cm.merge(that._update.params.ajax, o);
                break;
        }
        if (update) {
            that._update.params.ajax = cm.clone(that.params.ajax);
        }
        that.isAjax = that.params.ajax && !cm.isEmpty(that.params.ajax.url);
        return that;
    };

    that.renderNotification = function(o) {
        that.callbacks.renderNotification(that, o);
        return that;
    };

    that.clearNotification = function() {
        cm.removeClass(that.nodes.notifications, 'is-show', true);
        that.components.notifications.clear();
        return that;
    };

    that.getNotifications = function() {
        return that.components.notifications;
    };

    that.renderError = function(errors, message) {
        that.callbacks.renderError(that, errors, message);
        return that;
    };

    that.clearError = function() {
        that.callbacks.clearError(that);
        return that;
    };

    that.getErrorMessage = function(code, data) {
        if (cm.isEmpty(code)) return;

        const message = that.getMsg(`error_codes.${code}`);
        if (!message) return;

        if (!cm.isEmpty(data) && cm.isObject(data)) {
            return cm.parseMessage(message, data);
        }
        return message;
    };

    that.getStatusMessage = function(code, data) {
        if (cm.isEmpty(code)) return;

        const message = that.getMsg(`status_codes.${code}`);
        if (!message) return;

        if (!cm.isEmpty(data) && cm.isObject(data)) {
            return cm.parseMessage(message, data);
        }
        return message;
    };

    that.getLoader = function() {
        return that.components.loader;
    };

    that.showLoader = function(isImmediately) {
        that.components.loader && that.components.loader.open(isImmediately);
        return that;
    };

    that.hideLoader = function(isImmediately) {
        that.components.loader && that.components.loader.close(isImmediately);
        return that;
    };

    that.setLoaderProgress = function(total, value) {
        that.components.loader && that.components.loader.setProgress(total, value);
        return that;
    };

    that.hideLoaderProgress = function() {
        that.components.loader && that.components.loader.hideProgress();
        return that;
    };

    that.getName = function() {
        return that.params.name;
    };

    that.getContainer = function() {
        return that.nodes.container;
    };

    that.getButtonsContainer = function() {
        return that.nodes.buttonsContainer;
    };

    that.getNodes = function(key) {
        return that.nodes[key] || that.nodes;
    };

    init();
});
