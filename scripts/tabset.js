Com['Tabset'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'renderOnInit' : true
		},o),
		nodes = {
			'container' : config['node']
		},
		ids = [],
		tabs = {},
		active,
		hashInterval;
		
	var init = function(){
		var tab, id, a, content;
		// Get nodes
		nodes['head'] = cm.getByClass('tabset-head', nodes['container'])[0];
		nodes['content'] = cm.getByClass('tabset-content', nodes['container'])[0];

		if(nodes['head'] && nodes['content']){
			// Get inner nodes
			nodes['headUL'] = nodes['head'].getElementsByTagName('ul')[0];
			nodes['contentUL'] = nodes['content'].getElementsByTagName('ul')[0];
			// Collect tabs
			for(var i = 0, l = nodes['headUL'].childNodes.length; i < l; i++){
				tab = nodes['headUL'].childNodes[i];
				if(tab.tagName && /^li$/i.test(tab.tagName)){
					// Get tab nodes
					id = tab.getAttribute('data-tabset-for');
					a = tab.getElementsByTagName('a')[0];
					content = cm.getByAttr('data-tabset-id', id, nodes['contentUL'])[0];
					// Remove active tab class if exists
					cm.removeClass(tab, 'active');
					// Hide content
					content.style.display = 'none';
					// Insert into array
					ids.push(id);
					tabs[id] = {
						'id' : id,
						'tab' : tab,
						'link' : a,
						'content' : content,
						'isHide' : true,
						'onShow' : function(){},
						'onHide' : function(){}
					};
				}
			}
			// Render active tab
			config['renderOnInit'] && render();
		}
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
		var id;
		// Init hash change handler
		initHashChange();
		// Set first active tab
		hashHandler();
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