cm.define('Com.Dialog', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig',
        'Stack'
    ],
    'events' : [
        'onRenderStart',
        'onRender',
        'onOpenStart',
        'onOpen',
        'onOpenEnd',
        'onCloseStart',
        'onClose',
        'onCloseEnd',
        'onScroll'
    ],
    'params' : {
        'container' : 'document.body',
        'name' : '',
        'size' : 'auto',                // auto | fullscreen
        'width' : 700,                  // number, %, px
        'height' : 'auto',              // number, %, px, auto
        'minHeight' : 0,                // number, %, auto, not applicable when using height
        'maxHeight' : 'auto',           // number, %, auto, not applicable when using height
        'position' : 'fixed',
        'indentY' : 24,
        'indentX' : 24,
        'animate' : false,
        'animateHeight' : false,
        'theme' : 'theme-light',        // theme css class name, default: theme-default | theme-black | theme-light
        'className' : '',               // custom css class name
        'content' : cm.node('div'),
        'contentValign' : 'top',        // top, center, bottom
        'scroll' : true,                // content scroll
        'showTitle' : true,
        'title' : '',
        'titleOverflow' : false,
        'titleReserve': true,
        'titleAlign': 'left',
        'closeButtonOutside' : false,
        'closeButton' : true,
        'closeOnBackground' : true,
        'closeOnDocument': false,
        'closeOnEsc' : true,
        'buttons' : false,
        'openTime' : null,
        'duration' : 'cm._config.animDuration',
        'autoOpen' : true,
        'appendOnRender' : false,
        'removeOnClose' : true,
        'destructOnRemove' : false,
        'documentScroll' : false,
        'icons' : {
            'closeInside' : 'icon default linked',
            'closeOutside' : 'icon default linked',
            'helpInside' : 'icon help linked',
            'helpOutside' : 'icon help linked'
        },

        'showHelp' : false,
        'help' : '',
        'helpConstructor' : 'Com.Tooltip',
        'helpParams' : {
            'hold' : true,
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'className' : 'com__dialog__tooltip',
            'animate' : 'drop-bottom-left',
            'width' : 'targetWidth -16',
            'top' : 8,
            'left' : 8,
            'position' : 'absolute',
            'duration' : 'cm._config.animDuration'
        },
    },
    'strings' : {
        'label': 'Dialog',
        'closeTitle' : 'Close',
        'close' : '',
        'helpTitle' : 'Help',
        'help' : ''
    }
},
function(params){
    var that = this,
        contentHeight,
        nodes = {};

    that.components = {};
    that.isOpen = false;
    that.isFocus = false;
    that.isRemoved = false;
    that.isDestructed = false;
    that.isMaximize = false;
    that.openInterval = null;
    that.resizeInterval = null;
    that.blinkingInterval = null;
    that.originalSize = {};
    that.maximizeSize = {
        'width' : '100%',
        'height' : '100%',
        'minHeight' : 0,
        'maxHeight' : 'auto',
        'indentX' : 0,
        'indentY' : 0
    };

    var init = function(){
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['content']);
        validateParams();
        that.triggerEvent('onRenderStart');
        render();
        that.addToStack(nodes['container']);
        // Trigger onRender event
        that.triggerEvent('onRender');
        // Open
        that.params['autoOpen'] && open();
    };

    var getLESSVariables = function(){
        that.params['duration'] = cm.getTransitionDurationFromLESS('ComDialog-Duration', that.params['duration']);
    };

    var validateParams = function(){
        if(that.params['openTime'] !== undefined && that.params['openTime'] !== null){
            that.params['duration'] = that.params['openTime'];
        }
        if(!that.params['showTitle']){
            that.params['titleReserve'] = false;
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.node('div', {'class' : 'com__dialog', 'role' : 'dialog', 'aria-modal': 'true'},
            nodes['bg'] = cm.node('div', {'class' : 'bg'}),
            nodes['window'] = cm.node('div', {'class' : 'com__dialog__window window'},
                nodes['windowInner'] = cm.node('div', {'class' : 'inner'})
            )
        );
        if(that.params['appendOnRender']){
            that.params['container'].appendChild(nodes['container']);
        }
        // Set params styles
        nodes['container'].style.position = that.params['position'];
        nodes['window'].style.width = that.params['width'] + 'px';
        // Add CSS Classes
        cm.addClass(nodes['container'], that.params['theme']);
        cm.addClass(nodes['window'], that.params['theme']);
        cm.addClass(nodes['container'], that.params['className']);
        if(that.params['animate']){
            cm.addClass(nodes['container'], 'is-animate');
            cm.addClass(nodes['window'], 'is-animate');
        }
        if(that.params['size'] === 'full'){
            cm.addClass(nodes['container'], 'is-full');
            cm.addClass(nodes['window'], 'is-full');
        }
        if(that.params['titleReserve']){
            cm.addClass(nodes['container'], 'is-title-reserve');
            cm.addClass(nodes['window'], 'is-title-reserve');
        }
        // Render close button
        if(that.params['closeButtonOutside']){
            nodes['closeOutside'] = cm.node('div', {
                'class' : that.params['icons']['closeOutside'],
                'title' : that.lang('closeTitle'),
                'role' : 'button',
                'tabindex' : 0,
            }, that.lang('close'));
            cm.appendChild(nodes['closeOutside'], nodes['bg']);
            cm.click.add(nodes['closeOutside'], close);
        }
        if(that.params['closeButton']){
            cm.addClass(nodes['container'], 'has-close-inside');
            cm.addClass(nodes['window'], 'has-close-inside');
            nodes['closeInside'] = cm.node('div', {
                'class' : that.params['icons']['closeInside'],
                'title' : that.lang('closeTitle'),
                'role' : 'button',
                'tabindex' : 0,
            }, that.lang('close'));
            cm.insertFirst(nodes['closeInside'], nodes['window']);
            cm.click.add(nodes['closeInside'], close);
        }
        if(that.params['closeOnBackground']){
            cm.addClass(nodes['container'], 'has-close-background');
            cm.addEvent(nodes['bg'], 'click', close);
        }
        // Render help button
        if(that.params['showHelp']){
            nodes['window'].appendChild(
                nodes['helpInside'] = cm.node('div', {'class' : that.params['icons']['helpInside'], 'title' : that.lang('helpTitle')}, that.lang('help'))
            );
        }
        // Set title
        renderTitle(that.params['title']);
        // Embed content
        renderContent(that.params['content']);
        // Embed buttons
        renderButtons(that.params['buttons']);
        // Set title
        renderHelp(that.params['help']);
        // Events
        cm.addEvent(nodes['container'], 'mouseover', function(e){
            var target = cm.getEventTarget(e);
            if(cm.isParent(nodes['container'], target, true)){
                that.isFocus = true;
            }
        });
        cm.addEvent(nodes['container'], 'mouseout', function(e){
            var target = cm.getRelatedTarget(e);
            if(!cm.isParent(nodes['container'], target, true)){
                that.isFocus = false;
            }
        });
        // Resize
        animFrame(resize);
    };

    var renderTitle = function(title){
        // Remove old nodes
        cm.remove(nodes['title']);
        // Set new title
        if(that.params['showTitle']){
            cm.removeClass(nodes['container'], 'has-no-title');
            cm.removeClass(nodes['window'], 'has-no-title');
            // Render new nodes
            nodes['title'] = cm.node('div', {'class' : 'title', 'role' : 'heading'});
            if(!cm.isEmpty(title)){
                if(cm.isNode(title)){
                    cm.appendChild(title, nodes['title']);
                }else{
                    cm.appendChild(cm.textNode(title), nodes['title']);
                }
                if(that.params['titleOverflow']){
                    cm.addClass(nodes['title'], 'cm__text-overflow');
                }
            }
            if(cm.inArray(['left', 'center', 'right'], that.params['titleAlign'])){
                cm.addClass(nodes['title'], ['is-align', that.params['titleAlign']].join('-'));
            }
            cm.insertFirst(nodes['title'], nodes['windowInner']);
        }else{
            var label = cm.isNode(title) ? title.textContent : title;
            if(cm.isEmpty(title)){
                label = that.msg('label');
            }
            nodes['container'].setAttribute('aria-label', label);
            cm.addClass(nodes['container'], 'has-no-title');
            cm.addClass(nodes['window'], 'has-no-title');
        }
    };

    var renderContent = function(node){
        if(!nodes['descr']){
            nodes['descr'] = cm.node('div', {'class' : 'descr'},
                nodes['scroll'] = cm.node('div', {'class' : 'scroll com__dialog__scroll'},
                    nodes['inner'] = cm.node('div', {'class' : 'inner com__dialog__inner'})
                )
            );
            if(!that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-no-scroll');
            }
            if(cm.inArray(['top', 'center', 'bottom'], that.params['contentValign'])){
                cm.addClass(nodes['scroll'], ['is-valign', that.params['contentValign']].join('-'));
            }
            if(nodes['title']){
                cm.insertAfter(nodes['descr'], nodes['title']);
            }else if(nodes['buttons']){
                cm.insertBefore(nodes['descr'], nodes['buttons']);
            }else{
                cm.insertLast(nodes['descr'], nodes['windowInner']);
            }
            cm.addEvent(nodes['scroll'], 'scroll', function(event){
                that.triggerEvent('onScroll', event);
            });
        }
        if(cm.isNode(node)){
            cm.clearNode(nodes['inner']).appendChild(node);
        }
    };

    var renderButtons = function(node){
        if(cm.isNode(node)){
            // Remove old nodes
            cm.remove(nodes['buttons']);
            // Render new nodes
            nodes['buttons'] = cm.node('div', {'class' : 'buttons'}, node);
            cm.insertLast(nodes['buttons'], nodes['windowInner']);
        }
    };

    var renderHelp = function(node){
        if(that.params['showHelp']){
            if(!nodes['help']){
                nodes['help'] = cm.node('div', {'class' : 'com__dialog__help'});
                // Render tooltip
                cm.getConstructor(that.params['helpConstructor'], function(classConstructor){
                    that.components['help'] = new classConstructor(
                        cm.merge(that.params['helpParams'], {
                            'target' : nodes['helpInside'],
                            'content' : nodes['help'],
                            'positionTarget' : nodes['descr'],
                            'container' : nodes['container'],
                            'holdTarget' : nodes['container']
                        })
                    );
                });
            }
            cm.clearNode(nodes['help']);
            // Append
            if(cm.isNode(node)){
                cm.appendChild(node, nodes['help']);
            }else{
                nodes['help'].innerHTML = node;
            }
        }
    };

    var stateHelper = function(){
        if(
            /full|fullscreen/.test(that.params['size']) ||
            cm.getPageSize('winWidth') <= cm._config.screenTabletPortrait
        ){
            that.maximize();
        }else{
            that.restore();
        }
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var winOffset = cm.getNodeOffset(nodes['container']),
            winHeight = winOffset['inner']['height'] - (that.params['indentY'] * 2),
            winWidth = winOffset['inner']['width'] - (that.params['indentX'] * 2),
            windowHeight = nodes['window'].offsetHeight,
            windowWidth = nodes['window'].offsetWidth,
            insetHeight = nodes['inner'].offsetHeight,

            AWidth,
            AHeight,
            NAHeight,

            maxHeight,
            minHeight,
            setHeight,
            setWidth;
        // Calculate available width / height
        AHeight = winHeight
            - (nodes['title'] && nodes['title'].offsetHeight || 0)
            - (nodes['buttons'] && nodes['buttons'].offsetHeight || 0)
            - cm.getIndentY(nodes['windowInner'])
            - cm.getIndentY(nodes['descr']);
        NAHeight = winHeight - AHeight;
        AWidth = winWidth;
        // Calculate min / max height
        if(that.params['maxHeight'] === 'auto'){
            maxHeight = AHeight;
        }else if(/%/.test(that.params['maxHeight'])){
            maxHeight = ((winHeight / 100) * parseFloat(that.params['maxHeight'])) - NAHeight;
        }else{
            if(/px/.test(that.params['maxHeight'])){
                that.params['maxHeight'] = parseFloat(that.params['maxHeight']);
            }
            maxHeight = that.params['maxHeight'] - NAHeight;
        }
        if(that.params['minHeight'] === 'auto'){
            minHeight = 0;
        }else if(/%/.test(that.params['minHeight'])){
            minHeight = ((winHeight / 100) * parseFloat(that.params['minHeight'])) - NAHeight;
        }else{
            if(/px/.test(that.params['minHeight'])){
                that.params['minHeight'] = parseFloat(that.params['minHeight']);
            }
            minHeight = that.params['minHeight'] - NAHeight;
        }
        // Calculate height
        if(that.params['height'] === 'auto'){
            if(insetHeight < minHeight){
                setHeight = minHeight;
            }else if(insetHeight > maxHeight){
                setHeight = maxHeight;
            }else{
                setHeight = insetHeight;
            }
        }else if(/%/.test(that.params['height'])){
            setHeight = ((winHeight / 100) * parseFloat(that.params['height'])) - NAHeight;
        }else{
            if(/px/.test(that.params['height'])){
                that.params['height'] = parseFloat(that.params['height']);
            }
            setHeight = that.params['height'] - NAHeight;
        }
        setHeight = Math.min(
            Math.max(setHeight, minHeight, 0),
            AHeight
        );
        // Calculate width
        if(/%/.test(that.params['width'])){
            setWidth = ((winWidth / 100) * parseFloat(that.params['width']));
        }else{
            if(/px/.test(that.params['width'])){
                that.params['width'] = parseFloat(that.params['width']);
            }
            setWidth = that.params['width'];
        }
        setWidth = Math.min(setWidth, AWidth);
        // Set window height
        if(windowHeight !== setHeight + NAHeight || contentHeight !== insetHeight){
            contentHeight = insetHeight;
            if(insetHeight <= setHeight){
                cm.removeClass(nodes['scroll'], 'is-scroll');
            }else if(that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-scroll');
            }
            nodes['scroll'].style.height = [setHeight, 'px'].join('');
        }
        // Set window width
        if(windowWidth !== setWidth){
            nodes['window'].style.width = [setWidth, 'px'].join('');
        }
    };

    var open = function(params){
        params = {
            'onEnd' : function(){}
        };
        if(!that.isOpen){
            that.isOpen = true;
            that.isFocus = true;
            that.isRemoved = false;
            if(!cm.inDOM(nodes['container'])){
                that.params['container'].appendChild(nodes['container']);
            }
            nodes['container'].style.display = 'block';
            stateHelper();
            resizeHelper();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.bodyScroll.add(nodes['container']);
            }
            // Add close event on Esc press
            cm.addEvent(window, 'click', windowClickEvent);
            cm.addEvent(window, 'keydown', windowKeyEvent);
            cm.addEvent(window, 'resize', windowResizeEvent);
            // Animate
            cm.addClass(nodes['container'], 'is-open', true);
            cm.addClass(nodes['window'], 'is-open', true);
            that.openInterval && clearTimeout(that.openInterval);
            that.openInterval = setTimeout(function(){
                params['onEnd']();
                // Start height animation
                if(that.params['animateHeight']){
                    cm.addClass(nodes['scroll'], 'is-animate');
                }
                // Open Event
                that.triggerEvent('onOpen');
                that.triggerEvent('onOpenEnd');
            }, that.params['duration']);
            // Open Event
            that.triggerEvent('onOpenStart');
        }
    };

    var close = function(params){
        params = {
            'onEnd' : function(){}
        };
        if(that.isOpen){
            that.isOpen = false;
            that.isFocus = false;
            // Remove close event on Esc press
            cm.removeEvent(window, 'click', windowClickEvent);
            cm.removeEvent(window, 'keydown', windowKeyEvent);
            cm.removeEvent(window, 'resize', windowResizeEvent);
            // Stop height animation
            if(that.params['animateHeight']){
                cm.removeClass(nodes['scroll'], 'is-animate');
            }
            // Animate
            cm.removeClass(nodes['container'], 'is-open', true);
            cm.removeClass(nodes['window'], 'is-open', true);
            that.openInterval && clearTimeout(that.openInterval);
            that.openInterval = setTimeout(function(){
                clearResizeInterval();
                // Show / Hide Document Scroll
                if(!that.params['documentScroll']){
                    cm.bodyScroll.remove(nodes['container']);
                }
                // Remove Window
                nodes['container'].style.display = 'none';
                that.params['removeOnClose'] && remove();
                params['onEnd']();
                // Close Event
                that.triggerEvent('onClose');
                that.triggerEvent('onCloseEnd');
            }, that.params['duration']);
            // Close Event
            that.triggerEvent('onCloseStart');
        }
    };

    var remove = function(forceRemove){
        if(!that.isRemoved){
            that.isRemoved = true;
            if(forceRemove || that.params['destructOnRemove']){
                that.destruct();
            }
            // Remove dialog container node
            cm.remove(nodes['container']);
        }
    };

    var windowResizeEvent = function(e){
        preventBlinking();
        stateHelper();
    };

    var windowKeyEvent = function(e){
        // Close dialog when ESC key pressed
        cm.handleKey(e, 'Escape', function(){
            if(that.params['closeOnEsc'] && that.isFocus){
                close();
            }
        });
    };

    var windowClickEvent = function(e) {
        if(that.params['closeOnDocument']){
            var target = cm.getEventTarget(e);
            if(!cm.isParent(nodes['container'], target, true)){
                close();
            }
        }
    };

    var clearResizeInterval = function(){
        that.resizeInterval && clearTimeout(that.resizeInterval);
    };

    var preventBlinking = function() {
        cm.addClass(nodes['container'], 'cm__transition-disable');
        that.blinkingInterval && clearTimeout(that.blinkingInterval);
        that.blinkingInterval = setTimeout(function() {
            cm.removeClass(nodes['container'], 'cm__transition-disable');
        }, 30);
    };

    /* ******* MAIN ******* */

    that.set = function(title, content, buttons){
        renderTitle(title);
        renderContent(content);
        renderButtons(buttons);
        return that;
    };

    that.setTitle = function(title){
        renderTitle(title);
        return that;
    };

    that.setContent = function(content){
        renderContent(content);
        return that;
    };

    that.setButtons = function(buttons){
        renderButtons(buttons);
        return that;
    };

    that.open = function(){
        open();
        return that;
    };

    that.close = function(){
        close();
        return that;
    };

    that.setSize = function(data){
        var params = ['width', 'height', 'minHeight', 'maxHeight'];
        cm.forEach(params, function(key) {
            if (!cm.isEmpty(data[key])) {
                that.params[key] = data[key];
            }
        });
        return that;
    };

    that.setWidth = function(width){
        that.params['width'] = width;
        return that;
    };

    that.setHeight = function(height){
        that.params['height'] = height;
        return that;
    };

    that.setMinHeight = function(height){
        that.params['minHeight'] = height;
        return that;
    };

    that.setMaxHeight = function(height){
        that.params['maxHeight'] = height;
        return that;
    };

    that.maximize = function(){
        if(!that.isMaximize){
            that.isMaximize = true;
            cm.forEach(that.maximizeSize, function(value, key){
                that.originalSize[key] = that.params[key];
                that.params[key] = value;
            });
            cm.addClass(nodes['container'], 'is-fullscreen');
            cm.addClass(nodes['window'], 'is-fullscreen');
        }
        return that;
    };

    that.restore = function(){
        if(that.isMaximize){
            that.isMaximize = false;
            cm.forEach(that.originalSize, function(value, key){
                that.params[key] = value;
            });
            cm.removeClass(nodes['container'], 'is-fullscreen');
            cm.removeClass(nodes['window'], 'is-fullscreen');
        }
        return that;
    };

    that.remove = function(forceRemove){
        if(that.isOpen){
            close({
                'onEnd' : function(){
                    if(forceRemove || !that.params['removeOnClose']){
                        remove(forceRemove);
                    }
                }
            });
        }else{
            remove(forceRemove);
        }
        return that;
    };

    that.destruct = function(){
        if(!that.isDestructed){
            that.isDestructed = true;
            cm.customEvent.trigger(nodes['container'], 'destruct', {
                'direction' : 'child',
                'self' : false
            });
            that.removeFromStack();
            that.remove(true);
        }
        return that;
    };

    that.isOwnNode = function(node){
        return cm.isParent(nodes['window'], node, true);
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});
