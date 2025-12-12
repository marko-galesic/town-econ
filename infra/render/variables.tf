variable "render_api_key" {
  description = "Render API key used for authentication. Prefer setting via the RENDER_API_KEY environment variable."
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "The Render owner/team ID that should own the resources."
  type        = string
}

variable "service_name" {
  description = "Name for the Render static site service."
  type        = string
  default     = "town-econ"
}

variable "repo_url" {
  description = "Git repository URL that Render should build from."
  type        = string
}

variable "repo_branch" {
  description = "Branch to deploy from the repository."
  type        = string
  default     = "main"
}

variable "root_directory" {
  description = "Root directory for Render builds, useful for monorepos."
  type        = string
  default     = "."
}

variable "build_command" {
  description = "Command Render runs to build the static site."
  type        = string
  default     = "pnpm install --frozen-lockfile && pnpm run build"
}

variable "publish_path" {
  description = "Path to the build output that should be published."
  type        = string
  default     = "dist"
}
