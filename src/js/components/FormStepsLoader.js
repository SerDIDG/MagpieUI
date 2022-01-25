cm.define('Com.FormStepsLoader', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'DataNodes',
        'Callbacks',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onError',
        'onAbort',
        'onSuccess',
        'onSendStart',
        'onSendEnd',
        'onProcessEnd'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'animateDuration' : 'cm._config.animDuration',
        'showLoader' : true,
        'loaderDelay' : 'cm._config.loadDelay',
        'responseKey' : 'data',                                     // Instead of using filter callback, you can provide response array key
        'responseHTML' : true,                                      // If true, html will append automatically
        'ajax' : {
            'type' : 'json',
            'method' : 'POST',
            'url' : '',                                             // Request URL. Variables: %baseUrl%
            'params' : {                                            // Request URL. Variables: %baseUrl%, %request%, %response%
                'request' : '%request%',
                'response' : '%response%'
            }
        },
        'Com.Overlay' : {
            'position' : 'absolute',
            'autoOpen' : false,
            'removeOnClose' : true
        }
    },
    'strings' : {
        'server_error' : 'An unexpected error has occurred. Please try again later.'
    }
},
function(params){
    var that = this;

    that.nodes = {
        'container' : cm.node('div'),
        'request' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        },
        'buttons' : {
            'send' : cm.node('div')
        },
        'response' : {
            'container' : cm.node('div'),
            'inner' : cm.node('div')
        }
    };
    that.components = {};
    that.animations = {};

    that.ajaxHandler = null;
    that.isProcess = false;
    that.isRendering = false;
    that.loaderDelay = null;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        that.callbacksProcess();
        validateParams();
        that.addToStack(that.params['node']);
        that.triggerEvent('onRenderStart');
        render();
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        that.params['Com.Overlay']['container'] = that.nodes['container'];
    };

    var render = function(){
        // Overlay
        cm.getConstructor('Com.Overlay', function(classConstructor, className){
            that.components['loader'] = new classConstructor(that.params[className]);
        });
        // Animations
        that.animations['response'] = new cm.Animation(that.nodes['response']['container']);
        // Events
        cm.addEvent(that.nodes['buttons']['send'], 'click', that.send);
    };

    /* ******* CALLBACKS ******* */

    /* *** AJAX *** */

    that.callbacks.prepare = function(that, config){
        config = that.callbacks.beforePrepare(that, config);
        config['url'] = cm.strReplace(config['url'], {
            '%baseUrl%' : cm._baseUrl
        });
        config['params'] = cm.objectReplace(config['params'], {
            '%baseUrl%' : cm._baseUrl,
            '%request%' : cm.getFDO(that.nodes['request']['inner']),
            '%response%' : cm.getFDO(that.nodes['response']['inner'])
        });
        config = that.callbacks.afterPrepare(that, config);
        return config;
    };

    that.callbacks.beforePrepare = function(that, config){
        return config;
    };

    that.callbacks.afterPrepare = function(that, config){
        return config;
    };

    that.callbacks.request = function(that, config){
        config = that.callbacks.prepare(that, config);
        // Return ajax handler (XMLHttpRequest) to providing abort method.
        return cm.ajax(
            cm.merge(config, {
                'onStart' : function(){
                    that.callbacks.start(that);
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
                    that.callbacks.end(that);
                }
            })
        );
    };

    that.callbacks.filter = function(that, config, response){
        var data,
            dataItem = cm.objectSelector(that.params['responseKey'], response);
        if(dataItem && !cm.isEmpty(dataItem)){
            data = dataItem;
        }
        return data;
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
        that.triggerEvent('onProcessEnd', that.nodes['response']['inner']);
    };

    that.callbacks.response = function(that, config, response){
        if(!cm.isEmpty(response)){
            response = that.callbacks.filter(that, config, response);
        }
        if(!cm.isEmpty(response)){
            that.callbacks.success(that, response);
        }else{
            that.callbacks.error(that, config);
        }
    };

    that.callbacks.error = function(that, config){
        that.callbacks.renderError(that, config);
        that.triggerEvent('onError');
    };

    that.callbacks.success = function(that, response){
        that.callbacks.render(that, response);
        that.triggerEvent('onSuccess', response);
    };

    that.callbacks.abort = function(that, config){
        that.triggerEvent('onAbort');
    };

    /* *** RENDER *** */

    that.callbacks.renderTemporary = function(that){
        return cm.node('div', {'class' : 'form__temporary'});
    };

    that.callbacks.render = function(that, data){
        var nodes, temporary;
        if(that.params['responseHTML']){
            that.isRendering = true;
            temporary = that.callbacks.renderTemporary(that);
            nodes = cm.strToHTML(data);
            if(!cm.isEmpty(nodes)){
                if(cm.isNode(nodes)){
                    temporary.appendChild(nodes);
                }else{
                    while(nodes.length){
                        if(cm.isNode(nodes[0])){
                            temporary.appendChild(nodes[0]);
                        }else{
                            cm.remove(nodes[0]);
                        }
                    }
                }
            }
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.renderError = function(that, config){
        if(that.params['responseHTML']){
            that.isRendering = true;
            var temporary = that.callbacks.renderTemporary(that);
            temporary.appendChild(
                cm.node('div', {'class' : 'cm__empty'}, that.lang('server_error'))
            );
            that.callbacks.append(that, temporary);
        }
    };

    that.callbacks.append = function(that, temporary){
        var height;
        // Wrap old content
        if(!that.nodes['response']['temporary']){
            that.nodes['response']['temporary'] = that.callbacks.renderTemporary(that);
            cm.forEach(that.nodes['response']['inner'].childNodes, function(node){
                cm.appendChild(node, that.nodes['response']['temporary']);
            });
            cm.appendChild(that.nodes['response']['temporary'], that.nodes['response']['inner']);
        }
        cm.removeClass(that.nodes['response']['temporary'], 'is-show', true);
        // Append temporary
        cm.appendChild(temporary, that.nodes['response']['inner']);
        cm.addClass(temporary, 'is-show', true);
        // Animate
        cm.removeClass(that.nodes['response']['container'], 'is-loaded', true);
        cm.addClass(that.nodes['response']['container'], 'is-show', true);
        height = temporary.offsetHeight;
        that.animations['response'].go({
            'style' : {'height' : [height, 'px'].join('')},
            'duration' : that.params['animateDuration'],
            'anim' : 'smooth',
            'onStop' : function(){
                that.nodes['response']['container'].style.height = '';
                cm.remove(that.nodes['response']['temporary']);
                cm.addClass(that.nodes['response']['container'], 'is-loaded', true);
                that.nodes['response']['temporary'] = temporary;
                that.isRendering = false;
            }
        });
    };

    /* ******* PUBLIC ******* */

    that.send = function(){
        if(that.isProcess){
            that.abort();
        }
        if(!that.isProcess && !that.isRendering){
            that.ajaxHandler = that.callbacks.request(that, cm.clone(that.params['ajax']));
        }
        return that;
    };

    that.abort = function(){
        if(that.ajaxHandler && that.ajaxHandler.abort){
            that.ajaxHandler.abort();
        }
        return that;
    };

    init();
});
