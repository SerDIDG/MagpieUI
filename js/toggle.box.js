Com['ToggleBox'] = function(o){
	var that = this,
		config = cm.merge({
            'node' : cm.Node('div'),
			'button' : cm.Node('div'),
			'block' : cm.Node('div'),
			'onShow' : function(){},
			'onHide' : function(){},
			'time' : 500,
			'useLangs' : false,             // If true - will be changes titles
			'titleNode' : false,			// If 'false' - script uses DT tag element, else - put title's dom node
            'events' : {},
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		},o),
        API = {
            'onShowStart' : [],
            'onShow' : [],
            'onHideStart' : [],
            'onHide' : []
        },
		anim,
		isHide,
        isProcess;
		
	var init = function(){
        // Convert events and deprecated event model
        convertEvents(config['events']);
        that.addEvent('onShowStart', config['onShowStart']);
        that.addEvent('onShow', config['onShow']);
        that.addEvent('onHideStart', config['onHideStart']);
        that.addEvent('onHide', config['onHide']);
        // Add events
        setMiscEvents();
	};

    var setMiscEvents = function(){
        var isHideTemp;
        anim = new cm.Animation(config['block']);
        cm.addEvent(config['button'], 'click', function(){
            isHideTemp = config['block'].offsetHeight === 0;
            isHide = !(!isHideTemp && (!isProcess || isProcess == 'show'));

            if(isHide){
                show();
            }else{
                hide();
            }
        });
    };
	
	var show = function(){
		if(isHide){
			var height,
				currentHeight;
			isHide = false;
            isProcess = 'show';
            cm.addClass(config['node'], 'is-show');
			// Set title
			if(config['useLangs']){
				if(config['titleNode']){
					config['titleNode'].innerHTML = config['langs']['hideTitle'];
				}else{
					config['button'].innerHTML = config['langs']['hideTitle'];
				}
			}
			// Get real block height
			currentHeight =  config['block'].offsetHeight + 'px';
			config['block'].style.height = 'auto';
			height = config['block'].offsetHeight + 'px';
			config['block'].style.height = currentHeight;
			// Animate
			anim.go({'style' : {'height' : height}, 'anim' : 'smooth', 'duration' : config['time'], 'onStop' : function(){
                isProcess = false;
				config['block'].style.height = 'auto';
				config['block'].style.overflow = 'visible';
                // Show Event
                executeEvent('onShow');
			}});
            // On Show Start Event
            executeEvent('onShowStart');
		}
	};
	
	var hide = function(){
		if(!isHide){
			isHide = true;
            isProcess = 'hide';
            cm.removeClass(config['node'], 'is-show');
			// Set title
			if(config['useLangs']){
				if(config['titleNode']){
					config['titleNode'].innerHTML = config['langs']['showTitle'];
				}else{
					config['button'].innerHTML = config['langs']['showTitle'];
				}
			}
			// Animate
			config['block'].style.overflow = 'hidden';
			anim.go({'style' : {'height' : '0px'}, 'anim' : 'smooth', 'duration' : config['time'], 'onStop' : function(){
                isProcess = false;
                // Hide Event
                executeEvent('onHide');
            }});
            // On Hide Start Event
            executeEvent('onHideStart');
		}
	};

    var executeEvent = function(event){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that);
            });
        };

        switch(event){
            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    /* *** MAIN *** */

    that.show = function(){
        show();
        return that;
    };

    that.hide = function(){
        hide();
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

Com['ToggleBoxWidget'] = function(o){
	var config = cm.merge({
			'node' : cm.Node('div'),
			'onShow' : function(){},
			'onHide' : function(){},
			'time' : 500,
			'useLangs' : false,
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		}, o);
		
	var init = function(){
		config['button'] = config['node'].getElementsByTagName('dt')[0];
		config['block'] = config['node'].getElementsByTagName('dd')[0];
		config['titleNode'] = cm.getByAttr('data-togglebox-titlenode', 'true', config['node'])[0];
		
		if(config['button'] && config['block']){
			new Com.ToggleBox(config);
		}
	};
	
	init();
};

Com['ToggleBoxCollector'] = function(node){
    var toggleboxes,
        togglebox,
        langShow,
        langHide;

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
        toggleboxes = cm.clone((node.getAttribute('data-togglebox') == 'true') ? [node] : cm.getByAttr('data-togglebox', 'true', node));
        cm.forEach(toggleboxes, function(item){
			langShow = item.getAttribute('data-togglebox-show');
			langHide = item.getAttribute('data-togglebox-hide');
		    // Render toggleboxes
			new Com.ToggleBox({
                'node' : item,
				'button' : item.getElementsByTagName('dt')[0],
				'block' : item.getElementsByTagName('dd')[0],
				'titleNode' : cm.getByAttr('data-togglebox-titlenode', 'true', item)[0],
				'useLangs' : langShow && langHide,
				'langs' : {
					'showTitle' : langShow,
					'hideTitle' : langHide
				}
			});
		});
	};
	
	init(node);
};

Com['ToggleBoxAccordion'] = function(node){
	var boxes = [],
        toggleboxes,
        togglebox;

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
        toggleboxes = cm.clone((node.getAttribute('data-togglebox') == 'true') ? [node] : cm.getByAttr('data-togglebox', 'true', node));
        cm.forEach(toggleboxes, function(item){
            var langShow = item.getAttribute('data-togglebox-show'),
                langHide = item.getAttribute('data-togglebox-hide');
            // Init togglebox and push to array
            togglebox = new Com.ToggleBox({
                'button' : item.getElementsByTagName('dt')[0],
                'block' : item.getElementsByTagName('dd')[0],
                'titleNode' : cm.getByAttr('data-togglebox-titlenode', 'true', item)[0],
                'useLangs' : langShow && langHide,
                'langs' : {
                    'showTitle' : langShow,
                    'hideTitle' : langHide
                },
                'events' : {
                    'onShowStart' : hide
                }
            });
            boxes.push(togglebox);
        });
	};
	
	var hide = function(me){
		cm.forEach(boxes, function(item){
			if(me !== item){
				item.hide();
			}
		});
	};
	
	init(node);
};

