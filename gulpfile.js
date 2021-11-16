let project_folder = 'dist',
// let project_folder = require("path").basename(__dirname),
    source_folder = 'dev'

let path = {
    build: {
        html: project_folder + '/',
        css: project_folder + '/css/',
        js: project_folder + '/js/',
        images: project_folder + '/images/',
        video: project_folder + '/video/',
        fonts: project_folder + '/fonts/',
    },
    src: {
        html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
        scss: source_folder + '/scss/style.scss',
        allCSS: source_folder + '/css/*.css',
        allJS: source_folder + '/css/*.js',
        js: source_folder + '/js/main.js',
        images: source_folder + '/images/**/*.*',
        // images: source_folder + '/images/**/*.{jpg, jpeg, png, svg, gif, ico, webp}',
        video: source_folder + '/video/**/*.*',
        fonts: source_folder + '/fonts/**/*.ttf',
    },
    watch: {
        html: source_folder + '/**/*.html',
        css: source_folder + '/scss/**/*.scss',
        allCSS: source_folder + '/css/*.css',
        allJS: source_folder + '/css/*.js',
        js: source_folder + '/js/**/*.js',
        images: source_folder + '/images/**/*.{jpg, jpeg, png, svg, gif, ico, webp}',
        video: source_folder + '/video/**/*.*',
    },
    clean: './' + project_folder + '/'
}

const {src, dest, watch, parallel, series, task} = require('gulp'),
    browsersync = require('browser-sync').create(),
    fileinclude = require("gulp-file-include"),
    del = require('del'),
    scss = require('gulp-sass')(require('sass')),
    sourcemaps = require('gulp-sourcemaps'),
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename_file = require("gulp-rename"),
    uglify = require('gulp-uglify-es').default,
    imagemin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webphtml = require('gulp-webp-html'),
    webpcss = require('gulp-webp-css'),
    svgSprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'),
    fs = require('fs');

function browserSync() {
    browsersync.init({
        server: {
            baseDir: './' + project_folder + '/',
        },
        port: 3008,
        notify: false
    });
}

function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(webphtml())
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.scss)
        .pipe(sourcemaps.init())
        .pipe(
            scss(
                {
                    errorLogToConsole: true,
                    outputStyle: 'expanded'
                }
            ).on('error', scss.logError))
        .pipe(
            group_media()
        )
        .pipe(autoprefixer({
            overrideBrowserslist: ['last 5 version'],
            grid: true
        }))
        .pipe(webpcss())
        .pipe(dest(path.build.css))
        .pipe(clean_css())
        .pipe(rename_file({
            extname: ".min.css"
        }))
        .pipe(sourcemaps.write())
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function allCss() {
    return src(path.src.allCSS)
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(
            rename_file({
                extname: ".min.js"
            })
        )
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function allJs() {
    return src(path.src.allJS)
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function video() {
    return src(path.src.video)
        .pipe(dest(path.build.video))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.images)
        .pipe(
            webp({
                quality: 70
            })
        )
        .pipe(dest(path.build.images))
        .pipe(src(path.src.images))
        .pipe(
            imagemin({
                interlaced: true,
                progressive: true,
                optimizationLevel: 2, //0 to 7
                svgoPlugins: [
                    {
                        removeViewBox: false
                    }
                ]
            })
        )
        .pipe(dest(path.build.images))
        .pipe(browsersync.stream())
}

task('svgSprite', function () {
    return src([source_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: "../icons/icons.svg", //sprite file name
                    example: true
                }
            }
        }))
        .pipe(dest(path.build.images))
})

task('otf2ttf', function () {
    return src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'));
})

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts));
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts));
}

function fontsStyle(params) {

    let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss');
    if (file_content === '') {
        fs.writeFile(source_folder + '/scss/fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                alert(c_fontname)
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname !== fontname) {
                        fs.appendFile(source_folder + '/scss/fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {
}

function watchFiles(params) {
    watch([path.watch.html], html)
    watch([path.watch.css], css)
    watch([path.watch.allCSS], allCss)
    watch([path.watch.js], js)
    // watch([path.watch.allJS], allJs)
    watch([path.watch.images], images)
    watch([path.watch.video], video)
}

function clean(params) {
    return del(path.clean)
}


let build = series(clean, parallel(js, css, allCss, html, images, video, fonts), fontsStyle);
let watchers = parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.html = html;
exports.css = css;
exports.allCSS = allCss;
exports.js = js;
// exports.allJS = allJs;
exports.images = images;
exports.video = video;
exports.fonts = fonts;
exports.build = build;
exports.watch = watchers;
exports.default = watchers;