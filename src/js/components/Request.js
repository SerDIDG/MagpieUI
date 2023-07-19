cm.define('Com.Request', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Stack',
        'Structure'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onStart',
        'onEnd',
        'onError',
        'onAbort',
        'onSuccess',
        'onContentRenderStart',
        'onContentRender',
        'onContentRenderEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'container' : null,
        'name' : '',
        'embedStructure' : 'append',
        'wrapContent' : true,
        'swapContentOnError' : true,
        'renderContentOnSuccess' : true,
        'className' : '',
        'autoSend' : false,
        'promise' : false,
        'successOnEmptyData': false,
        'responseKey' : 'data',
        'responseErrorsKey' : 'errors',
        'responseMessageKey' : 'message',
        'responseCodeKey' : 'code',
        'responseHTML' : true,
        'responseHTMLKey' : 'data',
        'responseStatusKey' : 'data.success',
        'responseContainer' : null,
        'showLoader' : true,
        'ajax' : {
            'type' : 'json',
            'method' : 'get',
            'variables' : {},
            'variablesMap' : {},
            'url' : '',                                 // Request URL. Variables: %baseUrl%, %callback%.
            'params' : ''                               // Params object. Variables: %baseUrl%, %callback%.
        },
        'animateDuration' : 'cm._config.animDuration',
        'overlayContainer' : 'document.body',
        'overlayConstructor' : 'Com.Overlay',
        'overlayParams' : {
            'lazy' : true,
            'autoOpen' : false,
            'removeOnClose' : true,
            'showSpinner' : true,
            'showContent' : false,
            'position' : 'absolute',
            'theme' : 'light'
        }
    },
    'strings' : {
        'server_error' : 'An unexpected error has occurred. Please try again later.'
    }
},
function(params){
    var that = this;
    that.nodes = {};
    that.animations = {};
    that.components = {};
    that.requestData = {};
    that.responseData = {};
    that.previousResponseData = {};
    that.isProcess = false;
    that.isError = false;
    that.isRendering = false;
    that.construct(params);
});

