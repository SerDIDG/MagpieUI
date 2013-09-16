Com.Elements['Tabset'] = {};

Com['GetTabset'] = function(id){
    return Com.Elements.Tabset[id] || null;
};

Com['Tabset'] = function(o){
	var that = this,
		config = cm.merge({
			'container' : cm.Node('div'),
            'tabset' : false,
            'toggleOnHashChange' : true,
			'renderOnInit' : true
		}, o),
        dataAttributes = ['toggleOnHashChange', 'renderOnInit'],
		nodes = {},
		ids = [],
		tabs = {},
		active,
		hashInterval;
		
	var init = function(){
        // Merge data-attributes with config. Data-attributes have higher priority.
        processDataAttributes();
        // Render tabset view
        renderView();
        // Render active tab
        config['renderOnInit'] && render();
    };

    var processDataAttributes = function(){
        var value;
        dataAttributes.forEach(function(item){
            value = config['tabset'].getAttribute(['data', item].join('-'));
            switch(item){
                case 'toggleOnHashChange':
                case 'renderOnInit':
                    value = value? (value == 'true') : config[item];
                    break;
                default:
                    value = value || config[item];
                    break
            }
            config[item] = value;
        })
    };

    var renderView = function(){
		var tabsLI, tab, id, title, a, content;
		/* *** STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'tabset'},
            nodes['header'] = cm.Node('div', {'class' : 'tabset-head clear'},
                nodes['headerUL'] = cm.Node('ul')
            ),
            nodes['content'] = cm.Node('div', {'class' : 'tabset-content clear'},
                nodes['contentUL'] = cm.Node('ul')
            )
        );
        /* *** RENDER TABS *** */
        if(config['tabset']){
            tabsLI = Array.prototype.filter.call(config['tabset'].childNodes, function(node){
                return node.nodeType == 1 && node.tagName.toLowerCase() == 'li';
            });
            cm.forEach(tabsLI, function(tabContent, i){
                id = tabContent.getAttribute('data-tabset-id');
                title = tabContent.getAttribute('data-tabset-title');
                // Remove active tab class if exists
                cm.removeClass(tabContent, 'active');
                // Hide content
                tabContent.style.display = 'none';
                // Render tab
                tab = cm.Node('li',
                    a = cm.Node('a', title)
                );
                if(config['toggleOnHashChange']){
                    a.setAttribute('href', [window.location.href.split('#')[0], id].join('#'));
                }else{
                    a.setAttribute('href', 'javascript:void(0);');
                    a.onclick = (function(){
                        var tid = id;
                        return function(){
                            set(tid);
                        };
                    })();
                }
                // Insert into array
                ids.push(id);
                tabs[id] = {
                    'id' : id,
                    'tab' : tab,
                    'link' : a,
                    'content' : tabContent,
                    'isHide' : true,
                    'onShow' : function(){},
                    'onHide' : function(){}
                };
                // Append tab
                nodes['contentUL'].appendChild(tabContent);
                nodes['headerUL'].appendChild(tab);
            });
            // ID
            if(config['tabset'].id){
                nodes['container'].id = config['tabset'].id;
            }
        }
        /* *** APPENDCHILD NEW TABSET *** */
        if(config['tabset']&& cm.inDOM(config['tabset'])){
            cm.insertBefore(nodes['container'], config['tabset']);
        }else{
            config['container'].appendChild(nodes['container']);
        }
        cm.remove(config['tabset']);
	};
	
	var initHashChange = function(){
		var hash, id;
		
		if("onhashchange" in window && !is('IE7')){
			cm.addEvent(window, 'hashchange', hashHandler);
		}else{
			hash = window.location.hash;
			hashInterval = setInterval(function(){
				if(hash != window.location.hash){
					hash = window.location.hash;
					id = hash.replace('#', '');
					set(id);
				}
			}, 25);
		}
	};
	
	var hashHandler = function(){
		var id = window.location.hash.replace('#', '');
		set(id);
	};
	
	/* Main */
	
	var render = that.render = function(){
        if(config['toggleOnHashChange']){
            // Init hash change handler
            initHashChange();
            // Set first active tab
            hashHandler();
        }else{
            set(config['tabset'].getAttribute('data-active') || ids[0])
        }
	};
	
	var set = that.set = function(id){
		var id = id && tabs[id]? id : ids[0];
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
		// onShow event
		tabs[active]['onShow'](that, tabs[active]);
		tabs[active]['isHide'] = false;
			
		return that;
	};
	
	var setEvents = that.setEvents = function(o){
		if(o){
			tabs = cm.merge(tabs, o);
		}
		
		return that;
	};
	
	var remove = that.remove = function(){
		cm.removeEvent(window, 'hashchange', hashHandler);
		hashInterval && clearInterval(hashInterval);
		cm.remove(nodes['container']);
		
		return that;
	};
	
	init();
};

Com['TabsetCollector'] = function(node){
    var that = this,
        tabsets,
        id,
        tabset;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, function(item){
                render(item);
            });
        }else{
            render(node);
        }
    };

    var render = function(node){
        tabsets = cm.getByAttr('data-tabset', 'true', node);
        // Render datepickers
        cm.forEach(tabsets, function(item){
            tabset = new Com.Tabset({'tabset' : item});
            if(id = item.id){
                Com.Elements.Tabset[id] = tabset;
            }
        });
    };

    init(node);
};