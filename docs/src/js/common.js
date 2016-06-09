if(cm._baseUrl.indexOf('serdidg.github.io/MagpieUI/') > -1){
    cm._baseUrl = [cm._baseUrl, '/MagpieUI/docs/build'].join('/');
}else{
    cm._baseUrl = [cm._baseUrl, 'docs/build'].join('/');
}