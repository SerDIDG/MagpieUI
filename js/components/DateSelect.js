Com['DateSelect'] = function(o){
    var that = this,
        config = cm.merge({
            'configDataMarker' : 'data-config',
            'container' : false,
            'input' : cm.Node('input', {'type' : 'text'}),
            'saveFormat' : '%Y-%m-%d',
            'startYear' : 1950,
            'endYear' : new Date().getFullYear() + 10,
            'renderSelectsInBody' : true,
            'events' : {},
            'langs' : {
                'day' : 'Day',
                'month' : 'Month',
                'year' : 'Years',
                'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            }
        }, o),
        API = {
            'onSelect' : [],
            'onChange' : []
        },
        nodes = {},
        coms = {},
        defaultDate = {
            'day' : '00',
            'month' : '00',
            'year' : '0000'
        };

    that.previous = cm.clone(defaultDate);
    that.selected = cm.clone(defaultDate);

    var init = function(){
        convertEvents(config['events']);
        getConfig(config['input'], config['configDataMarker']);
        render();
        // Set selected date
        set(config['input'].value);
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-dateselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'cm-toolbar bottom'},
                cm.Node('div', {'class' : 'inner clear'},
                    cm.Node('ul', {'class' : 'group'},
                        nodes['day'] = cm.Node('li', {'class' : 'is-field x-small'}),
                        nodes['month'] = cm.Node('li', {'class' : 'is-field medium'}),
                        nodes['year'] = cm.Node('li', {'class' : 'is-field small'})
                    )
                )
            )
        );
        renderSelects();
        /* *** ATTRIBUTES *** */
        // Set hidden input attributes
        if(config['input'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', config['input'].getAttribute('name'));
        }
        /* *** INSERT INTO DOM *** */
        if(config['container']){
            config['container'].appendChild(nodes['container']);
        }else if(config['input'].parentNode){
            cm.insertBefore(nodes['container'], config['input']);
        }
        cm.remove(config['input']);
    };

    var renderSelects = function(){
        var data, i;
        // Days
        data = [
            {'value' : '00', 'text' : lang('day')}
        ];
        for(i = 1; i <= 31; i++){
            data.push({'value' : cm.addLeadZero(i), 'text' : i});
        }
        coms['day'] = new Com.Select({
            'container' : nodes['day'],
            'options' : data,
            'renderInBody' : config['renderSelectsInBody'],
            'events' : {
                'onChange' :  function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['day'] = item;
                    setMisc(true);
                }
            }
        });
        // Months
        data = [
            {'value' : '00', 'text' : lang('month')}
        ];
        cm.forEach(config['langs']['months'], function(month, i){
            data.push({'value' : cm.addLeadZero(parseInt(i + 1)), 'text' : month});
        });
        coms['month'] = new Com.Select({
            'container' : nodes['month'],
            'options' : data,
            'renderInBody' : config['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['month'] = item;
                    setMisc(true);
                }
            }
        });
        // Years
        data = [
            {'value' : '0000', 'text' : lang('year')}
        ];
        for(i = config['endYear']; i >= config['startYear']; i--){
            data.push({'value' : i, 'text' : i});
        }
        coms['year'] = new Com.Select({
            'container' : nodes['year'],
            'options' : data,
            'renderInBody' : config['renderSelectsInBody'],
            'events' : {
                'onChange' : function(select, item){
                    that.previous = cm.clone(that.selected);
                    that.selected['year'] = item;
                    setMisc(true);
                }
            }
        });
    };

    var set = function(str, execute){
        that.previous = cm.clone(that.selected);
        if(!str || str == toStr(defaultDate)){
            that.selected = cm.clone(defaultDate);
        }else{
            if(str instanceof Date){
                that.selected = fromStr(cm.parseDate(str));
            }else{
                that.selected = fromStr(str);
            }
        }
        coms['day'].set(that.selected['day'], false);
        coms['month'].set(that.selected['month'], false);
        coms['year'].set(that.selected['year'], false);
        setMisc(execute);
    };

    var setMisc = function(execute){
        nodes['hidden'].value = toStr(that.selected);
        if(execute){
            // API onSelect event
            executeEvent('onSelect', toStr(that.selected));
            // API onChange event
            if(toStr(that.selected) != toStr(that.previous)){
                executeEvent('onChange', toStr(that.selected));
            }
        }
    };

    var fromStr = function(str, format){
        var o = {},
            convertFormats = {
                '%Y' : 'YYYY',
                '%m' : 'mm',
                '%d' : 'dd'
            },
            formats = {
                'YYYY' : function(value){
                    o['year'] = value;
                },
                'mm' : function(value){
                    o['month'] = value;
                },
                'dd' : function(value){
                    o['day'] = value;
                }
            },
            fromIndex = 0;
        format = format || config['saveFormat'];
        // Parse
        cm.forEach(convertFormats, function(item, key){
            format = format.replace(key, item);
        });
        cm.forEach(formats, function(item, key){
            fromIndex = format.indexOf(key);
            while(fromIndex != -1){
                item(str.substr(fromIndex, key.length));
                fromIndex = format.indexOf(key, fromIndex + 1);
            }
        });
        return o;
    };

    var toStr = function(o, format){
        var str = format || config['saveFormat'],
            formats = function(o){
                return {
                    '%Y' : function(){
                        return o['year'];
                    },
                    '%m' : function(){
                        return o['month'];
                    },
                    '%d' : function(){
                        return o['day'];
                    }
                }
            };
        cm.forEach(formats(o), function(item, key){
            str = str.replace(key, item);
        });
        return str;
    };

    /* ******* MISC FUNCTIONS ******* */

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    var lang = function(str){
        if(!config['langs'][str]){
            config['langs'][str] = str;
        }
        return config['langs'][str];
    };

    var getConfig = function(container, marker){
        if(container){
            marker = marker || 'data-config';
            var sourceConfig = container.getAttribute(marker);
            if(sourceConfig){
                config = cm.merge(config, JSON.parse(sourceConfig));
            }
        }
    };

    var executeEvent = function(event, params){
        API[event].forEach(function(item){
            item(that, params || {});
        });
    };

    /* ******* MAIN ******* */

    that.get = function(format){
        format = format || config['saveFormat'];
        return toStr(that.selected, format);
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    that.addEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event].push(handler);
        }
        return that;
    };

    that.removeEvent = function(event, handler){
        if(API[event] && typeof handler == 'function'){
            API[event] = API[event].filter(function(item){
                return item != handler;
            });
        }
        return that;
    };

    init();
};