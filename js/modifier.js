Com['Modifier'] = function(){
    var that = this,
        stack = {};

    var get = function(rule){
        var handler;
        if((handler = stack[rule]) && (handler = handler[handler.length - 1])){
            return handler;
        }
        return function(){};
    };

    /* Main */

    that.__add__ = function(rule, handler){
        if(typeof handler == 'function'){
            if(!stack[rule]){
                stack[rule] = [];
                that[rule] = function(){
                    return get(rule).apply(this, arguments);
                };
            }
            stack[rule].push(handler);
        }
        return that;
    };

    that.__remove__ = function(rule, handler){
        if(typeof handler == 'function'){
            if(stack[rule]){
                stack[rule] = stack[rule].filter(function(item){
                    return item != handler;
                });
            }
        }
        return that;
    };

    that.__get__ = function(rule){
        return get(rule);
    };

    that.__exec__ = function(rule /*, attributes */){
        var attributes = [];
        cm.forEach(arguments, function(item){
            if(item != rule){
                attributes.push(item);
            }
        });
        return get(rule).apply(this, attributes);
    };

};

Com['ModifierBind'] = new function(){
    var stack = [];
    return function(Class){
        if(!cm.inArray(stack, Class)){
            stack.push(Class);
            Class.prototype = new Com.Modifier();
        }
        return Class.prototype;
    }
};