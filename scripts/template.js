Com['Template'] = function(o){
    var that = this,
        config = cm.merge({
            'html' : '',
            'data' : {},
            'lang' : {},
            'container' : cm.Node('div'),
            'render' : true,
            'parseNodesName' : false
        }, o),
        mainNode = cm.Node('div'),
        namedNodes,
        isRender = false;

    var init = function(){
        // Parse HTML string to DOM object
        mainNode.insertAdjacentHTML('beforeend', config['html']);
        // Find lang strings
        parseLang(mainNode, config['lang'], 'lang');
        // Find data attributes
        parseData(mainNode, config['data'], 'data');
        // Find nodes
        config['parseNodesName'] && parseNodes();
        // Embed into DOM
        config['render'] && render();
    };

    var render = function(){
        config['container'].appendChild(mainNode);
        isRender = true;
    };

    var parseLang = function(node, lang, langKey){
        var nodes, currentKey;
        cm.forEach(lang, function(value, key){
            currentKey = [langKey, key].join('.');
            if(cm.isObject(value)){
                parseLang(node, value, currentKey);
            }else{
                nodes = cm.getByAttr('cmt-key', currentKey, node);
                cm.forEach(nodes, function(item){
                    item.removeAttribute('cmt-key');
                    item.appendChild(
                        document.createTextNode(value)
                    );
                });
            }
        });
    };

    var parseData = function(node, data, dataKey){
        var nodes, currentKey;
        cm.forEach(data, function(value, key){
            currentKey = [dataKey, key].join('.');
            if(cm.isObject(value)){
                parseData(node, value, currentKey);
            }else if(cm.isArray(value)){
                nodes = cm.getByAttr('cmt-key', currentKey, node);
                cm.forEach(nodes, function(item){
                    item.removeAttribute('cmt-key');
                    cm.forEach(value, function(foreachValue){
                        parseData(cm.insertBefore(item.cloneNode(true), item), foreachValue, currentKey);
                    });
                    cm.remove(item);
                });
            }else{
                nodes = cm.getByAttr('cmt-key', currentKey, node);
                cm.forEach(nodes, function(item){
                    item.removeAttribute('cmt-key');
                    item.appendChild(
                        document.createTextNode(value)
                    );
                });
            }
        });
    };

    var parseNodes = function(){
        namedNodes = {};
        /// Find nodes in cycles
        parseNodesCycles(mainNode, namedNodes);
        // Find other left nodes
        parseNodesOther();
    };

    var parseNodesCycles = function(mainNode, namedNodes){
        var nodes, cycles, cAttr, cName, attr, o;
        cycles = mainNode.querySelectorAll('[cmt-node-foreach]');
        cm.forEach(cycles, function(cycle){
            if(cAttr = cycle.getAttribute('cmt-node-foreach')){
                cycle.removeAttribute('cmt-node-foreach');
                if(!namedNodes[cAttr]){
                    namedNodes[cAttr] = [];
                }
                o = {};
                namedNodes[cAttr].push(o);
                // Find child nodes
                nodes = cycle.querySelectorAll('[cmt-node]');
                // Add cycle in array, if he have node name
                if(cName = cycle.getAttribute('cmt-node')){
                    cycle.removeAttribute('cmt-node');
                    o[cName] = cycle;
                }
                // Add child nodes in array
                cm.forEach(nodes, function(node){
                    // Find cycles inside node
                    parseNodesCycles(cycle, o);
                    if(attr = node.getAttribute('cmt-node')){
                        node.removeAttribute('cmt-node');
                        o[attr] = node;
                    }
                });
            }
        });
    };

    var parseNodesOther = function(){
        var nodes, attr, names, namesLength, o;
        nodes = mainNode.querySelectorAll('[cmt-node]');
        cm.forEach(nodes, function(node){
            attr = node.getAttribute('cmt-node');
            names = attr.split('.');
            namesLength = names.length;
            o = namedNodes;
            cm.forEach(names, function(name, i){
                if(i == namesLength - 1){
                    o[name] = node;
                }
                if(!o[name]){
                    o[name] = {};
                }
                o = o[name];
            });
            node.removeAttribute('cmt-node');
        });
    };

    /* Main */

    that.render = function(){
        if(!isRender){
            render();
        }
        return that;
    };

    that.getNodes = function(){
        if(!namedNodes){
            parseNodes();
        }
        return namedNodes;
    };

    init();
};