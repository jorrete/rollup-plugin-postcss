'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rollupPluginutils = require('rollup-pluginutils');
var postcss = _interopDefault(require('postcss'));
var styleInject = _interopDefault(require('style-inject'));
var path = _interopDefault(require('path'));
var Concat = _interopDefault(require('concat-with-sourcemaps'));

function cwd(file) {
  return path.join(process.cwd(), file);
}

var index = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var filter = rollupPluginutils.createFilter(options.include, options.exclude);
  var injectFnName = '__$styleInject';
  var extensions = options.extensions || ['.css', '.sss'];
  var getExport = options.getExport || function () {};
  var combineStyleTags = !!options.combineStyleTags;
  var include = options.include || false;

  var concat = new Concat(true, 'styles.css', '\n');

  var injectStyleFuncCode = styleInject.toString().replace(/styleInject/, injectFnName);

  return {
    intro: function intro() {
      if (!include) {
        return;
      }

      if (combineStyleTags) {
        return injectStyleFuncCode + '\n' + injectFnName + '(' + JSON.stringify(concat.content.toString('utf8')) + ')';
      } else {
        return injectStyleFuncCode;
      }
    },
    transform: function transform(code, id) {
      if (!filter(id)) return null;
      if (extensions.indexOf(path.extname(id)) === -1) return null;
      var opts = {
        from: options.from ? cwd(options.from) : id,
        to: options.to ? cwd(options.to) : id,
        map: {
          inline: false,
          annotation: false
        },
        parser: options.parser
      };
      return postcss(options.plugins || []).process(code, opts).then(function (result) {
        var code = void 0,
            map = void 0;

        if (!include) {
          concat.add(result.opts.from, result.css, result.map && result.map.toString());
          code = 'export default ' + JSON.stringify(result.css) + ';';
          map = { mappings: '' };
        } else if (combineStyleTags) {
          concat.add(result.opts.from, result.css, result.map && result.map.toString());
          code = 'export default ' + JSON.stringify(getExport(result.opts.from)) + ';';
          map = { mappings: '' };
        } else {
          code = 'export default ' + injectFnName + '(' + JSON.stringify(result.css) + ',' + JSON.stringify(getExport(result.opts.from)) + ');';
          map = options.sourceMap && result.map ? JSON.parse(result.map) : { mappings: '' };
        }

        return { code: code, map: map };
      });
    }
  };
};

module.exports = index;
