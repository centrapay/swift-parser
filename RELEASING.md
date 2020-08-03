# Release Process

A new version is automatically published to NPM when a version tag is pushed.
The release workflow will fail if the tag version and the package version do
not match.

## Checklist

1. Update version in package.json
2. Update changelog
3. Push new tag with format "v${version}", eg: "v1.2.3"
