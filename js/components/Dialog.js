Com.Elements['Dialog'] = {};

Com['GetDialog'] = function(id){
    return Com.Elements.Dialog[id] || null;
};

Com['SetDialog'] = function(id, dialog){
    if(id && dialog){
        Com.Elements.Dialog[id] = dialog;
        return dialog;
    }
    return false;
};

Com['RemoveDialog'] = function(id){
    if(Com.Elements.Dialog[id]){
        delete Com.Elements.Dialog[id];
    }
};

cm.define('Com.Dialog', {
    'modules' : [
        'Params',
        'Events',
        'Langs',
        'DataConfig'
    ],
    'events' : [
        'onRender',
        'onOpenStart',
        'onOpen',
        'onCloseStart',
        'onClose'
    ],
    'params' : {
        'container' : 'document.body',
        'id' : null,
        'size' : 'auto',                // auto | fullscreen
        'width' : 700,                  // number, %
        'height' : 'auto',              // number, %, auto
        'minHeight' : 0,                // number, %, auto, not applicable when using height
        'maxHeight' : 'auto',           // number, %, auto, not applicable when using height
        'position' : 'fixed',
        'indentY' : 24,
        'indentX' : 24,
        'theme' : 'theme-default',      // theme css class name, default: theme-default
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
        'openTime' : 200,
        'autoOpen' : true,
        'appendOnRender' : true,
        'removeOnClose' : true,
        'scroll' : true,
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
        resizeInt,
        nodes = {},
        anim = {};

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['content']);
        validateParams();
        render();
        // Add to global array
        Com['SetDialog'](that.params['id'], that);
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
                nodes['closeOutside'] = cm.Node('div', {'class' : that.params['icons']['closeOutside']}, that.params['langs']['close'])
            );
            if(that.params['closeTitle']){
                nodes['closeOutside'].title = that.params['langs']['closeTitle'];
            }
            cm.addEvent(nodes['closeOutside'], 'click', close);
        }
        if(that.params['closeButton']){
            cm.addClass(nodes['container'], 'has-close-inside');
            nodes['window'].appendChild(
                nodes['closeInside'] = cm.Node('div', {'class' : that.params['icons']['closeInside']},
                    that.params['langs']['close']
                )
            );
            if(that.params['closeTitle']){
                nodes['closeInside'].title = that.params['langs']['closeTitle'];
            }
            cm.addEvent(nodes['closeInside'], 'click', close);
        }
        if(that.params['closeOnBackground']){
            cm.addClass(nodes['container'], 'has-close-background');
            cm.addEvent(nodes['bg'], 'click', close);
            if(that.params['closeTitle']){
                nodes['bg'].title = that.params['langs']['closeTitle'];
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
        // Trigger onRender event
        that.triggerEvent('onRender');
    };

    var renderTitle = function(title){
        if(!cm.isEmpty(title)){
            // Remove old nodes
            cm.remove(nodes['title']);
            // Render new nodes
            nodes['title'] = cm.Node('div', {'class' : 'title'}, title);
            if(that.params['titleOverflow']){
                cm.addClass(nodes['title'], 'cm__text-overflow');
            }
            cm.insertFirst(nodes['title'], nodes['windowInner']);
        }
    };

    var renderContent = function(node){
        if(!nodes['descr']){
            nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                    nodes['inner'] = cm.Node('div', {'class' : 'inner'})
                )
            );
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
            maxHeight = that.params['maxHeight'] - NAHeight;
        }
        if(that.params['minHeight'] == 'auto'){
            minHeight = 0;
        }else if(/%/.test(that.params['minHeight'])){
            minHeight = ((winHeight / 100) * parseFloat(that.params['minHeight'])) - NAHeight;
        }else{
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
            setHeight = that.params['height'] - NAHeight;
        }
        setHeight = Math.min(Math.max(setHeight, 0), AHeight);
        // Calculate width
        if(/%/.test(that.params['width'])){
            setWidth = ((winWidth / 100) * parseFloat(that.params['width']));
        }else{
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

    var open = function(){
        if(!cm.inDOM(nodes['container'])){
            that.params['container'].appendChild(nodes['container']);
        }
        nodes['container'].style.display = 'block';
        // Resize interval, will be removed on close
        resizeInt = setInterval(resize, 5);
        // Add close event on Esc press
        cm.addEvent(window, 'keydown', windowClickEvent);
        // Animate
        anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : that.params['openTime'], 'onStop' : function(){
            // Open Event
            that.triggerEvent('onOpen');
        }});
        // Open Event
        that.triggerEvent('onOpenStart');
    };

    var close = function(){
        // Remove resize interval
        resizeInt && clearInterval(resizeInt);
        // Remove close event on Esc press
        cm.removeEvent(window, 'keydown', windowClickEvent);
        // Animate
        anim['container'].go({'style' : {'opacity' : '0'}, 'duration' : that.params['openTime'], 'onStop' : function(){
            nodes['container'].style.display = 'none';
            // Close Event
            that.triggerEvent('onClose');
            // Remove Window
            that.params['removeOnClose'] && remove();
        }});
        // Close Event
        that.triggerEvent('onCloseStart');
    };

    var remove = function(){
        // Remove resize interval
        resizeInt && clearInterval(resizeInt);
        // Remove dialog container node
        cm.remove(nodes['container']);
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            close();
        }
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
        remove();
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
});