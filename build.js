// build.js - FINAL VERSION WITH ASSET COPYING

const esbuild = require('esbuild');
const fs = require('fs-extra');

const isWatchMode = process.argv.includes('--watch');

function build() {
    console.log('... Preparing dist folder and building assets');

    // 1. Ensure the 'dist' directory is clean and exists.
    fs.emptyDirSync('dist');

    // 2. Copy static HTML and CSS assets from 'src' to 'dist'.
    try {
        fs.copySync('src/ui/ui.html', 'dist/ui.html');
        fs.copySync('src/ui/core/styles', 'dist/styles');
        console.log('✅ Static HTML and CSS copied to dist/.');
    } catch (err) {
        console.error('❌ Error copying static assets:', err);
        process.exit(1);
    }

    // 3. Build the backend and frontend JavaScript bundles.
    esbuild.build({
        entryPoints: ['src/code.ts'],
        bundle: true,
        outfile: 'dist/code.js',
        platform: 'browser',
        target: 'es2017',
        watch: isWatchMode,
    }).catch(() => process.exit(1));

    esbuild.build({
        entryPoints: ['src/ui/core/app.js'],
        bundle: true,
        outfile: 'dist/ui-bundle.js',
        platform: 'browser',
        target: 'es2017',
        format: 'iife',
        watch: isWatchMode,
    }).catch(() => process.exit(1));

    if (isWatchMode) {
        console.log('👀 Watching for changes...');
    } else {
        console.log('✅ Build successful!');
    }
}

// Run the build process.
build();