terraform {
  required_version = ">= 1.7"

  required_providers {
    render = {
      source  = "render-oss/render"
      version = "~> 1.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

resource "render_static_site" "app" {
  name   = var.service_name
  branch = var.repo_branch

  repo_url       = var.repo_url
  root_directory = var.root_directory
  build_command  = var.build_command
  publish_path   = var.publish_path
  auto_deploy    = true

  build_filter = {
    paths = [
      "src/**",
      "public/**",
      "index.html",
      "package.json",
      "pnpm-lock.yaml",
      "vite.config.ts",
    ]
  }
}

output "static_site_id" {
  description = "Render identifier for the static site."
  value       = render_static_site.app.id
}

output "static_site_url" {
  description = "Public URL for the deployed static site."
  value       = render_static_site.app.url
}
