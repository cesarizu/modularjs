/**
 * modularjs: A modular javascript system 
 *
 * How to use:
 *
 * 1. Add to head:
 *      <script type="text/javascript"
 *              src="include.js?somepackage.SomeModule1,somepackage.SomeModule2">
 *      </script>
 *
 * 2. And anywhere in your js files:
 *      include("somepackage.SomeOtherModule");
 *
 * Modules are loaded from [package]/[subpackage]/[ModuleName].js files.
 *
 * See the README file to learn how to compile your modules into a single
 * compressed file.
 *
 * http://modularjs.googlecode.com
 */
var modularjs = {

    basePath: null,

    loaded: {},

    loading: {},

    /**
     * Inits the modularjs system.
     */
    init: function () {
        /*globals ActiveXObject */

        if (typeof XMLHttpRequest != "undefined") {
            modularjs.xhr = new XMLHttpRequest();
        } else if (typeof ActiveXObject != "undefined") {
            modularjs.xhr = new ActiveXObject("Microsoft.XMLHTTP");
        } else {
            throw new Error("XMLHttpRequest not supported");
        }

        modularjs.head = document.getElementsByTagName("head")[0];
        modularjs.eval = modularjs.findEvalFunction();
        var scripts = modularjs.head.getElementsByTagName("script");

        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src;
            if (src.match(/.*include\.js.*/)) {
                var parts = src.split(/\?/);
                modularjs.basePath = parts[0].replace(/include\.js.*/, '');
                if (parts.length > 1) {
                    parts = parts[1].split(",");
                    for (var j = 0; j < parts.length; j++) {
                        modularjs.include(parts[j]);
                    }
                }
            }
        }
    },

    /**
     * Finds the best function to be used.
     */
    findEvalFunction: function() {
        var SET_GLOBAL_VAR_NAME = "__modularjs_global_test__"
        var SET_GLOBAL_VAR = "var " + SET_GLOBAL_VAR_NAME + " = true;"

        var setGlobal = function(evalFunction) {
            if (!!window[SET_GLOBAL_VAR_NAME]) {
                try {
                    delete window[SET_GLOBAL_VAR_NAME];
                } catch(e) {
                    window[SET_GLOBAL_VAR_NAME] = undefined;
                }
            }
            evalFunction(SET_GLOBAL_VAR);
            return !!window[SET_GLOBAL_VAR_NAME];
        }

        var windowExecScript = function(contents) {
            if (window.execScript) {
                window.execScript(contents);
            }        
        }
        if (setGlobal(windowExecScript)) {
            return windowExecScript;
        }

        var withWindowEval = function(contents) {
            with (window) {
                window.eval(contents);
            }
        }
        if (setGlobal(withWindowEval)) {
            return withWindowEval;
        }

        var insertScript = function(contents) {
            var script = document.createElement("script");
            script.type = "text/javascript";
            script.text = contents;
            modularjs.head.appendChild(script);
            modularjs.head.removeChild(script);
        }
        if (setGlobal(insertScript)) {
            return insertScript;
        }

        throw new Error("Cannot determine a good eval function");
    },

    /**
     * Includes a module. Only absolute includes.
     * It's aliased to the global function 'include'.
     *
     * @param module {string} The module name (dot separated)
     * @returns true if module was included correctly
     */
    include: function (module) {
        if (!module) {
            throw new Error("No module name defined");
        }

        if (modularjs.loaded[module]) {
            return true;
        }

        if (modularjs.loading[module]) {
            throw new Error("Possible recursive import: " + module);
        }

        modularjs.loading[module] = true;

        var contents = modularjs.getContents(module);

        try {
            modularjs.eval(contents);
            modularjs.loaded[module] = true;
        } catch(e) {
            if (typeof console != "undefined") {
                console.log("Error importing module", module, e);
            }
        }

        modularjs.loading[module] = false;

        return !!modularjs.loaded[module];
    },

    /**
     * Returns the best filename that corresponds to a module.
     *
     * @param module {string} The module name
     * @returns The module filename
     */
    getContents: function (module) {
        var contents = null;
        var filename = null;

        filename = module + ".build.compressed.js";
        if (contents = modularjs.getFileContents(filename)) {
            return contents + "\r\n//@ sourceURL=" + filename;
        }

        filename = module + ".build.js";
        if (contents = modularjs.getFileContents(filename)) {
            return contents + "\r\n//@ sourceURL=" + filename;
        }

        filename = module.replace(/\./g, "/") + ".js";
        if (contents = modularjs.getFileContents(filename)) {
            return contents + "\r\n//@ sourceURL=" + filename;
        }

        throw new Error("Module " + module + " not found.");
    },

    /**
     * Checks for file existence
     *
     * @param filename {string} With the filename
     * @returns The module filename
     */
    getFileContents: function (filename) {
        try {
            modularjs.xhr.open("get", modularjs.basePath + filename, false);
            modularjs.xhr.send(null);

            if (modularjs.xhr.status == 0 || modularjs.xhr.status == 200) {
                return modularjs.xhr.responseText;
            }
        } catch(e) {
        }

        return "";
    }

};

var include = modularjs.include;

if (typeof __build__ == "undefined") {
    modularjs.init();
}

