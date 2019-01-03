cm.define('Com.Slider', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes',
        'Stack'
    ],
    'events' : [
        'onRender',
        'onChangeStart',
        'onChange',
        'onPause',
        'onStart',
        'enableEditing',
        'disableEditing',
        'enableEditable',
        'disableEditable'
    ],
    'params' : {
        'node' : cm.node('div'),
        'name' : '',
        'customEvents' : true,
        'renderStructure' : false,
        'isEditing' : false,
        'time' : 500,                   // Fade time
        'delay' : 4000,                 // Delay before slide will be changed
        'slideshow' : true,             // Turn on / off slideshow
        'direction' : 'forward',        // Slideshow direction: forward | backward | random
        'pauseOnHover' : true,
        'pauseOnScroll' : true,
        'fadePrevious' : false,         // Fade out previous slide, needed when using transparency slides
        'buttons' : true,               // Display buttons, can hide exists buttons
        'numericButtons' : false,       // Render slide index on button
        'arrows' : true,                // Display arrows, can hide exists arrows
        'effect' : 'fade',              // none | edit | fade | fade-out | push | pull | pull-parallax | pull-overlap
        'transition' : 'smooth',        // smooth | simple | acceleration | inhibition,
        'height' : 'auto',              // auto | max | slide
        'minHeight' : 48,               // Set min-height of slider, work with calculateMaxHeight parameter
        'hasBar' : false,
        'barDirection' : 'horizontal',  // horizontal | vertical
        'Com.Scroll' : {
            'step' : 25,
            'time' : 25
        }
    }
},
function(params){
    var that = this,
        components = {},
        slideshowInterval,
        minHeightDimension;
    
    that.nodes = {
        'container' : cm.Node('div'),
        'inner' : cm.Node('div'),
        'slides' : cm.Node('div'),
        'slidesInner' : cm.Node('ul'),
        'next' : cm.Node('div'),
        'prev' : cm.Node('div'),
        'buttons' : cm.Node('ul'),
        'items' : [],
        'layout-inner' : cm.Node('div'),
        'bar-inner' : cm.Node('div'),
        'bar-items' : []
    };

    that.anim = {};
    that.items = [];
    that.itemsLength = 0;

    that.effect = null;
    that.direction = 'next';
    that.current = null;
    that.previous = null;
    that.paused = false;
    that.pausedOutside = false;
    that.isProcess = false;
    that.isEditing = null;
    that.isDestructed = null;

    var init = function(){
        that.redrawHandler = that.redraw.bind(that);
        that.scrollHandler = that.scroll.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.enableEditingHandler = that.enableEditing.bind(that);
        that.disableEditingHandler = that.disableEditing.bind(that);
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);
        validateParams();
        renderSlider();
        renderLayout();
        setEvents();
        that.setEffect(that.params['effect']);
        that.addToStack(that.params['node']);
        that.params['isEditing'] && that.enableEditing();
        that.triggerEvent('onRender');
    };

    var getLESSVariables = function(){
        that.params['time'] = cm.getTransitionDurationFromLESS('ComSlider-Duration', that.params['time']);
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.isEditing = cm.hasClass(that.params['node'], 'is-editing');
        that.params['direction'] = {'forward' : 1, 'backward' : 1, 'random' : 1}[that.params['direction']] ? that.params['direction'] : 'forward';
        that.params['effect'] = Com.SliderEffects[that.params['effect']] ? that.params['effect'] : 'fade';
        that.params['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[that.params['transition']] ? that.params['transition'] : 'smooth';
        that.params['height'] = {'auto' : 1, 'max' : 1, 'slide' : 1}[that.params['height']] ? that.params['height'] : 'auto';
        if(that.params['minHeight'] && isNaN(that.params['minHeight'])){
            minHeightDimension = getDimension(that.params['minHeight']);
            that.params['minHeight'] = parseFloat(that.params['minHeight']);
        }
    };

    var renderSlider = function(){
        var transitionRule = cm.getSupportedStyle('transition');
        // Render Structure
        if(that.params['renderStructure']){
            renderView();
        }
        // Collect items
        cm.forEach(that.nodes['items'], collectItem);
        // Arrows
        if(that.params['arrows']){
            cm.addEvent(that.nodes['next'], 'click', that.next);
            cm.addEvent(that.nodes['prev'], 'click', that.prev);
        }
        if(!that.params['arrows'] || that.itemsLength < 2){
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }
        // Buttons
        if(that.params['buttons']){
            cm.forEach(that.items, renderButton);
        }
        if(!that.params['buttons'] || that.itemsLength < 2){
            that.nodes['buttons'].style.display = 'none';
        }
        // Height Type Parameters
        that.nodes['inner'].style[transitionRule] = [that.params['time'], 'ms'].join('');
        if(/max|slide/.test(that.params['height'])){
            cm.addClass(that.nodes['container'], 'is-adaptive-content');
        }
        // Pause slider when it hovered
        if(that.params['slideshow'] && that.params['pauseOnHover']){
            cm.addEvent(that.nodes['container'], 'mouseover', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    stopSlideshow();
                }
            });
            cm.addEvent(that.nodes['container'], 'mouseout', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    startSlideshow();
                }
            });
        }
        // Pause slider when in not in screen range
        scrollPauseHandler();
        // Init animations
        that.anim['slides'] = new cm.Animation(that.nodes['slides']);
        that.anim['slidesInner'] = new cm.Animation(that.nodes['slidesInner']);
    };

    var renderView = function(){

    };

    var setEvents = function(){
        // Resize events
        cm.addEvent(window, 'resize', that.redrawHandler);
        cm.addEvent(window, 'scroll', that.scrollHandler);
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.add(that.params['node'], 'redraw', that.redrawHandler);
            cm.customEvent.add(that.params['node'], 'enableEditable', that.enableEditingHandler);
            cm.customEvent.add(that.params['node'], 'disableEditable', that.disableEditingHandler);
            cm.customEvent.add(that.params['node'], 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function(){
        // Resize events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        cm.removeEvent(window, 'scroll', that.scrollHandler);
        // Add custom event
        if(that.params['customEvents']){
            cm.customEvent.remove(that.params['node'], 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.params['node'], 'enableEditable', that.enableEditingHandler);
            cm.customEvent.remove(that.params['node'], 'disableEditable', that.disableEditingHandler);
            cm.customEvent.remove(that.params['node'], 'destruct', that.destructHandler);
        }
    };

    var renderLayout = function(){
        if(that.params['hasBar']){
            that.nodes['ComScroll'] = cm.getNodes(that.params['node'])['ComScroll'];
            components['scroll'] = new Com.Scroll(
                cm.merge(that.params['Com.Scroll'], {
                    'nodes' : that.nodes['ComScroll']
                })
            );
        }
    };

    var calculateHeight = function(){
        switch(that.params['height']){
            case 'max' :
                calculateMaxHeight();
                break;

            case 'slide' :
                calculateSlideHeight();
                break;
        }
    };

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.items, function(item){
            height = Math.max(height, cm.getRealHeight(item.nodes['container'], 'offsetRelative'));
            if(item.nodes['inner']){
                height = Math.max(height, cm.getRealHeight(item.nodes['inner'], 'offsetRelative'));
            }
        });
        if(minHeightDimension === '%'){
            height = Math.max(height, (that.nodes['inner'].offsetWidth / 100 * that.params['minHeight']));
        }else{
            height = Math.max(height, that.params['minHeight']);
        }
        if(height !== that.nodes['inner'].offsetHeight){
            that.nodes['inner'].style.height = [height, 'px'].join('');
        }
    };

    var calculateSlideHeight = function(){
        var item,
            height = 0;
        if(that.current !== null){
            item = that.items[that.current];
            height = Math.max(height, cm.getRealHeight(item.nodes['container'], 'offsetRelative'));
            if(item.nodes['inner']){
                height = Math.max(height, cm.getRealHeight(item.nodes['inner'], 'offsetRelative'));
            }
        }
        if(minHeightDimension === '%'){
            height = Math.max(height, (that.nodes['inner'].offsetWidth / 100 * that.params['minHeight']));
        }else{
            height = Math.max(height, that.params['minHeight']);
        }
        if(height !== that.nodes['inner'].offsetHeight){
            that.nodes['inner'].style.height = [height, 'px'].join('');
        }
    };

    var collectItem = function(item, i){
        // Configuration
        item = {
            'index' : i,
            'nodes' : item
        };
        // Bar
        if(that.params['hasBar']){
            item['bar'] = that.nodes['bar-items'][i];
            item['bar']['title'] = item['bar']['link']? item['bar']['link'].getAttribute('title') || '' : '';
            item['bar']['src'] = item['bar']['link']? item['bar']['link'].getAttribute('href') || '' : '';
        }
        // Process item
        processItem(item);
    };

    var processItem = function(item){
        // Configuration
        item = cm.merge({
            'index' : that.items.length,
            'nodes' : {
                'container' : cm.Node('li'),
                'inner' : null
            }
        }, item);
        // Bar
        if(that.params['hasBar']){
            // Set image on thumb click
            cm.addEvent(item['bar']['link'], 'click', function(e){
                e = cm.getEvent(e);
                cm.preventDefault(e);
                set(item['index']);
            });
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Push to items array
        that.items.push(item);
        that.itemsLength = that.items.length;
    };

    var resetStyles = function(){
        that.nodes['slidesInner'].scrollLeft = 0;
        cm.forEach(that.items, function(item){
            item.nodes['container'].style.display = '';
            item.nodes['container'].style.opacity = '';
            item.nodes['container'].style.left = '';
            item.nodes['container'].style.zIndex = '';
        });
    };

    var renderButton = function(item){
        // Structure
        that.nodes['buttons'].appendChild(
            item['nodes']['button'] = cm.Node('li')
        );
        if(that.params['numericButtons']){
            item['nodes']['button'].innerHTML = item['index'] + 1;
        }
        // Event
        cm.addEvent(item['nodes']['button'], 'click', function(){
            that.direction = 'next';
            set(item['index']);
        });
    };

    var set = function(index){
        if(!that.isProcess){
            that.isProcess = true;
            // Renew slideshow delay
            that.params['slideshow'] && renewSlideshow();
            // Set current active slide
            var current = that.items[index],
                previous = that.items[that.current];
            that.previous = that.current;
            that.current = index;
            // API onChangeStart event
            that.triggerEvent('onChangeStart', {
                'current' : current,
                'previous' : previous
            });
            // Reset active slide
            if(previous){
                if(that.params['buttons']){
                    cm.removeClass(previous['nodes']['button'], 'active');
                }
            }
            // Set active slide
            if(that.params['buttons']){
                cm.addClass(current['nodes']['button'], 'active');
            }
            // Set bar item
            if(that.params['hasBar']){
                setBarItem(current, previous);
            }
            // Transition effect and callback
            Com.SliderEffects[that.effect](that, current, previous, function(){
                that.isProcess = false;
                // API onChange event
                that.triggerEvent('onChange', {
                    'current' : current,
                    'previous' : previous
                });
                // Trigger custom event
                cm.customEvent.trigger(current['nodes']['container'], 'redraw', {
                    'direction' : 'child',
                    'self' : false
                });
            });
            // Recalculate slider height dependence of height type
            calculateHeight();
        }
    };

    var setBarItem = function(current, previous){
        var left,
            top;
        // Thumbs classes
        if(previous){
            cm.removeClass(previous['bar']['container'], 'active');
        }
        cm.addClass(current['bar']['container'], 'active');
        // Move bar
        if(that.params['barDirection'] === 'vertical'){
            top = current['bar']['container'].offsetTop - (that.nodes['layout-inner'].offsetHeight / 2) + (current['bar']['container'].offsetHeight / 2);
            components['scroll'].scrollY(top);
        }else{
            left = current['bar']['container'].offsetLeft - (that.nodes['layout-inner'].offsetWidth / 2) + (current['bar']['container'].offsetWidth / 2);
            components['scroll'].scrollX(left);
        }
    };

    /* *** SLIDESHOW *** */

    var startSlideshow = function(){
        if(that.paused && !that.pausedOutside){
            that.paused = false;
            slideshowInterval = setTimeout(function(){
                switch(that.params['direction']){
                    case 'random':
                        set(cm.rand(0, (that.items.length - 1)));
                        break;

                    case 'backward':
                        that.prev();
                        break;

                    case 'forward':
                        that.next();
                        break;
                }
            }, that.params['delay']);
            that.triggerEvent('onStart');
        }
    };

    var stopSlideshow = function(){
        if(!that.paused){
            that.paused = true;
            slideshowInterval && clearTimeout(slideshowInterval);
            that.triggerEvent('onPause');
        }
    };

    var renewSlideshow = function(){
        if(!that.paused && !that.pausedOutside){
            stopSlideshow();
            startSlideshow();
        }
    };

    /* *** HELPERS *** */

    var resizeHandler = function(){
        // Recalculate slider height dependence of height type
        calculateHeight();
        // Pause slider when in not in screen range
        scrollPauseHandler();
    };

    var scrollHandler = function(){
        // Pause slider when in not in screen range
        scrollPauseHandler();
    };

    var scrollPauseHandler = function(){
        if(that.params['slideshow'] && that.params['pauseOnScroll']){
            var rect = cm.getRect(that.nodes['container']);
            if(cm.inRange(0, cm._pageSize['winHeight'], rect['top'], rect['bottom'])){
                startSlideshow();
            }else{
                stopSlideshow();
            }
        }
    };

    var getDimension = function(value){
        var pure = value.match(/\d+(\D*)/);
        return pure ? pure[1] : '';
    };

    /* ******* MAIN ******* */

    that.enableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || !that.isEditing){
            that.isEditing = true;
            cm.addClass(that.params['node'], 'is-editing is-editable');
            that.enableEditMode();
            that.triggerEvent('enableEditing');
            that.triggerEvent('enableEditable');
        }
        return that;
    };

    that.disableEditing = function(){
        if(typeof that.isEditing !== 'boolean' || that.isEditing){
            that.isEditing = false;
            cm.removeClass(that.params['node'], 'is-editing is-editable');
            that.disableEditMode();
            that.triggerEvent('disableEditing');
            that.triggerEvent('disableEditable');
        }
        return that;
    };

    that.destruct = function(){
        var that = this;
        if(!that.isDestructed){
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.redraw = function(){
        animFrame(resizeHandler);
        return that;
    };

    that.scroll = function(){
        animFrame(scrollHandler);
        return that;
    };

    that.set = function(index){
        if(that.items[index]){
            set(index);
        }
        return that;
    };

    that.get = function(index){
        return that.items[index]? that.items[index] : null;
    };

    that.next = function(){
        that.direction = 'next';
        var i = ((that.current + 1) === that.items.length) ? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function(){
        that.direction = 'prev';
        var i = (that.current === 0) ? (that.items.length - 1) : (that.current - 1);
        set(i);
        return that;
    };

    that.pause = function(){
        that.pausedOutside = true;
        stopSlideshow();
        return that;
    };

    that.start = function(){
        that.pausedOutside = false;
        startSlideshow();
        return that;
    };

    that.enableEditMode = function(){
        that.pause();
        cm.addClass(that.nodes['container'], 'is-editable');
        that.setEffect('edit');
    };

    that.disableEditMode = function(){
        that.start();
        cm.removeClass(that.nodes['container'], 'is-editable');
        that.restoreEffect();
    };

    that.setEffect = function(effect){
        // Reset slides styles after previous effect
        cm.removeClass(that.nodes['slides'], ['effect', that.effect].join('-'));
        resetStyles();
        // Set new effect
        that.effect = Com.SliderEffects[effect] ? effect : 'fade';
        cm.addClass(that.nodes['slides'], ['effect', that.effect].join('-'));
        // Reset slide
        if(that.items[0]){
            set(0);
        }
        // Recalculate slider height
        calculateHeight();
        return that;
    };

    that.restoreEffect = function(){
        that.setEffect(that.params['effect']);
        return that;
    };

    init();
});

/* ******* SLIDER EFFECTS ******* */

Com.SliderEffects = {};

/* *** NONE *** */

Com.SliderEffects['none'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        previous['nodes']['container'].style.display = 'none';
        previous['nodes']['container'].style.zIndex = 1;
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
    }
    callback();
};

