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
        nodes['container'] = cm.Node('div', {'class' : 'cm-calendar-events'});
        // Render calendar
        components['calendar'] = new Com.Calendar({
            'container' : nodes['container'],
            'renderMonthOnInit' : false,
            'startYear' : config['startYear'],
            'endYear' : config['endYear'],
            'startWeekDay' : config['startWeekDay'],
            'langs' : config['langs']
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
                    cm.addClass(day['node'], 'active');
                }
            })
        }
    };

    var renderTooltip = function(calendar, params){
        var data,
            checkInt,
            anim,
            myNodes = {};

        var getPosition = function(){
            var top = cm.getRealY(params['node']),
                left = cm.getRealX(params['node']),
                height = myNodes['container'].offsetHeight,
                width = myNodes['container'].offsetWidth,
                pageSize = cm.getPageSize(),
                positionTop = (top + height > pageSize['winHeight']? (top - height + params['node'].offsetHeight) : top),
                positionLeft = (left + width > pageSize['winWidth']? (left - width + params['node'].offsetWidth) : left);

            if(positionTop != myNodes['container'].offsetTop || positionLeft != myNodes['container'].offsetLeft){
                myNodes['container'].style.top =  [positionTop, 'px'].join('');
                myNodes['container'].style.left = [positionLeft, 'px'].join('');
            }
        };

        var bodyEvent = function(e){
            e = cm.getEvent(e);
            var target = cm.getEventTarget(e);
            if(!cm.isParent(myNodes['container'], target) && !cm.isParent(params['node'], target)){
                // Remove event - Check position
                checkInt && clearInterval(checkInt);
                // Remove mouseout event
                cm.removeEvent(document, 'mouseover', bodyEvent);
                // Animate
                anim.go({'style' : {'opacity' : 0}, 'duration' : 100, 'onStop' : function(){
                    myNodes['container'].style.display = 'none';
                    cm.remove(myNodes['container']);
                }});
            }
        };

        if((data = config['data'][params['year']]) && (data = data[(params['month'] + 1)]) && (data = data[params['day']])){
            // Structure
            myNodes['container'] = cm.Node('div', {'class' : 'cm-tooltip cm-calendar-events-tooltip'},
                cm.Node('div', {'class' : 'inner'},
                    cm.Node('div', {'class' : 'title'},
                        cm.Node('h3', cm.dateFormat(params['date'], config['format'], config['langs']))
                    ),
                    cm.Node('div', {'class' : 'scroll'},
                        cm.Node('div', {'class' : 'cm-calendar-events-listing'},
                            myNodes['list'] = cm.Node('ul')
                        )
                    )
                )
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
            // Init animation
            anim = new cm.Animation(myNodes['container']);
            // Append child tooltip into body and set position
            document.body.appendChild(myNodes['container']);
            getPosition();
            // Show tooltip
            myNodes['container'].style.display = 'block';
            // Check position
            checkInt = setInterval(getPosition, 5);
            // Animate
            anim.go({'style' : {'opacity' : 1}, 'duration' : 100});
            // Add mouseout event
            cm.addEvent(document, 'mouseover', bodyEvent);
        }
    };

    /* Main */

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