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
        'onCloseStart',
        'onClose'
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
        'theme' : 'theme-light',        // theme css class name, default: theme-default | theme-black | theme-light
        'className' : '',               // custom css class name
        'content' : cm.Node('div'),
        'title' : '',
        'buttons' : false,
        'titleOverflow' : false,
        'titleReserve': true,
        'closeButtonOutside' : false,
        'closeButton' : true,
        'closeTitle' : true,
        'closeOnBackground' : false,
        'openTime' : 'cm._config.animDuration',
        'autoOpen' : true,
        'appendOnRender' : false,
        'removeOnClose' : true,
        'destructOnRemove' : false,
        'scroll' : true,
        'documentScroll' : false,
        'icons' : {
            'closeInside' : 'icon default linked',
            'closeOutside' : 'icon default linked'
        },
        'langs' : {
            'closeTitle' : 'Close',
            'close' : ''
        }
    }
},
function(params){
    var that = this,
        contentHeight,
        nodes = {},
        anim = {};

    that.isOpen = false;
    that.isFocus = false;
    that.isRemoved = false;
    that.isDestructed = false;
    that.resizeInterval = null;

    var init = function(){
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
    
    var validateParams = function(){
        if(that.params['size'] == 'fullscreen'){
            that.params['width'] = '100%';
            that.params['height'] = '100%';
            that.params['indentX'] = 0;
            that.params['indentY'] = 0;
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__dialog'},
            nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
            nodes['window'] = cm.Node('div', {'class' : 'window'},
                nodes['windowInner'] = cm.Node('div', {'class' : 'inner'})
            )
        );
        if(that.params['appendOnRender']){
            that.params['container'].appendChild(nodes['container']);
        }
        // Set that.params styles
        nodes['container'].style.position = that.params['position'];
        nodes['window'].style.width = that.params['width'] + 'px';
        // Add CSS Classes
        !cm.isEmpty(that.params['theme']) && cm.addClass(nodes['container'], that.params['theme']);
        !cm.isEmpty(that.params['className']) && cm.addClass(nodes['container'], that.params['className']);
        if(that.params['size'] == 'fullscreen'){
            cm.addClass(nodes['container'], 'is-fullscreen');
        }
        if(that.params['titleReserve']){
            cm.addClass(nodes['container'], 'is-title-reserve');
        }
        // Render close button
        if(that.params['closeButtonOutside']){
            nodes['bg'].appendChild(
                nodes['closeOutside'] = cm.Node('div', {'class' : that.params['icons']['closeOutside']}, that.lang('close'))
            );
            if(that.params['closeTitle']){
                nodes['closeOutside'].title = that.lang('closeTitle');
            }
            cm.addEvent(nodes['closeOutside'], 'click', close);
        }
        if(that.params['closeButton']){
            cm.addClass(nodes['container'], 'has-close-inside');
            nodes['window'].appendChild(
                nodes['closeInside'] = cm.Node('div', {'class' : that.params['icons']['closeInside']}, that.lang('close'))
            );
            if(that.params['closeTitle']){
                nodes['closeInside'].title = that.lang('closeTitle');
            }
            cm.addEvent(nodes['closeInside'], 'click', close);
        }
        if(that.params['closeOnBackground']){
            cm.addClass(nodes['container'], 'has-close-background');
            cm.addEvent(nodes['bg'], 'click', close);
            if(that.params['closeTitle']){
                nodes['bg'].title = that.lang('closeTitle');
            }
        }
        // Set title
        renderTitle(that.params['title']);
        // Embed content
        renderContent(that.params['content']);
        // Embed buttons
        renderButtons(that.params['buttons']);
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
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
        if(!cm.isEmpty(title)){
            cm.removeClass(nodes['container'], 'has-no-title');
            // Remove old nodes
            cm.remove(nodes['title']);
            // Render new nodes
            nodes['title'] = cm.Node('div', {'class' : 'title'}, title);
            if(that.params['titleOverflow']){
                cm.addClass(nodes['title'], 'cm__text-overflow');
            }
            cm.insertFirst(nodes['title'], nodes['windowInner']);
        }else{
            cm.addClass(nodes['container'], 'has-no-title');
        }
    };

    var renderContent = function(node){
        if(!nodes['descr']){
            nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                    nodes['inner'] = cm.Node('div', {'class' : 'inner com__dialog__inner'})
                )
            );
            if(!that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-no-scroll');
            }
            if(nodes['title']){
                cm.insertAfter(nodes['descr'], nodes['title']);
            }else if(nodes['buttons']){
                cm.insertBefore(nodes['descr'], nodes['buttons']);
            }else{
                cm.insertLast(nodes['descr'], nodes['windowInner']);
            }
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
            nodes['buttons'] = cm.Node('div', {'class' : 'buttons'}, node);
            cm.insertLast(nodes['buttons'], nodes['windowInner']);
        }
    };

    var resizeHelper = function(){
        resize();
        clearResizeInterval();
        that.resizeInterval = setTimeout(resizeHelper, that.params['resizeInterval']);
    };

    var resize = function(){
        var winHeight = nodes['container'].offsetHeight - (that.params['indentY'] * 2),
            winWidth = nodes['container'].offsetWidth - (that.params['indentX'] * 2),
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
        if(that.params['maxHeight'] == 'auto'){
            maxHeight = AHeight;
        }else if(/%/.test(that.params['maxHeight'])){
            maxHeight = ((winHeight / 100) * parseFloat(that.params['maxHeight'])) - NAHeight;
        }else{
            if(/px/.test(that.params['maxHeight'])){
                that.params['maxHeight'] = parseFloat(that.params['maxHeight']);
            }
            maxHeight = that.params['maxHeight'] - NAHeight;
        }
        if(that.params['minHeight'] == 'auto'){
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
        if(that.params['height'] == 'auto'){
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
        if(windowHeight != setHeight + NAHeight || contentHeight != insetHeight){
            contentHeight = insetHeight;
            if(insetHeight <= setHeight){
                cm.removeClass(nodes['scroll'], 'is-scroll');
            }else if(that.params['scroll']){
                cm.addClass(nodes['scroll'], 'is-scroll');
            }
            nodes['scroll'].style.height = [setHeight, 'px'].join('');
        }
        // Set window width
        if(windowWidth != setWidth){
            nodes['window'].style.width = [setWidth, 'px'].join('')
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
            resizeHelper();
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.addClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Add close event on Esc press
            cm.addEvent(window, 'keydown', windowClickEvent);
            // Animate
            anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : that.params['openTime'], 'onStop' : function(){
                params['onEnd']();
                // Open Event
                that.triggerEvent('onOpen');
            }});
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
            cm.removeEvent(window, 'keydown', windowClickEvent);
            // Show / Hide Document Scroll
            if(!that.params['documentScroll']){
                cm.removeClass(cm.getDocumentHtml(), 'cm__scroll--none');
            }
            // Animate
            anim['container'].go({
                'style' : {'opacity' : '0'},
                'duration' : that.params['openTime'],
                'onStop' : function(){
                    clearResizeInterval();
                    nodes['container'].style.display = 'none';
                    // Remove Window
                    that.params['removeOnClose'] && remove();
                    params['onEnd']();
                    // Close Event
                    that.triggerEvent('onClose');
                }
            });
            // Close Event
            that.triggerEvent('onCloseStart');
        }
    };

    var remove = function(){
        if(!that.isRemoved){
            that.isRemoved = true;
            if(that.params['destructOnRemove'] && !that.isDestructed){
                that.isDestructed = true;
                cm.customEvent.trigger(nodes['container'], 'destruct', {
                    'type' : 'child',
                    'self' : false
                });
                that.removeFromStack();
                that.triggerEvent('onClose');
            }
            // Remove dialog container node
            cm.remove(nodes['container']);
        }
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        // ESC key
        if(e.keyCode == 27){
            that.isFocus && close();
        }
    };

    var clearResizeInterval = function(){
        that.resizeInterval && clearTimeout(that.resizeInterval);
        that.resizeInterval = null;
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

    that.remove = function(){
        if(that.isOpen){
            close({
                'onEnd' : function(){
                    if(!that.params['removeOnClose']){
                        remove();
                    }
                }
            });
        }else{
            remove();
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