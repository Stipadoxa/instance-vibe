// test-build.js
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

async function testBuild() {
  console.log('🧪 Testing AIDesigner modular build...');
  
  try {
    // Check if source files exist
    const requiredFiles = [
      'code.ts',
      'src/core/session-manager.ts',
      'src/core/component-scanner.ts',
      'src/core/figma-renderer.ts',
      'src/core/validation-engine.ts',
      'src/ai/gemini-api.ts'
    ];
    
    console.log('📁 Checking source files...');
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
      console.error('❌ Missing source files:', missingFiles);
      return false;
    }
    console.log('✅ All source files found');
    
    // Test TypeScript compilation
    console.log('🔨 Testing TypeScript compilation...');
    const buildResult = await esbuild.build({
      entryPoints: ['code.ts'],
      bundle: true,
      outfile: 'code.test.js',
      platform: 'browser',
      target: 'es2017',
      write: true,
      logLevel: 'info',
      format: 'iife'
    });
    
    if (buildResult.errors.length > 0) {
      console.error('❌ TypeScript compilation errors:', buildResult.errors);
      return false;
    }
    
    console.log('✅ TypeScript compilation successful');
    
    // Check output file
    if (fs.existsSync('code.test.js')) {
      const fileSize = fs.statSync('code.test.js').size;
      console.log(`📊 Bundle size: ${Math.round(fileSize / 1024)}KB`);
      
      // Read and analyze bundle
      const bundleContent = fs.readFileSync('code.test.js', 'utf8');
      
      // Check for key modules
      const requiredClasses = [
        'SessionManager',
        'ComponentScanner', 
        'FigmaRenderer',
        'GeminiAPI',
        'ValidationEngine'
      ];
      
      const foundClasses = requiredClasses.filter(cls => bundleContent.includes(cls));
      const missingClasses = requiredClasses.filter(cls => !bundleContent.includes(cls));
      
      console.log('✅ Found classes:', foundClasses);
      if (missingClasses.length > 0) {
        console.error('❌ Missing classes:', missingClasses);
        return false;
      }
      
      // Clean up test file
      fs.unlinkSync('code.test.js');
      
      console.log('🎉 Integration test PASSED!');
      console.log('✅ All modules are properly integrated');
      return true;
      
    } else {
      console.error('❌ Build output file not created');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Run the test
testBuild().then(success => {
  console.log(success ? '\n🚀 Ready to build!' : '\n🔧 Fix issues above before building');
  process.exit(success ? 0 : 1);
});