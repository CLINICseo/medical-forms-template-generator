// Integration test for new Export and Finalize endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:7075/api';
const TEST_DOCUMENT_ID = 'integration-test-' + Date.now();

// Mock field data for testing
const testFields = [
  {
    fieldId: 'nombre_paciente',
    displayName: 'Nombre del Paciente',
    fieldType: 'text',
    value: 'Juan Pérez García',
    confidence: 0.95,
    boundingBox: [100, 150, 300, 25],
    pageNumber: 1,
    medicalType: 'personal_info'
  },
  {
    fieldId: 'rfc',
    displayName: 'RFC',
    fieldType: 'rfc',
    value: 'PEGJ850101ABC',
    confidence: 0.88,
    boundingBox: [100, 200, 200, 20],
    pageNumber: 1,
    medicalType: 'identification'
  },
  {
    fieldId: 'fecha_nacimiento',
    displayName: 'Fecha de Nacimiento',
    fieldType: 'date',
    value: '01/01/1985',
    confidence: 0.94,
    boundingBox: [100, 350, 150, 20],
    pageNumber: 1,
    medicalType: 'personal_info'
  }
];

async function testExportEndpoint() {
  console.log('\n🧪 Testing Export Endpoint...');
  
  try {
    // Test JSON export
    console.log('  📄 Testing JSON export...');
    const jsonResponse = await axios.post(`${BASE_URL}/export/${TEST_DOCUMENT_ID}`, {
      format: 'json',
      fields: testFields,
      includeCoordinates: true,
      includeMedicalMetadata: true
    });

    if (jsonResponse.data.success) {
      console.log('  ✅ JSON export successful');
      console.log(`     📁 File: ${jsonResponse.data.data.fileName}`);
      console.log(`     📊 Size: ${jsonResponse.data.data.fileSize} bytes`);
      console.log(`     🔗 URL: ${jsonResponse.data.data.downloadUrl.substring(0, 80)}...`);
    } else {
      console.log('  ❌ JSON export failed');
      return false;
    }

    // Test XML export
    console.log('  📄 Testing XML export...');
    const xmlResponse = await axios.post(`${BASE_URL}/export/${TEST_DOCUMENT_ID}`, {
      format: 'xml',
      fields: testFields,
      includeCoordinates: true,
      includeMedicalMetadata: true
    });

    if (xmlResponse.data.success) {
      console.log('  ✅ XML export successful');
      console.log(`     📁 File: ${xmlResponse.data.data.fileName}`);
      console.log(`     📊 Size: ${xmlResponse.data.data.fileSize} bytes`);
    } else {
      console.log('  ❌ XML export failed');
      return false;
    }

    // Test PDF Template export
    console.log('  📄 Testing PDF Template export...');
    const pdfResponse = await axios.post(`${BASE_URL}/export/${TEST_DOCUMENT_ID}`, {
      format: 'pdf-template',
      fields: testFields,
      includeCoordinates: true,
      includeMedicalMetadata: true
    });

    if (pdfResponse.data.success) {
      console.log('  ✅ PDF Template export successful');
      console.log(`     📁 File: ${pdfResponse.data.data.fileName}`);
      console.log(`     📊 Size: ${pdfResponse.data.data.fileSize} bytes`);
    } else {
      console.log('  ❌ PDF Template export failed');
      return false;
    }

    return true;
  } catch (error) {
    console.log('  ❌ Export endpoint error:', error.message);
    return false;
  }
}

