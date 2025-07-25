async function testBlobDiagnostics() {
  try {
    console.log('🧪 Testing Blob Storage Diagnostics...');
    
    const response = await fetch('http://localhost:7076/api/debug/blob-storage');
    
    if (!response.ok) {
      console.log('❌ Diagnostics endpoint failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const diagnostics = await response.json();
    
    console.log('\n📊 BLOB STORAGE DIAGNOSTICS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Connection String
    console.log('📡 Connection String:');
    console.log(`  ✅ Configured: ${diagnostics.data.connectionString.configured}`);
    console.log(`  📏 Length: ${diagnostics.data.connectionString.length} characters`);
    console.log(`  🏢 Account Name: ${diagnostics.data.connectionString.accountName}`);
    
    // Service Test
    console.log('\n🔧 BlobStorageService Test:');
    if (diagnostics.data.serviceTest.success) {
      console.log(`  ✅ ${diagnostics.data.serviceTest.message}`);
    } else {
      console.log(`  ❌ Failed: ${diagnostics.data.serviceTest.error}`);
    }
    
    // Container Test
    console.log('\n📦 Container Test:');
    if (diagnostics.data.containerTest.success) {
      console.log(`  ✅ Container "${diagnostics.data.containerTest.name}" exists: ${diagnostics.data.containerTest.exists}`);
    } else {
      console.log(`  ❌ Container test failed: ${diagnostics.data.containerTest.error}`);
    }
    
    // Blob List Test
    console.log('\n📋 Blob List Test:');
    if (diagnostics.data.blobListTest.success) {
      console.log(`  ✅ Successfully listed blobs. Found: ${diagnostics.data.blobListTest.totalBlobs} blobs`);
      
      if (diagnostics.data.blobListTest.sampleBlobs.length > 0) {
        console.log('  📄 Sample blobs:');
        diagnostics.data.blobListTest.sampleBlobs.forEach((blob, index) => {
          console.log(`    ${index + 1}. ${blob.name} (${blob.size} bytes) - ${blob.lastModified}`);
        });
      } else {
        console.log('  📭 No blobs found in container');
      }
    } else {
      console.log(`  ❌ Blob listing failed: ${diagnostics.data.blobListTest.error}`);
    }
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (diagnostics.data.serviceTest.success && diagnostics.data.containerTest.success) {
      if (diagnostics.data.blobListTest.success) {
        if (diagnostics.data.blobListTest.totalBlobs > 0) {
          console.log('✅ Blob storage is working correctly and contains files');
          console.log('💡 The issue might be with specific blob name matching or retrieval logic');
        } else {
          console.log('⚠️ Blob storage is working but container is empty');
          console.log('💡 Files may not be uploading correctly or using different container');
        }
      } else {
        console.log('❌ Blob storage connection works but cannot list blobs');
        console.log('💡 Permission issue or container access problem');
      }
    } else {
      console.log('❌ Fundamental blob storage configuration issue');
      console.log('💡 Check connection string, account keys, or service initialization');
    }
    
  } catch (error) {
    console.error('❌ Diagnostics test failed:', error);
  }
}

// Run the test
testBlobDiagnostics();