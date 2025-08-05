# Spawning Multiple TerminalTurtle Instances

TerminalTurtle supports running multiple independent instances, each with its own port configuration, API key, and isolated workspace.

## Quick Start

```bash
# Spawn a new instance on port 3004
./turtle spawn 3004

# Spawn with a custom name
./turtle spawn 3004 myproject

# List all instances
./turtle list

# View instance details
./turtle info myproject
```

## Architecture

Each spawned instance:
- Runs as an independent Docker container
- Has its own API key for authentication
- Uses its own isolated workspace directory
- Configures non-conflicting ports automatically
- Can be managed independently

## Port Allocation

When you spawn an instance on port X, the following ports are allocated:
- API Server: X (e.g., 3004)
- Dev Server: X + 100 (e.g., 3104)
- Node App: X + 1100 (e.g., 4104)
- Vite: X + 2173 (e.g., 5177)

## Management Commands

```bash
# Core commands
./turtle spawn <port> [name]    # Create new instance
./turtle list                    # List all instances
./turtle info <name>             # Show instance details

# Instance control
./turtle start <name>            # Start instance
./turtle stop <name>             # Stop instance
./turtle restart <name>          # Restart instance
./turtle logs <name>             # View logs

# Cleanup
./turtle destroy <name>          # Remove instance completely
./turtle clean                   # Remove all stopped instances
```

## Instance Structure

Each instance is stored in `instances/<name>/` with:
```
instances/
└── myproject/
    ├── .env                    # Instance configuration
    ├── docker-compose.yml      # Docker setup
    ├── instance-info.json      # Instance metadata
    ├── workspace/              # Isolated workspace
    └── turtle-control.sh       # Control script
```

## Working with Instances

1. **Spawn an instance:**
   ```bash
   ./turtle spawn 3004 myapp
   ```

2. **Check status:**
   ```bash
   ./turtle list
   ```

3. **Test the API:**
   ```bash
   # Get API key from instance info
   ./turtle info myapp
   
   # Test with curl
   curl -H "Authorization: Bearer <API_KEY>" http://localhost:3004/health
   ```

4. **Initialize a project:**
   ```bash
   # Use the instance's API to initialize a Next.js project
   curl -X POST http://localhost:3004/init-project \
     -H "Authorization: Bearer <API_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"projectType": "nextjs", "projectName": "my-app"}'
   ```

5. **Start development server:**
   ```bash
   curl -X POST http://localhost:3004/start-dev-server \
     -H "Authorization: Bearer <API_KEY>"
   ```

## Best Practices

1. **Port Selection**: Choose ports that don't conflict with other services
2. **Naming**: Use descriptive names for instances (e.g., `client-app`, `admin-panel`)
3. **Cleanup**: Regularly run `./turtle clean` to remove stopped instances
4. **API Keys**: Each instance has a unique API key - keep them secure

## Troubleshooting

- **Port conflicts**: Ensure chosen port and calculated ports (+100, +1100, +2173) are available
- **Docker issues**: Check Docker is running and you have sufficient resources
- **Instance not starting**: Check logs with `./turtle logs <name>`

## Example: Running Multiple Projects

```bash
# Spawn frontend app
./turtle spawn 3000 frontend

# Spawn backend API
./turtle spawn 4000 backend

# Spawn admin panel
./turtle spawn 5000 admin

# List all running instances
./turtle list

# Each instance runs independently with its own:
# - Workspace for code
# - API authentication
# - Port configuration
# - Docker container
```