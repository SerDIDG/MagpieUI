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

Com['Dialog'] = function(o){
    var that = this,
        config = cm.merge({
            'configMarker' : 'data-config',
            'id' : null,
            'width' : 700,
            'minHeight' : 0,
            'maxHeight' : 'auto',
            'position' : 'fixed',
            'indentY' : 24,
            'indentX' : 24,
            'className' : '',
            'container' : document.body,
            'content' : cm.Node('div'),
            'title' : '',
            'buttons' : false,
            'closeButtonOutside' : false,
            'closeButton' : true,
            'closeTitle' : true,
            'closeOnBackground' : false,
            'openTime' : 200,
            'autoOpen' : true,
            'removeOnClose' : true,
            'scroll' : true,
            'clickEventName' : 'click',
            'events' : {},
            'icons' : {
                'closeInside' : 'icon default linked',
                'closeOutside' : 'icon default linked'
            },
            'langs' : {
                'closeTitle' : 'Close',
                'close' : ''
            }
        }, o),
        API = {
            'onOpenStart' : [],
            'onOpen' : [],
            'onCloseStart' : [],
            'onClose' : []
        },
        height,
        width,
        innerHeight,
        resizeInt,
        nodes = {},
        anim = {};

    var init = function(){
        // Convert events and deprecated event model
        convertEvents(config['events']);
        that.addEvent('onOpenStart', config['onOpenStart']);
        that.addEvent('onOpen', config['onOpen']);
        that.addEvent('onCloseStart', config['onCloseStart']);
        that.addEvent('onClose', config['onClose']);
        // Get data config
        getConfig(config['content'], config['configMarker']);
        // Render
        render();
        // Open
        config['autoOpen'] && open();
    };

    var render = function(){
        // Add to global array
        Com['SetDialog'](config['id'], that);
        // Structure
        config['container'].appendChild(
            nodes['container'] = cm.Node('div', {'class' : 'com-dialog'},
                nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
                nodes['window'] = cm.Node('div', {'class' : 'window'},
                    nodes['windowInner'] = cm.Node('div', {'class' : 'inner'})
                )
            )
        );
        // Set config styles
        nodes['container'].style.position = config['position'];
        nodes['window'].style.width = config['width'] + 'px';
        // Add CSS class
        !cm.isEmpty(config['className']) && cm.addClass(nodes['container'], config['className']);
        // Render close button
        if(config['closeButtonOutside']){
            nodes['bg'].appendChild(
                nodes['closeOutside'] = cm.Node('div', {'class' : config['icons']['closeOutside']}, config['langs']['close'])
            );
            if(config['closeTitle']){
                nodes['closeOutside'].title = config['langs']['closeTitle'];
            }
            cm.addEvent(nodes['closeOutside'], config['clickEventName'], close);
        }
        if(config['closeButton']){
            cm.addClass(nodes['container'], 'has-close-inside');
            nodes['window'].appendChild(
                nodes['closeInside'] = cm.Node('div', {'class' : config['icons']['closeInside']},
                    config['langs']['close']
                )
            );
            if(config['closeTitle']){
                nodes['closeInside'].title = config['langs']['closeTitle'];
            }
            cm.addEvent(nodes['closeInside'], config['clickEventName'], close);
        }
        if(config['closeOnBackground']){
            cm.addClass(nodes['container'], 'has-close-background');
            cm.addEvent(nodes['bg'], config['clickEventName'], close);
            if(config['closeTitle']){
                nodes['bg'].title = config['langs']['closeTitle'];
            }
        }
        // Set title
        renderTitle(config['title']);
        // Embed content
        renderContent(config['content']);
        // Embed buttons
        renderButtons(config['buttons']);
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
    };

    var renderTitle = function(title){
        if(!cm.isEmpty(title)){
            // Remove old nodes
            cm.remove(nodes['title']);
            // Render new nodes
            nodes['title'] = cm.Node('div', {'class' : 'title'}, title);
            cm.insertFirst(nodes['title'], nodes['windowInner']);
        }
    };

    var renderContent = function(node){
        if(!nodes['descr']){
            if(config['scroll']){
                nodes['descr'] = cm.Node('div', {'class' : 'descr'},
                    nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                        nodes['inner'] = cm.Node('div', {'class' : 'inner'})
                    )
                );
            }else{
                nodes['descr'] = cm.Node('div', {'class' : 'descr no-scroll'},
                    nodes['scroll'] = nodes['inner'] = cm.Node('div', {'class' : 'inner'})
                );
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

    var resizeHandler = function(){
        // Set scroll height if dialog height > window height
        var winHeight = nodes['container'].offsetHeight - (config['indentY'] * 2),
            winWidth = nodes['container'].offsetWidth - (config['indentX'] * 2),
            freeHeight = winHeight
                        - (nodes['title'] && nodes['title'].offsetHeight || 0)
                        - (nodes['buttons'] && nodes['buttons'].offsetHeight || 0)
                        - cm.getStyle(nodes['descr'], 'paddingTop', true)
                        - cm.getStyle(nodes['descr'], 'paddingBottom', true),
            insetHeight = nodes['inner'].offsetHeight,
            maxHeight = !config['maxHeight'] || config['maxHeight'] == 'auto' ? insetHeight : Math.min(config['maxHeight'], insetHeight),
            minHeight = /%/.test(config['minHeight'])? ((freeHeight / 100) * parseFloat(config['minHeight'])) : config['minHeight'],
            setHeight = Math.min(Math.max(maxHeight, minHeight), freeHeight),
            windowHeight = nodes['window'].offsetHeight,
            windowWidth = nodes['window'].offsetWidth,
            setWidth = Math.min(config['width'], winWidth);
        // Set or remove scroll if needs
        if(innerHeight != setHeight){
            innerHeight = setHeight;
            nodes['scroll'].style.height = [innerHeight, 'px'].join('');
            if(maxHeight <= freeHeight && insetHeight <= maxHeight){
                cm.removeClass(nodes['scroll'], 'isScroll');
            }else{
                cm.addClass(nodes['scroll'], 'isScroll');
            }
            windowHeight = nodes['window'].offsetHeight;
        }
        // Set window width
        if(windowWidth != setWidth){
            windowWidth = setWidth;
            nodes['window'].style.width = [setWidth, 'px'].join('')
        }
        // Set new align if needs
        if(height != windowHeight){
            height = windowHeight;
            nodes['window'].style.marginTop = [-(windowHeight / 2), 'px'].join('');
        }
        if(width != windowWidth){
            width = windowWidth;
            nodes['window'].style.marginLeft = [-(windowWidth / 2), 'px'].join('');
        }
    };

    var open = function(){
        nodes['container'].style.display = 'block';
        // Resize interval, will be removed on close
        resizeInt = setInterval(resizeHandler, 5);
        // Add close event on Esc press
        cm.addEvent(window, 'keypress', windowClickEvent);
        // Animate
        anim['container'].go({'style' : {'opacity' : '1'}, 'duration' : config['openTime'], 'onStop' : function(){
            // Open Event
            executeEvent('onOpen');
        }});
        // Open Event
        executeEvent('onOpenStart');
    };

    var close = function(){
        // Remove resize interval
        resizeInt && clearInterval(resizeInt);
        // Remove close event on Esc press
        cm.removeEvent(window, 'keypress', windowClickEvent);
        // Animate
        anim['container'].go({'style' : {'opacity' : '0'}, 'duration' : config['openTime'], 'onStop' : function(){
            nodes['container'].style.display = 'none';
            // Close Event
            executeEvent('onClose');
            // Remove Window
            config['removeOnClose'] && remove();
        }});
        // Close Event
        executeEvent('onCloseStart');
    };

    var remove = function(){
        // Remove resize interval
        resizeInt && clearInterval(resizeInt);
        // Remove dialog container node
        cm.remove(nodes['container']);
        // Remove dialog from global array
        Com['RemoveDialog'](config['id']);
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            close();
        }
    };

    /* *** MISC FUNCTION *** */

    var getConfig = function(container, marker){
        if(container){
            marker = marker || 'data-config';
            var sourceConfig = container.getAttribute(marker);
            if(sourceConfig){
                config = cm.merge(config, JSON.parse(sourceConfig));
            }
        }
    };

    var executeEvent = function(event){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that);
            });
        };

        switch(event){
            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    /* *** MAIN *** */

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

    that.remove = function(){
        remove();
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    init();
};