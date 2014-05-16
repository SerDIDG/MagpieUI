Com['GalleryLayout'] = function(o){
    var that = this,
        config = cm.merge({
            'node' : cm.Node('div'),
            'barDirection' : 'horizontal',      // horizontal | vertical
            'nodes' : {},
            'events' : {},
            'langs' : {},
            'Com.Gallery' : {},
            'Com.Scroll' : {
                'step' : 25,
                'time' : 25
            }
        }, o),
        API = {
            'onRender' : [],
            'onChange' : []
        },
        nodes = {
            'inner' : cm.Node('div'),
            'preview-inner' : cm.Node('div'),
            'bar-inner' : cm.Node('div'),
            'bar-items' : []
        },
        coms = {},
        items = [];

    /* *** CLASS FUNCTIONS *** */

    var init = function(){
        convertEvents(config['events']);
        getNodes(config['node']);
        getConfig(config['node']);
        collectItems();
        render();
    };

    var render = function(){
        config['type'] = cm.isClass(config['node'], 'vertical')
        // Scroll
        coms['scroll'] = new Com.Scroll(
            cm.merge(config['Com.Scroll'], {
                'nodes' : nodes['ComScroll']
            })
        );
        // Gallery
        coms['gallery'] = new Com.Gallery(
                cm.merge(config['Com.Gallery'], {
                    'container' : nodes['preview-inner'],
                    'items' : items
                })
            )
            .addEvent('onChange', onChange)
            .set(0);
        // API onRender event
        executeEvent('onRender', {});
    };

    var collectItems = function(){
        cm.forEach(nodes['bar-items'], function(item){
            item['title'] = item['link']? item['link'].getAttribute('title') || '' : '';
            item['src'] = item['link']? item['link'].getAttribute('href') || '' : '';
            items.push(item);
        });
    };

    var onChange = function(gallery, data){
        var item = data['current'],
            left,
            top;
        // Thumbs classes
        if(data['previous']){
            cm.removeClass(data['previous']['container'], 'active');
        }
        cm.addClass(item['container'], 'active');
        // Move bar
        if(config['barDirection'] == 'vertical'){
            top = item['container'].offsetTop - (nodes['inner'].offsetHeight / 2) + (item['container'].offsetHeight / 2);
            coms['scroll'].scrollY(top);
        }else{
            left = item['container'].offsetLeft - (nodes['inner'].offsetWidth / 2) + (item['container'].offsetWidth / 2);
            coms['scroll'].scrollX(left);
        }
        // API onSet event
        executeEvent('onChange', data);
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
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