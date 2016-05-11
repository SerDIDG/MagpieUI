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
        'theme' : 'default',            // transparent | default | light | dark
        'position' : 'fixed',
        'showSpinner' : true,
        'showContent' : true,
        'autoOpen' : true,
        'removeOnClose' : true,
        'duration' : 'cm._config.animDurationLong'
    }
},
function(params){
    var that = this,
        themes = ['transparent', 'default', 'light', 'dark'];

    that.nodes = {};
    that.isOpen = false;
    that.isShowSpinner = false;
    that.isShowContent = false;
    that.openInterval = null;

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
        that.params['duration'] = cm.getLESSVariable('PtOverlay-Duration', that.params['duration']);
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
        // Set position
        that.nodes['container'].style.position = that.params['position'];
        // Show spinner
        that.params['showSpinner'] && that.showSpinner();
        // Show content
        that.params['showContent'] && that.showContent();
        // Set theme
        that.setTheme(that.params['theme']);
    };

    var openHelper = function(){
        that.triggerEvent('onOpen')
            .triggerEvent('onOpenEnd');
    };

    var closeHelper = function(){
        that.triggerEvent('onClose')
            .triggerEvent('onCloseEnd');
        if(that.params['removeOnClose']){
            cm.remove(that.nodes['container']);
        }
    };

    /* ******* MAIN ******* */

    that.open = function(isImmediately){
        if(!that.isOpen){
            that.isOpen = true;
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
                    openHelper();
                }, 5);
            }else{
                that.openInterval = setTimeout(function(){
                    openHelper();
                }, that.params['duration'] + 5);
            }
        }
        return that;
    };

    that.close = function(isImmediately){
        if(that.isOpen){
            that.isOpen = false;
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
                    closeHelper();
                }, 5);
            }else{
                that.openInterval = setTimeout(function(){
                    closeHelper();
                }, that.params['duration'] + 5);
            }
        }
        // Close Event
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
            that.close();
            if(!that.params['removeOnClose']){
                setTimeout(function(){
                    cm.remove(that.nodes['container']);
                }, that.params['duration'] + 5);
            }
        }else{
            cm.remove(that.nodes['container']);
        }
        return that;
    };

    that.setTheme = function(theme){
        if(cm.inArray(themes, theme)){
            cm.addClass(that.nodes['container'], ['theme', theme].join('-'));
            cm.forEach(themes, function(item){
                if(item != theme){
                    cm.removeClass(that.nodes['container'], ['theme', item].join('-'));
                }
            });
        }
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

    that.embed = function(node){
        if(cm.isNode(node)){
            that.params['container'] = node;
            node.appendChild(that.nodes['container']);
        }
        return that;
    };

    that.getNodes = function(key){
        return that.nodes[key] || that.nodes;
    };

    init();
});