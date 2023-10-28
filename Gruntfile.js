module.exports = function(grunt) {
    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);
    // Display how match time it took to build each task
    require('@lodder/time-grunt')(grunt);
    // Project configuration.
    grunt.initConfig({
        pkg : grunt.file.readJSON('package.json'),
        banner : '/*! ************ <%= pkg.name %> v<%= pkg.version %> (<%= grunt.template.today("yyyy-mm-dd HH:MM") %>) ************ */\n',

        paths : {
            modules : 'node_modules',
            src : 'src',
            build : 'build',
            docs : 'docs',
            temp : 'temp'
        },

        components : {
            less : {
                path : '<%= paths.modules %>/less',
                dist : '<%= components.less.path %>/dist',
                scripts : [
                    '<%= components.less.dist %>/less.js'
                ]
            },
            animatecss : {
                path : '<%= paths.modules %>/animate.css',
                styles : [
                    '<%= components.animatecss.path %>/animate.css'
                ]
            },
            codemirror : {
                path : '<%= paths.modules %>/codemirror',
                dist : '<%= components.codemirror.path %>',
                scripts : [
                    '<%= components.codemirror.dist %>/lib/codemirror.js',
                    '<%= components.codemirror.dist %>/mode/clike/clike.js',
                    '<%= components.codemirror.dist %>/mode/htmlmixed/htmlmixed.js',
                    '<%= components.codemirror.dist %>/mode/javascript/javascript.js',
                    '<%= components.codemirror.dist %>/mode/css/css.js',
                    '<%= components.codemirror.dist %>/mode/xml/xml.js',
                    '<%= components.codemirror.dist %>/mode/php/php.js',
                ],
                styles : [
                    '<%= components.codemirror.dist %>/lib/codemirror.css'
                ]
            },
            tinycolor : {
                path : '<%= paths.modules %>/tinycolor2',
                scripts : [
                    '<%= components.tinycolor.path %>/tinycolor.js'
                ]
            }
        },

        clean : {
            scripts : [
                '<%= paths.build %>/js/*',
                '<%= paths.docs %>/build/js/*'
            ],
            styles : [
                '<%= paths.build %>/less/*',
                '<%= paths.build %>/css/*',
                '<%= paths.docs %>/build/less/*',
                '<%= paths.docs %>/build/css/*'
            ],
            images : [
                '<%= paths.build %>/img/*',
                '<%= paths.docs %>/build/img/*'
            ],
            fonts : [
                '<%= paths.build %>/fonts/*',
                '<%= paths.docs %>/build/fonts/*'
            ],
            stuff : [
                '<%= paths.docs %>/build/content/*',
                '<%= paths.docs %>/build/stuff/*'
            ],
            libs : [
                '<%= paths.build %>/libs/*',
                '<%= paths.docs %>/build/libs/*'
            ],
            temp : [
                '<%= paths.temp %>'
            ]
        },

        concat : {
            scripts : {
                options: {
                    banner: '<%= banner %>'
                },
                src : [
                    '<%= components.tinycolor.scripts %>',
                    '<%= paths.src %>/js/polyfill.js',
                    '<%= paths.src %>/js/common.js',
                    '<%= paths.src %>/js/modules.js',
                    '<%= paths.src %>/js/parts.js',
                    '<%= paths.src %>/js/init.js',
                    '<%= paths.src %>/js/helpers/**/*.js',
                    '<%= paths.src %>/js/abstracts/AbstractController.js',
                    '<%= paths.src %>/js/abstracts/AbstractContainer.js',
                    '<%= paths.src %>/js/abstracts/AbstractInput.js',
                    '<%= paths.src %>/js/abstracts/AbstractFileManager.js',
                    '<%= paths.src %>/js/abstracts/AbstractFileManagerContainer.js',
                    '<%= paths.src %>/js/abstracts/**/*.js',
                    '<%= paths.src %>/js/components/Form.js',
                    '<%= paths.src %>/js/components/TabsetHelper.js',
                    '<%= paths.src %>/js/components/ScrollPagination.js',
                    '<%= paths.src %>/js/components/**/*.js',
                    '<%= paths.src %>/js/fields/MultipleInput.js',
                    '<%= paths.src %>/js/fields/BoxTools.js',
                    '<%= paths.src %>/js/fields/**/*.js',
                    '!<%= paths.src %>/js/components/dev/**/*.js',
                    '!<%= paths.src %>/js/components/old/**/*.js'
                ],
                dest : '<%= paths.build %>/js/<%= pkg.name %>.js'
            },
            scripts_docs : {
                src : [
                    '<%= paths.build %>/js/<%= pkg.name %>.js',
                    '<%= paths.docs %>/build/js/<%= pkg.name %>.variables.js',
                    '<%= paths.docs %>/src/js/common.js',
                    '<%= paths.docs %>/src/js/components/**/*.js',
                    '<%= paths.docs %>/src/js/components.js'
                ],
                dest : '<%= paths.docs %>/build/js/<%= pkg.name %>.js'
            },
            codemirror : {
                src : [
                    '<%= components.codemirror.scripts %>'
                ],
                dest : '<%= paths.build %>/libs/codemirror_comp/codemirror.js'
            },
            styles : {
                options: {
                    banner: '<%= banner %>'
                },
                src : [
                    '<%= components.animatecss.styles %>',
                    '<%= components.codemirror.styles %>',
                    '<%= paths.src %>/less/helpers/**/*.less',
                    '<%= paths.src %>/less/extra/*.less',
                    '<%= paths.src %>/less/variables/*.less',
                    '<%= paths.src %>/less/mixins.less',
                    '<%= paths.src %>/less/common.less',
                    '<%= paths.src %>/less/common/Font.less',
                    '<%= paths.src %>/less/common/Size.less',
                    '<%= paths.src %>/less/common/Indent.less',
                    '<%= paths.src %>/less/common/Colors.less',
                    '<%= paths.src %>/less/common/Aspect.less',
                    '<%= paths.src %>/less/common/Icons.less',
                    '<%= paths.src %>/less/common/Tags.less',
                    '<%= paths.src %>/less/common/Inputs.less',
                    '<%= paths.src %>/less/common/Buttons.less',
                    '<%= paths.src %>/less/common/List.less',
                    '<%= paths.src %>/less/common/Form.less',
                    '<%= paths.src %>/less/common/**/*.less',
                    '<%= paths.src %>/less/parts/**/*.less',
                    '<%= paths.src %>/less/layouts/**/*.less',
                    '<%= paths.src %>/less/components/Input.less',
                    '<%= paths.src %>/less/components/ToggleBox.less',
                    '<%= paths.src %>/less/components/Tooltip.less',
                    '<%= paths.src %>/less/components/**/*.less'
                ],
                dest : '<%= paths.build %>/less/<%= pkg.name %>.less'
            },
            styles_docs : {
                src : [
                    '<%= paths.build %>/less/<%= pkg.name %>.less',
                    '<%= paths.docs %>/src/less/variables/*.less',
                    '<%= paths.docs %>/src/less/common.less'
                ],
                dest : '<%= paths.docs %>/build/less/<%= pkg.name %>.less'
            },
            variables : {
                src : [
                    '<%= paths.src %>/less/variables/**/*.less'
                ],
                dest : '<%= paths.build %>/less/<%= pkg.name %>.variables.less'
            },
            variables_docs : {
                src : [
                    '<%= paths.build %>/less/<%= pkg.name %>.variables.less',
                    '<%= paths.docs %>/src/less/variables/*.less'
                ],
                dest : '<%= paths.docs %>/build/less/<%= pkg.name %>.variables.less'
            }
        },

        jshint : {
            src : {
                options: {
                    '-W002' : false,
                    '-W069' : false
                },
                src :[
                    '<%= paths.src %>/js/common.js',
                    '<%= paths.src %>/js/modules.js',
                    '<%= paths.src %>/js/parts.js',
                    '<%= paths.src %>/js/init.js',
                    '<%= paths.src %>/js/components/AbstractInput.js',
                    '<%= paths.src %>/js/components/AbstractRange.js',
                    '<%= paths.src %>/js/components/Form.js',
                    '<%= paths.src %>/js/components/BoxTools.js',
                    '<%= paths.src %>/js/components/**/*.js'
                ]
            }
        },

        svgcss : {
            build : {
                options : {
                    previewhtml : null,
                    cssprefix : 'svg__',
                    csstemplate : '<%= paths.src %>/hbs/svg.hbs'
                },
                src : ['<%= paths.src %>/img/svg/*.svg'],
                dest : '<%= paths.src %>/less/extra/svg.less'
            }
        },

        lessvars: {
            options: {
                units : true,
                format : function(vars){
                    return 'window.LESS = ' + JSON.stringify(vars) + ';';
                }
            },
            build : {
                src : ['<%= paths.build %>/less/<%= pkg.name %>.variables.less'],
                dest : '<%= paths.build %>/js/<%= pkg.name %>.variables.js'
            },
            docs : {
                src : ['<%= paths.docs %>/build/less/<%= pkg.name %>.variables.less'],
                dest : '<%= paths.docs %>/build/js/<%= pkg.name %>.variables.js'
            }
        },

        less : {
            options: {
                strictMath: false,
                strictUnits: false
            },
            build : {
                src : ['<%= paths.build %>/less/<%= pkg.name %>.less'],
                dest : '<%= paths.build %>/css/<%= pkg.name %>.css'
            },
            docs : {
                src : ['<%= paths.docs %>/build/less/<%= pkg.name %>.less'],
                dest : '<%= paths.docs %>/build/css/<%= pkg.name %>.css'
            }
        },

        replace: {
            options: {
                patterns: [
                    {
                        match: 'VERSION',
                        replacement: '<%= pkg.version %>'
                    }
                ]
            },
            scripts: {
                src: ['<%= paths.build %>/js/<%= pkg.name %>.js'],
                dest: '<%= paths.build %>/js/<%= pkg.name %>.js'
            },
            scripts_docs: {
                src: ['<%= paths.docs %>/build/js/<%= pkg.name %>.js'],
                dest: '<%= paths.docs %>/build/js/<%= pkg.name %>.js'
            },
            styles: {
                src: ['<%= paths.build %>/less/<%= pkg.name %>.less'],
                dest: '<%= paths.build %>/less/<%= pkg.name %>.less'
            },
            styles_docs: {
                src: ['<%= paths.docs %>/build/less/<%= pkg.name %>.less'],
                dest: '<%= paths.docs %>/build/less/<%= pkg.name %>.less'
            },
            variables: {
                src: ['<%= paths.build %>/less/<%= pkg.name %>.variables.less'],
                dest: '<%= paths.build %>/less/<%= pkg.name %>.variables.less'
            },
            variables_docs: {
                src: ['<%= paths.docs %>/build/less/<%= pkg.name %>.variables.less'],
                dest: '<%= paths.docs %>/build/less/<%= pkg.name %>.variables.less'
            }
        },

        uglify : {
            build : {
                src : ['<%= paths.build %>/js/<%= pkg.name %>.js'],
                dest : '<%= paths.build %>/js/<%= pkg.name %>.min.js'
            },
            codemirror : {
                src : ['<%= paths.build %>/libs/codemirror_comp/codemirror.js'],
                dest : '<%= paths.build %>/libs/codemirror_comp/codemirror.min.js'
            }
        },

        cssmin : {
            build : {
                src : ['<%= paths.build %>/css/<%= pkg.name %>.css'],
                dest : '<%= paths.build %>/css/<%= pkg.name %>.min.css'
            }
        },

        imagemin : {
            build : {
                options: {
                    optimizationLevel: 3
                },
                files : [{
                    expand : true,
                    cwd : '<%= paths.build %>/img/',
                    src : [
                        '**/*.*',
                        '!animated/**/*.*'
                    ],
                    dest : '<%= paths.temp %>/img/'
                }]
            }
        },

        copy : {
            images : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.src %>/img/',
                    src : ['**/*.*'],
                    dest : '<%= paths.build %>/img/'
                }]
            },
            images_docs : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.build %>/img/',
                    src : ['**/*.*'],
                    dest : '<%= paths.docs %>/build/img/<%= pkg.name %>/'
                }]
            },
            images_docs_self : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.docs %>/src/img/',
                    src : ['**/*.*'],
                    dest : '<%= paths.docs %>/build/img/'
                }]
            },
            images_optimize : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.temp %>/img/',
                    src : ['**/*.*'],
                    dest : '<%= paths.build %>/img/'
                }]
            },
            fonts : {
                files: [{
                    expand : true,
                    cwd : '<%= paths.src %>/fonts/',
                    src : ['**/*.*', '!**/*.json'],
                    dest : '<%= paths.build %>/fonts/'
                }]
            },
            fonts_docs : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.build %>/fonts/',
                    src : ['**/*.*'],
                    dest : '<%= paths.docs %>/build/fonts/<%= pkg.name %>/'
                }]
            },
            fonts_docs_self : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.docs %>/src/fonts/',
                    src : ['**/*.*'],
                    dest : '<%= paths.docs %>/build/fonts/'
                }]
            },
            libs : {
                files : [{
                    expand : true,
                    cwd : '<%= components.less.dist %>',
                    src : ['**/*.*'],
                    dest : '<%= paths.build %>/libs/less/'
                },{
                    expand : true,
                    cwd : '<%= components.codemirror.dist %>',
                    src : ['**/*.*'],
                    dest : '<%= paths.build %>/libs/codemirror/'
                }]
            },
            libs_docs : {
                files : [{
                    expand : true,
                    cwd : '<%= paths.build %>/libs/',
                    src : ['**/*.*'],
                    dest : '<%= paths.docs %>/build/libs/'
                }]
            },
            stuff_docs : {
                files : [{
                    expand: true,
                    cwd: '<%= paths.docs %>/src/',
                    src: ['*.*'],
                    dest: '<%= paths.docs %>/build/'
                },{
                    expand: true,
                    cwd: '<%= paths.docs %>/src/content/',
                    src: ['**/*.*'],
                    dest: '<%= paths.docs %>/build/content/'
                },{
                    expand: true,
                    cwd: '<%= paths.docs %>/src/stuff/',
                    src: ['**/*.*'],
                    dest: '<%= paths.docs %>/build/stuff/'
                }]
            }
        },

        watch : {
            scripts : {
                files : [
                    '<%= paths.src %>/js/**/*.js',
                    '<%= paths.docs %>/src/js/**/*.js'
                ],
                tasks : ['scripts']
            },
            styles : {
                files : [
                    '<%= paths.src %>/less/**/*.less',
                    '<%= paths.docs %>/src/less/**/*.less'
                ],
                tasks : ['styles']
            },
            images : {
                files : [
                    '<%= paths.src %>/img/**/*.*',
                    '<%= paths.docs %>/src/img/**/*.*'
                ],
                tasks : ['images']
            },
            fonts : {
                files : [
                    '<%= paths.src %>/fonts/**/*.*',
                    '!<%= paths.src %>/fonts/**/*.json',
                    '<%= paths.docs %>/src/fonts/**/*.*',
                    '!<%= paths.docs %>/src/fonts/**/*.json'
                ],
                tasks : ['fonts']
            },
            stuff : {
                files : [
                    '<%= paths.docs %>/src/*.*',
                    '<%= paths.docs %>/src/content/**/*.*',
                    '<%= paths.docs %>/src/stuff/**/*.*'
                ],
                tasks : ['stuff']
            }
        }
    });
    // Custom Tasks
    grunt.registerTask('default', ['clean', 'pre', 'scripts', 'images', 'styles', 'fonts', 'libs', 'stuff']);
    grunt.registerTask('optimize', ['clean:temp', 'default', 'uglify:build', 'cssmin', 'imagemin', 'copy:images_optimize', 'clean:temp']);
    grunt.registerTask('watcher', ['watch']);

    grunt.registerTask('scripts', ['concat:scripts', 'replace:scripts', 'concat:scripts_docs']);
    grunt.registerTask('images', ['svgcss:build', 'copy:images', 'copy:images_docs', 'copy:images_docs_self']);
    grunt.registerTask('styles', ['variables', 'concat:styles', 'replace:styles', 'concat:styles_docs', 'less:build', 'less:docs']);
    grunt.registerTask('fonts', ['copy:fonts', 'copy:fonts_docs', 'copy:fonts_docs_self']);
    grunt.registerTask('stuff', ['copy:stuff_docs']);
    grunt.registerTask('libs', ['concat:codemirror', 'uglify:codemirror', 'copy:libs', 'copy:libs_docs']);
    grunt.registerTask('variables', ['concat:variables', 'replace:variables', 'concat:variables_docs', 'lessvars']);
    grunt.registerTask('pre', ['svgcss:build', 'variables']);
};
