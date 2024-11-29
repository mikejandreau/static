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

// JavaScript paths - add or remove JS files as needed
const scriptSRC = [
                    "src/js/prism.js", 
                    "src/js/custom.js"
                ]; // Path to JS vendor and custom files in desired concat order.


// Clean the dist folder
function clean() {
    return del(['dist']);
}

// Compile and minify HTML files
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

// Compile SCSS files and minify CSS
function scssTask() {
    return src('src/scss/styles.scss', { sourcemaps: true })
        .pipe(sass())
        .pipe(postcss([cssnano()]))
        .pipe(dest('dist/assets', { sourcemaps: '.' }));
}

// Minify JavaScript files
function jsTask() {
    return src(scriptSRC, { sourcemaps: true }) // Target specific files in order
        .pipe(concat('scripts.js')) // Combine files into a single file named scripts.js
        .pipe(terser()) // Minify the combined file
        .pipe(dest('dist/assets', { sourcemaps: '.' })); // Output with sourcemaps
}

// Copy images to the dist/assets folder
function imgTask() {
    return src('src/img/**/*') // Adjust the source path as needed
        .pipe(dest('dist/assets/img')); // Copy to dist/assets/img
}

// Serve and watch files for changes
function browsersyncServe(cb) {
    browsersync.init({
        watch: true,
        server: {
            baseDir: 'dist'
        }    
    });
    cb();
}

// Reload BrowserSync
function browsersyncReload(cb) {
    browsersync.reload();
    cb();
}

// Watch for file changes
function watchFiles() {
    watch('src/html/**/*', series(html, browsersyncReload)); // Ensure HTML is re-minified
    watch(['src/scss/**/*.scss', 'src/js/**/*.js'], series(scssTask, jsTask, browsersyncReload));
    watch('src/img/**/*', series(imgTask, browsersyncReload)); // Watch for image changes
}

// Build the project
exports.build = series(clean, scssTask, jsTask, html, imgTask);
exports.default = series(clean, scssTask, jsTask, html, imgTask, browsersyncServe, watchFiles);
