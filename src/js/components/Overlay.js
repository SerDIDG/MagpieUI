cm.define('Com.Overlay', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onOpenEnd',
        'onCloseStart',
        'onClose',
        'onCloseEnd'
    ],
    'params' : {
        'name' : '',
        'container' : 'document.body',
        'appendMode' : 'appendChild',
        'theme' : 'default',                // transparent | default | light | solid-light | dark
        'className' : '',
        'position' : 'fixed',
        'lazy' : false,
        'delay' : 'cm._config.lazyDelay',
        'content' : null,
        'showSpinner' : true,
        'spinnerSize' : 'default',
        'showContent' : true,
        'showProgress' : false,
        'autoOpen' : true,
        'autoClose' : false,                // ToDo: implement
        'removeOnClose' : true,
        'destructOnRemove' : false,
        'transition' : 'ease',
        'duration' : 'cm._config.animDurationLong'
    }
},
function(params){
    var that = this;

    that.nodes = {};
    that.currentTheme = null;
    that.isDestructed = false;
    that.isOpen = false;
    that.isShowSpinner = false;
    that.isShowContent = false;
    that.openInterval = null;
    that.delayInterval = null;

    var init = function(){
        // Binds
        that.openHandler = that.open.bind(that);
        that.closeHandler = that.close.bind(that);
        that.toggleHandler = that.toggle.bind(that);
        // Params
        that.params['controllerEvents'] && that.bindControllerEvents(); // ToDo: move to abstract controller
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        validateParams();
        render();
        that.addToStack(that.nodes['container']);
        that.triggerEvent('onRender');
        that.params['autoOpen'] && that.open();
    };

    var getLESSVariables = function(){
        that.params['duration'] = cm.getTransitionDurationFromLESS('PtOverlay-Duration', that.params['duration']);
    };

    var validateParams = function(){
        that.params['position'] = cm.inArray(['static', 'relative', 'absolute', 'fixed'], that.params['position']) ? that.params['position'] : 'fixed';
    };

    var render = function(){
        // Structure
        that.nodes['container'] = cm.node('div', {'class' : 'com__overlay pt__overlay', 'aria-busy' : 'false', 'aria-live' : 'assertive'},
            that.nodes['spinner'] = cm.node('div', {'class' : ['overlay__spinner', ['size', that.params['spinnerSize']].join('--')]}),
            that.nodes['content'] = cm.node('div', {'class' : 'overlay__content'}),
            that.nodes['progress'] = cm.node('progress', {'class' : 'overlay__progress', 'value' : 0, 'min' : 0, 'max' : 100})
        );
        // CSS Class
        cm.addClass(that.nodes['container'], that.params['className']);
        cm.addClass(that.nodes['container'], ['transition', that.params['transition']].join('-'));
        // Set position
        that.nodes['container'].style.position = that.params['position'];
        // Set content
        !cm.isEmpty(that.params['content']) && that.setContent(that.params['content']);
        // Show spinner
        that.params['showSpinner'] && that.showSpinner();
        // Show content
        that.params['showContent'] && that.showContent();
        // Set theme
        that.setTheme(that.params['theme']);
    };

    var triggerOpenEvents = function(){
        that.triggerEvent('onOpen')
            .triggerEvent('onOpenEnd');
    };

    var triggerCloseEvents = function(){
        that.triggerEvent('onClose')
            .triggerEvent('onCloseEnd');
        if(that.params['removeOnClose']){
            that.remove();
        }
    };

    var openProcess = function(isImmediately, callback){
        that.isOpen = true;
        callback = cm.isFunction(callback) ? callback : function(){};
        // Set immediately animation hack
        if(isImmediately){
            cm.addClass(that.nodes['container'], 'is-immediately');
        }
        if(!cm.inDOM(that.nodes['container'])){
            cm[that.params['appendMode']](that.nodes['container'], that.params['container']);
        }
        that.triggerEvent('onOpenStart');
        that.nodes['container'].ariaBusy = 'true';
        cm.addClass(that.nodes['container'], 'is-open', true);
        // Remove immediately animation hack
        that.openInterval && clearTimeout(that.openInterval);
        if(isImmediately){
            that.openInterval = setTimeout(function(){
                cm.removeClass(that.nodes['container'], 'is-immediately');
                triggerOpenEvents();
                callback();
            }, 5);
        }else{
            that.openInterval = setTimeout(function(){
                triggerOpenEvents();
                callback();
            }, that.params['duration'] + 5);
        }
    };

    var closeProcess = function(isImmediately, callback){
        that.isOpen = false;
        callback = cm.isFunction(callback) ? callback : function(){};
        // Set immediately animation hack
        if(isImmediately){
            cm.addClass(that.nodes['container'], 'is-immediately');
        }
        that.triggerEvent('onCloseStart');
        that.nodes['container'].ariaBusy = 'false';
        cm.removeClass(that.nodes['container'], 'is-open');
        // Remove immediately animation hack
        that.openInterval && clearTimeout(that.openInterval);
        if(isImmediately){
            that.openInterval = setTimeout(function(){
                cm.removeClass(that.nodes['container'], 'is-immediately');
                triggerCloseEvents();
                callback();
            }, 5);
        }else{
            that.openInterval = setTimeout(function(){
                triggerCloseEvents();
                callback();
            }, that.params['duration'] + 5);
        }
    };

    /* ******* MAIN ******* */

    that.open = function(isImmediately, callback){
        if(!that.isOpen){
            if(that.params['lazy'] && !isImmediately){
                that.delayInterval && clearTimeout(that.delayInterval);
                that.delayInterval = setTimeout(function(){
                    openProcess(isImmediately, callback);
                }, that.params['delay']);
            }else{
                openProcess(isImmediately, callback);
            }
        }
        return that;
    };

    that.close = function(isImmediately, callback){
        that.openInterval && clearTimeout(that.openInterval);
        that.delayInterval && clearTimeout(that.delayInterval);
        if(that.isOpen){
            closeProcess(isImmediately, callback);
        }
        return that;
    };

    that.toggle = function(value){
        if(value){
            that.open();
        }else{
            that.close();
        }
        return that;
    };

    that.remove = function(){
        if(that.isOpen){
            that.close(function(){
                if(!that.params['removeOnClose']){
                    that.remove();
                }
            });
        }else{
            that.params['destructOnRemove'] && that.destruct();
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.setTheme = function(theme){
        that.currentTheme && cm.removeClass(that.nodes['container'], ['theme', that.currentTheme].join('-'));
        theme && cm.addClass(that.nodes['container'], ['theme', theme].join('-'));
        that.currentTheme = theme;
        return that;
    };

    that.showSpinner = function(){
        that.isShowSpinner = true;
        cm.addClass(that.nodes['spinner'], 'is-show');
        return that;
    };

    that.hideSpinner = function(){
        that.isShowSpinner = false;
        cm.removeClass(that.nodes['spinner'], 'is-show');
        return that;
    };

    that.setContent = function(node){
        if(cm.isEmpty(node)){
            cm.clearNode(that.nodes['content']);
        }else{
            if(!cm.isNode(node)){
                node = node.toString();
                node = cm.node('div', {'class' : 'inner', 'innerHTML' : node});
            }
            cm.appendChild(node, that.nodes['content']);
        }
        return that;
    };

    that.showContent = function(){
        that.isShowContent = true;
        cm.addClass(that.nodes['content'], 'is-show');
        return that;
    };

    that.hideContent = function(){
        that.isShowContent = false;
        cm.removeClass(that.nodes['content'], 'is-show');
        return that;
    };

    that.showProgress = function(){
        cm.addClass(that.nodes['progress'], 'is-show');
        return that;
    };

    that.hideProgress = function(){
        cm.removeClass(that.nodes['progress'], 'is-show');
        return that;
    };

    that.setProgress = function(total, value){
        that.nodes['progress'].max = total;
        that.nodes['progress'].value = value;
        if(that.params['showProgress']){
            that.showProgress();
        }
        return that;
    };

    that.embed = function(node, appendMode){
        appendMode = !cm.isUndefined(appendMode) ? appendMode : that.params['appendMode'];
        if(cm.isNode(node)){
            that.params['container'] = node;
            that.params['appendMode'] = appendMode;
            if(cm.inDOM(that.nodes['container'])){
                cm[that.params['appendMode']](that.nodes['container'], that.params['container']);
            }
        }
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            that.removeFromStack();
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.bindControllerEvents = function(){
        // ToDo: refactor overlay class to abstract controller
        cm.forEach(that._raw['events'], function(name){
            if(!that[name]){
                that[name] = function(){};
            }
            if(!that[name + 'Handler']){
                that[name + 'Handler'] = that[name].bind(that);
            }
            that.addEvent(name, that[name + 'Handler']);
        });
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});
