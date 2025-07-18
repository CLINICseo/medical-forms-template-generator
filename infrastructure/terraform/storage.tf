# Random suffix for globally unique names
resource "random_string" "storage_suffix" {
  length  = 4
  special = false
  upper   = false
}

# Storage Account para PDFs y archivos temporales
resource "azurerm_storage_account" "main" {
  name                     = "st${replace(local.resource_prefix, "-", "")}${random_string.storage_suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  blob_properties {
    cors_rule {
      allowed_origins    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]
      allowed_headers    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
    
    delete_retention_policy {
      days = 7
    }
    
    versioning_enabled = true
  }
  
  tags = local.tags
}

# Containers
resource "azurerm_storage_container" "pdfs" {
  name                  = "pdf-uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "templates" {
  name                  = "templates"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "temp" {
  name                  = "temp-processing"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}