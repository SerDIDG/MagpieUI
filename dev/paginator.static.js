var StaticPaginator = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'renderArrows' : true,
			'renderNavPages' : true,
			'langs' : {
				'next' : 'Next Page',
				'prev' : 'Previous Page',
				'pages' : 'Pages:'
			}
		}, o),
		nodes = {},
		pages,
		navPages = [],
		current = 0;
		
	var init = function(){
		nodes['pages'] = cm.getByClass('pages', config['node'])[0];
		pages = cm.getByClass('page', nodes['pages']);
		// Render nav
		config['node'].appendChild(
			nodes['nav'] = cm.Node('div', {'class' : 'nav clear'})
		);
		// Render nav arrows
		if(config['renderArrows']){
			renderArrows(nodes['nav']);
		}
		// Render nav pages
		if(config['renderNavPages']){
			nodes['nav'].appendChild(
				nodes['navPages'] = cm.Node('dl',
					cm.Node('dt', config['langs']['pages'])
				)
			);
			for(var i = 0, l = pages.length; i < l; i++){
				(function(){
					var z = i;
					nodes['navPages'].appendChild(
						navPages[z] = cm.Node('dd',
							cm.Node('a', {'href' : 'javascript:void(0);'}, (z + 1))
						)
					);
					if(z === 0){
						cm.addClass(navPages[z], 'active');
					}
					navPages[z].onclick = function(){
						goto(z);
					};
				})();
			}
		} 
	};
	
	/* Main */
	
	var renderArrows = that.embedArrows = function(container){
		var myNodes = {};	
		myNodes['arrows'] = cm.Node('div', {'class' : 'arrows'},
			myNodes['prev'] = cm.Node('div', {'class' : 'icon arrow-left', 'title' : config['langs']['prev']}),
			myNodes['next'] = cm.Node('div', {'class' : 'icon arrow-right', 'title' : config['langs']['next']})
		);
		myNodes['next'].onclick = next;
		myNodes['prev'].onclick = prev;
		container && container.appendChild(myNodes['arrows']);

		return that;
	};
	
	var next = that.next = function(){
		if(pages[(current + 1)]){
			goto((current + 1));
		}else{
			goto(0);
		}
		return that;
	};
	
	var prev = that.prev = function(){
		if(pages[(current - 1)]){
			goto((current - 1));
		}else{
			goto((pages.length - 1));
		}
		return that;
	};
	
	var goto = that.goto = function(page){
		current = page;
		for(var i = 0, l = pages.length; i < l; i++){
			pages[i].style.display = 'none';
			config['renderNavPages'] && cm.removeClass(navPages[i], 'active');
		}
		pages[page].style.display = 'block';
		config['renderNavPages'] && cm.addClass(navPages[page], 'active');
		return that;
	};
	
	init();
};