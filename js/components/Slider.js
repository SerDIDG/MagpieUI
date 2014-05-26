Com['Slider'] = function(o){
	var that = this,
		config = cm.merge({
			'node' : cm.Node('div'),
            'nodesMarker' : 'ComSlider',
            'configMarker' : 'data-config',
            'nodes' : {},
            'events' : {},
			'time' : 500,					// Fade time
			'delay' : 4000,                 // Delay before slide will be changed
            'slideshow' : true,             // Turn on / off slideshow
            'direction' : 'forward',        // Slideshow direction: forward | backward | random
			'pauseOnHover' : true,
			'fadePrevious' : false,			// Fade out previous slide, needed when using transparency slides
			'buttons' : true,               // Display buttons, can hide exists buttons
			'numericButtons' : false,		// Render slide index on button
			'arrows' : true,                // Display arrows, can hide exists arrows
            'effect' : 'fade',              // fade | push
            'transition' : 'smooth'         // smooth | simple | acceleration | inhibition
		}, o),
		nodes = {
            'container' : cm.Node('div'),
            'slides' : cm.Node('div'),
            'slidesInner' : cm.Node('ul'),
            'next' : cm.Node('div'),
            'prev' : cm.Node('div'),
            'buttons' : cm.Node('ul'),
            'items' : []
        },
        API = {
            'onChangeStart' : [],
            'onChange' : [],
            'onPause' : [],
            'onUnPause' : []
        },
		items = [],
        anims = {},
        slideshowInt;

    that.direction = 'next';
    that.current = null;
    that.previous = null;
    that.paused = false;
		
	var init = function(){
        convertEvents(config['events']);
        getNodes(config['node'], config['nodesMarker']);
        getConfig(config['node'], config['configMarker']);
        // Validate configuration parameters and check supported values
        validateConfig();
		// Render slider
		render();
		// Set first active slide
        items[0] && set(0);
	};
	
	var render = function(){
        // Set class on slides container dependence of animation effect
        cm.addClass(nodes['slides'], ['effect', config['effect']].join('-'));
        // Collect items
        cm.forEach(nodes['items'], collectItem);
        // Arrows
        if(config['arrows']){
            cm.addEvent(nodes['next'], 'click', that.next);
            cm.addEvent(nodes['prev'], 'click', that.prev);
        }
        if(!config['arrows'] || items.length < 2){
            nodes['next'].style.display = 'none';
            nodes['prev'].style.display = 'none';
        }
        // Buttons
        if(config['buttons']){
            cm.forEach(items, renderButton);
        }
        if(!config['buttons'] || items.length < 2){
            nodes['buttons'].style.display = 'none';
        }
        // Pause slider when it hovered
        if(config['slideshow'] && config['pauseOnHover']){
            cm.addEvent(nodes['container'], 'mouseover', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(nodes['container'], target, true)){
                    that.pause();
                }
            });
            cm.addEvent(nodes['container'], 'mouseout', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(nodes['container'], target, true)){
                    that.unpause();
                }
            });
        }
        // Init animations
        anims['slides'] = new cm.Animation(nodes['slides']);
        anims['slidesInner'] = new cm.Animation(nodes['slidesInner']);
	};

    var collectItem = function(item){
        // Configuration
        item = {
            'nodes' : item
        };
        // Process item
        processItem(item);
    };
	
	var processItem = function(item){
        // Configuration
        item = cm.merge({
            'index' : items.length,
            'nodes' : {
                'container' : cm.Node('li')
            }
        }, item);
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Push to items array
        items.push(item);
	};

    var renderButton = function(item){
        // Structure
        nodes['buttons'].appendChild(
            item['nodes']['button'] = cm.Node('li')
        );
        if(config['numericButtons']){
            item['nodes']['button'].innerHTML = item['index'] + 1;
        }
        // Event
        cm.addEvent(item['nodes']['button'], 'click', function(){
            that.direction = 'next';
            set(item['index']);
        });
    };

    var effects = {
        'fade' : function(current, previous, callback){
            var fadeOut = function(item){
                if(item){
                    item['nodes']['container'].style.zIndex = 1;
                    if(config['fadePrevious']){
                        item['anim'].go({'style' : {'opacity' : 0}, 'duration' : config['time'], 'anim' : config['transition'], 'onStop' : function(){
                            hide(item);
                        }});
                    }else{
                        setTimeout(function(){
                            hide(item);
                        }, config['time']);
                    }
                }
            };
            var hide = function(item){
                if(item['index'] != that.current){
                    item['nodes']['container'].style.display = 'none';
                    cm.setOpacity(item['nodes']['container'], 0);
                }
            };
            // Hide previous slide
            fadeOut(previous);
            // Set visible new slide and animate it
            current['nodes']['container'].style.zIndex = 2;
            current['nodes']['container'].style.display = 'block';
            current['anim'].go({'style' : {'opacity' : 1}, 'duration' : config['time'], 'anim' : config['transition'], 'onStop' : callback});
        },

        'push' : function(current, previous, callback){
            var left = current['nodes']['container'].offsetLeft;
            anims['slidesInner'].go({'style' : {'scrollLeft' : left}, 'duration' : config['time'], 'anim' : config['transition'], 'onStop' : callback});
        }
    };
	
	var set = function(index){
        // Renew slideshow delay
        config['slideshow'] && renewSlideshow();
        // Set current active slide
        var current = items[index],
            previous = items[that.current];
        that.previous = that.current;
        that.current = index;
        // API onChangeStart event
        executeEvent('onChangeStart', {
            'current' : current,
            'previous' : previous
        });
        // Reset active slide
        if(previous){
            if(config['buttons']){
                cm.removeClass(previous['nodes']['button'], 'active');
            }
        }
		// Set active slide
		if(config['buttons']){
			cm.addClass(current['nodes']['button'], 'active');
		}
        // Transition effect and callback
        effects[config['effect']](current, previous, function(){
            // API onChange event
            executeEvent('onChange', {
                'current' : current,
                'previous' : previous
            });
        });
	};

    /* *** SLIDESHOW *** */

    var startSlideshow = function(){
        that.paused = false;
        slideshowInt = setTimeout(function(){
            switch(config['direction']){
                case 'random':
                    set(cm.rand(0, (items.length - 1)));
                    break;
                case 'backward':
                    that.prev();
                    break;
                case 'forward':
                    that.next();
                    break;
            }
        }, config['delay']);
    };

    var stopSlideshow = function(){
        that.paused = true;
        slideshowInt && clearTimeout(slideshowInt);
    };

    var renewSlideshow = function(){
        if(!that.paused){
            stopSlideshow();
            startSlideshow();
        }
    };

    /* *** MISC FUNCTIONS *** */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var validateConfig = function(){
        config['direction'] = {'forward' : 1, 'backward' : 1, 'random' : 1}[config['direction']] ? config['direction'] : 'forward';
        config['effect'] = {'push' : 1, 'fade' : 1}[config['effect']] ? config['effect'] : 'fade';
        config['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[config['transition']] ? config['transition'] : 'smooth';
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

    that.set = function(index){
        if(items[index]){
            set(index);
        }
        return that;
    };

    that.next = function(){
        that.direction = 'next';
        var i = ((that.current + 1) == items.length)? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function(){
        that.direction = 'prev';
        var i = (that.current == 0)? (items.length - 1) : (that.current - 1);
        set(i);
        return that;
    };

    that.pause = function(){
        stopSlideshow();
        // API onPause event
        executeEvent('onPause');
        return that;
    };

    that.unpause = function(){
        startSlideshow();
        // API onUnPause event
        executeEvent('onUnPause');
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