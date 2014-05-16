Com['GalleryPopup'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.Node('div'),
            'duration' : 300,
            'showCaption' : true,
            'icons' : {
                'close' : 'icon medium close-white linked'
            },
            'langs' : {
                'close' : 'Close'
            },
            'Com.Gallery' : {
                'showCaption' : false
            }
        }, o),
        API = {
            'onOpen' : [],
            'onClose' : [],
            'onChange' : []
        },
        nodes = {},
        coms = {},
        anim = {},
        isOpen = false;

    var init = function(){
        getConfig(config['node']);
        render();
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-gallery-popup'},
            nodes['title'] = cm.Node('div', {'class' : 'title'}),
            nodes['descr'] = cm.Node('div', {'class' : 'descr'}),
            nodes['close'] = cm.Node('div', {'class' : config['icons']['close'], 'title' : lang('close')})
        );
        // Overlay title
        if(config['showCaption']){
            nodes['title'].appendChild(
                nodes['caption'] = cm.Node('div', {'class' : 'caption'})
            );
        }
        // Gallery
        coms['gallery'] = new Com.Gallery(
                cm.merge(config['Com.Gallery'], {
                    'node' : config['node'],
                    'container' : nodes['descr']
                })
            )
            .addEvent('onSet', open)
            .addEvent('onChange', onChange);
        // Set events
        cm.addEvent(nodes['close'], 'click', close);
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
    };

    var onChange = function(gallery, data){
        // Set caption
        if(config['showCaption']){
            nodes['caption'].innerHTML = data['current']['title'];
        }
        // API onChange event
        executeEvent('onChange');
    };

    /* *** POPUP *** */

    var open = function(){
        if(!isOpen){
            isOpen = true;
            // Add close event on Esc press
            cm.addEvent(document.body, 'keypress', windowClickEvent);
            // Hide iframes and flash
            cm.hideSpecialTags();
            // Embed gallery
            document.body.appendChild(nodes['container']);
            // Animate
            anim['container'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['duration'], 'onStop' : function(){
                // API onOpen event
                executeEvent('onOpen');
            }});
        }
    };

    var close = function(){
        if(isOpen){
            // Remove close event on Esc press
            cm.removeEvent(document.body, 'keypress', windowClickEvent);
            // Animate
            anim['container'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : config['duration'], 'onStop' : function(){
                isOpen = false;
                // Show iframes and flash
                cm.showSpecialTags();
                // Remove from DOM
                cm.remove(nodes['container']);
                // API onClose event
                executeEvent('onClose');
            }});
        }
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            close();
        }
    };

    /* *** MISC FUNCTIONS *** */

    var getConfig = function(container, marker){
        if(container){
            marker = marker || 'data-config';
            var sourceConfig = container.getAttribute(marker);
            if(sourceConfig){
                config = cm.merge(config, JSON.parse(sourceConfig));
            }
        }
    };

    var lang = function(str){
        if(!config['langs'][str]){
            config['langs'][str] = str;
        }
        return config['langs'][str];
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.open = function(){
        open();
        return that;
    };

    that.close = function(){
        close();
        return that;
    };

    that.set = function(i){
        coms['gallery'].set(i);
        return that;
    };

    that.next = function(){
        coms['gallery'].next();
        return that;
    };

    that.prev = function(){
        coms['gallery'].prev();
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

    init();
};