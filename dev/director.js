var Director = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
			'slides' : [],
			'prefix' : ''
		}, o),
		nodes = {},
		indexed = {},
		anim = {},
		direction,
		count,
		width,
		hashInterval,
		isNavShow = false,
		current,
		currentSlide,
		previous,
		previousSlide;
		
	var init = function(){
		var id;
		// Render
		render();
		// Init hash change handler
		initHashChange();
		// Set first active slide
		id = window.location.hash.replace(['#', config['prefix']].join(''), '');
		set(id || 0);
	};
	
	var initHashChange = function(){
		var hash;
		
		if("onhashchange" in window && !is('IE7')){
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
		var id = window.location.hash.replace(['#', config['prefix']].join(''), '');
		set(id);
	};
	
	var render = function(){
		// Render Structure
		config['node'].appendChild(
			nodes['container'] = cm.Node('div', {'class' : 'module-slider'},
				nodes['navContainer'] = cm.Node('div', {'class' : 'nav'}),
				nodes['arrows'] = cm.Node('div', {'class' : 'arrows'},
					nodes['next'] = cm.Node('a', {'class' : 'next'}),
					nodes['prev'] = cm.Node('a', {'class' : 'prev'})
				),
				nodes['inner'] = cm.Node('ul')
			)
		);
		width = nodes['inner'].offsetWidth;
		// Render nav
		nodes['nav'] = renderNav(nodes['navContainer']);
		// Init anim
		anim['scroll'] = new cm.Animation(nodes['inner']);
		anim['nav'] = new cm.Animation(nodes['navContainer']);
		// Add events
		nodes['next'].onmousedown = function(){
			direction = 'next';
		};
		nodes['prev'].onmousedown = function(){
			direction = 'prev';
		};
		// Index slides
		count = config['slides'].length;
		config['slides'].forEach(function(item, i){
			indexed[item['name']] = i;
		});
	};
	
	var renderNav = function(node){
		var myNodes = {
			'items' : {}
		};
		// Structure
		node.appendChild(
			myNodes['container'] = cm.Node('div', {'class' : 'module-nav'},
				myNodes['inner'] = cm.Node('ul')
			)
		);
		// Items
		config['slides'].forEach(function(item, i){
			if(/chapter|slide/.test(item['type'])){
				myNodes['items'][i] = {};
				myNodes['inner'].appendChild(
					myNodes['items'][i]['node'] = cm.Node('li', {'class' : [item['type'], ' ', 'nav-', item['type'], '-', item['name']].join('')},
						myNodes['items'][i]['link'] = cm.Node('a', {'href' : ['#', config['prefix'], item['name']].join('')},
							cm.Node('span', {'class' : 'inner'})
						)
					)
				);
				myNodes['items'][i]['link'].onmousedown = function(){
					direction = false;
				};
			}
		});
		// Return nodes
		return myNodes;
	};
	
	var showNav = function(){
		if(!isNavShow){
			isNavShow = true;
			anim['nav'].go({'style' : {'opacity' : 1}, 'duration' : 900, 'anim' : 'smooth', 'onStop' : function(){
				if(is('IE') && isVersion() < 9){
					nodes['navContainer'].style.filter = 'none';
				}
			}});
		}
	};
	
	var hideNav = function(){
		if(isNavShow){
			isNavShow = false;
			anim['nav'].go({'style' : {'opacity' : 0}, 'duration' : 900, 'anim' : 'smooth'});
		}
	};
	
	var setNav = function(i){
		cm.foreach(nodes['nav']['items'], function(key, item){
			if(key <= i){
				cm.addClass(item['node'], 'active');
			}else{
				cm.removeClass(item['node'], 'active');
			}
		});
	};
	
	var renderSlide = function(item, old){
		var my = this,
			item = cm.merge({
				'name' : '',
				'type' : 'slide',			// splash | chapter | slide | tofc | quiz
				'hideNav' : false,
				'slide' : function(){}
			}, item),
			myIsRemoved = false,
			myAnim;
			
		var myInit = function(){
			// Structure
			nodes['inner'].appendChild(
				item['node'] = cm.Node('li', {'class' : [item['type'], ' ', config['prefix'], item['name']].join('')})
			);
			// Render slide content
			item['slide'] = new item['slide']({
				'node' : item['node'],
				'director' : that
			});
			// Nav
			if(item['hideNav']){
				hideNav();
			}else{
				showNav();
			}
			// Animate
			item['anim'] = new cm.Animation(item['node']);
			// Animation logic
			if(item['type'] == 'splash' && direction == 'prev'){
				new scrollRight(item, old);
			}else if(item['type'] == 'tofc' && direction == 'next' && old['type'] == 'splash'){
				new scrollLeft(item, old);
			}else if(item['type'] == 'chapter' && direction == 'prev' && old['type'] != 'tofc'){
				new scrollRight(item, old);
			}else if(item['type'] == 'slide' && direction == 'next'){
				new scrollLeft(item, old);
			}else if(item['type'] == 'slide' && direction == 'prev' && old['type'] != 'chapter'){
				new scrollRight(item, old);
			}else if(item['type'] == 'quiz' && direction == 'prev' && old['type'] != 'chapter'){
				new scrollRight(item, old);
			}else if(item['type'] == 'quiz' && old && old['type'] == 'chapter'){
				new scrollLeft(item, old);
			}else{
				if(old){
					cm.insertFirst(item['node'], nodes['inner']);
					old['node'].style.zIndex = 2;
					old['anim'].go({'style' : {'opacity' : 0}, 'duration' : 1000, 'anim' : 'smooth', 'onStop' : function(){
						item['onShow']();
					}});
				}else{
					cm.setOpacity(item['node'], 0);
					item['anim'].go({'style' : {'opacity' : 1}, 'duration' : 1000, 'anim' : 'smooth', 'onStop' : function(){
						if(is('IE') && isVersion() < 9){
							item['node'].style.filter = 'none';
						}
						item['onShow']();
					}});
				}
			}
		};
		
		/* Main */

		item['onShow'] = function(){
			old && old.remove();
			item['slide'].onShow && item['slide'].onShow();
		};
		
		item['remove'] = function(){
			if(!myIsRemoved){
				myIsRemoved = true;
				old && old.remove();
				item['slide'].onHide && item['slide'].onHide();
				cm.remove(item['node']);
			}
		};
		
		myInit();
		
		return item;
	};
	
	var scrollRight = function(item, old){
		cm.insertFirst(item['node'], nodes['inner']);
		old['node'].style.left = [width, 'px'].join('');
		nodes['inner'].scrollLeft = width;
		anim['scroll'].go({'style' : {'scrollLeft' : 0}, 'duration' : 800, 'anim' : 'smooth', 'onStop' : function(){
			nodes['inner'].scrollLeft = 0;
			item['onShow']();
		}});
	};
	
	var scrollLeft = function(item, old){
		old['node'].style.left = 0;
		item['node'].style.left = [width, 'px'].join('');
		nodes['inner'].scrollLeft = 0;
		anim['scroll'].go({'style' : {'scrollLeft' : width}, 'duration' : 800, 'anim' : 'smooth', 'onStop' : function(){
			item['onShow']();
			item['node'].style.left = 0;
			nodes['inner'].scrollLeft = 0;
		}});
	};
	
	var set = function(i){
		var i = i;
		if(typeof i == 'string'){
			i = indexed[i];
		}
		if(config['slides'][i]){
			// Arrows
			if(i == 0){
				nodes['next'].style.display = 'block';
				nodes['prev'].style.display = 'none';
				nodes['next'].setAttribute('href', ['#', config['prefix'], config['slides'][1]['name']].join(''));
			}else if(i == (count - 1)){
				nodes['next'].style.display = 'none';
				nodes['prev'].style.display = 'block';
				nodes['prev'].setAttribute('href', ['#', config['prefix'], config['slides'][i - 1]['name']].join(''));
			}else{
				nodes['next'].style.display = 'block';
				nodes['prev'].style.display = 'block';
				nodes['next'].setAttribute('href', ['#', config['prefix'], config['slides'][i + 1]['name']].join(''));
				nodes['prev'].setAttribute('href', ['#', config['prefix'], config['slides'][i - 1]['name']].join(''));
			}
			// Nav
			setNav(i);
			// Save previous
			if(currentSlide){
				previous = current;
				previousSlide = currentSlide;
			}
			// Current
			current = i;
			currentSlide = new renderSlide(config['slides'][i], previousSlide);
		}
	};
	
	/* Main */
	
	that.set = function(i){
		direction = false;
		set(i);
		return that;
	};
	
	that.embedNav = function(node){
		renderNav(node);
		return that;
	};
	
	init();
};