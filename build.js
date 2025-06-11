// build.js

const esbuild = require('esbuild');

const isWatchMode = process.argv.includes('--watch');

// Створюємо контекст для esbuild
esbuild.context({
  entryPoints: ['code.ts'],
  bundle: true,
  outfile: 'code.js',
  platform: 'browser',
  target: 'es2017',
}).then(context => {
  if (isWatchMode) {
    // Якщо режим спостереження, запускаємо watch() з контексту
    console.log('👀 Watching for changes...');
    context.watch();
  } else {
    // Якщо це одноразове збирання, запускаємо build() і виходимо
    console.log('Building...');
    context.rebuild().then(() => {
        console.log('✅ Build successful!');
        context.dispose(); // Звільняємо ресурси
    });
  }
}).catch((e) => {
  console.error('❌ Build failed:', e);
  process.exit(1);
});