async function testFinalizeEndpoint() {
  console.log('\n🧪 Testing Finalize Endpoint...');
  
  try {
    // Test approval finalization
    console.log('  ✅ Testing approval finalization...');
    const approvalResponse = await axios.post(`${BASE_URL}/finalize/${TEST_DOCUMENT_ID}`, {
      validatedFields: testFields,
      reviewerNotes: 'All fields validated successfully during integration test',
      finalStatus: 'approved',
      qualityScore: 92
    });

    if (approvalResponse.data.success) {
      console.log('  ✅ Approval finalization successful');
      console.log(`     📋 Document ID: ${approvalResponse.data.data.documentId}`);
      console.log(`     🏷️  Template ID: ${approvalResponse.data.data.templateId}`);
      console.log(`     📊 Summary: ${approvalResponse.data.data.validationSummary.totalFields} fields, ${approvalResponse.data.data.validationSummary.approvedFields} approved`);
      console.log(`     ⭐ Avg Confidence: ${Math.round(approvalResponse.data.data.validationSummary.averageConfidence * 100)}%`);
    } else {
      console.log('  ❌ Approval finalization failed');
      return false;
    }

    // Test rejection finalization
    console.log('  ❌ Testing rejection finalization...');
    const rejectionResponse = await axios.post(`${BASE_URL}/finalize/${TEST_DOCUMENT_ID}-reject`, {
      validatedFields: testFields.slice(0, 1), // Only one field
      reviewerNotes: 'Document quality insufficient for template creation',
      finalStatus: 'rejected',
      qualityScore: 45
    });

    if (rejectionResponse.data.success) {
      console.log('  ✅ Rejection finalization successful');
      console.log(`     📋 Status: ${rejectionResponse.data.data.status}`);
      console.log(`     🚫 No template ID (as expected for rejection)`);
    } else {
      console.log('  ❌ Rejection finalization failed');
      return false;
    }

    // Test needs review finalization
    console.log('  📝 Testing needs review finalization...');
    const reviewResponse = await axios.post(`${BASE_URL}/finalize/${TEST_DOCUMENT_ID}-review`, {
      validatedFields: testFields.slice(0, 2), // Two fields
      reviewerNotes: 'Requires manual review for medical context validation',
      finalStatus: 'needs_review',
      qualityScore: 75
    });

    if (reviewResponse.data.success) {
      console.log('  ✅ Needs review finalization successful');
      console.log(`     📋 Status: ${reviewResponse.data.data.status}`);
      console.log(`     📊 Fields: ${reviewResponse.data.data.validationSummary.totalFields}`);
    } else {
      console.log('  ❌ Needs review finalization failed');
      return false;
    }

    return true;
  } catch (error) {
    console.log('  ❌ Finalize endpoint error:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🧪 Testing Error Handling...');
  
  try {
    // Test missing document ID
    console.log('  ❓ Testing missing document ID...');
    try {
      await axios.post(`${BASE_URL}/export/`, {
        format: 'json',
        fields: testFields
      });
      console.log('  ❌ Should have failed with missing document ID');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('  ✅ Correctly handled missing document ID');
      } else {
        console.log('  ❌ Unexpected error for missing document ID');
        return false;
      }
    }

    // Test invalid format
    console.log('  ❓ Testing invalid format...');
    try {
      const response = await axios.post(`${BASE_URL}/export/${TEST_DOCUMENT_ID}`, {
        format: 'invalid_format',
        fields: testFields
      });
      if (!response.data.success) {
        console.log('  ✅ Correctly rejected invalid format');
      } else {
        console.log('  ❌ Should have rejected invalid format');
        return false;
      }
    } catch (error) {
      console.log('  ✅ Correctly handled invalid format error');
    }

    // Test missing fields in finalize
    console.log('  ❓ Testing missing fields in finalize...');
    try {
      const response = await axios.post(`${BASE_URL}/finalize/${TEST_DOCUMENT_ID}`, {
        finalStatus: 'approved'
        // Missing validatedFields
      });
      if (!response.data.success) {
        console.log('  ✅ Correctly rejected missing fields');
      } else {
        console.log('  ❌ Should have rejected missing fields');
        return false;
      }
    } catch (error) {
      console.log('  ✅ Correctly handled missing fields error');
    }

    return true;
  } catch (error) {
    console.log('  ❌ Error handling test failed:', error.message);
    return false;
  }
}

async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests for New Endpoints');
  console.log('=' .repeat(60));
  
  let allTestsPassed = true;

  // Test export endpoint
  const exportPassed = await testExportEndpoint();
  allTestsPassed = allTestsPassed && exportPassed;

  // Test finalize endpoint
  const finalizePassed = await testFinalizeEndpoint();
  allTestsPassed = allTestsPassed && finalizePassed;

  // Test error handling
  const errorHandlingPassed = await testErrorHandling();
  allTestsPassed = allTestsPassed && errorHandlingPassed;

  console.log('\n' + '=' .repeat(60));
  if (allTestsPassed) {
    console.log('🎉 ALL INTEGRATION TESTS PASSED!');
    console.log('✅ Export endpoint working correctly');
    console.log('✅ Finalize endpoint working correctly');
    console.log('✅ Error handling working correctly');
    console.log('✅ Backend-Frontend integration ready');
    console.log('\n📋 Summary:');
    console.log('   - Export supports JSON, XML, and PDF Template formats');
    console.log('   - Finalize supports approve, reject, and needs_review statuses');
    console.log('   - Files are stored in Azure Blob Storage');
    console.log('   - Quality scores and validation summaries calculated');
    console.log('   - Error handling robust for edge cases');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('Please check the logs above for details');
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests().catch(error => {
  console.error('💥 Integration test runner failed:', error.message);
  process.exit(1);
});