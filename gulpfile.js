const { src, dest, series, watch } = require('gulp');
const del = require('del');
const njk = require('gulp-nunjucks-render');
const beautify = require('gulp-beautify');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const cssnano = require('cssnano');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const rename = require('gulp-rename'); 
const browsersync = require('browser-sync').create();
const siteConfig = require('./siteConfig.json'); // Load the JSON configuration file


function clean() {
    return del(['dist']);
}

function html() {
    return src('src/html/pages/*.+(html|njk)')
        .pipe(
            njk({
                path: ['src/html'],
                data: { siteConfig } // Pass the JSON data to Nunjucks
            })
        )
        .pipe(beautify.html({ indent_size: 4, preserve_newlines: false }))
        .pipe(rename(function (path) {
            // Check if the file is not the main index or 404 page
            if (path.basename !== 'index' && path.basename !== '404') {
                path.dirname = path.basename; // Move each file into a folder named after the file
                path.basename = 'index';      // Rename each file to index.html
            }
            path.extname = '.html';
        }))
        .pipe(dest('dist'));
}


function scssTask() {
    return src('src/scss/styles.scss', { sourcemaps: true })
        .pipe(sass())
        .pipe(postcss([cssnano()]))
        .pipe(dest('dist/assets', { sourcemaps: '.' }));
}


function jsTask() {
    return src([
        'src/js/prism.js', 
        'src/js/custom.js'
        ], { sourcemaps: true }) // Target specific files in order
        .pipe(concat('scripts.js')) // Combine files into a single file named scripts.js
        .pipe(terser()) // Minify the combined file
        .pipe(dest('dist/assets', { sourcemaps: '.' })); // Output with sourcemaps
}

exports.jsTask = jsTask;



function browsersyncServe(cb) {
    browsersync.init({
        watch: true,
        server: {
            baseDir: 'dist'
        }
    });
    cb();
}

function browsersyncReload(cb) {
    browsersync.reload();
    cb();
}

function watchFiles() {
    watch('src/html/**/*', html, browsersyncReload);
    watch(['src/scss/**/*.scss', 'src/js/**/*.js'], series(scssTask, jsTask, browsersyncReload));
}

exports.build = series(clean, scssTask, jsTask, html);
exports.default = series(clean, scssTask, jsTask, html, browsersyncServe, watchFiles);
