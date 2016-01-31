cm.define('Com.DateSelect', {
    'modules' : [
        'Params',
        'DataConfig',
        'Langs',
        'Events',
        'Structure',
        'Stack'
    ],
    'events' : [
        'onSelect',
        'onChange'
    ],
    'params' : {
        'input' : null,                                 // Deprecated, use 'node' parameter instead.
        'node' : cm.Node('input', {'type' : 'text'}),
        'name' : '',
        'embedStructure' : 'replace',
        'container' : null,
        'format' : 'cm._config.dateFormat',
        'startYear' : 1950,
        'endYear' : new Date().getFullYear() + 10,
        'renderSelectsInBody' : true,
        'langs' : {
            'Day' : 'Day',
            'Month' : 'Month',
            'Year' : 'Year',
            'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
        }
    }
},
function(params){
    var that = this,
        nodes = {},
        components = {},
        defaultDate = {
            'day' : '00',
            'month' : '00',
            'year' : '0000'
        };
    
    that.previous = cm.clone(defaultDate);
    that.selected = cm.clone(defaultDate);

    var init = function(){
        that.setParams(params);
        preValidateParams();
        that.convertEvents(that.params['events']);
        that.getDataConfig(that.params['node']);
        validateParams();
        render();
        that.addToStack(nodes['container']);
        // Set selected date
        set(that.params['node'].value);
    };

    var preValidateParams = function(){
        if(cm.isNode(that.params['input'])){
            that.params['node'] = that.params['input'];
        }
    };

    var validateParams = function(){
        if(cm.isNode(that.params['node'])){
            that.params['name'] = that.params['node'].getAttribute('name') || that.params['name'];
        }
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com__dateselect'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'pt__toolbar bottom'},
                cm.Node('div', {'class' : 'inner clear'},
                    cm.Node('ul', {'class' : 'group'},
                        nodes['year'] = cm.Node('li', {'class' : 'is-field small'}),
                        nodes['month'] = cm.Node('li', {'class' : 'is-field medium'}),
                        nodes['day'] = cm.Node('li', {'class' : 'is-field x-small'})
                    )
                )
            )
        );
        renderSelects();
        // Attributes
        if(that.params['name']){
            nodes['hidden'].setAttribute('name', that.params['name']);
        }
        // Append
        that.embedStructure(nodes['container']);
    };

    var renderSelects = function(){
        var data, i;
        // Days
        data = [
            {'value' : '00', 'text' : that.lang('Day')}
        ];
        for(i = 1; i <= 31; i++){
            data.push({'value' : cm.addLeadZero(i), 'text' : i});
        }
        components['day'] = new Com.Select({
            'container' : nodes['day'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
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
            {'value' : '00', 'text' : that.lang('Month')}
        ];
        cm.forEach(that.lang('months'), function(month, i){
            data.push({'value' : cm.addLeadZero(parseInt(i + 1)), 'text' : month});
        });
        components['month'] = new Com.Select({
            'container' : nodes['month'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
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
            {'value' : '0000', 'text' : that.lang('Year')}
        ];
        for(i = that.params['endYear']; i >= that.params['startYear']; i--){
            data.push({'value' : i, 'text' : i});
        }
        components['year'] = new Com.Select({
            'container' : nodes['year'],
            'options' : data,
            'renderInBody' : that.params['renderSelectsInBody'],
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
        components['day'].set(that.selected['day'], false);
        components['month'].set(that.selected['month'], false);
        components['year'].set(that.selected['year'], false);
        setMisc(execute);
    };

    var setMisc = function(execute){
        nodes['hidden'].value = toStr(that.selected);
        if(execute){
            // API onSelect event
            that.triggerEvent('onSelect', toStr(that.selected));
            // API onChange event
            if(toStr(that.selected) != toStr(that.previous)){
                that.triggerEvent('onChange', toStr(that.selected));
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
        format = format || that.params['format'];
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
        var str = format || that.params['format'],
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

    /* ******* PUBLIC ******* */

    that.get = function(format){
        format = format || that.params['format'];
        return toStr(that.selected, format);
    };

    that.getDate = function(){
        return that.selected;
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    init();
});