/* *** DEV *** */

Com.SliderEffects['edit'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        previous['nodes']['container'].style.display = 'none';
        previous['nodes']['container'].style.zIndex = 1;
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.opacity = 1;
        current['nodes']['container'].style.display = 'block';
        current['nodes']['container'].style.left = 0;
    }
    callback();
};

/* *** FADE *** */

Com.SliderEffects['fade'] = function(slider, current, previous, callback){
    var hide = function(item){
        item['nodes']['container'].style.display = 'none';
        cm.setOpacity(item['nodes']['container'], 0);
    };

    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        if(slider.params['fadePrevious']){
            previous['anim'].go({'style' : {'opacity' : 0}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
                hide(previous);
            }});
        }else{
            setTimeout(function(){
                hide(previous);
            }, slider.params['time']);
        }
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        current['anim'].go({'style' : {'opacity' : 1}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** FADE *** */

Com.SliderEffects['fade-out'] = function(slider, current, previous, callback){
    var hide = function(item){
        item['nodes']['container'].style.display = 'none';
        cm.setOpacity(item['nodes']['container'], 0);
    };

    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'opacity' : 0}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            hide(previous);
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        current['anim'].go({'style' : {'opacity' : 1}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PUSH *** */

Com.SliderEffects['push'] = function(slider, current, previous, callback){
    var left = current['nodes']['container'].offsetLeft;
    slider.anim['slidesInner'].go({'style' : {'scrollLeft' : left}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
};

/* *** PULL *** */

Com.SliderEffects['pull'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        var style = slider.direction === 'next' ? '-100%' : '100%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction === 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction === 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL OVERLAP *** */

Com.SliderEffects['pull-overlap'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        setTimeout(function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }, slider.params['time']);
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction === 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction === 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL PARALLAX *** */

Com.SliderEffects['pull-parallax'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        var style = slider.direction === 'next' ? '-50%' : '50%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction === 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction === 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

Com.SliderEffects['pull-parallax-css'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current !== previous){
        // Hide previous slide
        var style = slider.direction === 'next' ? '-50%' : '50%';
        previous['nodes']['container'].style.zIndex = 1;
        cm.transition(previous['nodes']['container'], {
            'properties' : {
                'transform' : 'translateX('+style+')'
            },
            'duration' : slider.params['time'],
            'delayOut' : 30,
            'onStop' : function(){
                previous['nodes']['container'].style.display = 'none';
                cm.setCSSTranslate(previous['nodes']['container'], '100%', 0, 0);
            }
        });
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction === 'next'){
            cm.setCSSTranslate(current['nodes']['container'], '100%', 0, 0);
        }else if(slider.direction === 'prev'){
            cm.setCSSTranslate(current['nodes']['container'], '-100%', 0, 0);
        }
        cm.transition(current['nodes']['container'], {
            'properties' : {
                'transform' : 'translateX(0%)'
            },
            'duration' : slider.params['time'],
            'delayOut' : 30,
            'onStop' : callback
        });
    }else{
        callback();
    }
};

Com.SliderEffects['custom'] = function(slider, current, previous, callback){
    if(slider.itemsLength && current !== previous){
        // Hide previous
        if(previous){
            cm.addClass(previous['nodes']['container'], 'hide', true);
            cm.addClass(previous['nodes']['container'], slider.direction, true);
        }
        // Show current
        if(previous){
            cm.addClass(current['nodes']['container'], 'show');
            cm.addClass(current['nodes']['container'], slider.direction);
        }
        cm.addClass(current['nodes']['container'], 'active', true);
        cm.removeClass(current['nodes']['container'], 'show', true);
        cm.removeClass(current['nodes']['container'], slider.direction, true);
        // Delays
        setTimeout(function(){
            // Previous
            if(previous){
                cm.removeClass(previous['nodes']['container'], slider.direction);
                cm.removeClass(previous['nodes']['container'], 'active hide');
            }
            // Callback
            callback();
        }, slider.params['time']);
    }else{
        callback();
    }
};