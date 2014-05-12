Com.Elements['Tabset'] = {};

Com['GetTabset'] = function(id){
    return Com.Elements.Tabset[id] || null;
};

Com['Tabset'] = function(o){
	var that = this,
		config = cm.merge({
			'container' : false,
            'tabset' : false,
            'toggleOnHashChange' : true,
			'renderOnInit' : true,
            'active' : false,
            'className' : '',
            'isAdaptive' : true,
            'tabsPosition' : 'top',         // top | bottom
            'showTabs' : true,
            'tabs' : []
		}, o),
        dataAttributes = ['active', 'className', 'isAdaptive', 'toggleOnHashChange', 'renderOnInit', 'tabsPosition', 'showTabs'],
		nodes = {},
		ids = [],
		tabs = {},
		active,
		hashInterval;
		
	var init = function(){
        // Merge data-attributes with config. Data-attributes have higher priority.
        config['tabset'] && processDataAttributes();
        // Render tabset view
        renderView();
        // Render active tab
        config['renderOnInit'] && render();
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['tabset'].getAttribute(['data', item].join('-'));
            if(/^false|true$/.test(value)){
                value = value? (value == 'true') : config[item];
            }else if(item == 'tabsPosition'){
                value = ['top', 'bottom'].indexOf(value) != -1? value : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var render = function(){
        var id = config['active'];
        if(config['toggleOnHashChange']){
            // Init hash change handler
            initHashChange();
            // Set first active tab
            if(id && tabs[id]){
                set(id);
            }else{
                hashHandler();
            }
        }else{
            if(id = id && tabs[id]? id : ids[0]){
                set(id);
            }
        }
    };

    var renderView = function(){
		var tabsLI;
		/* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-tabset'},
            nodes['header'] = cm.Node('div', {'class' : 'com-tabset-head clear'},
                nodes['header-button'] = cm.Node('div', {'class' : 'com-tabset-head-button'},
                    nodes['headerUL'] = cm.Node('ul')
                ),
                nodes['header-title'] = cm.Node('div', {'class' : 'com-tabset-head-title'})
            ),
            nodes['content'] = cm.Node('div', {'class' : 'com-tabset-content clear'},
                nodes['contentUL'] = cm.Node('ul')
            )
        );
        // Add CSS class
        !cm.isEmpty(config['className']) && cm.addClass(nodes['container'], config['className']);
        // Adaptive
        if(config['isAdaptive']){
            cm.addClass(nodes['container'], 'is-adaptive');
        }
        // Show tabs
        if(!config['showTabs']){
            nodes['header'].style.display = 'none';
        }
        // Tabs position
        if(config['tabsPosition'] == 'bottom'){
            cm.addClass(nodes['container'], 'bottom');
            nodes['container'].appendChild(nodes['header']);
        }else{
            cm.addClass(nodes['container'], 'top');
        }
        /* *** RENDER TABS *** */
        if(config['tabset']){
            tabsLI = Array.prototype.filter.call(config['tabset'].childNodes, function(node){
                return node.nodeType == 1 && node.tagName.toLowerCase() == 'li';
            });
            cm.forEach(tabsLI, function(tabContent){
                renderTab({
                    'id' : tabContent.getAttribute('data-tabset-id'),
                    'title' : tabContent.getAttribute('data-tabset-title'),
                    'content' : tabContent
                });
            });
            // ID
            if(config['tabset'].id){
                nodes['container'].id = config['tabset'].id;
            }
        }
        cm.forEach(config['tabs'], function(item){
            renderTab(item);
        });
        /* *** INSERT INTO DOM *** */
        if(config['container']){
            config['container'].appendChild(nodes['container']);
        }else if(config['tabset'].parentNode){
            cm.insertBefore(nodes['container'], config['tabset']);
        }
        cm.remove(config['tabset']);
	};

    var renderTab = function(item){
        // Check for exists
        if(tabs[item['id']]){
            removeTab(tabs[item['id']]);
        }
        // Config
        item = cm.merge({
            'id' : '',
            'title' : '',
            'content' : cm.Node('li'),
            'isHide' : true,
            'onShow' : function(that, tab){},
            'onHide' : function(that, tab){}
        }, item);
        // Structure
        item['tab'] = cm.Node('li',
            item['a'] = cm.Node('a', item['title'])
        );
        // Remove active tab class if exists
        cm.removeClass(item['content'], 'active');
        // Hide content
        item['content'].style.display = 'none';
        // Add click event
        if(config['toggleOnHashChange']){
            item['a'].setAttribute('href', [window.location.href.split('#')[0], item['id']].join('#'));
        }else{
            //item['a'].setAttribute('href', 'javascript:void(0);');
            item['a'].onclick = function(){
                 set(item['id']);
            };
        }
        // Append tab
        nodes['headerUL'].appendChild(item['tab']);
        nodes['contentUL'].appendChild(item['content']);
        // Push
        ids.push(item['id']);
        tabs[item['id']] = item;
    };

    var removeTab = function(item){
        // Set new active tab, if current active is nominated for remove
        if(item['id'] === active){
            set(ids[0]);
        }
        // Remove tab from list and array
        cm.remove(item['tab']);
        cm.remove(item['content']);
        ids = ids.filter(function(id){
            return item['id'] != id;
        });
        delete tabs[item['id']];
    };

    var set = function(id){
        // Hide previous active tab
        if(active && tabs[active]){
            // onHide event
            tabs[active]['onHide'](that, tabs[active]);
            tabs[active]['isHide'] = true;
            // Hide
            cm.removeClass(tabs[active]['tab'], 'active');
            tabs[active]['content'].style.display = 'none';
        }
        // Show current tab
        active = id;
        // Show
        cm.addClass(tabs[active]['tab'], 'active');
        tabs[active]['content'].style.display = 'block';
        nodes['header-title'].innerHTML = tabs[active]['title'];
        // onShow event
        tabs[active]['onShow'](that, tabs[active]);
        tabs[active]['isHide'] = false;
    };
	
	var initHashChange = function(){
		var hash;
		if("onhashchange" in window && !cm.is('IE7')){
			cm.addEvent(window, 'hashchange', hashHandler);
		}else{
			hash = window.location.hash;
			hashInterval = setInterval(function(){
				if(hash != window.location.hash){
					hash = window.location.hash;
                    hashHandler();
				}
			}, 25);
		}
	};
	
	var hashHandler = function(){
		var id = window.location.hash.replace('#', '');
        if(id = id && tabs[id]? id : ids[0]){
            set(id);
        }
	};
	
	/* Main */
	
	that.render = function(){
        render();
        return that;
	};
	
	that.set = function(id){
        if(id && tabs[id]){
            set(id);
        }
		return that;
	};

    that.get = function(id){
        if(id && tabs[id]){
            return tabs[id];
        }
        return null;
    };

    that.addTab = function(item){
        if(item && item['id']){
            renderTab(item);
        }
        return that;
    };

    that.removeTab = function(id){
        if(id && tabs[id]){
            removeTab(tabs[id]);
        }
        return that;
    };
	
	that.setEvents = function(o){
		if(o){
			tabs = cm.merge(tabs, o);
		}
		return that;
	};
	
	that.remove = function(){
		cm.removeEvent(window, 'hashchange', hashHandler);
		hashInterval && clearInterval(hashInterval);
		cm.remove(nodes['container']);
		return that;
	};

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };
	
	init();
};

Com['TabsetCollector'] = function(node){
    var tabsets,
        id,
        tabset;

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
        tabsets = cm.clone((node.getAttribute('data-tabset') == 'true') ? [node] : cm.getByAttr('data-tabset', 'true', node));
        // Render tabsets
        cm.forEach(tabsets, function(item){
            tabset = new Com.Tabset({'tabset' : item});
            if(id = item.id){
                Com.Elements.Tabset[id] = tabset;
            }
        });
    };

    init(node);
};