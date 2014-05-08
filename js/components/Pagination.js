Com['Pagination'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'count' : 1,
            'active' : 1,
            'countLR' : 3,
            'countMid' : 1,                 // must be 1, for drawing 3 center pagination buttons, 2 - 5, 3 - 7, etc
            'position' : 'bottom',          // top | bottom | both
            'animDuration' : 200,
            'events' : {},
            'langs' : {
                'next' : 'Next page',
                'prev' : 'Previous page'
            },
            'classes' : {
                'pagination' : ''
            }
        },o),
        API = {
            'onChange' : [],
            'onChangeComplete' : []
        },
        nodes = {
            'top' : {},
            'bottom' : {}
        },
        anims = {},
        isToggled = true;

    that.previous = 0;
    that.current = 0;

    var init = function(){
        // Convert events to API Events
        convertEvents();
        render();
        set(config['active']);
    };

    var render = function(){
        // Structure
        config['container'].appendChild(
            nodes['container'] = cm.Node('div', {'class' : 'com-pagination-container'},
                nodes['content'] = cm.Node('div', {'class' : 'com-pagination-content'})
            )
        );
        // Init animations
        anims['content'] = new cm.Animation(nodes['content']);
        // Render pagination bars
        if(config['count'] > 1){
            if(/top|both/.test(config['position'])){
                renderBar('top');
            }
            if(/bottom|both/.test(config['position'])){
                renderBar('bottom');
            }
        }
    };

    var renderBar = function(position){
        // Structure
        nodes[position]['container'] = cm.Node('div', {'class' : 'com-pagination'},
            nodes[position]['list'] = cm.Node('ul')
        );
        // Add css class
        cm.addClass(nodes[position]['container'], config['classes']['pagination']);
        // Append
        if(position == 'bottom'){
            cm.appendChild(nodes[position]['container'], nodes['container']);
        }else{
            cm.insertFirst(nodes[position]['container'], nodes['container']);
        }
    };

    var renderBarItems = function(position){
        var dots = false;
        // Clear container node from old pagination buttons
        cm.clearNode(nodes[position]['list']);
        // Previous page buttons
        renderBarArrow(position, '<', that.prev, 'prev', lang('prev'));
        // Page buttons
        cm.forEach(config['count'], function(page){
            ++page;
            if(page == that.current){
                renderBarItem(position, page, true);
                dots = true;
            }else{
                if(
                    page <= config['countLR'] ||
                    (that.current && page >= that.current - config['countMid'] && page <= that.current + config['countMid']) ||
                    page > config['count'] - config['countLR']
                ){
                    renderBarItem(position, page, false);
                    dots = true;
                }else if(dots){
                    renderBarPoints(position);
                    dots = false;
                }

            }
        });
        // Next page buttons
        renderBarArrow(position, '>', that.next, 'next', lang('next'));
    };

    var renderBarArrow = function(position, name, handler, className, title){
        var item = {};
        // Structure
        item['container'] = cm.Node('li', {'class' : className},
            item['link'] = cm.Node('a', {'title' : title || ''}, name)
        );
        // Events
        cm.addEvent(item['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            handler();
        });
        // Append
        nodes[position]['list'].appendChild(item['container']);
    };

    var renderBarPoints = function(position){
        var item = {};
        // Structure
        item['container'] = cm.Node('li', {'class' : 'points'}, '...');
        // Append
        nodes[position]['list'].appendChild(item['container']);
    };

    var renderBarItem = function(position, page, isActive){
        var item = {};
        // Structure
        item['container'] = cm.Node('li',
            item['link'] = cm.Node('a', page)
        );
        // Active Class
        if(isActive){
            cm.addClass(item['container'], 'active');
        }
        // Events
        cm.addEvent(item['link'], 'click', function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            set(page);
        });
        // Append
        nodes[position]['list'].appendChild(item['container']);
    };

    var set = function(page){
        if(isToggled){
            isToggled = false;
            that.previous = that.current;
            that.current = page;
            // Redraw pagination bars
            if(config['count'] > 1){
                if(/top|both/.test(config['position'])){
                    renderBarItems('top');
                }
                if(/bottom|both/.test(config['position'])){
                    renderBarItems('bottom');
                }
            }
            // Render page
            nodes['previous'] = nodes['current'];
            nodes['content'].appendChild(
                nodes['current'] = cm.Node('div')
            );
            anims['previous'] = anims['current'];
            anims['current'] = new cm.Animation(nodes['current']);
            // API onChange Event
            executeEvent('onChange', {
                'page' : that.current,
                'previous' : that.previous,
                'container' : nodes['current']
            });
            // Animate
            if(nodes['previous']){
                nodes['content'].style.overflow = 'hidden';
                anims['current'].go({
                    'style' : {'opacity' : 1},
                    'duration' : config['animDuration'],
                    'anim' : 'smooth',
                    'onStop' : function(){
                        cm.remove(nodes['previous']);
                    }
                });
                anims['content'].go({
                    'style' : {'height' : [nodes['current'].offsetHeight, 'px'].join('')},
                    'duration' : config['animDuration'],
                    'anim' : 'smooth',
                    'onStop' : setComplete
                });
            }else{
                setComplete();
            }
        }
    };

    var setComplete = function(){
        isToggled = true;
        nodes['content'].style.height = 'auto';
        nodes['content'].style.overflow = 'visible';
        cm.setOpacity(nodes['current'], 1);
        // API onChangeComplete Event
        executeEvent('onChangeComplete', {
            'page' : that.current,
            'previous' : that.previous,
            'container' : nodes['current']
        });
    };

    /* *** MISC HANDLERS *** */

    var convertEvents = function(){
        cm.forEach(config['events'], function(item, key){
            that.addEvent(key, item);
        });
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

    that.set = function(page){
        set(page || that.current);
        return that;
    };

    that.next = function(){
        set(config['count'] == that.current? 1 : that.current + 1);
    };

    that.prev = function(){
        set(that.current - 1 || config['count']);
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