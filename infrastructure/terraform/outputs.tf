output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = azurerm_storage_account.main.name
}

output "storage_account_connection_string" {
  description = "Connection string for storage account"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "cosmos_db_endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "cosmos_db_connection_string" {
  description = "Cosmos DB connection string"
  value       = azurerm_cosmosdb_account.main.primary_sql_connection_string
  sensitive   = true
}

output "document_intelligence_endpoint" {
  description = "Document Intelligence endpoint"
  value       = azurerm_cognitive_account.document_intelligence.endpoint
}

output "document_intelligence_key" {
  description = "Document Intelligence key"
  value       = azurerm_cognitive_account.document_intelligence.primary_access_key
  sensitive   = true
}

output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}
