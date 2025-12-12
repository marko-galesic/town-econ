# Render infrastructure

Terraform configuration for deploying the static Vite site to Render. The configuration provisions a Render static site that builds directly from this repository.

## Inputs

The configuration relies on the following variables:

- `render_api_key`: Render API key with permission to manage the owner account. Use the `RENDER_API_KEY` environment variable when running Terraform or GitHub Actions.
- `render_owner_id`: Owner/team ID that should own the resources.
- `repo_url`: HTTPS URL of the Git repository Render should build from (for example, `https://github.com/your-org/town-econ`).
- `repo_branch`: Branch to deploy (default: `main`).
- `service_name`: Render service name (default: `town-econ`).
- `root_directory`: Monorepo root for the build (default: repository root).
- `build_command`: Build command used by Render (default: `pnpm install --frozen-lockfile && pnpm run build`).
- `publish_path`: Directory Render publishes (default: `dist`).

## Outputs

- `static_site_id`: Render identifier for the static site.
- `static_site_url`: Public URL for the deployed site.

## Local usage

```bash
cd infra/render
export RENDER_API_KEY="..."
export RENDER_OWNER_ID="..."
terraform init
terraform plan -var "repo_url=https://github.com/your-org/town-econ" -out=tfplan
terraform apply tfplan
```

## GitHub Actions deployment

The repository includes a GitHub Actions workflow that runs on every push to `main`. The workflow uses Terraform to create/update the Render static site using the variables above. Configure these repository secrets before enabling deployments:

- `RENDER_API_KEY`: Render API key for automation.
- `RENDER_OWNER_ID`: Owner/team ID to own the resources.

The workflow automatically sets `TF_VAR_repo_url` based on the repository URL and deploys the `main` branch.
