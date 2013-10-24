Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

Com['Datepicker'] = function(o){
	var that = this,
		config = cm.merge({
            'container' : false,
			'input' : cm.Node('input', {'type' : 'text'}),
            'placeholder' : '',
			'format' : '%F %j, %Y',
			'saveFormat' : '%Y-%m-%d',
			'startYear' : 1900,
			'endYear' : new Date().getFullYear(),
            'startWeekDay' : 0,
			'showPlaceholder' : true,
			'showTodayButton' : true,
			'showClearButton' : false,
            'showTitleTag' : true,
            'title' : false,
			'menuMargin' : 3,
			'events' : {},
			'langs' : {
				'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
				'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				'clearButtonTitle' : 'Clear datepicker',
				'todayButton' : 'Today'
			}
		}, o),
        dataAttributes = ['placeholder', 'showPlaceholder', 'showTodayButton', 'showClearButton', 'startYear', 'endYear', 'startWeekDay', 'format', 'saveFormat', 'showTitleTag', 'title'],
        API = {
            'onSelect' : [],
            'onChange' : []
        },
		nodes = {
            'calendar' : {}
        },
        components = {},
		isHide = true,
		checkInt,
		anim,

        today = new Date(),
		currentSelectedDate,
		previousSelectedDate;

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
                    nodes['calendarContainer'] = cm.Node('div', {'class' : 'cm-datepicker-calendar'})
                )
			)
		);
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
		// Show / hide on click
		nodes['icon'].onclick = function(){
			if(isHide){
				showMenu();
			}else{
				hideMenu(false);
			}
		};
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'container' : nodes['calendarContainer'],
            'startYear' : config['startYear'],
            'endYear' : config['endYear'],
            'startWeekDay' : config['startWeekDay'],
            'langs' : config['langs'],
            'renderMonthOnInit' : false
        }).addEvent('onDayClick', function(calendar, params){
            set(params['date'], true);
            hideMenu(false);
        }).addEvent('onMonthRender', markSelectedDay);
        nodes['calendar'] = components['calendar'].getNodes();
		// Init animation
		anim = new cm.Animation(nodes['menu']);
	};

	var set = function(str, execute){
        previousSelectedDate = currentSelectedDate;
		if(!str || new RegExp(cm.dateFormat(false, config['saveFormat'], config['langs'])).test(str)){
            currentSelectedDate = null;
			nodes['input'].value = '';
			nodes['hidden'].value = cm.dateFormat(false, config['saveFormat'], config['langs']);
		}else{
			if(typeof str == 'object'){
                currentSelectedDate = str;
			}else{
				str = str.split(' ')[0].split('-');
                currentSelectedDate = new Date(str[0], (parseInt(str[1], 10) - 1), str[2]);
			}
			nodes['input'].value = cm.dateFormat(currentSelectedDate, config['format'], config['langs']);
			nodes['hidden'].value = cm.dateFormat(currentSelectedDate, config['saveFormat'], config['langs']);
		}
        if(execute){
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onSelect');
            executeEvent('onChange');
        }
	};

    var markSelectedDay = function(calendar, params){
        if(
            currentSelectedDate &&
            params['year'] == currentSelectedDate.getFullYear() &&
            params['month'] == currentSelectedDate.getMonth()
        ){
            cm.addClass(params['days'][currentSelectedDate.getDate()]['node'], 'selected');
        }
    };

    var executeEvent = function(event){
        var handler = function(){
            API[event].forEach(function(item){
                item(that, currentSelectedDate);
            });
        };

        switch(event){
            case 'onChange':
                if(!previousSelectedDate || (!currentSelectedDate && previousSelectedDate) || (currentSelectedDate.toString() !== previousSelectedDate.toString())){
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
			if(
                !cm.isParent(nodes['menu'], target) &&
                !cm.isParent(nodes['container'], target) &&
                !cm.isParent(nodes['calendar']['selects']['months']['menu'], target) &&
                !cm.isParent(nodes['calendar']['selects']['years']['menu'], target)
            ){
                hideMenu(false);
			}
		}
	};

	var getTop = function(){
		return nodes['container'].offsetHeight + cm.getRealY(nodes['container']);
	};

	var getPosition = (function(){
		var top, left, height, winHeight, containerHeight, position;

		return function(){
			winHeight = cm.getPageSize('winHeight');
			height = nodes['menu'].offsetHeight;
			top = getTop();
            left = cm.getRealX(nodes['container']);
			containerHeight = nodes['container'].offsetHeight;
			position = (top + height > winHeight? (top - height - containerHeight - config['menuMargin']) : (top + config['menuMargin']));

			if(position != nodes['menu'].offsetTop || left != nodes['menu'].offsetLeft){
				nodes['menu'].style.top =  [position, 'px'].join('');
				nodes['menu'].style.left = [left, 'px'].join('');
			}
		};
	})();

	var showMenu = function(){
		isHide = false;
        // Render calendar month
        if(!currentSelectedDate){
            today = new Date();
            components['calendar']
                .set(today.getFullYear(), today.getMonth())
                .renderMonth();
        }else{
            components['calendar']
                .set(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth())
                .renderMonth();
        }
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
		return cm.dateFormat(currentSelectedDate, (format || config['saveFormat']), config['langs']);
	};

	that.set = function(str){
		set(str, true);
		return that;
	};

	that.getDate = function(){
		return currentSelectedDate || '';
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