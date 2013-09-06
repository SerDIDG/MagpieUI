var Timer = function(container, expires, handler){
    var current,
        diff,
        inter,
        num,
        num2,
        num3,
        h,
        m,
        s;
    if(typeof expires == 'string'){
        num = expires.split(' ');
        num2 = num[0].split('-');
        num3 = num[1].split(':');
        expires = new Date(num2[0], parseInt(num2[1]-1), num2[2], num3[0], num3[1]);
    }
    if(typeof container == 'string'){
        container = document.getElementById(container);
    }
    inter = setInterval(function(){
        current = new Date();
        diff = expires - current;
        if(diff <= 1){
            clearInterval(inter);
            container.innerHTML = ['0','0','0'].join(':');
            handler();
        }else{
            h = Math.floor(diff / 1000 / 60 / 60);
            m = Math.floor((diff / 1000 / 60) - (h * 60));
            s = Math.floor((diff / 1000) - (h * 60 * 60) - (m * 60));
            
            container.innerHTML = [h,m,s].join(':');
        }
    },500);
};

var expires = new Date();
expires.setMinutes(expires.getMinutes() + 1);
new Timer('timer1', expires, function(){
    alert('WOW');
});

new Timer('timer2', '2012-09-29 00:00', function(){
    alert('WOW');
});