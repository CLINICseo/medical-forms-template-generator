const fs = require('fs');
const path = require('path');

async function testFixedBlobStorage() {
  try {
    console.log('🧪 Testing FIXED Blob Storage Implementation...');
    
    const pdfPath = path.join(__dirname, 'docs', 'pdfs', 'informe-medico-Inbursa.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.error('❌ PDF file not found:', pdfPath);
      return;
    }
    
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(pdfPath);
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    formData.append('document', blob, 'informe-medico-Inbursa.pdf');
    
    console.log('📤 Step 1: Uploading PDF with FIXED upload logic...');
    const uploadResponse = await fetch('http://localhost:7076/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}\n${errorText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const documentId = uploadResult.data.documentId;
    console.log('✅ Upload successful, document ID:', documentId);
    
    // Wait a moment for blob to be properly stored
    console.log('⏳ Waiting 3 seconds for blob storage to sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('🔍 Step 2: Analyzing document with FIXED retrieval logic...');
    const analysisResponse = await fetch(`http://localhost:7076/api/analyze/${documentId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      throw new Error(`Analysis failed: ${analysisResponse.status} ${analysisResponse.statusText}\n${errorText}`);
    }
    
    const analysisResult = await analysisResponse.json();
    
    console.log('\n📊 FIXED BLOB STORAGE TEST RESULTS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔧 Model used: ${analysisResult.data.modelUsed}`);
    console.log(`📄 Total fields detected: ${analysisResult.data.detectedFields.length}`);
    console.log(`🎯 Overall confidence: ${Math.round(analysisResult.data.confidence * 100)}%`);
    console.log(`⚡ Processing time: ${analysisResult.data.processingTime}s`);
    console.log(`🏥 Insurer detected: ${analysisResult.data.insurerDetected}`);
    console.log(`📋 Form type: ${analysisResult.data.formType}`);
    
    if (analysisResult.data.revolutionMetrics) {
      console.log('\n📈 Revolution Metrics:');
      console.log(`  📋 Tables detected: ${analysisResult.data.revolutionMetrics.tablesDetected}`);
      console.log(`  🔑 Key-value pairs: ${analysisResult.data.revolutionMetrics.keyValuePairsDetected}`);
      console.log(`  ☑️ Selection marks: ${analysisResult.data.revolutionMetrics.selectionMarksDetected}`);
      console.log(`  📰 Paragraphs: ${analysisResult.data.revolutionMetrics.paragraphsDetected}`);
      console.log(`  🚀 Improvement factor: ${analysisResult.data.revolutionMetrics.improvementFactor}x`);
    }
    
    console.log('\n🏷️ Sample detected fields:');
    analysisResult.data.detectedFields.slice(0, 10).forEach((field, index) => {
      const sourceType = field.sourceType || 'unknown';
      console.log(`  ${index + 1}. ${field.displayName}: "${field.value}" (${Math.round(field.confidence * 100)}%) [${sourceType}]`);
    });
    
    if (analysisResult.data.detectedFields.length > 10) {
      console.log(`  ... and ${analysisResult.data.detectedFields.length - 10} more fields`);
    }
    
    console.log('\n🎯 FINAL TEST VERDICT:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (analysisResult.data.modelUsed === 'prebuilt-document') {
      console.log('🎉 SUCCESS! Blob storage is FIXED!');
      console.log('✅ Using real Azure Document Intelligence with prebuilt-document model');
      console.log(`✅ Detected ${analysisResult.data.detectedFields.length} real fields from your PDF`);
      console.log('✅ Upload → Storage → Retrieval → Azure DI pipeline is working perfectly');
      
      if (analysisResult.data.detectedFields.length > 5) {
        console.log('🚀 BREAKTHROUGH: We have successfully broken the 5-field limitation!');
      }
    } else if (analysisResult.data.modelUsed === 'fallback') {
      console.log('❌ Still using fallback - blob storage issue persists');
      console.log('📝 Check the Azure Functions console for detailed error logs');
    } else {
      console.log(`⚠️ Using unexpected model: ${analysisResult.data.modelUsed}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testFixedBlobStorage();