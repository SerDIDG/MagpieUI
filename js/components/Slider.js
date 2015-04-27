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
        'onStart'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'name' : '',
        'time' : 500,                   // Fade time
        'delay' : 4000,                 // Delay before slide will be changed
        'slideshow' : true,             // Turn on / off slideshow
        'direction' : 'forward',        // Slideshow direction: forward | backward | random
        'pauseOnHover' : true,
        'fadePrevious' : false,         // Fade out previous slide, needed when using transparency slides
        'buttons' : true,               // Display buttons, can hide exists buttons
        'numericButtons' : false,       // Render slide index on button
        'arrows' : true,                // Display arrows, can hide exists arrows
        'effect' : 'fade',              // fade | push | pull | pull-parallax | pull-overlap
        'transition' : 'smooth',        // smooth | simple | acceleration | inhibition,
        'calculateMaxHeight' : false,
        'minHeight' : 96,               // Set min-height of slider, work with calculateMaxHeight parameter
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
        slideshowInt,
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

    that.direction = 'next';
    that.current = null;
    that.previous = null;
    that.paused = false;
    that.pausedOutside = false;
    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);

        validateParams();
        renderSlider();
        renderLayout();
        that.items[0] && set(0);
        that.addToStack(that.params['node']);
        that.triggerEvent('onRender');
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
        that.params['direction'] = {'forward' : 1, 'backward' : 1, 'random' : 1}[that.params['direction']] ? that.params['direction'] : 'forward';
        that.params['effect'] = Com.SliderEffects[that.params['effect']] ? that.params['effect'] : 'fade';
        that.params['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[that.params['transition']] ? that.params['transition'] : 'smooth';
        if(that.params['minHeight'] && isNaN(that.params['minHeight'])){
            minHeightDimension = getDimension(that.params['minHeight']);
            that.params['minHeight'] = parseFloat(that.params['minHeight']);
        }
    };

    var renderSlider = function(){
        // Set class on slides container dependence of animation effect
        cm.addClass(that.nodes['slides'], ['effect', that.params['effect']].join('-'));
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
        // Parameters
        if(that.params['calculateMaxHeight']){
            cm.addClass(that.params['node'], 'is-adaptive-content');
            calculateMaxHeight();
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
        // Init animations
        that.anim['slides'] = new cm.Animation(that.nodes['slides']);
        that.anim['slidesInner'] = new cm.Animation(that.nodes['slidesInner']);
        // Resize events
        cm.addEvent(window, 'resize', resizeHandler);
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

    var calculateMaxHeight = function(){
        var height = 0;
        cm.forEach(that.items, function(item){
            if(item.nodes['inner']){
                height = Math.max(height, cm.getRealHeight(item.nodes['inner'], 'offsetRelative'));
            }else{
                height = Math.max(height, cm.getRealHeight(item.nodes['container'], 'offsetRelative'));
            }
        });
        if(minHeightDimension == '%'){
            height = Math.max(height, (that.nodes['inner'].offsetWidth / 100 * that.params['minHeight']));
        }else{
            height = Math.max(height, that.params['minHeight']);
        }
        if(height != that.nodes['inner'].offsetHeight){
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
            }, true, true);
        }
        // Init animation
        item['anim'] = new cm.Animation(item['nodes']['container']);
        // Push to items array
        that.items.push(item);
        that.itemsLength = that.items.length;
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
            Com.SliderEffects[that.params['effect']](that, current, previous, function(){
                that.isProcess = false;
                // API onChange event
                that.triggerEvent('onChange', {
                    'current' : current,
                    'previous' : previous
                });
            });
            // Recalculate slider height
            if(that.params['calculateMaxHeight']){
                calculateMaxHeight();
            }
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
        if(that.params['barDirection'] == 'vertical'){
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
            slideshowInt = setTimeout(function(){
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
            slideshowInt && clearTimeout(slideshowInt);
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
        // Recalculate slider height
        if(that.params['calculateMaxHeight']){
            calculateMaxHeight();
        }
    };

    var getDimension = function(value){
        var pure = value.match(/\d+(\D*)/);
        return pure ? pure[1] : '';
    };
    
    /* ******* MAIN ******* */

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
        var i = ((that.current + 1) == that.items.length) ? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function(){
        that.direction = 'prev';
        var i = (that.current == 0) ? (that.items.length - 1) : (that.current - 1);
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

    init();
});

/* ******* SLIDER EFFECTS ******* */

Com.SliderEffects = {};

/* *** FADE *** */

Com.SliderEffects['fade'] = function(slider, current, previous, callback){
    var hide = function(item){
        item['nodes']['container'].style.display = 'none';
        cm.setOpacity(item['nodes']['container'], 0);
    };

    if(slider.itemsLength > 1 && previous && current != previous){
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

/* *** PUSH *** */

Com.SliderEffects['push'] = function(slider, current, previous, callback){
    var left = current['nodes']['container'].offsetLeft;
    slider.anim['slidesInner'].go({'style' : {'scrollLeft' : left}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
};

/* *** PULL *** */

Com.SliderEffects['pull'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous &&current != previous){
        // Hide previous slide
        var style = slider.direction == 'next' ? '-100%' : '100%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL OVERLAP *** */

Com.SliderEffects['pull-overlap'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous && current != previous){
        // Hide previous slide
        previous['nodes']['container'].style.zIndex = 1;
        setTimeout(function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }, slider.params['time']);
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};

/* *** PULL PARALLAX *** */

Com.SliderEffects['pull-parallax'] = function(slider, current, previous, callback){
    if(slider.itemsLength > 1 && previous &&current != previous){
        // Hide previous slide
        var style = slider.direction == 'next' ? '-50%' : '50%';
        previous['nodes']['container'].style.zIndex = 1;
        previous['anim'].go({'style' : {'left' : style}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : function(){
            previous['nodes']['container'].style.display = 'none';
            previous['nodes']['container'].style.left = '100%';
        }});
        // Set visible new slide and animate it
        current['nodes']['container'].style.zIndex = 2;
        current['nodes']['container'].style.display = 'block';
        if(slider.direction == 'next'){
            current['nodes']['container'].style.left = '100%';
        }else if(slider.direction == 'prev'){
            current['nodes']['container'].style.left = '-100%';
        }
        current['anim'].go({'style' : {'left' : '0%'}, 'duration' : slider.params['time'], 'anim' : slider.params['transition'], 'onStop' : callback});
    }else{
        callback();
    }
};