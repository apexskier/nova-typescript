# Changelog

## v1.5.0

### Changed

* Improve documentation in readme and throughout extension
* Sidebar "refresh" button now restarts language server

### Added

* Custom TypeScript library location support (now actually works!)
   * Preference type changed to string
   * Relative path support
   * Auto-restart on preference change

## v1.4.2

### Changed

* Upgrade bundled version of TypeScript to 3.9

## v1.4.1

### Changed

* New sidebar icons from [Sam Gwilym](http://gwil.co)

## v1.4.0

### Added

* Add images to sidebar

### Changed

* Dev functionality and error handling

## v1.3.0

### Added

* Show "Go to Definition" results in sidebar for multiple results

### Fixed

* Allow "Code Actions" and "Go to Definition" when editor doesn't have focus.

## v1.2.1

### Fixed

* Fix tsx/jsx language support

## v1.2.0

### Added

* Display active TypeScript version to sidebar
* Improved "Find Symbol" sidebar UI
* Extension falls back to it's own installation of TypeScript

### Fixed

* Fewer warnings about misconfigured TypeScript

### Changed

* Configuration for custom TypeScript installation has changed
* Language server isn't bundled with published extension

## v1.1.0

### Added

* "Find Symbol" command and sidebar
* "Code Actions" editor command
* Support for language server driven edits

### Fixed

* Cleaner deactivation logic

## v1.0.1

### Fixed

* Fix issue preventing language server startup when installed from extension library

## v1.0.0

Initial release

* Language Server support
* Custom TypeScript installation support
* "Go to Definition" editor command
* "Rename" editor command