Com['ToggleBoxGridlist'] = function(o){
	var config = cm.merge({
			'node' : cm.Node('div'),
			'useLangs' : false,
			'langs' : {
				'showTitle' : 'Show',
				'hideTitle' : 'Hide'
			}
		}, o),
		buttons = [],
		boxes = {};
		
	var init = function(){
		// Get buttons
		buttons = cm.getByAttr('data-togglebox-button', 'true', config['node']);
		// Get blocks
		for(var i = 0, l = buttons.length; i < l; i++){
			renderItem(buttons[i]);
		}
	};
	
	var renderItem = function(button){
		var id = button.getAttribute('data-gridlist-for'),
			blocks = cm.getByAttr('data-gridlist-id', id, config['node']),
			subs = cm.getByAttr('data-gridlist-parent-id', id, config['node']);
		// Add event
		cm.addEvent(button, 'click', function(){
			if(boxes[id]['isHide']){
				show(id);
			}else{
				hide(id);
			}
		});
		// Collect
		boxes[id] = {
			'id' : id,
			'item' : cm.getByAttr('data-gridlist-item', id, config['node'])[0],
			'button' : button,
			'blocks' : blocks,
			'subs' : subs,
			'isHide' : cm.isClass(blocks[0], 'display-none')
		};
	};
	
	var show = function(id){
		boxes[id]['isHide'] = false;
		for(var i = 0, l = boxes[id]['blocks'].length; i < l; i++){
			cm.removeClass(boxes[id]['blocks'][i], 'display-none');
			cm.addClass(boxes[id]['blocks'][i], 'is-show');
		}
		cm.addClass(boxes[id]['item'], 'is-show');
		if(config['useLangs']){
			boxes[id]['button'].innerHTML = config['langs']['hideTitle'];
		}
	};
	
	var hide = function(id){
		boxes[id]['isHide'] = true;
		if(boxes[id]['subs']){
            cm.forEach(boxes[id]['subs'], function(item){
                var subId = item.getAttribute('data-gridlist-id');
                if(subId != id){
                    hide(subId);
                }
            });
		}
        cm.forEach(boxes[id]['blocks'], function(item){
            cm.addClass(item, 'display-none');
            cm.removeClass(item, 'is-show');
        });
		cm.removeClass(boxes[id]['item'], 'is-show');
		if(config['useLangs']){
			boxes[id]['button'].innerHTML = config['langs']['showTitle'];
		}
	};
	
	init();
};


