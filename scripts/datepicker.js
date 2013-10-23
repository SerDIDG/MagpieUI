Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

Com['Datepicker'] = function(o){
	var that = this,
		config = cm.merge({
            'container' : cm.Node('div'),
			'input' : cm.Node('input', {'type' : 'text'}),
            'placeholder' : '',
			'format' : '%F %j, %Y',
			'saveFormat' : '%Y-%m-%d',
			'startYear' : 1900,
			'endYear' : new Date().getFullYear(),
			'showPlaceholder' : true,
			'showTodayButton' : true,
			'showClearButton' : false,
            'showTitleTag' : true,
            'title' : false,
			'menuMargin' : 3,
			'events' : {},                                      // Deprecated, use addEvent method
			'langs' : {
				'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
				'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				'clearButtonTitle' : 'Clear datepicker',
				'todayButton' : 'Today'
			}
		}, o),
        dataAttributes = ['placeholder', 'showPlaceholder', 'showTodayButton', 'showClearButton', 'startYear', 'endYear', 'format', 'saveFormat', 'showTitleTag', 'title'],
        API = {
            'onSelect' : [],
            'onChange' : []
        },
		nodes = {},
		selects = {},
		isHide = true,
		checkInt,
		anim,

		today = new Date(),
		active,
		oldActive,
		selected,
		monthDays,
        startDay;

	var init = function(){
        // Legacy: Convert events to API Events
        convertEvents(config['events']);
        // Merge data-attributes with config. Data-attributes have higher priority.
        processDataAttributes();
		render();
		setMiscEvents();
        // Set selected date
		set(config['input'].value);
	};

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['input'].getAttribute(['data', item].join('-'));
            if(item == 'placeholder'){
                value = config['input'].getAttribute(item) || value;
            }else if(item == 'title'){
                value = config['input'].getAttribute(item) || value;
            }else if(/^false|true$/.test(value)){
                value = value? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

	var render = function(){
        /* *** RENDER STRUCTURE *** */
		nodes['container'] = cm.Node('div', {'class' : 'datepicker-input'},
			nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
			nodes['input'] = cm.Node('input', {'type' : 'text'}),
			nodes['icon'] = cm.Node('div', {'class' : 'icon datepicker'}),

			nodes['menu'] = cm.Node('div', {'class' : 'datepicker-menu'},
				nodes['menuInner'] = cm.Node('div', {'class' : 'inner'},
					cm.Node('div', {'class' : 'selects'},
						nodes['months'] = cm.Node('select', {'class' : 'select months'}),
						nodes['years'] = cm.Node('select', {'class' : 'select years'})
					),
					cm.Node('table', {'cellcpacing' : '0', 'cellpadding' : '0'},
						cm.Node('thead',
							nodes['days'] = cm.Node('tr')
						),
						nodes['dates'] = cm.Node('tbody')
					)
				)
			)
		);
		// Render days
		config['langs']['days'].forEach(function(item){
			nodes['days'].appendChild(
				cm.Node('th', item)
			);
		});
		// Render selects options
		config['langs']['months'].forEach(function(item, i){
			nodes['months'].appendChild(
				cm.Node('option', {'value' : i}, item)
			);
		});
		for(var i = config['endYear']; i >= config['startYear']; i--){
			nodes['years'].appendChild(
				cm.Node('option', {'value' : i}, i)
			);
		}
        /* *** ATTRIBUTES *** */
        // Title
        if(config['showTitleTag'] && config['title']){
            nodes['container'].title = config['title'];
        }
        // ID
        if(config['input'].id){
            nodes['container'].id = config['input'].id;
        }
		// Set hidden input attributes
        if(config['input'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', config['input'].getAttribute('name'));
        }
		// Placeholder
		if(config['showPlaceholder'] && config['placeholder']){
			nodes['input'].setAttribute('placeholder', config['placeholder']);
		}
		// Clear Butoon
		if(config['showClearButton']){
			cm.addClass(nodes['container'], 'has-clear-button');
			nodes['container'].appendChild(
				nodes['clearButton'] = cm.Node('div', {'class' : 'icon remove', 'title' : config['langs']['clearButtonTitle']})
			);
		}
		// Today Button
		if(config['showTodayButton']){
			nodes['menuInner'].appendChild(
				nodes['todayButton'] = cm.Node('div', {'class' : 'button today'}, config['langs']['todayButton'])
			);
		}
        /* *** INSERT INTO DOM *** */
        if(config['container']){
            config['container'].appendChild(nodes['container']);
        }else if(config['input'].parentNode){
            cm.insertBefore(nodes['container'], config['input']);
        }
        cm.remove(config['input']);
	};

	var setMiscEvents = function(){
		// Add events on input to makes him clear himself when user whants that
		nodes['input'].onkeydown = function(e){
			e = cm.getEvent(e);
			cm.preventDefault(e);
			if(e.keyCode == 8){
				set(0);
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onChange');
			}else{
				return false;
			}
		};
        // Clear Butoon
        if(config['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                set(0);
                hideMenu(false);
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onChange');
            });
        }
        // Today Button
        if(config['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                set(today, true);
                hideMenu(false);
            });
        }
		// Init custom selects
		selects['months'] = new Com.Select({'select' : nodes['months']})
			.set(today.getMonth())
			.addEvent('onChange', renderView);
		selects['years'] = new Com.Select({'select' : nodes['years']})
			.set(today.getFullYear())
			.addEvent('onChange', renderView);
		// Show / hide on click
		nodes['icon'].onclick = function(){
			if(isHide){
				showMenu();
			}else{
				hideMenu(false);
			}
		};
		// Init animation
		anim = new cm.Animation(nodes['menu']);
	};

	var renderView = function(){
		var year = selects['years'].get(),
			month = selects['months'].get();
		// Get current date
		today = new Date();
		// Set selected
		selected = new Date(year, month, 1);
		// Clear container year nad month
		cm.clearNode(nodes['dates']);
		// Get month's day count and start day
		monthDays = 32 - new Date(year, month, 32).getDate();
		startDay = selected.getDay();
		// Render row
		var rows = Math.ceil((monthDays + startDay) / 7);
		for(var i = 0; i < rows; i++){
			renderRow(i);
		}
	};

	var renderRow = function(i){
		var start = (i * 7) + 1 - startDay,
			tr = nodes['dates'].appendChild(cm.Node('tr'));
		for(var d = 0; d < 7; d++){
			renderCell(tr, d, start);
		}
	};

	var renderCell = function(tr, d, start){
		var day = start + d,
			td,
			div;
		tr.appendChild(
			td = cm.Node('td')
		);
		// Render day
		if(day > 0 && day <= monthDays){
			td.appendChild(
				div = cm.Node('div', day)
			);
			if(active && active.getFullYear() == selected.getFullYear() && active.getMonth() == selected.getMonth() && day == active.getDate()){
				cm.addClass(td, 'selected');
			}
			if(today.getFullYear() == selected.getFullYear() && today.getMonth() == selected.getMonth() && day == today.getDate()){
				cm.addClass(td, 'today');
			}
			if(/0|6/.test(d)){
				cm.addClass(td, 'weekend');
			}
			// Onclick set selected date
			div.onclick = function(){
				selected.setDate(day);
				set(selected, true);
				hideMenu(false);
			};
		}
	};

	var set = function(str, execute){
		oldActive = active;
		if(!str || new RegExp(cm.dateFormat(false, config['saveFormat'], config['langs'])).test(str)){
			active = null;
			selected = today;
			nodes['input'].value = '';
			nodes['hidden'].value = cm.dateFormat(false, config['saveFormat'], config['langs']);
			selects['years'].set(selected.getFullYear());
			selects['months'].set(selected.getMonth());
		}else{
			if(typeof str == 'object'){
				active = str;
			}else{
				str = str.split(' ')[0].split('-');
				active = new Date(str[0], (parseInt(str[1], 10) - 1), str[2]);
			}
			nodes['input'].value = cm.dateFormat(active, config['format'], config['langs']);
			nodes['hidden'].value = cm.dateFormat(active, config['saveFormat'], config['langs']);
			selects['years'].set(active.getFullYear());
			selects['months'].set(active.getMonth());
		}
        if(execute){
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onSelect');
            executeEvent('onChange');
        }
	};

    var executeEvent = function(event){
        var handler = function(){
            API[event].forEach(function(item){
                item(that, active);
            });
        };

        switch(event){
            case 'onChange':
                if(!oldActive || (!active && oldActive) || (active.toString() !== oldActive.toString())){
                    handler();
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

			if(!cm.isParent(nodes['menu'], target) &&!cm.isParent(nodes['container'], target) && !cm.isParent(selects['months'].getNodes('menu'), target) && !cm.isParent(selects['years'].getNodes('menu'), target)){
				hideMenu(false);
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
			}
		};
	})();

	var showMenu = function(){
		isHide = false;
		// Render dates
		renderView();
		// Append child menu in body and set position
		document.body.appendChild(nodes['menu']);
		getPosition();
		// Show menu
		nodes['menu'].style.display = 'block';
		// Check position
		checkInt = setInterval(getPosition, 5);
		// Hide menu on window resize
		cm.addEvent(window, 'resize', hideMenu);
		// Hide menu by click on another object
		cm.addEvent(document, 'click', bodyClick);
		// Animate
		anim.go({'style' : {'opacity' : 1}, 'duration' : 100});
	};

	var hideMenu = function(now){
		isHide = true;
		// Remove event - Check position
		checkInt && clearInterval(checkInt);
		// Remove event - Hide menu on resize
		cm.removeEvent(window, 'resize', getPosition);
		// Remove event - Hide menu by click on another object
		cm.removeEvent(document, 'click', bodyClick);
		// Animate
		anim.go({'style' : {'opacity' : 0}, 'duration' : (now? 0 : 100), 'onStop' : function(){
			// Append child menu in select container
			nodes['container'].appendChild(nodes['menu']);
			nodes['menu'].style.display = 'none';
		}});
	};

	/* Main */

	that.get = function(format){
		return cm.dateFormat(active, (format || config['saveFormat']), config['langs']);
	};

	that.set = function(str){
		set(str, true);
		return that;
	};

	that.getDate = function(){
		return active || '';
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

    that.parseDate = function(o, format){
        return cm.dateFormat(o, (format || config['saveFormat']), config['langs']);
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

	that.addEvents = function(o){       // Deprecated
        o && convertEvents(o);
		return that;
	};

	init();
};

Com['DatepickerCollector'] = function(node){
    var datepickers,
        id,
        datepicker;

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
        datepickers = cm.clone((node.getAttribute('data-datepicker') == 'true') ? [node] : cm.getByAttr('data-datepicker', 'true', node));
        // Render datepickers
        cm.forEach(datepickers, function(item){
            datepicker = new Com.Datepicker({'input' : item});
            if(id = item.id){
                Com.Elements.Datepicker[id] = datepicker;
            }
        });
    };

    init(node);
};