cm.define('Com.Slider', {
    modules: [
        'Params',
        'Langs',
        'Events',
        'DataConfig',
        'DataNodes',
        'Structure',
        'Stack'
    ],
    events: [
        'onRender',
        'onChangeStart',
        'onChange',
        'onPause',
        'onStart',
        'onEnableEditing',
        'onEnableEditable',
        'onDisableEditing',
        'onDisableEditable',
    ],
    params: {
        node: cm.node('div'),
        name: '',
        container: false,
        className: null,
        customEvents: true,
        renderStructure: false,
        isEditing: false,

        time: 500,                   // Fade time
        delay: 4000,                 // Delay between slides, 0 - stop slideshow
        effect: 'fade',              // none | edit | fade | fade-out | push | pull | pull-parallax | pull-overlap
        transition: 'smooth',        // smooth | simple | acceleration | inhibition
        height: 'auto',              // auto | max | slide
        minHeight: 48,               // Set min-height of slider, work with calculateMaxHeight parameter

        items: [],
        slideshow: true,             // Enable \ disable slideshow
        cycle: true,
        direction: 'forward',        // Slideshow direction: forward | backward | random

        pauseOnHover: true,
        pauseOnScroll: true,
        setInitial: true,            // Boolean: auto mode | number: slide index | string: random
        setOnClick: false,
        fadePrevious: false,         // Fade out previous slide, needed when using transparency slides

        controlsType: 'partial',     // full | partial | small | null
        controlsClasses: [],
        buttons: true,               // Display buttons, can hide exists buttons
        numericButtons: false,       // Render slide index on button
        arrows: true,                // Display arrows, can hide exists arrows

        hasBar: false,
        barDirection: 'horizontal',  // horizontal | vertical

        scroller: {
            constructor: 'Com.Scroll',
            constructorParams: {
                step: 25,
                time: 25
            },
        },
    },
    strings: {
        prev: 'Previous',
        next: 'Next'
    }
},
function (params) {
    var that = this,
        components = {},
        slideshowInterval,
        minHeightDimension;

    that.nodes = {
        container: cm.node('div'),
        inner: cm.node('div'),
        slides: cm.node('div'),
        slidesInner: cm.node('ul'),
        next: cm.node('div'),
        prev: cm.node('div'),
        buttonsBar: cm.node('div'),
        buttons: cm.node('ul'),
        items: [],
        'layout-inner': cm.node('div'),
        'bar-inner': cm.node('div'),
        'bar-items': []
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

    var init = function () {
        that.redrawHandler = that.redraw.bind(that);
        that.scrollHandler = that.scroll.bind(that);
        that.destructHandler = that.destruct.bind(that);
        that.enableEditingHandler = that.enableEditing.bind(that);
        that.disableEditingHandler = that.disableEditing.bind(that);
        getLESSVariables();
        that.setParams(params);
        that.convertEvents(that.params.events);
        that.getDataNodes(that.params.node);
        that.getDataConfig(that.params.node);
        validateParams();
        renderView();
        renderBar();
        setEvents();
        that.setEffect(that.params.effect);
        that.addToStack(that.nodes.container);
        that.params.isEditing && that.enableEditing();
        that.triggerEvent('onRender');
    };

    var getLESSVariables = function () {
        that.params.time = cm.getTransitionDurationFromLESS('ComSlider-Duration', that.params.time);
    };

    var validateParams = function () {
        // Check if slider in the editing mode
        if (cm.isNode(that.params.node)) {
            that.params.name = that.params.node.getAttribute('name') || that.params.name;
            that.isEditing = cm.hasClass(that.params.node, 'is-editing');
        }

        // Validate available effects and slideshow params
        that.params.effect = Com.SliderEffects[that.params.effect] ? that.params.effect : 'fade';
        that.params.transition = cm.inArray(['smooth', 'simple', 'acceleration', 'inhibition'], that.params.transition) ? that.params.transition : 'smooth';
        that.params.direction = cm.inArray(['forward', 'backward', 'random'], that.params.direction) ? that.params.direction : 'forward';

        // Show a first slide randomly when a slideshow direction is "random"
        if (that.params.setInitial === true && that.params.direction === 'random') {
            that.params.setInitial = 'random';
        }

        // Disable slideshow when delay between slides is 0 or less (for some reason)
        if (!that.params.delay || that.params.delay <= 0) {
            that.params.slideshow = false;
        }

        // Calculate height params
        that.params.height = cm.inArray(['auto', 'max', 'slide'], that.params.height) ? that.params.height : 'auto';
        if (that.params.minHeight && isNaN(that.params.minHeight)) {
            minHeightDimension = getDimension(that.params.minHeight);
            that.params.minHeight = parseFloat(that.params.minHeight);
        }
    };

    var renderView = function () {
        // Render Structure
        if (that.params.renderStructure) {
            renderStructure();
        } else {
            if (!cm.isNode(that.nodes.container)) {
                that.nodes.container = that.params.node;
            }
        }
        cm.addClass(that.nodes.container, that.params.className);

        // Collect items
        cm.forEach(that.nodes.items, collectItem);
        cm.forEach(that.params.items, collectItem);

        // Controls
        if (cm.inArray(['full', 'partial', 'small'], that.params.controlsType)) {
            cm.addClass(that.nodes.controls, ['is', that.params.controlsType].join('-'));
        }
        cm.addClass(that.nodes.controls, that.params.controlsClasses);

        // Arrows
        if (that.params.arrows) {
            cm.click.add(that.nodes.next, function (event) {
                cm.preventDefault(event);
                that.next();
            });
            cm.click.add(that.nodes.prev, function (event) {
                cm.preventDefault(event);
                that.prev();
            });
        }
        setArrows(that.params.arrows);

        // Buttons
        if (that.params.buttons) {
            cm.forEach(that.items, renderButton);
        }
        if (!that.params.buttons || that.itemsLength < 2) {
            cm.addClass(that.nodes.buttonsBar, 'is-hidden');
            that.nodes.buttonsBar.setAttribute('aria-hidden', true);
        }

        // Height Type Parameters
        that.nodes.inner.style.transition = [that.params.time, 'ms'].join('');
        if (/max|slide/.test(that.params.height)) {
            cm.addClass(that.nodes.container, 'is-adaptive-content');
        }

        // Pause slider when it hovered
        if (that.params.slideshow && that.params.pauseOnHover) {
            cm.addEvent(that.nodes.container, 'mouseover', function (e) {
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if (!cm.isParent(that.nodes.container, target, true)) {
                    stopSlideshow();
                }
            });
            cm.addEvent(that.nodes.container, 'mouseout', function (e) {
                e = cm.getEvent(e);
                var target = cm.getObjToEvent(e);
                if (!cm.isParent(that.nodes.container, target, true)) {
                    startSlideshow();
                }
            });
        }

        // Pause slider when in not in screen range
        scrollPauseHandler();

        // Init animations
        that.anim.slides = new cm.Animation(that.nodes.slides);
        that.anim.slidesInner = new cm.Animation(that.nodes.slidesInner);
    };

    var renderStructure = function () {
        that.nodes.container = cm.node('div', {classes: 'com__slider'},
            that.nodes.inner = cm.node('div', {classes: 'inner'},
                that.nodes.size = cm.node('div', {classes: 'size'}),
                that.nodes.slides = cm.node('div', {classes: 'slides'},
                    that.nodes.slidesInner = cm.node('ul')
                ),
                that.nodes.controls = cm.node('div', {classes: 'com__gallery-controls'},
                    cm.node('div', {classes: 'inner'},
                        that.nodes.prev = cm.node('div', {
                                classes: 'bar-arrow prev',
                                title: that.msg('prev'),
                                role: 'button',
                                tabindex: 0
                            },
                            cm.node('div', {classes: 'icon default prev'})
                        ),
                        that.nodes.next = cm.node('div', {
                                classes: 'bar-arrow next',
                                title: that.msg('next'),
                                role: 'button',
                                tabindex: 0
                            },
                            cm.node('div', {classes: 'icon default next'})
                        ),
                        that.nodes.buttonsBar = cm.node('div', {classes: 'bar-buttons'},
                            that.nodes.buttons = cm.node('ul')
                        )
                    )
                )
            )
        );

        // Embed
        that.embedStructure(that.nodes.container);
    };

    var setEvents = function () {
        // Resize events
        cm.addEvent(window, 'resize', that.redrawHandler);
        cm.addEvent(window, 'scroll', that.scrollHandler);
        // Add custom event
        if (that.params.customEvents) {
            cm.customEvent.add(that.nodes.container, 'redraw', that.redrawHandler);
            cm.customEvent.add(that.nodes.container, 'enableEditable', that.enableEditingHandler);
            cm.customEvent.add(that.nodes.container, 'disableEditable', that.disableEditingHandler);
            cm.customEvent.add(that.nodes.container, 'destruct', that.destructHandler);
        }
    };

    var unsetEvents = function () {
        // Resize events
        cm.removeEvent(window, 'resize', that.redrawHandler);
        cm.removeEvent(window, 'scroll', that.scrollHandler);
        // Add custom event
        if (that.params.customEvents) {
            cm.customEvent.remove(that.nodes.container, 'redraw', that.redrawHandler);
            cm.customEvent.remove(that.nodes.container, 'enableEditable', that.enableEditingHandler);
            cm.customEvent.remove(that.nodes.container, 'disableEditable', that.disableEditingHandler);
            cm.customEvent.remove(that.nodes.container, 'destruct', that.destructHandler);
        }
    };

    var renderBar = function () {
        if (!that.params.hasBar) {
            return;
        }

        // ToDo: fix data-nodes for gallery layout / slider layout views
        that.nodes.ComScroll = cm.getNodes(that.params.node).ComScroll;
        cm.getConstructor(that.params.scroller.constructor, function (classConstructor) {
            components.scroll = new classConstructor(
                cm.merge(that.params.scroller.constructorParams, {
                    nodes: that.nodes.ComScroll
                })
            );
        });
    };

    var calculateHeight = function () {
        switch (that.params.height) {
            case 'max':
                calculateMaxHeight();
                break;

            case 'slide':
                calculateSlideHeight();
                break;
        }
    };

    var calculateMaxHeight = function () {
        var height = 0;
        cm.forEach(that.items, function (item) {
            height = Math.max(height, cm.getRealHeight(item.nodes.container, 'offsetRelative'));
            if (item.nodes.inner) {
                height = Math.max(height, cm.getRealHeight(item.nodes.inner, 'offsetRelative'));
            }
        });
        if (minHeightDimension === '%') {
            height = Math.max(height, (that.nodes.inner.offsetWidth / 100 * that.params.minHeight));
        } else {
            height = Math.max(height, that.params.minHeight);
        }
        if (height !== that.nodes.inner.offsetHeight) {
            that.nodes.inner.style.height = [height, 'px'].join('');
        }
    };

    var calculateSlideHeight = function () {
        var item,
            height = 0;
        if (that.current !== null) {
            item = that.items[that.current];
            height = Math.max(height, cm.getRealHeight(item.nodes.container, 'offsetRelative'));
            if (item.nodes.inner) {
                height = Math.max(height, cm.getRealHeight(item.nodes.inner, 'offsetRelative'));
            }
        }
        if (minHeightDimension === '%') {
            height = Math.max(height, (that.nodes.inner.offsetWidth / 100 * that.params.minHeight));
        } else {
            height = Math.max(height, that.params.minHeight);
        }
        if (height !== that.nodes.inner.offsetHeight) {
            that.nodes.inner.style.height = [height, 'px'].join('');
        }
    };

    var collectItem = function (item) {
        // Configuration
        item = {
            index: that.items.length,
            nodes: item
        };

        // Get data-image if provided
        if (cm.isEmpty(item.image)) {
            item.image = cm.getData(item.nodes.container, 'image');
        }

        // Bar
        if (that.params.hasBar) {
            item.bar = that.nodes['bar-items'][item.index];
            item.bar.title = item.bar.link ? item.bar.link.getAttribute('title') || '' : '';
            item.bar.src = item.bar.link ? item.bar.link.getAttribute('href') || '' : '';
        }

        // Process item
        processItem(item);
    };

    var processItem = function (item) {
        // Configuration
        item = cm.merge({
            isImageSet: true,
            index: that.items.length,
            image: null,
            nodes: {
                container: cm.node('li'),
                inner: null
            }
        }, item);

        // Validate
        if (!cm.isEmpty(item.image)) {
            item.isImageSet = false;
        }

        // Attributes
        item.nodes.container.setAttribute('aria-hidden', true);
        cm.addClass(item.nodes.container, 'is-ready');

        // Bar
        if (that.params.hasBar) {
            // Set image on thumb click
            cm.click.add(item.bar.link, function (event) {
                cm.preventDefault(event);
                set(item.index);
            });
        }

        // Init animation
        item.anim = new cm.Animation(item.nodes.container);

        // Set image on slide click
        if (that.params.setOnClick) {
            cm.click.add(item.nodes.container, function (event) {
                cm.preventDefault(event);
                set(item.index);
            });
        }

        // Embed
        if (that.params.renderStructure || !cm.hasParentNode(item.nodes.container)) {
            cm.appendChild(item.nodes.container, that.nodes.slidesInner);
        }

        // Push to the items array
        that.items.push(item);
        that.itemsLength = that.items.length;
    };

    var resetStyles = function () {
        that.nodes.slidesInner.scrollLeft = 0;
        cm.forEach(that.items, function (item) {
            item.nodes.container.style.display = '';
            item.nodes.container.style.opacity = '';
            item.nodes.container.style.left = '';
            item.nodes.container.style.zIndex = '';
        });
    };

    var renderButton = function (item) {
        // Structure
        that.nodes.buttons.appendChild(
            item.nodes.button = cm.node('li')
        );
        if (that.params.numericButtons) {
            item.nodes.button.innerHTML = item.index + 1;
        }
        // Event
        cm.click.add(item.nodes.button, function (event) {
            cm.preventDefault(event);
            that.direction = item.index <= that.current ? 'next' : 'prev';
            set(item.index);
        });
    };

    var set = function (index) {
        if (!that.isProcess) {
            that.isProcess = true;
            // Renew slideshow delay
            that.params.slideshow && renewSlideshow();
            // Set current active slide
            var current = that.items[index],
                previous = that.items[that.current];
            that.previous = that.current;
            that.current = index;
            // API onChangeStart event
            that.triggerEvent('onChangeStart', {
                current: current,
                previous: previous
            });
            // Reset active slide
            if (previous) {
                if (that.params.buttons) {
                    cm.removeClass(previous.nodes.button, 'active');
                }
            }
            // Set image
            if (!current.isImageSet && !cm.isEmpty(current.image)) {
                current.isImageSet = true;
                current.nodes.container.style.backgroundImage = 'url("' + current.image + '")';
            }
            // Set active slide
            if (that.params.buttons) {
                cm.addClass(current.nodes.button, 'active');
            }
            // Set arrows
            if (that.params.arrows) {
                setArrows();
            }
            // Set bar item
            if (that.params.hasBar) {
                setBarItem(current, previous);
            }
            // Transition effect and callback
            Com.SliderEffects[that.effect](that, current, previous, function () {
                that.isProcess = false;
                // API onChange event
                that.triggerEvent('onChange', {
                    current: current,
                    previous: previous
                });
                // Trigger custom event
                cm.customEvent.trigger(current.nodes.container, 'redraw', {
                    direction: 'child',
                    self: false
                });
            });
            // Recalculate slider height dependence of a height type
            calculateHeight();
        }
    };

    var setArrows = function (toggle) {
        var showPrev = toggle === false
            ? false
            : that.params.cycle || that.itemsLength < 2 ? that.itemsLength > 1 : that.current > 0;
        that.nodes.prev.disabled = !showPrev;
        that.nodes.prev.setAttribute('aria-hidden', !showPrev);
        cm.toggleClass(that.nodes.prev, 'is-hidden', !showPrev);

        var showNext = toggle === false
            ? false
            : that.params.cycle || that.itemsLength < 2 ? that.itemsLength > 1 : that.current < that.itemsLength - 1;
        that.nodes.next.disabled = !showNext;
        that.nodes.next.setAttribute('aria-hidden', !showNext);
        cm.toggleClass(that.nodes.next, 'is-hidden', !showNext);
    };

    var setBarItem = function (current, previous) {
        var left,
            top;
        // Thumbs classes
        if (previous) {
            cm.removeClass(previous.bar.container, 'active');
        }
        cm.addClass(current.bar.container, 'active');
        // Move bar
        if (that.params.barDirection === 'vertical') {
            top = current.bar.container.offsetTop - (that.nodes['layout-inner'].offsetHeight / 2) + (current.bar.container.offsetHeight / 2);
            components.scroll.scrollY(top);
        } else {
            left = current.bar.container.offsetLeft - (that.nodes['layout-inner'].offsetWidth / 2) + (current.bar.container.offsetWidth / 2);
            components.scroll.scrollX(left);
        }
    };

    /* *** SLIDESHOW *** */

    var startSlideshow = function () {
        if (that.paused && !that.pausedOutside) {
            that.paused = false;
            slideshowInterval = setTimeout(function () {
                switch (that.params.direction) {
                    case 'random':
                        set(that.getRandomIndex());
                        break;

                    case 'backward':
                        that.prev();
                        break;

                    case 'forward':
                        that.next();
                        break;
                }
            }, that.params.delay);
            that.triggerEvent('onStart');
        }
    };

    var stopSlideshow = function () {
        if (!that.paused) {
            that.paused = true;
            slideshowInterval && clearTimeout(slideshowInterval);
            that.triggerEvent('onPause');
        }
    };

    var renewSlideshow = function () {
        if (!that.paused && !that.pausedOutside) {
            stopSlideshow();
            startSlideshow();
        }
    };

    /* *** HELPERS *** */

    var resizeHandler = function () {
        // Recalculate slider height dependence of a height type
        calculateHeight();
        // Pause slider when in not in screen range
        scrollPauseHandler();
    };

    var scrollHandler = function () {
        // Pause slider when in not in screen range
        scrollPauseHandler();
    };

    var scrollPauseHandler = function () {
        if (that.params.slideshow && that.params.pauseOnScroll) {
            var rect = cm.getRect(that.nodes.container);
            if (cm.inRange(0, cm._pageSize.winHeight, rect.top, rect.bottom)) {
                startSlideshow();
            } else {
                stopSlideshow();
            }
        }
    };

    var getDimension = function (value) {
        var pure = value.match(/\d+(\D*)/);
        return pure ? pure[1] : '';
    };

    /* ******* MAIN ******* */

    that.enableEditing = function () {
        if (typeof that.isEditing !== 'boolean' || !that.isEditing) {
            that.isEditing = true;
            cm.addClass(that.nodes.container, 'is-editing is-editable');
            that.enableEditMode();
            that.triggerEvent('onEnableEditing');
            that.triggerEvent('onEnableEditable');
        }
        return that;
    };

    that.disableEditing = function () {
        if (typeof that.isEditing !== 'boolean' || that.isEditing) {
            that.isEditing = false;
            cm.removeClass(that.nodes.container, 'is-editing is-editable');
            that.disableEditMode();
            that.triggerEvent('onDisableEditing');
            that.triggerEvent('onDisableEditable');
        }
        return that;
    };

    that.destruct = function () {
        var that = this;
        if (!that.isDestructed) {
            that.isDestructed = true;
            unsetEvents();
            that.removeFromStack();
        }
        return that;
    };

    that.redraw = function () {
        animFrame(resizeHandler);
        return that;
    };

    that.scroll = function () {
        animFrame(scrollHandler);
        return that;
    };

    that.set = function (index) {
        if (that.items[index]) {
            set(index);
        }
        return that;
    };

    that.setInitial = function(index) {
        if (cm.isNumber(index)) {
            index = that.items[index] ? index : 0;
        } else if (cm.isString(index) && index === 'random') {
            index = that.getRandomIndex();
        } else {
            index = 0;
        }
        that.set(index);
        return that;
    };

    that.get = function (index) {
        return that.items[index] ? that.items[index] : null;
    };

    that.getRandomIndex = function () {
        if (that.items.length <= 1) {
            return 0;
        }
        var index = 0;
        do {
            index = cm.rand(0, that.items.length - 1);
        } while (index === that.current);
        return index;
    };

    that.next = function () {
        that.direction = 'next';
        var i = ((that.current + 1) === that.items.length) ? 0 : (that.current + 1);
        set(i);
        return that;
    };

    that.prev = function () {
        that.direction = 'prev';
        var i = (that.current === 0) ? (that.items.length - 1) : (that.current - 1);
        set(i);
        return that;
    };

    that.pause = function () {
        that.pausedOutside = true;
        stopSlideshow();
        return that;
    };

    that.start = function () {
        that.pausedOutside = false;
        startSlideshow();
        return that;
    };

    that.enableEditMode = function () {
        that.pause();
        cm.addClass(that.nodes.container, 'is-editable');
        that.setEffect('edit');
    };

    that.disableEditMode = function () {
        that.start();
        cm.removeClass(that.nodes.container, 'is-editable');
        that.restoreEffect();
    };

    that.setEffect = function (effect) {
        // Reset slider
        that.current = null;
        that.previous = null;
        // Reset slides styles after previous effect
        cm.removeClass(that.nodes.slides, ['effect', that.effect].join('-'));
        resetStyles();
        // Set new effect
        that.effect = Com.SliderEffects[effect] ? effect : 'fade';
        cm.addClass(that.nodes.slides, ['effect', that.effect].join('-'));
        // Set initial slide
        if (that.isEditing) {
            that.setInitial(0);
        } else if (that.params.setInitial !== false) {
            that.setInitial(that.params.setInitial);
        }
        // Recalculate slider height
        calculateHeight();
        return that;
    };

    that.restoreEffect = function () {
        that.setEffect(that.params.effect);
        return that;
    };

    init();
});

/* ******* SLIDER EFFECTS ******* */

Com.SliderEffects = {};

/* *** NONE *** */

Com.SliderEffects.none = function (slider, current, previous, callback) {
    if (previous && current !== previous) {
        previous.nodes.container.setAttribute('aria-hidden', true);
        previous.nodes.container.style.display = 'none';
        previous.nodes.container.style.zIndex = 1;
    }
    current.nodes.container.setAttribute('aria-hidden', false);
    current.nodes.container.style.zIndex = 2;
    current.nodes.container.style.display = 'block';
    callback();
};

/* *** DEV *** */

Com.SliderEffects.edit = function (slider, current, previous, callback) {
    if (previous && current !== previous) {
        previous.nodes.container.setAttribute('aria-hidden', true);
        previous.nodes.container.style.display = 'none';
        previous.nodes.container.style.zIndex = 1;
    }
    current.nodes.container.setAttribute('aria-hidden', false);
    current.nodes.container.style.zIndex = 2;
    current.nodes.container.style.display = 'block';
    callback();
};

/* *** FADE *** */

Com.SliderEffects.fade = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.display = 'none';
        item.nodes.container.style.zIndex = 1;
        item.nodes.container.style.opacity = 0;
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        item.nodes.container.style.opacity = 1;
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            if (slider.params.fadePrevious) {
                previous.anim.go({
                    style: {opacity: 0},
                    duration: slider.params.time,
                    anim: slider.params.transition,
                    onStop: () => hide(previous),
                });
            } else {
                setTimeout(() => hide(previous), slider.params.time);
            }
        }
        // Set visible new slide and animate it
        show(current);
        current.nodes.container.style.opacity = 0;
        current.anim.go({
            style: {opacity: 1},
            duration: slider.params.time,
            anim: slider.params.transition,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

/* *** FADE *** */

Com.SliderEffects['fade-out'] = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.display = 'none';
        item.nodes.container.style.zIndex = 1;
        item.nodes.container.style.opacity = 0;
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        item.nodes.container.style.opacity = 1;
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            previous.anim.go({
                style: {opacity: 0},
                duration: slider.params.time,
                anim: slider.params.transition,
                onStop: () => hide(previous),
            });
        }
        // Set visible new slide and animate it
        show(current);
        current.nodes.container.style.opacity = 0;
        current.anim.go({
            style: {opacity: 1},
            duration: slider.params.time,
            anim: slider.params.transition,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

/* *** PUSH *** */

Com.SliderEffects.push = function (slider, current, previous, callback) {
    if (previous && current !== previous) {
        previous.nodes.container.setAttribute('aria-hidden', true);
    }
    current.nodes.container.setAttribute('aria-hidden', false);
    slider.anim.slidesInner.go({
        style: {scrollLeft: current.nodes.container.offsetLeft},
        duration: slider.params.time,
        anim: slider.params.transition,
        onStop: callback
    });
};

/* *** PULL *** */

Com.SliderEffects.pull = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.zIndex = 1;
        item.nodes.container.style.left = '100%';
        item.nodes.container.style.display = 'none';
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        item.nodes.container.style.left = 0;
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            previous.anim.go({
                style: {left: slider.direction === 'next' ? '-100%' : '100%'},
                duration: slider.params.time,
                anim: slider.params.transition,
                onStop: () => hide(previous),
            });
        }
        // Set visible new slide and animate it
        show(current);
        if (slider.direction === 'next') {
            current.nodes.container.style.left = '100%';
        } else if (slider.direction === 'prev') {
            current.nodes.container.style.left = '-100%';
        }
        current.anim.go({
            style: {left: '0%'},
            duration: slider.params.time,
            anim: slider.params.transition,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

/* *** PULL OVERLAP *** */

Com.SliderEffects['pull-overlap'] = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.zIndex = 1;
        item.nodes.container.style.left = '100%';
        item.nodes.container.style.display = 'none';
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        item.nodes.container.style.left = 0;
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            setTimeout(() => hide(previous), slider.params.time);
        }
        // Set visible new slide and animate it
        show(current);
        if (slider.direction === 'next') {
            current.nodes.container.style.left = '100%';
        } else if (slider.direction === 'prev') {
            current.nodes.container.style.left = '-100%';
        }
        current.anim.go({
            style: {left: '0%'},
            duration: slider.params.time,
            anim: slider.params.transition,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

/* *** PULL PARALLAX *** */

Com.SliderEffects['pull-parallax'] = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.zIndex = 1;
        item.nodes.container.style.left = '100%';
        item.nodes.container.style.display = 'none';
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        item.nodes.container.style.left = 0;
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            previous.anim.go({
                style: {left: slider.direction === 'next' ? '-50%' : '50%'},
                duration: slider.params.time,
                anim: slider.params.transition,
                onStop: () => hide(previous),
            });
        }
        // Set visible new slide and animate it
        show(current);
        if (slider.direction === 'next') {
            current.nodes.container.style.left = '100%';
        } else if (slider.direction === 'prev') {
            current.nodes.container.style.left = '-100%';
        }
        current.anim.go({
            style: {left: '0%'},
            duration: slider.params.time,
            anim: slider.params.transition,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

Com.SliderEffects['pull-parallax-css'] = function (slider, current, previous, callback) {
    const hide = (item) => {
        item.nodes.container.style.zIndex = 1;
        cm.setCSSTranslate(item.nodes.container, '100%', 0, 0);
        item.nodes.container.style.display = 'none';
        item.nodes.container.setAttribute('aria-hidden', true);
    };

    const show = (item) => {
        item.nodes.container.style.zIndex = 2;
        cm.setCSSTranslate(item.nodes.container, '0%', 0, 0);
        item.nodes.container.style.display = 'block';
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && previous && current !== previous) {
        // Hide previous slide
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            previous.nodes.container.style.zIndex = 1;
            cm.transition(previous.nodes.container, {
                properties: {
                    transform: 'translateX(' + (slider.direction === 'next' ? '-50%' : '50%') + ')'
                },
                duration: slider.params.time,
                delayOut: 30,
                onStop: () => hide(previous),
            });
        }
        // Set visible new slide and animate it
        show(current);
        if (slider.direction === 'next') {
            cm.setCSSTranslate(current.nodes.container, '100%', 0, 0);
        } else if (slider.direction === 'prev') {
            cm.setCSSTranslate(current.nodes.container, '-100%', 0, 0);
        }
        cm.transition(current.nodes.container, {
            properties: {
                transform: 'translateX(0%)'
            },
            duration: slider.params.time,
            delayOut: 30,
            onStop: callback
        });
    } else {
        show(current);
        callback();
    }
};

Com.SliderEffects.custom = function (slider, current, previous, callback) {
    const show = (item) => {
        cm.addClass(item.nodes.container, 'active', true);
        cm.removeClass(item.nodes.container, 'show', true);
        cm.removeClass(item.nodes.container, slider.direction, true);
        item.nodes.container.setAttribute('aria-hidden', false);
    };

    if (slider.itemsLength > 1 && current !== previous) {
        // Hide previous
        if (previous) {
            previous.nodes.container.setAttribute('aria-hidden', true);
            cm.addClass(previous.nodes.container, 'hide', true);
            cm.addClass(previous.nodes.container, slider.direction, true);
        }
        // Show current
        if (previous) {
            cm.addClass(current.nodes.container, 'show');
            cm.addClass(current.nodes.container, slider.direction);
        }
        show(current);
        // Delays
        setTimeout( () => {
            // Previous
            if (previous) {
                cm.removeClass(previous.nodes.container, slider.direction);
                cm.removeClass(previous.nodes.container, 'active hide');
            }
            // Callback
            callback();
        }, slider.params.time);
    } else {
        show(current);
        callback();
    }
};
