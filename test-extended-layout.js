// test-extended-layout.js
// Test file for extended auto-layout support
// This would be used within a Figma plugin environment

const testExtendedLayoutSupport = () => {
  console.log('🧪 Testing Extended Auto-Layout Support');
  
  // Test data with all new properties
  const testData = {
    layoutContainer: {
      name: "Extended Layout Test Container",
      layoutMode: "HORIZONTAL",
      
      // NEW: Layout wrap support
      layoutWrap: "WRAP",
      
      // NEW: Enhanced alignment
      primaryAxisAlignItems: "SPACE_BETWEEN",
      counterAxisAlignItems: "CENTER", 
      
      // NEW: Sizing modes
      primaryAxisSizingMode: "AUTO",
      counterAxisSizingMode: "FIXED",
      
      // NEW: AUTO spacing
      itemSpacing: "AUTO",
      
      // NEW: Size constraints
      minWidth: 200,
      maxWidth: 800,
      minHeight: 100,
      maxHeight: 400,
      
      // Standard properties
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 24,
      paddingRight: 24
    },
    items: [
      {
        type: "native-text",
        text: "Flexible Text Item",
        properties: {
          // NEW: Child layout properties
          layoutAlign: "STRETCH",
          layoutGrow: 1,
          layoutPositioning: "AUTO",
          minWidth: 100,
          maxWidth: 300
        }
      },
      {
        type: "native-rectangle",
        width: 60,
        height: 60,
        fill: { r: 0.2, g: 0.6, b: 1.0 },
        properties: {
          // NEW: Child layout properties
          layoutAlign: "CENTER",
          layoutPositioning: "AUTO",
          layoutGrow: 0
        }
      },
      {
        type: "native-text", 
        text: "Fixed Width Item",
        properties: {
          // NEW: Child layout properties
          layoutAlign: "MIN",
          layoutPositioning: "AUTO",
          maxWidth: 150,
          minWidth: 80
        }
      }
    ]
  };
  
  console.log('✅ Test data structure created');
  console.log('📊 Container properties:', Object.keys(testData.layoutContainer));
  console.log('📊 Child properties:', testData.items.map(item => Object.keys(item.properties || {})));
  
  // Property validation
  const containerProps = testData.layoutContainer;
  const requiredNewProps = [
    'layoutWrap', 'primaryAxisAlignItems', 'counterAxisAlignItems',
    'primaryAxisSizingMode', 'counterAxisSizingMode', 'itemSpacing',
    'minWidth', 'maxWidth', 'minHeight', 'maxHeight'
  ];
  
  const foundProps = requiredNewProps.filter(prop => containerProps[prop] !== undefined);
  console.log('✅ Found container properties:', foundProps);
  
  const childProps = testData.items.flatMap(item => Object.keys(item.properties || {}));
  const requiredChildProps = ['layoutAlign', 'layoutGrow', 'layoutPositioning'];
  const foundChildProps = requiredChildProps.filter(prop => childProps.includes(prop));
  console.log('✅ Found child properties:', foundChildProps);
  
  // Usage instructions
  console.log('\n📖 Usage in Figma plugin:');
  console.log('// In your Figma plugin code:');
  console.log('await FigmaRenderer.generateUIFromData(testData, figma.currentPage);');
  
  console.log('\n🔧 Manual testing steps:');
  console.log('1. Copy this test data into your Figma plugin');
  console.log('2. Call FigmaRenderer.generateUIFromData() with the test data');
  console.log('3. Verify the generated frame has:');
  console.log('   - Wrap layout enabled');
  console.log('   - Space-between primary axis alignment');
  console.log('   - Center counter axis alignment');
  console.log('   - AUTO item spacing');
  console.log('   - Size constraints applied');
  console.log('4. Verify child items have:');
  console.log('   - Proper layout alignment');
  console.log('   - Grow behavior');
  console.log('   - Size constraints');
  
  return testData;
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testExtendedLayoutSupport };
} else {
  // Browser/Figma environment
  window.testExtendedLayoutSupport = testExtendedLayoutSupport;
}

// Run test
testExtendedLayoutSupport();