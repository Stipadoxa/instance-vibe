// build.js - Updated to build both backend and frontend

const esbuild = require('esbuild');

const isWatchMode = process.argv.includes('--watch');

async function buildBackend() {
    console.log('🔨 Building backend (TypeScript)...');
    
    const backendContext = await esbuild.context({
        entryPoints: ['code.ts'],
        bundle: true,
        outfile: 'code.js',
        platform: 'browser',
        target: 'es2017',
    });
    
    return backendContext;
}

async function buildFrontend() {
    console.log('🎨 Building frontend (UI modules)...');
    
    const frontendContext = await esbuild.context({
        entryPoints: ['ui-main.js'],
        bundle: true,
        outfile: 'ui-bundle.js',
        platform: 'browser',
        target: 'es2017',
        format: 'iife', // Immediately Invoked Function Expression for global scope
        globalName: 'AIDesignerUI', // Optional global variable name
    });
    
    return frontendContext;
}

async function main() {
    try {
        // Build both backend and frontend
        const [backendContext, frontendContext] = await Promise.all([
            buildBackend(),
            buildFrontend()
        ]);

        if (isWatchMode) {
            console.log('👀 Watching for changes...');
            await Promise.all([
                backendContext.watch(),
                frontendContext.watch()
            ]);
            console.log('✅ Watch mode active for both backend and frontend');
        } else {
            console.log('Building...');
            await Promise.all([
                backendContext.rebuild(),
                frontendContext.rebuild()
            ]);
            
            // Clean up contexts
            await Promise.all([
                backendContext.dispose(),
                frontendContext.dispose()
            ]);
            
            console.log('✅ Build successful!');
            console.log('   📁 Backend: code.js');
            console.log('   📁 Frontend: ui-bundle.js');
        }
    } catch (error) {
        console.error('❌ Build failed:', error);
        process.exit(1);
    }
}

main();