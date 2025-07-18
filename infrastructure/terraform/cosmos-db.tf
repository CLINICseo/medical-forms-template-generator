# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "cosmos-${local.resource_prefix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "GlobalDocumentDB"

  consistency_policy {
    consistency_level       = "Session"
    max_interval_in_seconds = 5
    max_staleness_prefix    = 100
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  backup {
    type = "Continuous"
    tier = "Continuous30Days"
  }

  tags = local.tags
}

# Database
resource "azurerm_cosmosdb_sql_database" "templates" {
  name                = "TemplatesDB"
  resource_group_name = azurerm_cosmosdb_account.main.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Containers
resource "azurerm_cosmosdb_sql_container" "templates" {
  name                  = "Templates"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.templates.name
  partition_key_paths   = ["/formType"]
  partition_key_version = 1

  indexing_policy {
    indexing_mode = "consistent"

    included_path {
      path = "/*"
    }
  }

  unique_key {
    paths = ["/templateId"]
  }
}

resource "azurerm_cosmosdb_sql_container" "versions" {
  name                  = "TemplateVersions"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.templates.name
  partition_key_paths   = ["/templateId"]
  partition_key_version = 1
}

resource "azurerm_cosmosdb_sql_container" "audit" {
  name                  = "AuditLog"
  resource_group_name   = azurerm_cosmosdb_account.main.resource_group_name
  account_name          = azurerm_cosmosdb_account.main.name
  database_name         = azurerm_cosmosdb_sql_database.templates.name
  partition_key_paths   = ["/date"]
  partition_key_version = 1

  default_ttl = 2592000 # 30 días
}
