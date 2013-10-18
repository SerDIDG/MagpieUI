Com['Template'] = function(html, data, lang){
    var that = this,
        mainNode = cm.Node('div'),
        fragment,
        namedNodes;

    var init = function(){
        // Parse HTML string to DOM object
        mainNode.insertAdjacentHTML('beforeend', html);
        // Find lang strings
        parseLang(mainNode, lang, 'lang');
        // Find data attributes
        parseData(mainNode, data, 'data');
    };

    var parseLang = function(node, lang, langKey){
        var nodes,
            currentKey;
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
        var nodes,
            currentKey;
        cm.forEach(data, function(value, key){
            currentKey = [dataKey, key].join('.');
            nodes = cm.getByAttr('cmt-key', currentKey, node);
            if(cm.isArray(value)){
                cm.forEach(nodes, function(item){
                    item.removeAttribute('cmt-key');
                    cm.forEach(value, function(foreachValue){
                        parseData(cm.insertBefore(item.cloneNode(true), item), foreachValue, currentKey);
                    });
                    cm.remove(item);
                });
            }else{
                cm.forEach(nodes, function(item){
                    item.removeAttribute('cmt-key');
                    item.appendChild(
                        document.createTextNode(value)
                    );
                });
            }
        });
    };

    /* Main **/

    that.get = function(){
        if(!fragment){
            fragment = document.createDocumentFragment();
            // Insert nodes into fragment
            while(mainNode.childNodes.length){
                fragment.appendChild(mainNode.childNodes[0]);
            }
        }
        return fragment;
    };

    that.getNodes = function(){
        var attr,
            nodes;
        if(!namedNodes){
            // Find nodes
            namedNodes = {};
            nodes = cm.getByAttr('cmt-node', 'true', mainNode);
            cm.forEach(nodes, function(item){
                if(attr = item.getAttribute('cmt-name')){
                    namedNodes[attr] = item;
                }
                item.removeAttribute('cmt-name');
                item.removeAttribute('cmt-node');
            });
        }
        return namedNodes
    };

    init();
};