cm.getConstructor('Com.Request', function(classConstructor, className, classProto){
    classProto.construct = function(params){
        var that = this;
        that.destructHandler = that.destruct.bind(that);
        that.requestHandler = that.request.bind(that);
        that.sendHandler = that.send.bind(that);
        that.setParams(params);
        that.convertEvents(that.params.events);
        that.validateParams();
        that.addToStack(that.params.node);
        that.triggerEvent('onRenderStart');
        that.render();
        that.addToStack(that.nodes.container);
        that.triggerEvent('onRender');
        that.params.autoSend && that.send();
        return that;
    };

    classProto.validateParams = function(){
        var that = this;
        // Legacy parameter name
        if(!cm.isUndefined(that.params.showOverlay)){
            that.params.showLoader = that.params.showOverlay;
        }
    };

    classProto.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            that.components.overlay && that.components.overlay.destruct();
            that.removeFromStack();
        }
        return that;
    };

    classProto.send = function(){
        var that = this;
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            if(that.params.promise){
                return new Promise(that.requestHandler);
            }
            that.request();
        }
        return that;
    };

    classProto.get = function(){
        var that = this;
        return that.responseData;
    };

    classProto.render = function(){
        var that = this;
        // Keys
        if(cm.isEmpty(that.params.responseHTMLKey)){
            that.params.responseHTMLKey = that.params.responseKey;
        }
        // Structure
        that.renderView();
        if(that.params.wrapContent && cm.isNode(that.params.container)){
            cm.appendNodes(that.params.container.childNodes, that.nodes.inner);
        }
        // Attributes
        that.setAttributes();
        // Overlay
        if(that.params.responseHTML){
            that.params.overlayParams.container =
                that.params.overlayParams.container ||
                that.params.overlayContainer ||
                that.nodes.container ||
                document.body;
        }else{
            that.params.overlayParams.container =
                that.params.overlayParams.container ||
                that.params.overlayContainer ||
                document.body;
        }
        if(that.params.showLoader){
            cm.getConstructor(that.params.overlayConstructor, function(classConstructor){
                that.components.overlay = new classConstructor(that.params.overlayParams);
            });
        }
        // Append
        that.embedStructure(that.nodes.container);
        return that;
    };

    classProto.renderView = function(){
        var that = this;
        that.nodes.container = cm.node('div', {'class' : 'com__request'},
            that.nodes.inner = cm.node('div', {'class' : 'inner'})
        );
        return that;
    };

    classProto.setAttributes = function(){
        var that = this;
        // CSS Class
        cm.addClass(that.nodes.container, that.params.className);
        // Animations
        that.animations.container = new cm.Animation(that.nodes.container);
        return that;
    };

    classProto.setAction = function(o, mode, update){
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
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
        if(update){
            that._update.params.ajax = cm.clone(that.params.ajax);
        }
        return that;
    };

    classProto.setVariables = function(o, mode, update){
        var that = this;
        mode = cm.inArray(['raw', 'update', 'current'], mode)? mode : 'current';
        switch(mode){
            case 'raw':
                that.params.ajax.variables = cm.merge(that._raw.params.ajax.variables, o);
                break;
            case 'current':
                that.params.ajax.variables = cm.merge(that.params.ajax.variables, o);
                break;
            case 'update':
                that.params.ajax.variables = cm.merge(that._update.params.ajax.variables, o);
                break;
        }
        if(update){
            that._update.params.ajax.variables = cm.clone(that.params.ajax.variables);
        }
        return that;
    };

    /* *** REQUEST *** */

    classProto.request = function(resolve, reject){
        var that = this;
        that.prepare();
        that.components.ajax = cm.ajax(
            cm.merge(that.requestData, {
                'onStart' : function(){
                    that.start();
                },
                'onSuccess' : function(data, event){
                    event = data instanceof ProgressEvent ? data : event;
                    that.response('success', data, event, resolve);
                },
                'onError' : function(data, event){
                    event = data instanceof ProgressEvent ? data : event;
                    that.response('error', data, event, reject);
                },
                'onAbort' : function(){
                    that.aborted();
                },
                'onEnd' : function(){
                    that.end();
                }
            })
        );
        return that;
    };

    classProto.prepare = function(){
        var that = this;
        that.isError = false;
        // Request data
        that.requestData = cm.clone(that.params.ajax);
        that.requestData.url = cm.strReplace(that.requestData.url, that.params.variables);
        that.requestData.params = cm.objectReplace(that.requestData.params, that.params.variables);
        that.previousResponseData = cm.clone(that.responseData);
        // Response data
        that.responseData = {
            'request' : that.requestData
        };
        return that;
    };

    classProto.abort = function(){
        var that = this;
        if(that.components.ajax && that.components.ajax.abort){
            that.components.ajax.abort();
        }
        return that;
    };

    classProto.start = function(){
        var that = this;
        that.isProcess = true;
        // Show Overlay
        if(that.params.showLoader){
            that.components.overlay && that.components.overlay.open();
        }
        that.triggerEvent('onStart');
        return that;
    };

    classProto.end = function(){
        var that = this;
        that.isProcess = false;
        // Hide Overlay
        if(that.params.showLoader){
            that.components.overlay && that.components.overlay.close();
        }
        that.triggerEvent('onEnd');
        return that;
    };

    classProto.filter = function(){
        var that = this;
        if(!cm.isEmpty(that.responseData.response)){
            that.responseData.errors = cm.reducePath(that.params.responseErrorsKey, that.responseData.response);
            that.responseData.message = cm.reducePath(that.params.responseMessageKey, that.responseData.response);
            that.responseData.code = cm.reducePath(that.params.responseCodeKey, that.responseData.response);
            that.responseData.status = cm.reducePath(that.params.responseStatusKey, that.responseData.response);
            that.responseData.data = cm.reducePath(that.params.responseKey, that.responseData.response);
            that.responseData.html = cm.reducePath(that.params.responseHTMLKey, that.responseData.response);
        }
        // Validate
        if(cm.isEmpty(that.responseData.status)){
            that.responseData.status = false;
        }
        if(cm.isEmpty(that.responseData.data)){
            that.responseData.data = [];
        }
        that.responseData.filtered = that.responseData.data;
    };

    classProto.response = function(status, data, event, callback){
        var that = this;
        if(event instanceof ProgressEvent){
            that.responseData.target = event.target;
        }
        that.responseData.response = data;
        that.responseData.callback = callback;
        that.filter();
        if(
            status === 'success'
            && (that.params.successOnEmptyData || !cm.isEmpty(that.responseData.data) || that.responseData.status)
        ){
            that.success();
        }else{
            that.error();
        }
        return that;
    };

    classProto.error = function(){
        var that = this;
        that.isError = true;
        that.responseData.isError = true;
        that.renderError();
        that.triggerEvent('onError', that.responseData);
        // Promise callback
        if(cm.isFunction(that.responseData.callback)){
            that.responseData.callback(that.responseData);
        }
        return that;
    };

    classProto.success = function(){
        var that = this;
        that.isError = false;
        that.responseData.isError = false;
        if(!that.responseData.status || (that.responseData.status && that.params.renderContentOnSuccess)){
            that.renderResponse();
        }
        that.triggerEvent('onSuccess', that.responseData);
        // Promise callback
        if(cm.isFunction(that.responseData.callback)){
            that.responseData.callback(that.responseData);
        }
        return that;
    };

    classProto.aborted = function(){
        var that = this;
        that.triggerEvent('onAbort');
        return that;
    };

    /* *** RENDER *** */

    classProto.renderTemporary = function(visible){
        var node = cm.node('div', {'class' : 'com__request__temporary'});
        if(visible){
            cm.addClass(node, 'is-show');
        }
        return node;
    };

    classProto.renderResponse = function(){
        var that = this,
            nodes;
        if(that.params.responseHTML){
            nodes = cm.strToHTML(that.responseData.html);
            that.renderContent(nodes);
        }
        return that;
    };

    classProto.renderContent = function(nodes){
        var that = this,
            temporary;
        if(cm.isNode(that.params.responseContainer)){
            that.triggerEvent('onContentRenderStart', nodes);
            cm.clearNode(that.params.responseContainer);
            cm.appendNodes(nodes, that.params.responseContainer);
            that.triggerEvent('onContentRender', nodes);
            that.triggerEvent('onContentRenderEnd', nodes);
        }else if(cm.isNode(that.params.container)){
            temporary = that.renderTemporary(false);
            cm.appendNodes(nodes, temporary);
            that.appendResponse(temporary);
        }else{
            that.triggerEvent('onContentRenderStart', nodes);
            that.triggerEvent('onContentRender', nodes);
            that.triggerEvent('onContentRenderEnd', nodes);
        }
        return that;
    };

    classProto.renderError = function(){
        var that = this,
            temporary,
            node;
        if(that.params.responseHTML){
            node = cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'));
            // Append
            if(cm.isNode(that.params.responseContainer)){
                that.triggerEvent('onContentRenderStart', node);
                if(that.params.swapContentOnError){
                    cm.clearNode(that.params.responseContainer);
                    cm.appendChild(node, that.params.responseContainer);
                }else{
                    cm.remove(that.nodes.error);
                    that.nodes.error = node;
                    cm.insertFirst(that.nodes.error, that.params.responseContainer);
                }
                that.triggerEvent('onContentRender', node);
                that.triggerEvent('onContentRenderEnd', node);
            }else if(cm.isNode(that.params.container)){
                temporary = that.renderTemporary();
                cm.appendChild(node, temporary);
                if(that.params.swapContentOnError){
                    that.appendResponse(temporary);
                }else{
                    that.appendError(temporary);
                }
            }else{
                that.triggerEvent('onContentRenderStart', node);
                that.triggerEvent('onContentRender', node);
                that.triggerEvent('onContentRenderEnd', node);
            }
        }
        return that;
    };

    classProto.appendError = function(temporary){
        var that = this;
        that.isRendering = true;
        that.triggerEvent('onContentRenderStart', temporary);
        cm.remove(that.nodes.error);
        that.nodes.error = temporary;
        cm.addClass(that.nodes.error, 'is-show');
        if(that.nodes.temporary){
            cm.insertFirst(that.nodes.error, that.nodes.temporary);
        }else{
            cm.insertFirst(that.nodes.error, that.nodes.inner);
        }
        cm.addClass(that.nodes.container, 'is-show is-loaded', true);
        that.isRendering = false;
        that.triggerEvent('onContentRender', temporary);
        that.triggerEvent('onContentRenderEnd', temporary);
        return that;
    };

    classProto.appendResponse = function(temporary){
        var that = this,
            height;
        that.isRendering = true;
        that.triggerEvent('onContentRenderStart', temporary);
        // Wrap old content
        if(!that.nodes.temporary){
            that.nodes.temporary = that.renderTemporary(false);
            cm.appendNodes(that.nodes.inner.childNodes, that.nodes.temporary);
            cm.appendChild(that.nodes.temporary, that.nodes.inner);
            cm.customEvent.trigger(that.nodes.temporary, 'destruct', {
                'direction' : 'child',
                'self' : false
            });
        }
        cm.removeClass(that.nodes.temporary, 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes.inner);
        cm.addClass(temporary, 'is-show', true);
        // Show container
        cm.removeClass(that.nodes.container, 'is-loaded', true);
        cm.addClass(that.nodes.container, 'is-show', true);
        that.triggerEvent('onContentRender', that.nodes.temporary);
        // Animate
        height = temporary.offsetHeight;
        that.animations.container.go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params.animateDuration,
            'anim' : 'smooth',
            'onStop' : function(){
                // Remove old temporary
                cm.remove(that.nodes.temporary);
                // Apply new temporary
                that.nodes.temporary = temporary;
                that.nodes.container.style.height = '';
                cm.addClass(that.nodes.container, 'is-loaded', true);
                that.isRendering = false;
                that.triggerEvent('onContentRenderEnd', that.nodes.temporary);
            }
        });
        return that;
    };
});
