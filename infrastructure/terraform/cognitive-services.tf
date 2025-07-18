# Random suffix for Key Vault (globally unique)
resource "random_string" "kv_suffix" {
  length  = 4
  special = false
  upper   = false
}

# Document Intelligence (Form Recognizer)
resource "azurerm_cognitive_account" "document_intelligence" {
  name                = "cog-docint-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  kind                = "FormRecognizer"
  sku_name            = "S0"

  custom_subdomain_name = "docint-${local.resource_prefix}"

  tags = local.tags
}

# Key Vault para almacenar las keys de forma segura
resource "azurerm_key_vault" "main" {
  name                = "kv-medforms-${var.environment}-${random_string.kv_suffix.result}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  purge_protection_enabled   = true
  soft_delete_retention_days = 7

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get", "List", "Set", "Delete", "Purge", "Recover"
    ]
  }

  tags = local.tags
}

# Guardar Document Intelligence Key en Key Vault
resource "azurerm_key_vault_secret" "document_intelligence_key" {
  name         = "document-intelligence-key"
  value        = azurerm_cognitive_account.document_intelligence.primary_access_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_key_vault.main]
}
