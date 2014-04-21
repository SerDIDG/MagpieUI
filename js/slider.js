Com['Slider'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),		// Slider container
			'time' : 500,					// Fade time
			'delay' : 4000,
			'pauseOnHover' : true,
			'fadePrevious' : false,			// Fade out previous slide, needed when using transparency slides
			'buttons' : true,
			'scrollButtons' : false,		// Scroll buttons line inside, needed when using a lot of slides
			'numericButtons' : false,		// Render slide number on buttons
			'buttonsCount' : 3,				// Works only with active "buttons" and "scrollButtons"
			'arrows' : false,
			'nav' : false,
			'scrollNav' : false,			// Works only with active "nav"
			'scrollNavType' : 'available',	// Scroll nav by "first" or "last" item, or by "available" size. Works only with active "nav" and "scrollNav". "last" not yet implemented!
			'scrollNavTime' : 200,
            'effect' : 'fade',              // fade, push
            'transition' : 'smooth',
			'langs' : {
				'next' : 'Next',
				'prev' : 'Previous'
			}
		}, o),
		nodes = {},
		slides = [],
        anims = {},
		count = 0,
		buttonSize,
		current,
		isPause = false,
		direction = 'next';
		
	var init = function(){
        validateConfig();
		// Render slider
		render();
		// Init manager
		setInterval(function(){
			!isPause && next();
		}, config['delay']);
		// Set first slide
		set(0);
	};

    var validateConfig = function(){
        // Check supported values
        config['effect'] = {'push' : 1, 'fade' : 1}[config['effect']] ? config['effect'] : 'fade';
        config['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[config['transition']] ? config['transition'] : 'smooth';
    };
	
	var render = function(){
		var lines;
        // Structure
        nodes['stuff'] = cm.Node('div', {'class':'stuff'},
            nodes['stuffInner'] = cm.Node('div', {'class':'inner'})
        );
        config['node'].appendChild(nodes['stuff']);
		// Container for slider buttons
		if(config['buttons']){
			nodes['buttonsContainer'] = nodes['stuffInner'].appendChild(cm.Node('div', {'class':'markers'}));
			// Container for buttons scroll
			if(config['scrollButtons']){
				nodes['buttonsScroll'] = nodes['buttonsContainer'].appendChild(cm.Node('div', {'class':'scroll'}));
				nodes['buttonsContainer'] = nodes['buttonsScroll'].appendChild(cm.Node('div', {'class':'inside'}));
				nodes['buttonsAnim'] = new cm.Animation(nodes['buttonsContainer']);
			}
		}
		// Container for nav
		if(config['nav']){
			nodes['navContainer'] = cm.getByClass('nav', config['node'])[0];
			nodes['navInner'] = nodes['navContainer'].getElementsByTagName('ul')[0];
			nodes['navItems'] = nodes['navContainer'].getElementsByTagName('li');
			// Init animation for nav scroller
			if(config['scrollNav']){
				nodes['navAnim'] = new cm.Animation(nodes['navInner']);
			}
		}
		// Render slides, buttons, nav
        nodes['slides'] = cm.getByClass('slides', config['node'])[0];
        anims['slides'] = new cm.Animation(nodes['slides']);
		lines = nodes['slides'].getElementsByTagName('li');
		count = lines.length;
        cm.forEach(count, function(i){
            renderSlide(i, lines[i]);
        });
		// Set dimentions to buttons scroll container
		if(config['buttons'] && config['scrollButtons']){
			buttonSize = slides[1]['button'].offsetWidth;
			nodes['buttonsScroll'].style.width = buttonSize * config['buttonsCount'] + 'px';
			nodes['buttonsContainer'].style.width = buttonSize * count + 'px';
		}
		// Arrows
		if(config['arrows']){
			nodes['arrowPrev'] = nodes['stuffInner'].appendChild(cm.Node('div', {'class':'arrow-l', 'title' : config['langs']['prev']}));
			nodes['arrowNext'] = nodes['stuffInner'].appendChild(cm.Node('div', {'class':'arrow-r', 'title' : config['langs']['next']}));
			nodes['arrowPrev'].onclick = previous;
			nodes['arrowNext'].onclick = next;
		}
		// Pause slide change on hover
		if(config['pauseOnHover']){
			cm.addEvent(config['node'], 'mouseover', function(){
				isPause = true;
			});
			cm.addEvent(config['node'], 'mouseout', function(){
				isPause = false;
			});
		}
	};
	
	var renderSlide = function(i, item){
		var slide = slides[i] = {};
		// Render buttons
		if(config['buttons']){
			slide['button'] = nodes['buttonsContainer'].appendChild(cm.Node('div', {'class':'marker'}));
			if(config['numericButtons']){
				slide['button'].innerHTML = i + 1;
			}
            cm.addEvent(slide['button'], 'click', function(){
                direction = 'next';
                set(i);
            });
		}
		// Render nav buttons
		if(config['nav']){
			slide['nav'] = nodes['navItems'][i];
			slide['nav'].onclick = function(){
				direction = 'next';
				set(i);
			};
		}
		// Add slide node to array
		slide['node'] = item;
		slide['anim'] = new cm.Animation(slide['node']);
	};
	
	var previous = function(){
		direction = 'prev';
		var i = (current == 0)? (count - 1) : (current - 1);
		set(i);
	};
	
	var next = function(){
		direction = 'next';
		var i = ((current + 1) == count)? 0 : (current + 1);
		set(i);
	};

    var effects = {
        'fade' : function(item){
            var fadeOut = function(slide){
                if(slides[current]){
                    slides[slide]['node'].style.zIndex = 1;
                    if(config['fadePrevious']){
                        slides[slide]['anim'].go({'style' : {'opacity' : 0}, 'duration' : config['time'], 'onStop' : function(){
                            hide(slide);
                        }});
                    }else{
                        setTimeout(function(){
                            hide(slide);
                        }, config['time']);
                    }
                }
            };
            var hide = function(slide){
                if(slide != current){
                    slides[slide]['node'].style.display = 'none';
                    cm.setOpacity(slides[slide]['node'], 0)
                }
            };
            // Hide previous slide
            fadeOut(current);
            // Set visible new slide and animate it
            slides[item]['node'].style.zIndex = 2;
            slides[item]['node'].style.display = 'block';
            slides[item]['anim'].go({'style' : {'opacity' : 1}, 'duration' : config['time'], 'anim' : config['transition']});
        },

        'push' : function(item){
            var left = slides[item]['node'].offsetLeft;
            anims['slides'].go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'anim' : config['transition']});
        }
    };
	
	var set = function(item){
		// Global
        cm.forEach(count, function(i){
            // Reset active class name from buttons
            if(config['buttons']){
                cm.removeClass(slides[i]['button'], 'active');
            }
            // Reset active class name from nav
            if(config['nav']){
                cm.removeClass(slides[i]['nav'], 'active');
            }
        });
		// Set active class name to button
		if(config['buttons']){
			cm.addClass(slides[item]['button'], 'active');
			// Scroll buttons
			if(config['scrollButtons']){
				nodes['buttonsAnim'].go({'style' : {'left': - ((item - 1) * buttonSize) + 'px'}, 'duration' : 200});
			}
		}
		// Set active class name to nav
		if(config['nav']){
			cm.addClass(slides[item]['nav'], 'active');
			// Scroll nav
			scrollNav(item);
		}
        // Transition Effect
        effects[config['effect']](item);
		// Set current active slide
		current = item;
	};
	
	var scrollNav = function(slide){
		var width, available, previous, next, left, node;
		
		if(config['scrollNav']){
			switch(config['scrollNavType']){
				case 'available' :
					if(slides[current]){
						available = Math.max((nodes['navInner'].scrollWidth - nodes['navInner'].offsetWidth), 0);
						previous = slides[current]['nav'].offsetWidth;
						left = (slide === 0)? 0 : nodes['navInner'].scrollLeft + Math.min(available, previous);
						nodes['navAnim'].go({'style' : {'scrollLeft': left}, 'duration' : config['scrollNavTime']});
					}
				break;
				
				case 'first' :
					width = nodes['navContainer'].offsetWidth;
					if(width < nodes['navInner'].offsetWidth){
						if(slides[current] && current != slide){
							if(direction == 'next'){
								previous = slides[current]['nav'].offsetWidth;
								nodes['navInner'].style.left = slides[slide]['nav'].offsetLeft + 'px';
								node = nodes['navInner'].firstChild;
								while(node != slides[slide]['nav']){
									nodes['navInner'].appendChild(node);
									node = nodes['navInner'].firstChild;
								}
							}else{
								next = slides[slide]['nav'].offsetWidth;
								nodes['navInner'].style.left = - next + 'px';
								cm.insertFirst(slides[slide]['nav'], nodes['navInner']);
							}
						}
						// Check availability
						for(var i = 0; i < count; i++){
							if((slides[i]['nav'].offsetLeft + slides[i]['nav'].offsetWidth) > width){
								cm.setOpacity(slides[i]['nav'], 0);
							}else{
								cm.setOpacity(slides[i]['nav'], 1);
							}
						}
						// Animate
						nodes['navAnim'].go({'style' : {'left': '0px'}, 'duration' : config['scrollNavTime']});
					}
				break;
			}
		}
	};
	
	init();
};