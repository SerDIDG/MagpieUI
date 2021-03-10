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
        'theme' : 'default',                // transparent | default | light | dark
        'className' : '',
        'position' : 'fixed',
        'lazy' : false,
        'delay' : 'cm._config.loadDelay',
        'showSpinner' : true,
        'showContent' : true,
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
        that.nodes['container'] = cm.Node('div', {'class' : 'com__overlay pt__overlay'},
            that.nodes['spinner'] = cm.Node('div', {'class' : 'overlay__spinner'}),
            that.nodes['content'] = cm.Node('div', {'class' : 'overlay__content'})
        );
        // CSS Class
        cm.addClass(that.nodes['container'], that.params['className']);
        cm.addClass(that.nodes['container'], ['transition', that.params['transition']].join('-'));
        // Set position
        that.nodes['container'].style.position = that.params['position'];
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

    that.toggle = function(){
        if(that.isOpen){
            that.hide();
        }else{
            that.show();
        }
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
        if(cm.isNode(node)){
            that.nodes['content'].appendChild(node);
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

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});
