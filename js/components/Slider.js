cm.define('Com.Slider', {
    'modules' : [
        'Params',
        'Events',
        'DataConfig',
        'DataNodes'
    ],
    'events' : [
        'onRender',
        'onChangeStart',
        'onChange',
        'onPause',
        'onUnPause'
    ],
    'params' : {
        'node' : cm.Node('div'),
        'time' : 500,                   // Fade time
        'delay' : 4000,                 // Delay before slide will be changed
        'slideshow' : true,             // Turn on / off slideshow
        'direction' : 'forward',        // Slideshow direction: forward | backward | random
        'pauseOnHover' : true,
        'fadePrevious' : false,         // Fade out previous slide, needed when using transparency slides
        'buttons' : true,               // Display buttons, can hide exists buttons
        'numericButtons' : false,       // Render slide index on button
        'arrows' : true,                // Display arrows, can hide exists arrows
        'effect' : 'fade',              // fade | push
        'transition' : 'smooth',        // smooth | simple | acceleration | inhibition,
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
        items = [],
        components = {},
        anims = {},
        slideshowInt;
    
    that.nodes = {
        'container' : cm.Node('div'),
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

    that.direction = 'next';
    that.current = null;
    that.previous = null;
    that.paused = false;

    that.isProcess = false;

    var init = function(){
        that.setParams(params);
        that.convertEvents(that.params['events']);
        that.getDataNodes(that.params['node']);
        that.getDataConfig(that.params['node']);

        validateParams();
        renderSlider();
        renderLayout();
        afterRender();
        items[0] && set(0);
    };

    var validateParams = function(){
        that.params['direction'] = {'forward' : 1, 'backward' : 1, 'random' : 1}[that.params['direction']] ? that.params['direction'] : 'forward';
        that.params['effect'] = {'push' : 1, 'fade' : 1}[that.params['effect']] ? that.params['effect'] : 'fade';
        that.params['transition'] = {'smooth' : 1, 'simple' : 1, 'acceleration' : 1, 'inhibition' : 1}[that.params['transition']] ? that.params['transition'] : 'smooth';
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
        if(!that.params['arrows'] || items.length < 2){
            that.nodes['next'].style.display = 'none';
            that.nodes['prev'].style.display = 'none';
        }
        // Buttons
        if(that.params['buttons']){
            cm.forEach(items, renderButton);
        }
        if(!that.params['buttons'] || items.length < 2){
            that.nodes['buttons'].style.display = 'none';
        }
        // Pause slider when it hovered
        if(that.params['slideshow'] && that.params['pauseOnHover']){
            cm.addEvent(that.nodes['container'], 'mouseover', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    that.pause();
                }
            });
            cm.addEvent(that.nodes['container'], 'mouseout', function(e){
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if(!cm.isParent(that.nodes['container'], target, true)){
                    that.unpause();
                }
            });
        }
        // Init animations
        anims['slides'] = new cm.Animation(that.nodes['slides']);
        anims['slidesInner'] = new cm.Animation(that.nodes['slidesInner']);
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

    var afterRender = function(){
        that.triggerEvent('onRender');
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
            'index' : items.length,
            'nodes' : {
                'container' : cm.Node('li')
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
        items.push(item);
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

    var effects = {
        'fade' : function(current, previous, callback){
            var fadeOut = function(item){
                if(item){
                    item['nodes']['container'].style.zIndex = 1;
                    if(that.params['fadePrevious']){
                        item['anim'].go({'style' : {'opacity' : 0}, 'duration' : that.params['time'], 'anim' : that.params['transition'], 'onStop' : function(){
                            hide(item);
                        }});
                    }else{
                        setTimeout(function(){
                            hide(item);
                        }, that.params['time']);
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
            current['anim'].go({'style' : {'opacity' : 1}, 'duration' : that.params['time'], 'anim' : that.params['transition'], 'onStop' : callback});
        },

        'push' : function(current, previous, callback){
            var left = current['nodes']['container'].offsetLeft;
            anims['slidesInner'].go({'style' : {'scrollLeft' : left}, 'duration' : that.params['time'], 'anim' : that.params['transition'], 'onStop' : callback});
        }
    };

    var set = function(index){
        if(!that.isProcess){
            that.isProcess = true;
            // Renew slideshow delay
            that.params['slideshow'] && renewSlideshow();
            // Set current active slide
            var current = items[index],
                previous = items[that.current];
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
            effects[that.params['effect']](current, previous, function(){
                that.isProcess = false;
                // API onChange event
                that.triggerEvent('onChange', {
                    'current' : current,
                    'previous' : previous
                });
            });
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
        that.paused = false;
        slideshowInt = setTimeout(function(){
            switch(that.params['direction']){
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
        }, that.params['delay']);
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
    
    /* ******* MAIN ******* */

    that.set = function(index){
        if(items[index]){
            set(index);
        }
        return that;
    };

    that.next = function(){
        that.direction = 'next';
        var i = ((that.current + 1) == items.length) ? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function(){
        that.direction = 'prev';
        var i = (that.current == 0) ? (items.length - 1) : (that.current - 1);
        set(i);
        return that;
    };

    that.pause = function(){
        stopSlideshow();
        // API onPause event
        that.triggerEvent('onPause');
        return that;
    };

    that.unpause = function(){
        startSlideshow();
        // API onUnPause event
        that.triggerEvent('onUnPause');
        return that;
    };

    init();
});