Com.Elements['Selects'] = {};

Com['GetSelect'] = function(id){
	return Com.Elements.Selects[id] || null;
};

Com['Select'] = function(o){
	var that = this,
		config = cm.merge({
            'container' : cm.Node('div'),
			'select' : cm.Node('select'),
            'multiple' : false,
			'menuMargin' : 3,
            'options' : [],
			'selected' : 0,
			'events' : {}					// Deprecated, use addEvent method
		}, o),
		API = {
			'onSelect' : [],
			'onChange' : [],
			'onFocus' : [],
			'onBlur' : []
		},
		nodes = {},
		options = {},
		optionsList = [],
		optionsLength,
		isHide = true,
		checkInt,
		anim,
		
		oldActive,
		active;
	
	var init = function(){
		// Legacy: Convert events to API Events
		convertEvents(config['events']);
		// Render
		render();
		setMiscEvents();
        // Set selected option
        if(config['multiple']){
            active = [];
			if(config['selected'] && cm.isArray(config['selected'])){
                cm.forEach(config['selected'], function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
			}else{
				cm.forEach(config['select'].options, function(item){
					item.selected && set(options[item.value]);
				});
			}
        }else{
			if(config['selected'] && options[config['selected']]){
				set(options[config['selected']]);
			}else if(config['select'].value){
				set(options[config['select'].value]);
			}else{
				set(optionsList[0]);
			}
        }
	};

    var render = function(){
		var tabindex;
		/* *** RENDER STRUCTURE *** */
		if(config['multiple']){
            renderMultiple();
        }else{
            renderSingle();
        }
		/* *** ATTRIBUTES *** */
		// Set select width
		if(config['select'].offsetWidth && config['select'].offsetWidth != config['select'].parentNode.offsetWidth){
            nodes['container'].style.width = config['select'].offsetWidth + 'px';
		}
		// Add class name
		if(config['select'].className){
			cm.addClass(nodes['container'], config['select'].className);
		}
		// Tabindex
		if(tabindex = config['select'].getAttribute('tabindex')){
			nodes['container'].setAttribute('tabindex', tabindex);
		}
		// ID
		if(config['select'].id){
			nodes['container'].id = config['select'].id;
		}
		// Data
		Array.prototype.forEach.call(config['select'].attributes, function(item){
			if(/^data-/.test(item.name)){
				nodes['container'].setAttribute(item.name, item.value);
			}
		});
        // Set hidden input attributes
        if(config['select'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', config['select'].getAttribute('name'));
        }
		/* *** RENDER OPTIONS *** */
        cm.forEach(config['select'].options, function(item){
            renderOption(item.value, item.innerHTML);
        });
        cm.forEach(config['options'], function(item){
            renderOption(item.value, item.text);
        });
		/* *** APPENDCHILD NEW SELECT *** */
        if(cm.inDOM(config['select'])){
		    cm.insertBefore(nodes['container'], config['select']);
        }else{
            config['container'].appendChild(nodes['container']);
        }
		cm.remove(config['select']);
	};

    var renderSingle = function(){
        nodes['container'] = cm.Node('div', {'class':'cm-select'},
            nodes['hidden'] = cm.Node('select', {'data-select' : 'false', 'class' : 'display-none'}),
            nodes['input'] = cm.Node('div', {'class':'cm-select-input clear'},
                cm.Node('div', {'class':'cm-select-inner'},
                    nodes['arrow'] = cm.Node('div', {'class':'cm-select-arrow'}),
                    nodes['text'] = cm.Node('div', {'class':'cm-select-text'})
                )
            ),

            nodes['menu'] = cm.Node('div', {'class':'cm-select-menu'},
                cm.Node('div', {'class':'cm-select-inner'},
                    nodes['scroll'] = cm.Node('div', {'class':'cm-select-scroll'},
                        nodes['items'] = cm.Node('ul')
                    )
                )
            )
        );
    };

    var renderMultiple = function(){
        nodes['container'] = cm.Node('div', {'class' : 'cm-multiselect'},
            nodes['hidden'] = cm.Node('select', {'data-select' : 'false', 'class' : 'display-none', 'multiple' : true}),
            nodes['inner'] = cm.Node('div', {'class' : 'inner'},
                nodes['scroll'] = cm.Node('div', {'class' : 'scroll'},
                    nodes['items'] = cm.Node('ul')
                )
            )
        );
    };
	
	var renderOption = function(value, text){
		// Check for exists
		if(options[value]){
			removeOption(options[value]);
		}
		// Config
		var item = {
            'node' : nodes['items'].appendChild(cm.Node('li', {'innerHTML' : text})),
            'option' : nodes['hidden'].appendChild(cm.Node('option', {'value' : value, 'innerHTML' : text})),
            'selected' : false,
			'value' : value,
			'text' : text
		};
		// Label onlick event
		item['node'].onclick = function(){
			set(item, true);
            !config['multiple'] && hideMenu(false);
		};
		// Push
		optionsList.push(options[value] = item);
		optionsLength = optionsList.length;
	};
	
	var removeOption = function(option){
        var value = option['value'] || option['text'];
		// Set new active option, if current active is nominated for remove
        if(config['multiple']){
            active = active.filter(function(item){
                return value != item;
            });
        }else{
            if(value === active){
                set(optionsList[0], true);
            }
        }
		// Remove option from list and array
		cm.remove(option['node']);
        cm.remove(option['option']);
		optionsList = optionsList.filter(function(item){
			return option != item;
		});
		optionsLength = optionsList.length;
		delete options[option['value']];
	};
	
	var setMiscEvents = function(){
		// Switch items on arrows press
		cm.addEvent(nodes['container'], 'keydown', function(e){
			e = cm.getEvent(e);
			var item = options[active],
				index = optionsList.indexOf(item);
			if(e.keyCode == 38){
				if(index - 1 >= 0){
					set(optionsList[index - 1], true);
				}else{
					set(optionsList[optionsLength - 1], true);
				}
			}else if(e.keyCode == 40){
				if(index + 1 < optionsLength){
					set(optionsList[index + 1], true);
				}else{
					set(optionsList[0], true);
				}
			}
		});
		cm.addEvent(nodes['container'], 'focus', function(){
			cm.addEvent(document.body, 'keydown', blockDocumentArrows)
		});
		cm.addEvent(nodes['container'], 'blur', function(){
			cm.removeEvent(document.body, 'keydown', blockDocumentArrows)
		});
        if(!config['multiple']){
            // Show / hide on click
            nodes['input'].onclick = function(){
                if(isHide){
                    showMenu();
                }else{
                    hideMenu(false);
                }
            };
            // Init animation
            anim = new cm.Animation(nodes['menu']);
        }
	};
	
	var set = function(option, execute){
        if(option){
            if(config['multiple']){
                setMultiple(option);
            }else{
                setSingle(option);
            }
        }
        /* *** EXECUTE API EVENTS *** */
        if(execute){
            executeEvent('onSelect');
            executeEvent('onChange');
        }
	};

    var setMultiple = function(option){
        var value = option['value'] || option['text'];
        if(option['selected']){
            active = active.filter(function(item){
                return value != item;
            });
            option['option'].selected = false;
            option['selected'] = false;
            cm.removeClass(option['node'], 'active');
        }else{
            active.push(value);
            option['option'].selected = true;
            option['selected'] = true;
            cm.addClass(option['node'], 'active');
        }
    };

    var setSingle = function(option){
        oldActive = active;
        active = option['value'] || option['text'];
        optionsList.forEach(function(item){
            cm.removeClass(item['node'], 'active');
        });
        cm.clearNode(nodes['text']).appendChild(
            cm.Node('span', {'innerHTML': option['text']})
        );
        option['option'].selected = true;
        cm.addClass(option['node'], 'active');
    };
	
	var executeEvent = function(event){
		var handler = function(){
			API[event].forEach(function(item){
				item(that, active);
			});
		};
		
		switch(event){
			case 'onChange':
                if(config['multiple']){
                    handler();
                }else{
                    active != oldActive && handler();
                }
			break;
			
			default:
				handler();
			break;
		}
	};
	
	var convertEvents = function(o){
		cm.foreach(o, function(key, item){
			if(API[key] && typeof item == 'function'){
				API[key].push(item);
			}
		});
	};
	
	var bodyClick = function(e){
		if(nodes && !isHide){
			e = cm.getEvent(e);
		    var target = cm.getEventTarget(e);
			if(!cm.isParent(nodes['menu'], target) && !cm.isParent(nodes['container'], target)){
				hideMenu(false);
			}
		}
	};
	
	var blockDocumentArrows = function(e){
		e = cm.getEvent(e);
		if(e.keyCode == 38 || e.keyCode == 40){
			if(e.preventDefault){ 
				e.preventDefault(); 
			}else{
				e.returnValue = false;
			}
		}
	};
	
	var getTop = function(){
		return nodes['container'].offsetHeight + cm.getRealY(nodes['container']);
	};
	
	var getPosition = (function(){
		var top, height, winHeight, containerHeight, position;
		
		return function(){
			winHeight = cm.getPageSize('winHeight');
			height = nodes['menu'].offsetHeight;
			top = getTop();
			containerHeight = nodes['container'].offsetHeight;
			position = (top + height > winHeight? (top - height - containerHeight - config['menuMargin']) : (top + config['menuMargin']));
			
			if(position != nodes['menu'].offsetTop){
				nodes['menu'].style.top =  [position, 'px'].join('');
				nodes['menu'].style.left = [cm.getX(nodes['container']), 'px'].join('');
				nodes['menu'].style.width = [nodes['container'].offsetWidth, 'px'].join('');
			}
		};
	})();
	
	var showMenu = function(){
		isHide = false;
		// Set classes
		cm.addClass(nodes['input'], 'hidden');
		cm.addClass(nodes['container'], 'active');
		// Append child menu in body and set position
		document.body.appendChild(nodes['menu']);
		getPosition();
		// Show menu
		nodes['menu'].style.display = 'block';
		// Scroll to active element
		if(active && options[active]){
			nodes['scroll'].scrollTop = options[active]['node'].offsetTop - nodes['scroll'].offsetTop;
		}
		// Check position
		checkInt = setInterval(getPosition, 5);
		// Hide menu on window resize
		cm.addEvent(window, 'resize', hideMenu);
		// Hide menu by click on another object
		cm.addEvent(document, 'click', bodyClick);
		// Animate
		anim.go({'style' : {'opacity' : 1}, 'duration' : 100});
		/* *** EXECUTE API EVENTS *** */
		executeEvent('onFocus');
	};
	
	var hideMenu = function(now){
        isHide = true;
        // Remove event - Check position
        checkInt && clearInterval(checkInt);
        // Remove event - Hide menu on resize
        cm.removeEvent(window, 'resize', getPosition);
        // Remove event - Hide menu by click on another object
        cm.removeEvent(document, 'click', bodyClick);
        // Remove classes
        cm.removeClass(nodes['input'], 'hidden');
        cm.removeClass(nodes['container'], 'active');
        // Animate
        anim.go({'style' : {'opacity' : 0}, 'duration' : (now? 0 : 100), 'onStop' : function(){
            // Append child menu in select container
            nodes['container'].appendChild(nodes['menu']);
            nodes['menu'].style.display = 'none';
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onBlur');
        }});
	};
	
	/* *** MAIN *** */

	that.get = function(){
		return active;
	};
	
	that.set = function(value){
        // Select option and execute events
        if(value){
            if(cm.isArray(value)){
                cm.forEach(value, function(item){
                    if(options[item]){
                        set(options[item], true);
                    }
                });
            }else if(options[value]){
                set(options[value], true);
            }
        }
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
	
	that.addOption = function(value, text){
		renderOption(value, text);
		return that;
	};
	
	that.removeOption = function(value){
		if(value && options[value]){
			removeOption(options[value]);
		}
		return that;
	};

    that.addOptions = function(arr){
        cm.forEach(arr, function(item){
            renderOption(item.value, item.text);
        });
        return that;
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    that.addEvents = function(o){		// Deprecated
        o && convertEvents(o);
        return that;
    };
	
	init();
};

Com['SelectCollector'] = function(node){
	var selects,
        id,
		select;
		
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
        selects = cm.clone((node.nodeType == 1 && node.tagName.toLowerCase() == 'select') ? [node] : node.getElementsByTagName('select'));
        // Render datepickers
        cm.forEach(selects, function(item){
            if(!/^norender|false$/.test(item.getAttribute('data-select'))){
                select = new Com.Select({
                    'select' : item,
                    'multiple' : item.multiple
                });
                if(id = item.id){
                    Com.Elements.Selects[id] = select;
                }
            }
        });
    };
	
	init(node);
};