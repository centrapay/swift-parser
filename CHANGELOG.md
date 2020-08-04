# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- support for MT942

### Removed
- parser middleware support
- "withTags" parse option
- Parser class not exposed from main module
- Statement.statementDate

### Changed
- parse method exposed in main module
- parse method accepts opts object and returns Statement instances

## [0.2.0] - 2020-08-03

### Changed
- Add simplified cli bin

## [0.1.0] - 2020-08-03
### Added
- First release under new package name, no functional change from original repository :tada: