# Mark.js-playground

<img height="540" src="assets/images/playground.png" border="1px solid">

### Description
The program can handle `mark.js` or `jquery.mark.js` - it only requires adding according reference in `index.html` file.
It works both with new [https://github.com/angezid/advanced-mark.js](https://github.com/angezid/advanced-mark.js) and `mark.js` library. The `mark.js` library has many limitations, so behavior of this program will depend on library.  

Currently, the two mark libraries are installed by default:
* the `mark.js` from package v8.11.1
* the `jquery.mark.js` from package 'https://www.npmjs.com/package/advanced-mark.js'

They are not conflicting with each other and can be switch by checkbox (in settings).  

### Install Mark.js-playground
Clone or download this repository and run:
```
npm install && npm run build
```

### Export/Import
The idea to export/import 'Playground tab' in JSON format:
* save/load the current state
* bug report
* ask for help, if there's problem highlighting something

When you paste or drag & drop a Html content into the Html editor or load/import, the content runs through the Html sanitizer, which removes head, script, style, link, and meta elements and comments.
It also removes attributes containing `javascript:` or have name start with `on`. The values of `href, src, srcset` attributes are replaced by '#'.  

Warning: 100% security is currently under the question.

Note: be reasonable, do not export big HTML test content. For security reasons, nobody will dare import your export (only those who trust you).  
Locate and leave only problematic area(s) which can be easily visually examine.

### Things you need to know

There are two test content modes - Text and Html . If you want to add HTML content, you need to switch to the Html mode.  
An `object` option was added to the Accuracy selector, just to enable an `accuracy` object editor. This option is not part of the mark.js library.  
If you enable the custom code editor, the program evaluates the whole internal code (see 'Internal code' which appears below the 'Results').
Otherwise, only the options that accept Objects, Arrays or RegExp are evaluated.  
Tooltips can be called by pressing `Ctrl/Cmd` key and cursor over an item. Note that the tooltip system is still under development.

Note:
- due to limitations of the `mark.js` library, the next/previous buttons functionality with `acrossElements` option may not work as expected.
- in test container editors, due limitation of `contenteditable` attribute, the undo won't works.

### Option examples
There are several option examples in `JSON -> Examples`.

### Server
To play with `iframes` option, you need to launch the server. It also opens `build/playground.html` file. Server url - `http://localhost:8080`.
```
npm run server
```
or run `server.bat`.

### Custom code
When `Custom code editor` is activated, a minimal code with all callbacks is generated.
For normal playground workflow, a two internal functions are necessary:
- `highlighter.flagStartElement()` in the `each` callback for next/previous buttons functionality
- `highlighter.finish()` in the `done` callback for highlighting matches and logging results  
They're automatically added to the internal code if their parameters and functions parameters are the same.

### License

[MIT](LICENSE)
