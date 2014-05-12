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
            'marginMobile' : 10,
            'slideChangeTime' : 300,
            'showArrowTitles' : false,
            'showTitle' : true,
            'showCounter' : true,
            'langs' : {
                'next' : 'Next',
                'prev' : 'Previous',
                'close' : 'Close',
                'counter' : '%item% / %items%'
            }
        }, o),
        dataAttributes = ['showArrowTitles', 'showTitle', 'showCounter'],
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
        // Merge data-attributes with config. Data-attributes have higher priority.
        config['gallery'] && processDataAttributes();
        // Render overlay
        render();
        // Collect items
        if(config['gallery']){
            itemsNodes = cm.getByAttr('data-image', 'true', config['gallery']);
            cm.forEach(itemsNodes, collect);
        }
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['gallery'].getAttribute(['data', item].join('-'));
            if(/^false|true$/.test(value)){
                value = value? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-gallery-overlay'},
            nodes['bg'] = cm.Node('div', {'class' : 'bg'}),
            nodes['window'] = cm.Node('div', {'class' : 'window'},
                nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                    nodes['top'] = cm.Node('div', {'class' : 'top'},
                        nodes['close'] = cm.Node('div', {'class' : 'close'}, config['langs']['close'])
                    ),
                    nodes['viewer'] = cm.Node('div', {'class' : 'com-gallery-viewer'},
                        nodes['bar'] = cm.Node('div', {'class' : 'bar'},
                            nodes['next'] = cm.Node('div', {'class' : 'bar-item arrows-next'},
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
        );
        // Arrow titles
        if(config['showArrowTitles']){
            nodes['next'].setAttribute('title', config['langs']['next']);
            nodes['prev'].setAttribute('title', config['langs']['prev']);
        }
        // Overlay counter
        if(config['showCounter']){
            cm.insertFirst(
                nodes['counter'] = cm.Node('div', {'class' : 'counter'}),
                nodes['top']
            );
        }
        // Overlay title
        if(config['showTitle']){
            cm.insertFirst(
                nodes['title'] = cm.Node('div', {'class' : 'title'}),
                nodes['top']
            );
        }
        // Set minimal dimensions of viewer
        nodes['window'].style.width = [config['minWidth'], 'px'].join('');
        nodes['window'].style.height = [config['minHeight'], 'px'].join('');
        // Set events
        cm.addEvent(nodes['bg'], 'click', close);
        cm.addEvent(nodes['close'], 'click', close);
        cm.addEvent(nodes['next'], 'click', next);
        cm.addEvent(nodes['prev'], 'click', prev);
        // Init animation
        anim['container'] = new cm.Animation(nodes['container']);
        anim['window'] = new cm.Animation(nodes['window']);
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
            if(cm.is('IE') && cm.isVersion() < 9){
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
            // If current active item not equal new item - process with new item, else redraw window alignment and dimensions
            if(i != active){
                // Set dimmer
                nodes['dimmer'].style.display = 'block';
                isDimmer = true;
                // Set overlays info
                if(config['showTitle']){
                    nodes['title'].innerHTML = item['title'];
                }
                if(config['showCounter']){
                    nodes['counter'].innerHTML = config['langs']['counter'].replace('%item%', (i + 1)).replace('%items%', items.length);
                }
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
        item['node'].style.zIndex = 2;
        nodes['viewer'].appendChild(item['node']);
        // Redraw overlay dimensions and position
        setImageDimension();
        // Animate
        item['anim'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'onStop' : function(){
            // IE filter fix
            if(cm.is('IE') && cm.isVersion() < 9){
                item['node'].style.filter = '';
            }
            // Remove old item
            if(itemOld){
                cm.remove(itemOld['node']);
                if(cm.is('IE') && cm.isVersion() < 9){
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
            width, height, overlayOffset, spaceWidth, spaceHeight, newWidth, newHeight, ratio;
        // Ugly IE fix
        if(cm.is('IE') && cm.isVersion() < 9){
            item['img'].style.display = 'none';
            item['img'].style.display = 'block';
        }
        // Capture outer overlay offset
        overlayOffset = pageSize['winWidth'] <= 640? config['marginMobile'] : config['margin'];
        // Restore original dimensions of viewer new item
        item['img'].style.width = 'auto';
        item['img'].style.height = 'auto';
        // Calculate actual free space for overlay
        spaceWidth = (pageSize['winWidth'] - overlayOffset * 2);
        spaceHeight = (pageSize['winHeight'] - overlayOffset * 2);
        // Capture dimensions of new viewer item
        width = item['img'].offsetWidth;
        height = item['img'].offsetHeight;
        // Calculate actual dimensions of new viewer item
        if(width < spaceWidth && height < spaceHeight){
            newWidth = width;
            newHeight = height;
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
        // Animate and align center overlay
        anim['window'].go({'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'style' : {
            'height' : [newHeight, 'px'].join(''),
            'width' : [newWidth, 'px'].join(''),
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
    var galleries,
        renderedGalleries = [],
        isParent = false,
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
        galleries = cm.clone((node.getAttribute('data-gallery') == 'true') ? [node] : cm.getByAttr('data-gallery', 'true', node));
        // Render galleries
        cm.forEach(galleries, function(item){
            cm.forEach(renderedGalleries, function(parent){
                isParent = cm.isParent(parent, item);
            });
            if(!isParent){
                renderedGalleries.push(item);
                gallery = new Com.Gallery({'gallery' : item});
                if(id = item.id){
                    Com.Elements.Gallery[id] = gallery;
                }
            }
        });
    };

    init(node);
};