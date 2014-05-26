Com['Gallery'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'node' : cm.Node('div'),
            'data' : [],
            'duration' : 500,
            'showCaption' : true,
            'showArrowTitles' : false,
            'nodes' : {},
            'events' : {},
            'langs' : {
                'next' : 'Next',
                'prev' : 'Previous'
            },
            'icons' : {
                'prev' : 'icon xx-large arrow-white-left centered',
                'next' : 'icon xx-large arrow-white-right centered'
            }
        }, o),
        API = {
            'onSet' : [],
            'onChange' : [],
            'onItemLoad' : [],
            'onItemSet' : []
        },
        nodes = {
            'items' : []
        },
        items = [],
        anim = {},
        active;

    var init = function(){
        convertEvents(config['events']);
        getConfig(config['node']);
        getNodes(config['node']);
        render();
        // Collect items
        cm.forEach(nodes['items'], collectItem);
        // Process config items
        cm.forEach(config['items'], processItem);
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-gallery'},
            nodes['holder'] = cm.Node('div', {'class' : 'holder'}),
            nodes['bar'] = cm.Node('div', {'class' : 'com-gallery-controls'},
                cm.Node('div', {'class' : 'inner'},
                    nodes['prev'] = cm.Node('div', {'class' : 'bar-arrow prev'},
                        cm.Node('div', {'class' : config['icons']['prev']})
                    ),
                    nodes['next'] = cm.Node('div', {'class' : 'bar-arrow next'},
                        cm.Node('div', {'class' : config['icons']['next']})
                    )
                )
            ),
            nodes['loader'] = cm.Node('div', {'class' : 'loader'},
                cm.Node('div', {'class' : 'bg'}),
                cm.Node('div', {'class' : 'icon small loader centered'})
            )
        );
        // Arrow titles
        if(config['showArrowTitles']){
            nodes['next'].setAttribute('title', lang('next'));
            nodes['prev'].setAttribute('title', lang('prev'));
        }
        // Set events
        cm.addEvent(nodes['next'], 'click', next);
        cm.addEvent(nodes['prev'], 'click', prev);
        // Init animation
        anim['loader'] = new cm.Animation(nodes['loader']);
        // Embed
        config['container'].appendChild(nodes['container']);
    };

    var collectItem = function(item, i){
        if(!item['link']){
            item['link'] = cm.Node('a')
        }
        item = cm.merge({
            'src' : item['link'].getAttribute('href') || '',
            'title' : item['link'].getAttribute('title') || ''
        }, item);
        processItem(item, i);
    };

    var processItem = function(item, i){
        item = cm.merge({
            'index' : i,
            'isLoad' : false,
            'type' : 'image',        // image | video
            'nodes' : {}
        }, item);
        /// Check type
        item['type'] = /(\.jpg|\.png|\.gif|\.jpeg|\.bmp|\.tga)$/gi.test(item['src']) ? 'image' : 'video';
        // Structure
        item['nodes']['container'] = cm.Node('div', {'class' : 'cm-imagebox is-no-hover is-centered'},
            item['nodes']['inner'] = cm.Node('div', {'class' : 'inner'})
        );
        // Render by type
        switch(item['type']){
            case 'image':
                item['nodes']['inner'].appendChild(
                    item['nodes']['content'] = cm.Node('img', {'class' : 'descr', 'alt' : item['title']})
                );
                // Caption
                if(config['showCaption'] && !cm.isEmpty(item['title'])){
                    item['nodes']['inner'].appendChild(
                        cm.Node('div', {'class' : 'title'},
                            cm.Node('div', {'class' : 'inner'}, item['title'])
                        )
                    );
                }
                break;

            default:
                item['nodes']['inner'].appendChild(
                    item['nodes']['content'] = cm.Node('iframe', {'class' : 'descr'})
                );
                break;
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Set image on thumb click
        cm.addEvent(item['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set(item['index']);
        }, true, true);
        // Push item to array
        items.push(item);
    };

    var set = function(i){
        var item = items[i],
            itemOld = items[active];
        // API onSet
        executeEvent('onSet', {
            'current' : item,
            'previous' : itemOld
        });
        // If current active item not equal new item - process with new item, else redraw window alignment and dimensions
        if(i != active){
            // API onSet
            executeEvent('onChange', {
                'current' : item,
                'previous' : itemOld
            });
            // Check type
            if(item['type'] == 'image'){
                cm.removeClass(nodes['container'], 'has-iframe');
            }else{
                cm.addClass(nodes['container'], 'has-iframe');
                nodes['holder'].appendChild(item['nodes']['container']);
            }
            // Check is content load
            if(!item['isLoad'] || item['type'] != 'image'){
                // Show loader
                nodes['loader'].style.display = 'block';
                anim['loader'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['duration']});
                // Add image load event and src
                cm.addEvent(item['nodes']['content'], 'load', function(){
                    // Hide loader
                    anim['loader'].go({'style' : {'opacity' : 0}, 'anim' : 'smooth', 'duration' : config['duration'], 'onStop' : function(){
                        nodes['loader'].style.display = 'none';
                    }});
                    // Set and show image
                    setImage(i, item, itemOld);
                });
                item['nodes']['content'].src = item['src'];
            }else{
                // Set and show image
                setImage(i, item, itemOld);
            }
        }
    };

    var setImage = function(i, item, itemOld){
        // Set new active
        active = i;
        item['isLoad'] = true;
        // API onImageSetStart
        executeEvent('onItemLoad', item);
        // Embed item content
        if(itemOld){
            itemOld['nodes']['container'].style.zIndex = 1;
            item['nodes']['container'].style.zIndex = 2;
        }
        if(item['type'] == 'image'){
            nodes['holder'].appendChild(item['nodes']['container']);
        }
        // Animate Slide
        item['anim'].go({'style' : {'opacity' : 1}, 'anim' : 'smooth', 'duration' : config['duration'], 'onStop' : function(){
            // Remove old item
            if(itemOld){
                cm.setOpacity(itemOld['nodes']['container'], 0);
                cm.remove(itemOld['nodes']['container']);
            }
            // API onImageSet event
            executeEvent('onItemSet', item);
        }});
    };

    var next = function(){
        set((active == items.length - 1)? 0 : active + 1);
    };

    var prev = function(){
        set((active == 0)? items.length - 1 : active - 1);
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var lang = function(str){
        if(!config['langs'][str]){
            config['langs'][str] = str;
        }
        return config['langs'][str];
    };

    var getNodes = function(container, marker){
        if(container){
            var sourceNodes = {};
            if(marker){
                sourceNodes = cm.getNodes(container)[marker] || {};
            }else{
                sourceNodes = cm.getNodes(container);
            }
            nodes = cm.merge(nodes, sourceNodes);
        }
        nodes = cm.merge(nodes, config['nodes']);
    };

    var getConfig = function(container, marker){
        if(container){
            marker = marker || 'data-config';
            var sourceConfig = container.getAttribute(marker);
            if(sourceConfig){
                config = cm.merge(config, JSON.parse(sourceConfig));
            }
        }
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.set = function(i){
        if(!isNaN(i) && items[i]){
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