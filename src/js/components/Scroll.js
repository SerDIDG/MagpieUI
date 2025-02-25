cm.define('Com.Scroll', {
    extend: 'Com.AbstractController',
    events: [
        'onScroll',
        'onScrollStart',
        'onScrollEnd',
    ],
    params: {
        controllerEvents: true,
        renderStructure: false,
        embedStructureOnRender: false,

        step: 15,
        time: 50,
        duration: 300,
    },
},
function() {
    Com.AbstractController.apply(this, arguments);
});

cm.getConstructor('Com.Scroll', function(classConstructor, className, classProto, classInherit) {
    classProto.construct = function () {
        const that = this;

        // Pre-define nodes
        that.nodes = {
            left: cm.node('div'),
            right: cm.node('div'),
            up: cm.node('div'),
            down: cm.node('div'),
            scroll: cm.node('div'),
        };

        // Call parent method
        classInherit.prototype.construct.apply(that, arguments);
    };

    classProto.renderViewModel = function() {
        const that = this;
        // Call parent method
        classInherit.prototype.renderViewModel.apply(that, arguments);

        // Init animation
        that.components.animation = new cm.Animation(that.nodes.scroll);
        
        // Reset scroll
        that.nodes.scroll.scrollTop = 0;
        that.nodes.scroll.scrollLeft = 0;
        
        // Add target events
        cm.addEvent(that.nodes.up, 'mousedown', that.startMoveUp.bind(that));
        cm.addEvent(that.nodes.up, 'mouseup', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.up, 'mouseout', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.down, 'mousedown', that.startMoveDown.bind(that));
        cm.addEvent(that.nodes.down, 'mouseup', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.down, 'mouseout', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.left, 'mousedown', that.startMoveLeft.bind(that));
        cm.addEvent(that.nodes.left, 'mouseup', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.left, 'mouseout', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.right, 'mousedown', that.startMoveRight.bind(that));
        cm.addEvent(that.nodes.right, 'mouseup', that.endAnimation.bind(that));
        cm.addEvent(that.nodes.right, 'mouseout', that.endAnimation.bind(that));
    };

    /******* DIRECTIONS *******/

    classProto.startMoveUp = function(){
        const that = this;
        that.endAnimation();
        that.animationInterval = setInterval(that.moveUp.bind(that), that.params.time);
        that.moveUp();
    };

    classProto.startMoveDown = function(){
        const that = this;
        that.endAnimation();
        that.animationInterval = setInterval(that.moveDown.bind(that), that.params.time);
        that.moveDown();
    };

    classProto.startMoveLeft = function(){
        const that = this;
        that.endAnimation();
        that.animationInterval = setInterval(that.moveLeft.bind(that), that.params.time);
        that.moveLeft();
    };

    classProto.startMoveRight = function(){
        const that = this;
        that.endAnimation();
        that.animationInterval = setInterval(that.moveRight.bind(that), that.params.time);
        that.moveRight();
    };

    classProto.endAnimation = function(){
        const that = this;
        that.animationInterval && clearInterval(that.animationInterval);
    };

    classProto.moveUp = function(){
        const that = this;
        const top = Math.max((that.nodes.scroll.scrollTop - that.params.step), 0);
        that.components.animation.go({style: {scrollTop: top}, duration: that.params.time, anim: 'simple'});
    };

    classProto.moveDown = function(){
        const that = this;
        const top = Math.min((that.nodes.scroll.scrollTop + that.params.step), (that.nodes.scroll.scrollHeight - that.nodes.scroll.offsetHeight));
        that.components.animation.go({style: {scrollTop: top}, duration: that.params.time, anim: 'simple'});
    };

    classProto.moveLeft = function(){
        const that = this;
        const left = Math.max((that.nodes.scroll.scrollLeft - that.params.step), 0);
        that.components.animation.go({style: {scrollLeft: left}, duration: that.params.time, anim: 'simple'});
    };

    classProto.moveRight = function(){
        const that = this;
        const left = Math.min((that.nodes.scroll.scrollLeft + that.params.step), (that.nodes.scroll.scrollWidth - that.nodes.scroll.offsetWidth));
        that.components.animation.go({style: {scrollLeft: left}, duration: that.params.time, anim: 'simple'});
    };

    /******* PUBLIC *******/

    classProto.scrollY = function(num){
        const that = this;
        const top = Math.max(Math.min(num, that.nodes.scroll.scrollHeight - that.nodes.scroll.offsetHeight), 0);
        that.components.animation.go({style: {scrollTop: top}, duration: that.params.duration, anim: 'smooth'});
        return that;
    };

    classProto.scrollX = function(num){
        const that = this;
        const left = Math.max(Math.min(num, that.nodes.scroll.scrollWidth - that.nodes.scroll.offsetWidth), 0);
        that.components.animation.go({style: {scrollLeft: left}, duration: that.params.duration, anim: 'smooth'});
        return that;
    };
});