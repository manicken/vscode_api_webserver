# api-webserver README

This extension make it possible to take control of Visual Studio Code from a Web Page based client.


## Features

POST request with data contents in json format:
```
{
    "files":[
        {
            "name":"Main.c",
            "contents":""
        },
        {
            "name":"Main.h",
            "contents":""
        }
    ],
    "command":""
}
```
GET request
possible query strings:
```
http://localhost:8080?cmd=getFile&fileName=fileNameWithExt
http://localhost:8080?cmd=compile
http://localhost:8080?cmd=upload
http://localhost:8080?cmd=ping
```
note. that i have prevented directory traversal by the filename

## Requirements
none
## Extension Settings
none
## Known Issues
none
## Release Notes

### 1.0.0

Initial release of API_Webserver


-----------------------------------------------------------------------------------------------------------
<!---
### For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
 * [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
 -->