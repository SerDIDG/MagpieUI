Com['Datepicker'] = function(o){
	var that = this,
		config = cm.merge({
			'input' : cm.Node('input', {'type' : 'text'}),
			'format' : '%F %j, %Y',
			'saveFormat' : '%Y-%m-%d',
			'startYear' : 1900,
			'endYear' : new Date().getFullYear(),
			'showPlaceholder' : true,
			'showTodayButton' : true,
			'showClearButton' : false,
			'menuMargin' : 3,
			'events' : {
				'onSelect' : function(datepicker, active){},
				'onChange' : function(datepicker, active){}
			},
			'langs' : {
				'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
				'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
				'clearButtonTitle' : 'Clear datepicker',
				'todayButton' : 'Today'
			}
		}, o),
		placeholder = config['input'].getAttribute('data-placeholder') || config['input'].getAttribute('placeholder'),
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
		render();
		setMiscEvents();
		set(config['input'].value);
	};
	
	var render = function(){
		// Structure
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
		// Render selects
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
		// Set hidden input attributes
		nodes['hidden'].setAttribute('name', config['input'].getAttribute('name'));
		nodes['hidden'].id = config['input'].id;
		// Placeholder
		if(config['showPlaceholder'] && placeholder){
			nodes['input'].setAttribute('placeholder', placeholder);
		}
		// Clear Butoon
		if(config['showClearButton']){
			cm.addClass(nodes['container'], 'has-clear-button');
			nodes['container'].appendChild(
				nodes['clearButton'] = cm.Node('div', {'class' : 'icon remove', 'title' : config['langs']['clearButtonTitle']})
			);
			cm.addEvent(nodes['clearButton'], 'click', function(){
				set(0);
				hideMenu();
			});
		}
		// Today Button
		if(config['showTodayButton']){
			nodes['menuInner'].appendChild(
				nodes['todayButton'] = cm.Node('div', {'class' : 'button today'}, config['langs']['todayButton'])
			);
			cm.addEvent(nodes['todayButton'], 'click', function(){
				set(today);
				hideMenu();
				// Events
				config['events']['onSelect'](that, active);
				if(!oldActive || (active.toString() !== oldActive.toString())){
					config['events']['onChange'](that, active);
				}
			});
		}
		// Append
		cm.insertBefore(nodes['container'], config['input']);
		cm.remove(config['input']);
	};
    
	var setMiscEvents = function(){
		// Add events on input to makes him clear himself when user whants that
		nodes['input'].onkeydown = function(e){
			var e = cm.getEvent(e);
			cm.preventDefault(e);
			if(e.keyCode == 8){
				set(0);
			}else{
				return false;
			}
		};
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
				hideMenu();
			}
		};
		// Init animation
		anim = new cm.Animation(nodes['menu']);
	};
	
	var renderView = function(){
		var year = selects['years'].get(),
			month = selects['months'].get();
		// Get current date
		today = new Date(),
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
				set(selected);
				hideMenu();
				// Events
				config['events']['onSelect'](that, active);
				if(!oldActive || (active.toString() !== oldActive.toString())){
					config['events']['onChange'](that, active);
				}
			};
		}
	};
	
	var set = function(str){
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
			cm.removeClass(nodes['input'], 'placeholder');
			nodes['hidden'].value = cm.dateFormat(active, config['saveFormat'], config['langs']);
			selects['years'].set(active.getFullYear());
			selects['months'].set(active.getMonth());
		}
	};
	
	var bodyClick = function(e){
		if(nodes && !isHide){
			var e = cm.getEvent(e),
				target = cm.getEventTarget(e);
			
			if(!cm.isParent(nodes['menu'], target) &&!cm.isParent(nodes['container'], target) && !cm.isParent(selects['months'].getNodes('menu'), target) && !cm.isParent(selects['years'].getNodes('menu'), target)){
				hideMenu();
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
			containerHeight = nodes['container'].offsetHeight,
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
		cm.addEvent(document.body, 'click', bodyClick);
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
		cm.removeEvent(document.body, 'click', bodyClick);
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
		set(str);
		return that;
	};
	
	that.getDate = function(){
		return active || '';
	};
	
	that.parseDate = function(o, format){
		return cm.dateFormat(o, (format || config['saveFormat']), config['langs']);
	};
	
	that.getNodes = function(key){
		return nodes[key] || nodes;
	};
	
	that.addEvents = function(o){
		config['events'] = cm.merge(config['events'], o);
		return that;
	};
	
	init();
};


