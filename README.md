`````
                                                   ___
       __                                         /\_ \
  ___ /\_\    ___     ___   __  __    ___         \//\ \     ___      __      __      __   _ __
 /'___\/\ \ /' _ `\  / __`\/\ \/\ \  / __`\  _______\ \ \   / __`\  /'_ `\  /'_ `\  /'__`\/\`'__\
/\ \__/\ \ \/\ \/\ \/\ \L\ \ \ \_/ |/\ \L\ \/\______\\_\ \_/\ \L\ \/\ \L\ \/\ \L\ \/\  __/\ \ \/
\ \____\\ \_\ \_\ \_\ \____/\ \___/ \ \____/\/______//\____\ \____/\ \____ \ \____ \ \____\\ \_\
 \/____/ \/_/\/_/\/_/\/___/  \/__/   \/___/          \/____/\/___/  \/___L\ \/___L\ \/____/ \/_/
                                                                      /\____/ /\____/
                                                                      \_/__/  \_/__/
`````

# cinovo-logger-file

File endpoint for [cinovo-logger](https://github.com/cinovo/node-logger).

## Getting started

### At first you must install and require the logger.

    npm install cinovo-logger

### Next you must require the module

`````javascript
var logger = require("cinovo-logger");
`````

### Append cinovo-logger-file endpoint

	npm install cinovo-logger-file

In your JavaScript code append the file endpoint.

`````javascript
logger.append(require("cinovo-logger-file")(true, true, true, true, "./log", "log", ".txt", 1, 60, 10));
`````

### Log something

`````javascript
logger.debug("all values are ok");
logger.info("myscript", "all values are ok");
logger.error("myscript", "some values are not ok", {a: 10, b: 20});
logger.exception("myscript", "some values are not ok", new Error("error"));
logger.critical("myscript", "all values are not ok", {a: 10, b: 20}, function(err) { ... });
`````

### Done

Now you can log to file endpoint.

## API

### (debug, info, error, critial, dir, fileSuffix, filePrefix, maxFileSize, maxFileAge, maxFiles, callback)

Async creates a file Endpoint.

* `debug`: Boolean - true if the endpoint should log debug level
* `info`: Boolean - true if the endpoint should log info level
* `error`: Boolean - true if the endpoint should log error level
* `critical`: Boolean - true if the endpoint should log critical level
* `dir`: String - directory in which log files are saved.
* `filePrefix`: String -
* `fileSuffix`: String -
* `maxFileSize`: Number - bytes
* `maxFileAge`: Number - seconds
* `maxFiles`: Number - Maximum Number of files in dir (oldest are removed first)
* `callback`: Function(err, endpoint) - fired if the endpoint is ready to use
    * `err`: Error (optional)
    * `endpoint`: Endpoint - use the endpoint like this logger.append(endpoint)

### Events

#### stop(lastFile)

When the endpoint is stopped.

* `lastFile`: String - path and name

#### error(err)

Something went wrong in the background e.g. roll because of max age reached.

* `err`: Error

#### openFile(file)

File was opened and is ready to be written.

* `file`: String - path and name

**Example:**

`````javascript
var endpoint = require("cinovo-logger-file")(true, true, true, true, "./log", "log", ".txt", 1, 60, 10);
endpoint.on("openFile", function(file) { ... });
logger.append(endpoint);
`````

#### createFile(file)

File was created and is ready to be written.

* `file`: String - path and name

**Example:**

`````javascript
var endpoint = require("cinovo-logger-file")(true, true, true, true, "./log", "log", ".txt", 1, 60, 10);
endpoint.on("createFile", function(file) { ... });
logger.append(endpoint);
`````

#### rollFile(oldFile, newFile)

If the file size gets to big or the file gets to old the current file is replaced with a new one. This is called a roll.

* `oldFile`: String - file that is too big or too old (path and name)
* `newFile`: String - file ready to be written (path and name)

**Example:**

`````javascript
var endpoint = require("cinovo-logger-file")(true, true, true, true, "./log", "log", ".txt", 1, 60, 10);
endpoint.on("closeFile", function(file) { ... });
logger.append(endpoint);
`````

#### closeFile(file)

File was closed and is ready to be written.

* `file`: String - path and name

**Example:**

`````javascript
var endpoint = require("cinovo-logger-file")(true, true, true, true, "./log", "log", ".txt", 1, 60, 10);
endpoint.on("closeFile", function(file) { ... });
logger.append(endpoint);
`````