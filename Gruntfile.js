module.exports = function(grunt) {
    // Custom config
    var config = {
        'less' : {
            'files' : [
                'src/less/variables/**/*.less',
                'src/less/variables.less',
                'src/less/mixins.less',
                'src/less/common.less',
                'src/less/common/Font.less',
                'src/less/common/Size.less',
                'src/less/common/Indent.less',
                'src/less/common/Colors.less',
                'src/less/common/Aspect.less',
                'src/less/common/Icons.less',
                'src/less/common/Tags.less',
                'src/less/common/Inputs.less',
                'src/less/common/Buttons.less',
                'src/less/common/List.less',
                'src/less/common/Form.less',
                'src/less/common/**/*.less',
                'src/less/parts/**/*.less',
                'src/less/layouts/**/*.less',
                'src/less/components/Tooltip.less',
                'src/less/components/**/*.less',
                '!src/less/index.less',
                '!src/less/components/old/**/*.less'
            ]
        }
    };
    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);
    // Display how match time it took to build each task
    require('time-grunt')(grunt);
    // Project configuration.
    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),

        clean: {
            build : [
                'build'
            ],
            docs : [
                'docs/build'
            ],
            post : [
                'temp'
            ]
        },

        bower : {
            install : {
                targetDir : './lib',
                cleanup : true,
                layout : 'byComponent',
                install : true
            }
        },

        less_imports: {
            source: {
                options: {
                    banner: '/* ************ MAGPIE UI ************ */'
                },
                src: config['less']['files'],
                dest: 'src/less/index.less'
            }
        },

        less : {
            build: {
                files: [{
                    src: ['src/less/index.less'],
                    dest: 'temp/build.css'
                }]
            },
            docs: {
                src: ['docs/src/less/index.less'],
                dest: 'temp/docs.css'
            }
        },

        concat: {
            build: {
                files: [{
                    src: [
                        'lib/**/*.js',
                        '!lib/codemirror',
                        'src/js/polyfill.js',
                        'src/js/common.js',
                        'src/js/modules.js',
                        'src/js/parts.js',
                        'src/js/init.js',
                        'src/js/components/Form.js',
                        'src/js/components/**/*.js',
                        '!src/js/components/dev/**/*.js',
                        '!src/js/components/old/**/*.js'
                    ],
                    dest: 'build/js/<%= pkg.name %>.js'
                },{
                    src: [
                        'lib/**/*.css',
                        '!lib/codemirror',
                        'src/css/**/*.css',
                        'temp/build.css'
                    ],
                    dest: 'build/css/<%= pkg.name %>.css'
                },{
                    src: [
                        'lib/**/*.css',
                        config['less']['files'],
                        'src/css/**/*.css'
                    ],
                    dest: 'build/less/<%= pkg.name %>.less'
                }]
            },
            docs: {
                files: [{
                    src: [
                        'lib/**/*.js',
                        'bower_components/codemirror/mode/javascript/javascript.js',
                        'bower_components/codemirror/mode/css/css.js',
                        'bower_components/codemirror/mode/xml/xml.js',
                        'bower_components/codemirror/mode/htmlmixed/htmlmixed.js',
                        'src/js/polyfill.js',
                        'src/js/common.js',
                        'src/js/modules.js',
                        'src/js/parts.js',
                        'src/js/init.js',
                        'src/js/components/Form.js',
                        'src/js/components/**/*.js',
                        '!src/js/components/dev/**/*.js',
                        '!src/js/components/old/**/*.js',
                        'docs/src/js/*.js',
                        'docs/src/js/components/**/*.js',
                        'docs/src/js/components.js'
                    ],
                    dest: 'docs/build/js/<%= pkg.name %>.js'
                },{
                    src: [
                        'lib/**/*.css',
                        'temp/docs.css',
                        'docs/src/css/**/*.css'
                    ],
                    dest: 'docs/build/css/<%= pkg.name %>.css'
                }]
            }
        },

        cssmin : {
            build : {
                files : {
                    'build/css/<%= pkg.name %>.min.css' : 'build/css/<%= pkg.name %>.css'
                }
            }
        },

        uglify : {
            build : {
                src : 'build/js/<%= pkg.name %>.js',
                dest : 'build/js/<%= pkg.name %>.min.js'
            }
        },

        imagemin: {
            build: {
                options: {
                    optimizationLevel: 3
                },
                files: [{
                    expand: true,
                    cwd: 'src/img/',
                    src: ['**/*.*'],
                    dest: 'build/img/'
                }]
            }
        },

        copy: {
            build: {
                files: [{
                    expand: true,
                    cwd: 'src/fonts/',
                    src: [
                        '**/*.*',
                        '!**/*.json'
                    ],
                    dest: 'build/fonts/'
                }]
            },
            docs: {
                files: [{
                    expand: true,
                    cwd: 'docs/src/',
                    src: ['*.*'],
                    dest: 'docs/build/'
                },{
                    expand: true,
                    cwd: 'docs/src/content/',
                    src: ['**/*.*'],
                    dest: 'docs/build/content/'
                },{
                    expand: true,
                    cwd: 'docs/src/stuff/',
                    src: ['**/*.*'],
                    dest: 'docs/build/stuff/'
                },{
                    expand: true,
                    cwd: 'docs/src/img/',
                    src: ['**/*.*'],
                    dest: 'docs/build/img/'
                },{
                    expand: true,
                    cwd: 'build/fonts/',
                    src: ['**/*.*'],
                    dest: 'docs/build/fonts/magpieui/'
                },{
                    expand: true,
                    cwd: 'build/img/',
                    src: ['**/*.*'],
                    dest: 'docs/build/img/magpieui'
                }]
            }
        },

        watch: {
            dev: {
                files: [
                    'src/js/**/*.js',
                    'src/css/**/*.css',
                    'src/less/**/*.less'
                ],
                tasks: ['dev'],
                options: {
                    spawn: false
                }
            },
            docs: {
                files: [
                    'src/js/**/*.js',
                    'src/css/**/*.css',
                    'src/less/**/*.less',
                    'docs/src/js/**/*.js',
                    'docs/src/css/**/*.css',
                    'docs/src/less/**/*.less',
                    'docs/src/content/**/*.*'
                ],
                tasks: ['docs'],
                options: {
                    spawn: false
                }
            }
        }
    });
    // Tasks
    grunt.registerTask('default', ['clean', 'bower', 'less_imports', 'less', 'concat', 'cssmin', 'uglify', 'imagemin', 'copy', 'clean:post']);
    grunt.registerTask('dev', ['less_imports', 'less:build', 'concat:build', 'clean:post']);
    grunt.registerTask('docs', ['less_imports', 'less:docs', 'concat:docs', 'copy:docs', 'clean:post']);
};