# API Scripts

This directory contains convenience scripts for managing the API.

## JWT Secrets Management

### Quick Usage (from API directory)

```bash
# Check JWT secrets status
node scripts/manage-jwt.js --validate

# Generate missing/invalid JWT secrets
node scripts/manage-jwt.js --generate

# Force regenerate all JWT secrets
node scripts/manage-jwt.js --force
```

### Full Usage (from project root)

```bash
# Check JWT secrets status
node scripts/manage-jwt-secrets.js --validate

# Generate missing/invalid JWT secrets
node scripts/manage-jwt-secrets.js --generate

# Force regenerate all JWT secrets
node scripts/manage-jwt-secrets.js --force
```

## Files

- `manage-jwt.js` - Convenience shortcut to the main JWT management tool
- Main tool location: `../../../scripts/manage-jwt-secrets.js`

## Notes

- The shortcut automatically handles path resolution
- All commands work the same way from either location
- The main JWT management tool is in the project root `scripts/` directory
