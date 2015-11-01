MagpieUI
=======

Collection of JavaScript and CSS snippets to fast build UI.

Attention! Newer versions of MagpieUI library may not be compatible with the previous ones!

Developed with PhpStorm.

## Install

Install throw Bower:
```sh
bower install magpieui
```

## Custom build

First install Node.js and update npm:
```sh
sudo npm install npm -g
```
Install global  modules:
```sh
sudo npm install -g grunt-cli
sudo npm install -g bower
```
Install dependency modules:
```sh
cd patch_to/magpieui
sudo npm install
```
then run grunt task to execute full build:
```sh
grunt
```
or start watcher task to track file changes:
```sh
grunt watch
```