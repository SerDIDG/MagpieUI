Com.Elements['Datepicker'] = {};

Com['GetDatepicker'] = function(id){
    return Com.Elements.Datepicker[id] || null;
};

Com['Datepicker'] = function(o){
    var that = this, config = cm.merge({
            'container' : false,
            'input' : cm.Node('input', {'type' : 'text'}),
            'renderInBody' : true,
            'placeholder' : '',
            'format' : '%F %j, %Y',
            'saveFormat' : '%Y-%m-%d',
            'startYear' : 1900,
            'endYear' : new Date().getFullYear(),
            'startWeekDay' : 0,
            'showPlaceholder' : true,
            'showTodayButton' : true,
            'showClearButton' : false,
            'showTitleTag' : true,
            'title' : false,
            'menuMargin' : 3,
            'events' : {},
            'icons' : {
                'datepicker' : 'icon medium datepicker linked',
                'clear' : 'icon small remove linked'
            },
            'langs' : {
                'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                'clearButtonTitle' : 'Clear datepicker',
                'todayButton' : 'Today'
            }
        }, o),
        dataAttributes = ['renderInBody', 'placeholder', 'showPlaceholder', 'showTodayButton', 'showClearButton', 'startYear', 'endYear', 'startWeekDay', 'format', 'saveFormat', 'showTitleTag', 'title'],
        API = {
            'onSelect' : [],
            'onChange' : []
        },
        nodes = {
            'calendar' : {},
            'menu' : {}
        },
        components = {},

        today = new Date(),
        currentSelectedDate,
        previousSelectedDate;

    var init = function(){
        // Legacy: Convert events to API Events
        convertEvents(config['events']);
        // Merge data-attributes with config. Data-attributes have higher priority.
        processDataAttributes();
        render();
        setMiscEvents();
        // Set selected date
        set(config['input'].value);
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['input'].getAttribute(['data', item].join('-'));
            if(item == 'placeholder'){
                value = config['input'].getAttribute(item) || value;
            }else if(item == 'title'){
                value = config['input'].getAttribute(item) || value;
            }else if(/^false|true$/.test(value)){
                value = value ? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var render = function(){
        /* *** RENDER STRUCTURE *** */
        nodes['container'] = cm.Node('div', {'class' : 'com-datepicker-input'},
            nodes['hidden'] = cm.Node('input', {'type' : 'hidden'}),
            cm.Node('div', {'class' : 'form-field has-icon-right'},
                nodes['input'] = cm.Node('input', {'type' : 'text'}),
                nodes['icon'] = cm.Node('div', {'class' : config['icons']['datepicker']})
            ),
            nodes['menuContainer'] = cm.Node('div',
                nodes['calendarContainer'] = cm.Node('div')
            )
        );
        /* *** ATTRIBUTES *** */
        // Title
        if(config['showTitleTag'] && config['title']){
            nodes['container'].title = config['title'];
        }
        // ID
        if(config['input'].id){
            nodes['container'].id = config['input'].id;
        }
        // Set hidden input attributes
        if(config['input'].getAttribute('name')){
            nodes['hidden'].setAttribute('name', config['input'].getAttribute('name'));
        }
        // Placeholder
        if(config['showPlaceholder'] && config['placeholder']){
            nodes['input'].setAttribute('placeholder', config['placeholder']);
        }
        // Clear Butoon
        if(config['showClearButton']){
            cm.addClass(nodes['container'], 'has-clear-button');
            nodes['container'].appendChild(
                nodes['clearButton'] = cm.Node('div', {'class' : config['icons']['clear'], 'title' : config['langs']['clearButtonTitle']})
            );
        }
        // Today Button
        if(config['showTodayButton']){
            nodes['menuContainer'].appendChild(
                nodes['todayButton'] = cm.Node('div', {'class' : 'button today'}, config['langs']['todayButton'])
            );
        }
        /* *** INSERT INTO DOM *** */
        if(config['container']){
            config['container'].appendChild(nodes['container']);
        }else if(config['input'].parentNode){
            cm.insertBefore(nodes['container'], config['input']);
        }
        cm.remove(config['input']);
    };

    var setMiscEvents = function(){
        // Add events on input to makes him clear himself when user wants that
        nodes['input'].onkeydown = function(e){
            e = cm.getEvent(e);
            cm.preventDefault(e);
            if(e.keyCode == 8){
                set(0);
                components['menu'].hide(false);
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onChange');
            }
        };
        // Clear Butoon
        if(config['showClearButton']){
            cm.addEvent(nodes['clearButton'], 'click', function(){
                set(0);
                components['menu'].hide(false);
                /* *** EXECUTE API EVENTS *** */
                executeEvent('onChange');
            });
        }
        // Today Button
        if(config['showTodayButton']){
            cm.addEvent(nodes['todayButton'], 'click', function(){
                set(today, true);
                components['menu'].hide(false);
            });
        }
        // Render tooltip
        components['menu'] = new Com.Tooltip({
            'container' : config['renderInBody'] ? document.body : nodes['container'],
            'className' : 'com-datepicker-tooltip',
            'top' : ['targetHeight', config['menuMargin']].join('+'),
            'content' : nodes['menuContainer'],
            'target' : nodes['container'],
            'targetEvent' : 'click',
            'hideOnReClick' : true,
            'events' : {
                'onShowStart' : show,
                'onHideStart' : hide
            }
        });
        nodes['menu'] = components['menu'].getNodes();
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'container' : nodes['calendarContainer'],
            'renderSelectsInBody' : false,
            'className' : 'com-datepicker-calendar',
            'startYear' : config['startYear'],
            'endYear' : config['endYear'],
            'startWeekDay' : config['startWeekDay'],
            'langs' : config['langs'],
            'renderMonthOnInit' : false,
            'events' : {
                'onMonthRender' : markSelectedDay,
                'onDayClick' : function(calendar, params){
                    set(params['date'], true);
                    components['menu'].hide(false);
                }
            }
        });
    };

    var show = function(){
        // Render calendar month
        if(!currentSelectedDate){
            today = new Date();
            components['calendar'].set(today.getFullYear(), today.getMonth()).renderMonth();
        }else{
            components['calendar'].set(currentSelectedDate.getFullYear(), currentSelectedDate.getMonth()).renderMonth();
        }
    };

    var hide = function(){
    };

    var set = function(str, execute){
        previousSelectedDate = currentSelectedDate;
        if(!str || new RegExp(cm.dateFormat(false, config['saveFormat'], config['langs'])).test(str)){
            currentSelectedDate = null;
            nodes['input'].value = '';
            nodes['hidden'].value = cm.dateFormat(false, config['saveFormat'], config['langs']);
        }else{
            if(typeof str == 'object'){
                currentSelectedDate = str;
            }else{
                str = str.split(' ')[0].split('-');
                currentSelectedDate = new Date(str[0], (parseInt(str[1], 10) - 1), str[2]);
            }
            nodes['input'].value = cm.dateFormat(currentSelectedDate, config['format'], config['langs']);
            nodes['hidden'].value = cm.dateFormat(currentSelectedDate, config['saveFormat'], config['langs']);
        }
        if(execute){
            /* *** EXECUTE API EVENTS *** */
            executeEvent('onSelect');
            executeEvent('onChange');
        }
    };

    var markSelectedDay = function(calendar, params){
        if(currentSelectedDate && params['year'] == currentSelectedDate.getFullYear() && params['month'] == currentSelectedDate.getMonth()){
            cm.addClass(params['days'][currentSelectedDate.getDate()]['container'], 'selected');
        }
    };

    var executeEvent = function(event){
        var handler = function(){
            cm.forEach(API[event], function(item){
                item(that, currentSelectedDate);
            });
        };

        switch(event){
            case 'onChange':
                if(!previousSelectedDate || (!currentSelectedDate && previousSelectedDate) || (currentSelectedDate.toString() !== previousSelectedDate.toString())){
                    handler();
                }
                break;

            default:
                handler();
                break;
        }
    };

    var convertEvents = function(o){
        cm.forEach(o, function(item, key){
            if(API[key] && typeof item == 'function'){
                API[key].push(item);
            }
        });
    };

    /* Main */

    that.get = function(format){
        return cm.dateFormat(currentSelectedDate, (format || config['saveFormat']), config['langs']);
    };

    that.set = function(str){
        set(str, true);
        return that;
    };

    that.getDate = function(){
        return currentSelectedDate || '';
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

    that.parseDate = function(o, format){
        return cm.dateFormat(o, (format || config['saveFormat']), config['langs']);
    };

    that.getNodes = function(key){
        return nodes[key] || nodes;
    };

    that.addEvents = function(o){       // Deprecated
        o && convertEvents(o);
        return that;
    };

    init();
};

Com['DatepickerCollector'] = function(node){
    var datepickers, id, datepicker;

    var init = function(node){
        if(!node){
            render(document.body);
        }else if(node.constructor == Array){
            cm.forEach(node, render);
        }else{
            render(node);
        }
    };

    var render = function(node){
        datepickers = cm.clone((node.getAttribute('data-datepicker') == 'true') ? [node] : cm.getByAttr('data-datepicker', 'true', node));
        // Render datepickers
        cm.forEach(datepickers, function(item){
            datepicker = new Com.Datepicker({'input' : item});
            if(id = item.id){
                Com.Elements.Datepicker[id] = datepicker;
            }
        });
    };

    init(node);
};