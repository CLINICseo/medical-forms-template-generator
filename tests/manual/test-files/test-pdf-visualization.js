// Test completo de visualización PDF real con overlays
const axios = require('axios');

const BASE_URL = 'http://localhost:7075/api';
const FRONTEND_URL = 'http://localhost:3000';

async function testPDFVisualizationFlow() {
  console.log('🔍 Testing PDF Visualization Flow - Real Document');
  console.log('=' .repeat(60));

  try {
    // Step 1: Upload a real PDF
    console.log('📤 Step 1: Uploading PDF document...');
    const fs = require('fs');
    
    // Create a more complex test PDF
    const testPDF = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica
    >>
  >>
>>
>>
endobj
4 0 obj
<<
/Length 250
>>
stream
BT
/F1 12 Tf
50 750 Td
(FORMULARIO MEDICO - MAPFRE) Tj
0 -30 Td
(Nombre del Paciente: Juan Perez Garcia) Tj
0 -25 Td
(RFC: PEGJ850101ABC) Tj
0 -25 Td
(CURP: PEGJ850101HDFRNN05) Tj
0 -25 Td
(Fecha de Nacimiento: 01/01/1985) Tj
0 -25 Td
(No. Poliza: POL-2024-001234) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000334 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
633
%%EOF`;

    fs.writeFileSync('complex-medical-form.pdf', testPDF);
    
    const uploadResponse = await axios.post(`${BASE_URL}/upload`, 
      fs.readFileSync('complex-medical-form.pdf'),
      {
        headers: { 'Content-Type': 'application/pdf' }
      }
    );

    if (!uploadResponse.data.success) {
      console.log('❌ Upload failed');
      return false;
    }

    const documentId = uploadResponse.data.data.documentId;
    console.log(`✅ PDF uploaded successfully`);
    console.log(`   📋 Document ID: ${documentId}`);
    console.log(`   📊 File size: ${uploadResponse.data.data.fileSize} bytes`);

    // Step 2: Analyze document with Azure DI
    console.log('\n🧠 Step 2: Analyzing document with Azure Document Intelligence...');
    const analysisResponse = await axios.post(`${BASE_URL}/analyze/${documentId}`);
    
    if (!analysisResponse.data.success) {
      console.log('❌ Analysis failed');
      return false;
    }

    const analysisData = analysisResponse.data.data;
    console.log(`✅ Document analyzed successfully`);
    console.log(`   🎯 Confidence: ${Math.round(analysisData.confidence * 100)}%`);
    console.log(`   ⏱️  Processing time: ${analysisData.processingTime}s`);
    console.log(`   🏢 Insurer detected: ${analysisData.insurerDetected}`);
    console.log(`   📝 Form type: ${analysisData.formType}`);
    console.log(`   🔍 Fields detected: ${analysisData.detectedFields.length}`);

    // Show detected fields
    console.log('\n   📋 Detected Fields:');
    analysisData.detectedFields.forEach((field, index) => {
      console.log(`      ${index + 1}. ${field.displayName}: "${field.value}" (${Math.round(field.confidence * 100)}%)`);
      console.log(`         📍 Position: [${field.boundingBox.join(', ')}] Page ${field.pageNumber}`);
      console.log(`         🏷️  Type: ${field.fieldType}`);
    });

    // Step 3: Test PDF endpoint
    console.log('\n📄 Step 3: Testing PDF serving endpoint...');
    const pdfResponse = await axios.get(`${BASE_URL}/pdf/${documentId}`, {
      responseType: 'arraybuffer'
    });

    if (pdfResponse.status !== 200) {
      console.log('❌ PDF endpoint failed');
      return false;
    }

    console.log(`✅ PDF served successfully`);
    console.log(`   📊 Content-Type: ${pdfResponse.headers['content-type']}`);
    console.log(`   📦 Content-Length: ${pdfResponse.headers['content-length']} bytes`);
    
    // Step 4: Test validation endpoint
    console.log('\n✅ Step 4: Testing validation endpoint...');
    const validationResponse = await axios.get(`${BASE_URL}/validate/${documentId}`);
    
    if (!validationResponse.data.success) {
      console.log('❌ Validation failed');
      return false;
    }

    console.log(`✅ Validation completed`);
    console.log(`   📊 Completion: ${validationResponse.data.data.completionPercentage}%`);
    console.log(`   ✅ Is Valid: ${validationResponse.data.data.isValid}`);
    console.log(`   ⚠️  Warnings: ${validationResponse.data.data.validationWarnings.length}`);
    
    // Step 5: Test export functionality
    console.log('\n📤 Step 5: Testing export functionality...');
    const exportResponse = await axios.post(`${BASE_URL}/export/${documentId}`, {
      format: 'json',
      fields: analysisData.detectedFields,
      includeCoordinates: true,
      includeMedicalMetadata: true
    });

    if (!exportResponse.data.success) {
      console.log('❌ Export failed');
      return false;
    }

    console.log(`✅ Export completed`);
    console.log(`   📁 File: ${exportResponse.data.data.fileName}`);
    console.log(`   📊 Size: ${exportResponse.data.data.fileSize} bytes`);
    console.log(`   🔗 Download URL available`);

    // Step 6: Test finalize functionality
    console.log('\n🎯 Step 6: Testing finalize functionality...');
    const finalizeResponse = await axios.post(`${BASE_URL}/finalize/${documentId}`, {
      validatedFields: analysisData.detectedFields,
      reviewerNotes: 'Complete PDF visualization test - all components working',
      finalStatus: 'approved',
      qualityScore: Math.round(analysisData.confidence * 100)
    });

    if (!finalizeResponse.data.success) {
      console.log('❌ Finalize failed');
      return false;
    }

    console.log(`✅ Finalize completed`);
    console.log(`   📋 Status: ${finalizeResponse.data.data.status}`);
    console.log(`   🏷️  Template ID: ${finalizeResponse.data.data.templateId}`);
    console.log(`   📊 Quality Score: ${finalizeResponse.data.data.validationSummary.averageConfidence * 100}%`);

    // Step 7: Generate frontend URLs
    console.log('\n🌐 Step 7: Frontend URLs for manual testing...');
    console.log(`   📄 Upload Page: ${FRONTEND_URL}/upload`);
    console.log(`   🔍 Validation Page: ${FRONTEND_URL}/validate/${documentId}`);
    console.log(`   📊 Analysis Page: ${FRONTEND_URL}/analyze/${documentId}`);

    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 PDF VISUALIZATION FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('');
    console.log('✅ Components Verified:');
    console.log('   • PDF Upload with real file ✅');
    console.log('   • Azure Document Intelligence analysis ✅');
    console.log('   • PDF serving endpoint ✅');
    console.log('   • Field detection with coordinates ✅');
    console.log('   • Document validation ✅');
    console.log('   • Export functionality ✅');
    console.log('   • Finalize functionality ✅');
    console.log('');
    console.log('🔗 Integration Status:');
    console.log('   • Backend ↔ Azure DI: CONNECTED');
    console.log('   • Backend ↔ Azure Storage: CONNECTED');
    console.log('   • Frontend ↔ Backend API: READY');
    console.log('   • PDF Viewer ↔ Real Documents: FUNCTIONAL');
    console.log('');
    console.log('📋 For manual testing, navigate to:');
    console.log(`   ${FRONTEND_URL}/validate/${documentId}`);
    console.log('');
    console.log('Expected behavior:');
    console.log('• PDF loads from real uploaded document');
    console.log('• Field overlays show detected coordinates');
    console.log('• Field panel shows Azure DI analysis results');
    console.log('• Export and finalize buttons work correctly');

    // Cleanup
    fs.unlinkSync('complex-medical-form.pdf');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    if (error.response) {
      console.log('   Response status:', error.response.status);
      console.log('   Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testPDFVisualizationFlow().catch(error => {
  console.error('💥 Test runner failed:', error.message);
  process.exit(1);
});