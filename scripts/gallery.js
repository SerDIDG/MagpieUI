Com['Gallery'] = function(o){
	var that = this,
		config = that.config = cm.merge({
			'type' : 'images',					// Type of content: videos / images
			'items' : [],
			'assign' : {},						// Assign custom data array keys. 'key' : 'custom_key'
			'minWidth' : 400,
			'minHeight' : 400,
			'overlayOpenTime' : 300,
			'overlayOffset' : 70,
			'slideChangeTime' : 300,
			'langs' : {
				'next' : 'Next',
				'prev' : 'Previous',
				'close' : 'Close',
				'thumb' : 'Thumb',
				'counter' : '%item% / %items%'
			}
		}, o),
		nodes = that.nodes = {
			'lists' : null,
			'viewer' : null,
			'overlay' : null
		},
		API = {
			'onRenderViewer' : [],
			'onImageLoad' : [],
			'onOverlayOpen' : [],
			'onOverlayClose' : [],
			'onWindowResize' : [],
			'stopPlugins' : []
		},
		itemWidth = 0,
		itemHeight = 0,
		activeItem;
		
	/* Slider */
	
	var embedList = that.embedList = function(container){
		var list = {
			'container' : typeof container == 'string'? cm.getEl(container) : container,
			'config' : {
				'type' : 'embed',
				'thumbs' : false
			},
			'items' : []
		};
		nodes['lists'] = list;
		// Structure
		list['slider'] = list['container'].appendChild(cm.Node('div', {'class':'com-gallery-list'},
			list['inner'] = cm.Node('div', {'class':'inner clear'})
		));
		// Thumbs
		for(var i = 0, l = config['items'].length; i < l; i++){
			list['items'].push(renderThumb(i, config['items'][i], list));
		}
		
		return that;
	};
	
	var renderThumb = function(i, item, slider){
		var thumb = {
			'config' : item
		};
		// Structure
		thumb['thumb'] = slider['inner'].appendChild(cm.Node('div', {'class':'item'},
			thumb['inner'] = cm.Node('div', {'class':'inner'},
				thumb['image'] = cm.Node('img')
			)
		));
		// Attributes
		thumb['image'].setAttribute('alt', item['alt_tag'] || config['langs']['thumb']);
		thumb['image'].setAttribute('title', item['title'] || '');
		// Onload Event
		thumb['image'].onload = function(){
			cm.addClass(thumb['thumb'], 'loaded');
		};
		// Image path
		thumb['image'].src = item['thumb_path'];
		// Item size
		itemWidth = thumb['thumb'].offsetWidth;
		itemHeight = thumb['thumb'].offsetHeight;
		// Thumb click event
		cm.addEvent(thumb['image'], 'click', function(e){
			if(slider['config']['type'] == 'embed'){
				openOverlay().active(i);
			}else{
				active(i);
			}
		});
		
		return thumb;
	};
	
	/* Viewer */
	
	var embedViewer = that.embedViewer = function(container, type){
		var viewer = {
			'container' : typeof container == 'string'? cm.getEl(container) : container,
			'config' : {},
			'item' : null,
			'image' : null,
			'bar' : null
		};
		nodes['viewer'] = viewer;
		// Structure
		viewer['viewer'] = viewer['container'].appendChild(cm.Node('div', {'class':'com-gallery-viewer'},
			viewer['inner'] = cm.Node('div', {'class':'inner'},
				viewer['bar'] = cm.Node('div', {'class':'bar'})
			)
		));
		// Init animation
		viewer['anim'] = new cm.Animation(viewer['inner']);
		// Set minimal dimention of viewer
		viewer['inner'].style.width = [config['minWidth'], 'px'].join('');
		viewer['inner'].style.height = [config['minHeight'], 'px'].join('');
		// Embed type
		if(type == 'overlay'){
			viewer['config']['type'] = 'overlay';
		}else{
			viewer['config']['type'] = 'embed';
		}
		// API -> On Render Viewer
		executeCommand('onRenderViewer', viewer);
		
		return that;
	};
	
	var renderView = function(i, item){
		viewer = nodes['viewer'];
				
		switch(config['type']){
			case 'images' :
				var previous = viewer['preview'];
				viewer['preview'] = new previewObject(viewer, item, previous);
			break;
			case 'videos' :
				cm.clearNode(viewer['inner']);
				viewer['item'] = viewer['inner'].appendChild(cm.Node('div', {'class':'item video', 'innerHTML':'<object width="100%" height="100%"><param name="movie" value="http://www.youtube.com/v/'+item['video']+'?version=3"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/'+item['video']+'?version=3" type="application/x-shockwave-flash" width="100%" height="100%" allowscriptaccess="always" allowfullscreen="true"></embed></object>'}));
			break;
		}
	};
	
	var previewObject = function(viewer, item, previous){
		var my = this,
			loaderAnim,
			itemAnim,
			isLoaded = false,
			myNodes = {};
		
		var hide = my.hide = function(){
			removeLoader();
			myNodes['item'].style.zIndex = 1;
			if(isLoaded == false){
				cm.removeEvent(myNodes['image'], 'load', onload);
				previous && previous.remove();
			}
		};
		
		var remove = my.remove = function(){
			itemAnim.go({'style':{'opacity':0}, 'anim':'smooth', 'duration':200, 'onStop':function(){
				viewer['inner'].removeChild(myNodes['item']);
			}});
		};
		
		var removeLoader = function(){
			if(myNodes['loader']){
				loaderAnim.go({'style':{'opacity':0}, 'anim':'smooth', 'duration':200, 'onStop':function(){
					viewer['inner'].removeChild(myNodes['loader']);
					myNodes['loader'] = null;
				}});
			}
		};
		
		var render = function(){
			previous && previous.hide();
			// Loader
			myNodes['loader'] = viewer['inner'].appendChild(cm.Node('div', {'class' : 'loader'},
				cm.Node('div', {'class' : 'loader-bg'}),
				cm.Node('div', {'class':'loader-icon'})
			));
			loaderAnim = new cm.Animation(myNodes['loader']);
			loaderAnim.go({'style':{'opacity':1}, 'anim':'smooth', 'duration':200});
			// Image
			myNodes['item'] = viewer['inner'].appendChild(cm.Node('div', {'class':'item', 'style':'z-index:2;'},
				myNodes['image'] = cm.Node('img', {'alt':item['alt_tag']})
			));
			itemAnim = new cm.Animation(myNodes['item']);
			cm.addEvent(myNodes['image'], 'load', onload);
			myNodes['image'].src = item['image_path'];
			// Push item to global viewer
			viewer['image'] = myNodes['image'];
			viewer['item'] = myNodes['item'];
		};
		
		var onload = function(){
			isLoaded = true;
			// Remove loader
			removeLoader();
			// Center
			setTimeout(redrawView, 0);
			// Animate
			itemAnim.go({'style':{'opacity':1}, 'anim':'smooth', 'duration':config['slideChangeTime'], 'onStop':function(){
				if(is('IE') && isVersion() < 9){
					myNodes['item'].style.filter = '';
				}
				// Remove previous
				previous && previous.remove();
			}});
			// API -> On Image Load
			executeCommand('onImageLoad', viewer);
		};
		
		render();
	};
	
	var redrawView = that.redrawView = function(){
		var overlay = nodes['overlay'],
			viewer = nodes['viewer'],
			pageSize = cm.getPageSize(),
			width, height, prevWidth, prevHeight, overlayOffset, overlayInnerOffsetWidth, overlayInnerOffsetHeight, spaceWidth, spaceHeight, newWidth, newHeight, ratio;
		if(viewer && viewer['image'] && overlay){
			// Ugly IE fix
			if(is('IE') && isVersion() < 9){
				viewer['image'].style.display = 'none';
				viewer['image'].style.display = 'block';
			}
			// Capture outer overlay offset
			overlayOffset = pageSize['winWidth'] <= 600? 10 : config['overlayOffset'];
			// Restore original dimentions of viewer new item
			viewer['image'].style.width = 'auto';
			viewer['image'].style.height = 'auto';
			// Capture previous viewer dimantions
			prevWidth = viewer['inner'].offsetWidth;
			prevHeight = viewer['inner'].offsetHeight;
			// Capture inner offset of overlay
			overlayInnerOffsetWidth = overlay['window'].offsetWidth - prevWidth;
			overlayInnerOffsetHeight = overlay['window'].offsetHeight - prevHeight;
			// Calculate actual free space for overlay
			spaceWidth = (pageSize['winWidth'] - overlayOffset * 2);
			spaceHeight = (pageSize['winHeight'] - overlayOffset * 2);
			// Capture dimentions of new viewer item
			width = viewer['image'].offsetWidth;
			height = viewer['image'].offsetHeight;
			// Calculate actual dimentions of new viewer item
			if(width + overlayInnerOffsetWidth < spaceWidth && height + overlayInnerOffsetHeight < spaceHeight){
				newWidth = width + overlayInnerOffsetWidth;
				newHeight = height + overlayInnerOffsetHeight;
			}else{
				ratio = width / height;
				if(ratio > 1){
					newWidth = spaceWidth;
					newHeight = newWidth/ratio;
					
					if(newHeight > spaceHeight){
						newHeight = spaceHeight;
						newWidth = newHeight * ratio;
					}
				}else{
					newHeight = spaceHeight;
					newWidth = newHeight * ratio;
					
					if(newWidth > spaceWidth){
						newWidth = spaceWidth;
						newHeight = newWidth / ratio;
					}
				}
				newWidth = Math.floor(newWidth);
				newHeight = Math.floor(newHeight);
			}
			// Set new dimentions of viewer item
			viewer['image'].style.width = '100%';
			viewer['image'].style.height = '100%';
			// Set new dimentions of viewer
			viewer['anim'].go({'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'style' : {
				'height' : [newHeight - overlayInnerOffsetHeight, 'px'].join(''),
				'width' : [newWidth - overlayInnerOffsetWidth, 'px'].join('')
			}});
			// Set new overlay's margins for centering
			overlay['anim'].go({'anim' : 'smooth', 'duration' : config['slideChangeTime'], 'style' : {
				'marginLeft' : [-Math.floor((newWidth)/2), 'px'].join(''),
				'marginTop' : [-Math.floor((newHeight)/2), 'px'].join('')
			}});
		}
	};
	
	var removeView = that.removeView = function(){
		var viewer = nodes['viewer'];
		switch(config['type']){
			case 'videos' :
				cm.clearNode(viewer['inner']);
			break;
		}
	};
	
	/* Overlay */
	
	var openOverlay = that.openOverlay = function(container){
		var overlay = {
			'container' : (typeof container == 'string'? cm.getEl(container) : container) || document.body
		};
		nodes['overlay'] = overlay;
		// Hide iframes, flash
		toggleSpecialTags('hidden');
		// Structure
		overlay['overlay'] = overlay['container'].appendChild(cm.Node('div', {'class':'com-gallery-overlay'},
			overlay['bg'] = cm.Node('div', {'class':'bg'}),
			overlay['window'] = cm.Node('div', {'class':'window'},
				overlay['inner'] = cm.Node('div', {'class':'inner'},
					overlay['top'] = cm.Node('div', {'class' : 'top'},
						overlay['album'] = cm.Node('div', {'class':'album'}),
						overlay['counter'] = cm.Node('div', {'class':'counter'})
					),
					overlay['close'] = cm.Node('div', {'class':'close'}, config['langs']['close'])
				)
			)
		));
		// Init anim
		overlay['anim'] = new cm.Animation(overlay['window']);
		// Embed components
		embedViewer(overlay['inner'], 'overlay');
		// Close button
		overlay['close'].onclick = closeOverlay;
		overlay['bg'].onclick = closeOverlay;
		// Center position
		overlay['window'].style.marginLeft = -overlay['window'].offsetWidth/2 + 'px';
		overlay['window'].style.marginTop = -overlay['window'].offsetHeight/2 + 'px';
		// Add Close Event on Esc
		cm.addEvent(document.body, 'keypress', windowClickEvent);
		// Add rezise document event
		cm.addEvent(window, 'resize', redrawView);
		// API -> On Overlay Open
		executeCommand('onOverlayOpen', overlay);
		// Animate
		new cm.Animation(overlay['overlay']).go({'style':{'opacity':1}, 'anim':'smooth', 'duration':config['overlayOpenTime'], 'onStop':function(){
			if(is('IE') && isVersion() < 9){
				overlay['overlay'].style.filter = '';
			}
		}});
		return that;
	};
	
	var windowClickEvent = function(e){
		var e = cm.getEvent(e);
		
		if(e.keyCode == 27){
			closeOverlay();
		}
	};
	
	var setImageInfo = function(i, item){
		var overlay = nodes['overlay'];
		if(item){
			if(overlay['counter']){
				overlay['counter'].innerHTML = config['langs']['counter']
					.replace('%item%', (i + 1))
					.replace('%items%', config['items'].length);
			}
			if(overlay['album']){
				overlay['album'].innerHTML = item['album_name'];
			}
		}
	};
	
	var closeOverlay = that.closeOverlay = function(){
		var overlay = nodes['overlay'];
		// API -> On Overlay Close
		executeCommand('onOverlayClose', overlay);
		// Hide content before close
		removeView();
		// Remove Close Event on Esc
		cm.removeEvent(document.body, 'keypress', windowClickEvent);
		// Remove rezise document event
		cm.addEvent(window, 'resize', redrawView);
		// Animate
		new cm.Animation(overlay['overlay']).go({'style':{'opacity':0}, 'anim':'smooth', 'duration':config['overlayOpenTime'], 'onStop':function(){
			overlay['container'].removeChild(overlay['overlay']);
			nodes['overlay'] = null;
			// Show iframes, flash
			toggleSpecialTags('visible');
		}});
		
		return that;
	};
	
	var toggleSpecialTags = function(type){		
		var wrap = wrap || document;
		if(document.querySelectorAll){
			var els = document.querySelectorAll('iframe,object,embed');
			for(var i = 0, l = els.length; i < l; i++){
				els[i].style.visibility = type;
			}
		}else{
			var els = document.getElementsByTagName('*');
			for(var i = 0, l = els.length; i < l; i++){
				if(els[i].tagName && /iframe|object|embed/.test(els[i].tagName)){
					els[i].style.visibility = type;
				}
			}
			
		}
	};
	
	/* Main */
	
	var active = that.active = function(i){
		activeItem = i != null ? i : activeItem || 0;
		var item = config['items'][activeItem];
		// Set image info
		setImageInfo(activeItem, item);
		// View active item
		renderView(activeItem, item);

		return that;
	};
	
	var next = that.next = function(){
		if(activeItem == config['items'].length - 1){
			var goto = 0;
		}else{
			var goto = activeItem + 1;
		}
		active(goto);
	};
	
	var prev = that.prev = function(){
		if(activeItem == 0){
			var goto = config['items'].length - 1;
		}else{
			var goto = activeItem - 1;
		}
		active(goto);
	};
	
	var langs = that.langs = function(key){
		return config['langs'][key] || '';
	};
	
	var executeCommand = that.executeCommand = function(command, params){
		for(var i = 0, l = API[command].length; i < l; i++){
			API[command][i](params);
		}
	};
	
	var setCommand = that.setCommand = function(command, method){
		API[command].push(method);
	};
	
	var windowResizeEvent = function(){
		// API -> On Window Resize
		executeCommand('onWindowResize');
	};
	
	var rand = that.rand = function(min, max){
		return Math.floor(Math.random() * (max - min)) + min;
	};
	
	var assign = that.assign = function(o, type){
		for(var i = 0, l = o.length; i < l; i++){
			// Merge
			switch(type){
				case 'images' :
					o[i] = cm.merge({'album' : '', 'album_name' : '', 'title' : '', 'alt_tag' : '', 'author' : '', 'thumb_path' : '', 'image_path' : ''}, o[i]);
				break;
				case 'videos' :
					o[i] = cm.merge({'title' : '', 'alt_tag' : '', 'author' : '', 'thumb_path' : '', 'video' : ''}, o[i]);
				break;
			}
			// Assign
			for(var key in config['assign']){
				o[i][key] = o[i][config['assign'][key]];
			}
		}
	};
	
	var initPlugins = that.initPlugins = function(o){
		for(var key in o){
			if(that['com'+key]){
				that['com'+key](o[key]);
			}else{
				alert('Component '+key+' not found!');
			}
		}
		return that;
	};
	
	var init = function(){
		// Config
		assign(config['items'], config['type']);
		// Window resize event
		cm.addEvent(window, 'resize', windowResizeEvent);
	};
	
	init();
};

/* ******* Plugins ******* */

/* Slideshow */

Com.Gallery.prototype.comArrows = function(o){
	var gallery = this;
	
	return (function(){
		var config = cm.merge({}, o),
			nodes = {};
		
		var renderBar = function(viewer){
			// Structure
			viewer['bar'].appendChild(
				nodes['next'] = cm.Node('div', {'class' : 'bar-item arrows-next', 'title' : gallery.langs('next')},
					cm.Node('div', {'class' : 'icon'})
				)
			);
			viewer['bar'].appendChild(
				nodes['prev'] = cm.Node('div', {'class' : 'bar-item arrows-prev', 'title' : gallery.langs('prev')},
					cm.Node('div', {'class' : 'icon'})
				)
			);
			// Functions
			nodes['next'].onclick = function(){
				gallery.next();
			};
			nodes['prev'].onclick = function(){
				gallery.prev();
			};
		};
		
		var init = function(){
			gallery.setCommand('onRenderViewer', renderBar);
		};
		
		init();
		
		return true;
	})();
};