Com.Elements['CalendarEvents'] = {};

Com['GetCalendarEvents'] = function(id){
    return Com.Elements.CalendarEvents[id] || null;
};

Com['CalendarEvents'] = function(o){
    var that = this,
        config = cm.merge({
            'container' : cm.Node('div'),
            'data' : {},
            'format' : '%F %j, %Y',
            'startYear' : 1900,
            'endYear' : new Date().getFullYear(),
            'startWeekDay' : 0,
            'target' : '_blank',
            'langs' : {
                'days' : ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
                'months' : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            }
        }, o),
        dataAttributes = ['data', 'format', 'startYear', 'endYear', 'startWeekDay', 'target'],
        nodes = {},
        components = {};

    var init = function(){
        // Merge data-attributes with config. Data-attributes have higher priority.
        processDataAttributes();
        // Render
        render();
        setMiscEvents();
    };

    var processDataAttributes = function(){
        var value;
        cm.forEach(dataAttributes, function(item){
            value = config['container'].getAttribute(['data', item].join('-'));
            if(item == 'data'){
                value = value? JSON.parse(value) : config[item];
            }else if(/^false|true$/.test(value)){
                value = value? (value == 'true') : config[item];
            }else{
                value = value || config[item];
            }
            config[item] = value;
        });
    };

    var render = function(){
        // Structure
        nodes['container'] = cm.Node('div', {'class' : 'com-calendar-events'});
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'container' : nodes['container'],
            'renderMonthOnInit' : false,
            'startYear' : config['startYear'],
            'endYear' : config['endYear'],
            'startWeekDay' : config['startWeekDay'],
            'langs' : config['langs']
        });
        // Render tooltip
        components['tooltip'] = new Com.Tooltip({
            'className' : 'com-calendar-events-tooltip'
        });
        // Insert into DOM
        config['container'].appendChild(nodes['container']);
    };

    var setMiscEvents = function(){
        // Add events on calendars day
        components['calendar']
            .addEvent('onDayOver', renderTooltip)
            .addEvent('onMonthRender', markMonthDays)
            .renderMonth();
    };

    var markMonthDays = function(calendar, params){
        var data, day;
        if((data = config['data'][params['year']]) && (data = data[(params['month'] + 1)])){
            cm.forEach(data, function(value, key){
                if(day = params['days'][key]){
                    cm.addClass(day['container'], 'active');
                }
            })
        }
    };

    var renderTooltip = function(calendar, params){
        var data,
            myNodes = {};

        if((data = config['data'][params['year']]) && (data = data[(params['month'] + 1)]) && (data = data[params['day']])){
            // Structure
            myNodes['content'] = cm.Node('div', {'class' : 'com-calendar-events-listing'},
                myNodes['list'] = cm.Node('ul')
            );
            // Foreach events
            cm.forEach(data, function(value){
                myNodes['list'].appendChild(
                    cm.Node('li',
                        cm.Node('h4',
                            cm.Node('a', {'href' : value['url'], 'target' : config['target']}, value['title'])
                        )
                    )
                );
            });
            // Show tooltip
            components['tooltip']
                .setTarget(params['node'])
                .setTitle(cm.dateFormat(params['date'], config['format'], config['langs']))
                .setContent(myNodes['content'])
                .show();
        }
    };

    /* Main */

    that.addData = function(data){
        config['data'] = cm.merge(config['data'], data);
        components['calendar'].renderMonth();
        return that;
    };

    that.replaceData = function(data){
        config['data'] = data;
        components['calendar'].renderMonth();
        return that;
    };

    init();
};

Com['CalendarEventsCollector'] = function(node){
    var calendars, id, calendar;

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
        calendars = cm.clone((node.getAttribute('data-calendar-events') == 'true') ? [node] : cm.getByAttr('data-calendar-events', 'true', node));
        // Render calendars
        cm.forEach(calendars, function(item){
            calendar = new Com.CalendarEvents({'container' : item});
            if(id = item.id){
                Com.Elements.CalendarEvents[id] = calendar;
            }
        });
    };

    init(node);
};