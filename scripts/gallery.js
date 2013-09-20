Com.Elements['Gallery'] = {};

Com['GetGallery'] = function(id){
    return Com.Elements.Gallery[id] || null;
};

Com['Gallery'] = function(o){
    var that = this,
        config = cm.merge({
            'gallery' : false,
            'minWidth' : 400,
            'minHeight' : 400,
            'openTime' : 300,
            'margin' : 70,
            'slideChangeTime' : 300,
            'langs' : {
                'next' : 'Next',
                'prev' : 'Previous',
                'close' : 'Close',
                'thumb' : 'Thumb',
                'counter' : '%item% / %items%'
            }
        }, o),
        API = {
            'onOpen' : [],
            'onClose' : [],
            'onImageLoad' : []
        },
        nodes = {},
        items = [],
        anim = {},
        isOpen = false,
        isDimmer = false,
        active;

    var init = function(){
        var itemsNodes;
        // Render overlay
        render();
        // Collect items
        if(config['gallery']){
            itemsNodes = cm.getByAttr('data-image', 'true', config['gallery']);
            cm.forEach(itemsNodes, collect);
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'gallery-overlay'},
            nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
            nodes['window'] = cm.Node('div', {'class' : 'window'},
                nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                    nodes['top'] = cm.Node('div', {'class' : 'top'},
                        nodes['title'] = cm.Node('div', {'class' : 'title'}),
                        nodes['counter'] = cm.Node('div', {'class' : 'counter'})
                    ),
                    nodes['close'] = cm.Node('div', {'class' : 'close'}, config['langs']['close']),
                    nodes['viewer'] = cm.Node('div', {'class' : 'gallery-viewer'},
                        nodes['viewerInner'] = cm.Node('div', {'class' : 'inner'},
                            nodes['bar'] = cm.Node('div', {'class' : 'bar'},
                                nodes['next'] = cm.Node('div', {'class' : 'bar-item arrows-next', 'title' : config['langs']['next']},
                                    cm.Node('div', {'class' : 'icon'})
                                ),
                                nodes['prev'] = cm.Node('div', {'class' : 'bar-item arrows-prev', 'title' : config['langs']['prev']},
                                    cm.Node('div', {'class' : 'icon'})
                                )
                            ),
                            nodes['dimmer'] = cm.Node('div', {'class' : 'dimmer'}),
                            nodes['loader'] = cm.Node('div', {'class' : 'loader'},
                                cm.Node('div', {'class' : 'loader-bg'}),
                                cm.Node('div', {'class' : 'loader-icon'})
                            )
                        )
                    )
                )
            )
        );
        // Set minimal dimensions of viewer
        nodes['viewerInner'].style.width = [config['minWidth'], 'px'].join('');
        nodes['viewerInner'].style.height = [config['minHeight'], 'px'].join('');
        // Set events
        cm.addEvent(nodes['bg'], 'click', close);
        cm.addEvent(nodes['close'], 'click', close);
        cm.addEvent(nodes['next'], 'click', next);
        cm.addEvent(nodes['prev'], 'click', prev);
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
        anim['window'] = new cm.Animation(nodes['window']);
        anim['viewerInner'] = new cm.Animation(nodes['viewerInner']);
        anim['loader'] = new cm.Animation(nodes['loader']);
    };

    var collect = function(node, i){
        var image = node.getElementsByTagName('img')[0],
            item = {
                'image' : node.getAttribute('href'),
                'thumb' : image.getAttribute('src'),
                'title' : image? image.getAttribute('title') : '',
                'isLoad' : false
            };
        // Structure
        item['node'] = cm.Node('div', {'class' : 'item'},
            item['img'] = cm.Node('img', {'alt' : item['title']})
        );
        // Init animation
        item['anim'] = new cm.Animation(item['node']);
        // Open overlay on thumb click
        cm.addEvent(node, 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            open();
            set(i);
        });
        // Push item to array
        items.push(item);
    };

    var open = function(){
        isOpen = true;
        // Add close event on Esc press
        cm.addEvent(document.body, 'keypress', windowClickEvent);
        // Add rezise window event
        cm.addEvent(window, 'resize', windowResizeEvent);
        // Hide iframes and flash
        cm.hideSpecialTags();
        // Embed gallery
        document.body.appendChild(nodes['container']);
        // Align center overlay position
        if(!active){
            nodes['window'].style.marginLeft = [-Math.round(nodes['window'].offsetWidth/2), 'px'].join('');
            nodes['window'].style.marginTop = [-Math.round(nodes['window'].offsetHeight/2), 'px'].join('');
        }
        // Animate
        anim['container'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['openTime'], 'onStop' : function(){
            // IE filter fix
            if(is('IE') && isVersion() < 9){
                nodes['container'].style.filter = '';
            }
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onOpen');
        }});
    };

    var close = function(){
        isOpen = false;
        // Remove close event on Esc press
        cm.removeEvent(document.body, 'keypress', windowClickEvent);
        // Remove rezise window event
        cm.removeEvent(window, 'resize', windowResizeEvent);
        // Animate
        anim['container'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : config['openTime'], 'onStop' : function(){
            // Show iframes and flash
            cm.showSpecialTags();
            // Remove from DOM
            cm.remove(nodes['container']);
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onClose');
        }});
    };

    var executeEvent = function(event){
        API[event].forEach(function(item){
            item(that, active);
        });
    };

    var windowClickEvent = function(e){
        e = cm.getEvent(e);
        if(e.keyCode == 27){
            close();
        }
    };

    var windowResizeEvent = function(){
        setImageDimension();
    };

    var next = function(){
        set((active == items.length - 1)? 0 : active + 1);
    };

    var prev = function(){
        set((active == 0)? items.length - 1 : active - 1);
    };

    var set = function(i){
        var item = items[i],
            itemOld = items[active];
        if(!isDimmer){
            if(i != active){
                // Set dimmer
                nodes['dimmer'].style.display = 'block';
                isDimmer = true;
                // Set overlays info
                nodes['title'].innerHTML = item['title'];
                nodes['counter'].innerHTML = config['langs']['counter']
                    .replace('%item%', (i + 1))
                    .replace('%items%', items.length);
                // Check if is image load
                if(!item['isLoad']){
                    // Show loader
                    nodes['loader'].style.display = 'block';
                    anim['loader'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : 200});
                    // Add image load event and src
                    cm.addEvent(item['img'], 'load', function(){
                        // Hide loader
                        anim['loader'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : 200, 'onStop' : function(){
                            nodes['loader'].style.display = 'none';
                        }});
                        // Set and show image
                        setImage(i, item, itemOld);
                    });
                    item['img'].src = item['image'];
                }else{
                    // Set and show image
                    setImage(i, item, itemOld);
                }
            }else{
                setImageDimension();
            }
        }
    };

    var setImage = function(i, item, itemOld){
        // Set new active
        active = i;
        // Insert image into overlay
        nodes['viewerInner'].appendChild(item['node']);
        // Redraw overlay dimensions and position
        setImageDimension();
        // Animate
        item['node'].style.zIndex = 2;
        item['anim'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'onStop' : function(){
            // IE filter fix
            if(is('IE') && isVersion() < 9){
                item['node'].style.filter = '';
            }
            // Remove old item
            if(itemOld){
                cm.remove(itemOld['node']);
                if(is('IE') && isVersion() < 9){
                    itemOld['node'].style.filter = '';
                }else{
                    itemOld['node'].style.opacity = 0;
                }
            }
            // Remove dimmer
            nodes['dimmer'].style.display = 'none';
            isDimmer = false;
            item['isLoad'] = true;
            item['node'].style.zIndex = 1;
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onImageLoad');
        }});
    };

    var setImageDimension = function(){
        var item = items[active],
            pageSize = cm.getPageSize(),
            width, height, prevWidth, prevHeight, overlayOffset, overlayInnerOffsetWidth, overlayInnerOffsetHeight, spaceWidth, spaceHeight, newWidth, newHeight, ratio;
        // Ugly IE fix
        if(is('IE') && isVersion() < 9){
            item['img'].style.display = 'none';
            item['img'].style.display = 'block';
        }
        // Capture outer overlay offset
        overlayOffset = pageSize['winWidth'] <= 600? 10 : config['margin'];
        // Restore original dimensions of viewer new item
        item['img'].style.width = 'auto';
        item['img'].style.height = 'auto';
        // Capture previous viewer dimensions
        prevWidth = nodes['inner'].offsetWidth;
        prevHeight = nodes['inner'].offsetHeight;
        // Capture inner offset of overlay
        overlayInnerOffsetWidth = nodes['window'].offsetWidth - prevWidth;
        overlayInnerOffsetHeight = nodes['window'].offsetHeight - prevHeight;
        // Calculate actual free space for overlay
        spaceWidth = (pageSize['winWidth'] - overlayOffset * 2);
        spaceHeight = (pageSize['winHeight'] - overlayOffset * 2);
        // Capture dimensions of new viewer item
        width = item['img'].offsetWidth;
        height = item['img'].offsetHeight;
        // Calculate actual dimensions of new viewer item
        if(width + overlayInnerOffsetWidth < spaceWidth && height + overlayInnerOffsetHeight < spaceHeight){
            newWidth = width + overlayInnerOffsetWidth;
            newHeight = height + overlayInnerOffsetHeight;
        }else{
            ratio = width / height;
            if(ratio > 1){
                newWidth = spaceWidth;
                newHeight = newWidth/ratio;

                if(newHeight > spaceHeight){
                    newHeight = spaceHeight;
                    newWidth = newHeight * ratio;
                }
            }else{
                newHeight = spaceHeight;
                newWidth = newHeight * ratio;

                if(newWidth > spaceWidth){
                    newWidth = spaceWidth;
                    newHeight = newWidth / ratio;
                }
            }
            newWidth = Math.floor(newWidth);
            newHeight = Math.floor(newHeight);
        }
        // Set new dimensions of viewer item
        item['img'].style.width = '100%';
        item['img'].style.height = '100%';
        // Set new dimensions of viewer
        anim['viewerInner'].go({'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'style' : {
            'height' : [newHeight - overlayInnerOffsetHeight, 'px'].join(''),
            'width' : [newWidth - overlayInnerOffsetWidth, 'px'].join('')
        }});
        // Animate and align center overlay
        anim['window'].go({'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'style' : {
            'marginLeft' : [-Math.floor((newWidth)/2), 'px'].join(''),
            'marginTop' : [-Math.floor((newHeight)/2), 'px'].join('')
        }});
    };

    /* *** MAIN *** */

    that.open = function(){
        open();
        return that;
    };

    that.close = function(){
        close();
        return that;
    };

    that.set = function(i){
        if(i && items[i]){
            set(i);
        }
        return that;
    };

    that.next = function(){
        next();
        return that;
    };

    that.prev = function(){
        prev();
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

Com['GalleryCollector'] = function(node){
    var that = this,
        galleries,
        id,
        gallery;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };

    var render = function(node){
        galleries = (node.getAttribute('data-gallery') == 'true') ? [node] : cm.getByAttr('data-gallery', 'true', node);
        // Render galleries
        cm.forEach(galleries, function(item){
            gallery = new Com.Gallery({'gallery' : item});
            if(id = item.id){
                Com.Elements.Gallery[id] = gallery;
            }
        });
    };

    init(node);
};