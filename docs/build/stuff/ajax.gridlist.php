<?php

$data = '{
  "count" : 15,
  "data" : [
    {"id" : "1", "name" : "123", "descr" : "Lorem ipsum dolor sit amet, consectetur adipiscing elit.", "url" : "https://google.com", "html" : "<a href=\"https://google.com\">123</a>"},
    {"id" : "2", "name" : "6564636536", "descr" : "Aliquam fringilla congue quam, sed porttitor lectus.", "url" : "https://yandex.ru", "html" : "<a href=\"https://google.com\">123</a>"},
    {"id" : "3", "name" : "566464", "descr" : "Suspendisse commodo suscipit vulputate.", "url" : "https://ya.ru", "html" : "<a href=\"https://ya.com\">234</a>"},
    {"id" : "4", "name" : "5", "descr" : "Vivamus rutrum pulvinar est, nec pharetra arcu dignissim in.", "url" : "https://bing.com", "html" : "<a href=\"https://facebook.com\">Abc</a>", "actions" : []},
    {"id" : "5", "name" : "8325", "descr" : "Maecenas eget ultrices ante.", "url" : "https://google.com", "html" : "<a href=\"https://vk.com\">FG</a>", "actions" : ["edit"]}
  ]
}';

sleep(1);

echo $data;