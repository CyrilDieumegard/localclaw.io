const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {transformSync} = require('esbuild');

// Resolve references from the source homepage so catalogue refreshes automatically
// carry their latest data into the production bundle.
function homePageAssets(root) {
  const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
  let html = read('index.html');
  html = html.replace(/<link rel="stylesheet" href="\/?(css\/[\w.-]+\.css)(?:\?[^"]*)?">/g, (_, file) => {
    const css = transformSync(read(file), {loader: 'css', minify: true}).code;
    return '<style>' + css + '</style>';
  });
  html = html.replace(/<script src="\/(js\/theme-toggle\.js)\?[^"]+"><\/script>/, (_, file) =>
    '<script>' + transformSync(read(file), {minify: true}).code + '</script>');
  const assets = new Map();
  html = html.replace(/(?:<script src="js\/[\w.-]+\.js\?[^"]+"><\/script>\s*){2,}/g, (group) => {
    const files = Array.from(group.matchAll(/src="(js\/[^"?]+)\?/g), match => match[1]);
    const appIndex = files.findIndex(file => file.startsWith('js/app-'));
    const groups = appIndex > 0 ? [files.slice(0, appIndex), files.slice(appIndex)] : [files];
    return groups.map(files => {
      const scripts = files.map(file => {
        const source = read(file);
        if (file !== 'js/model-details.js') return source;
        // The homepage table and comparison only display the licence and developer.
        const details = vm.runInNewContext(source + '\n;MODEL_DETAILS', {}, {filename: file});
        const summary = Object.fromEntries(Object.entries(details).map(([id, {license, developer}]) =>
          [id, {license, developer}]));
        return 'const MODEL_DETAILS = ' + JSON.stringify(summary);
      });
      const bundle = transformSync(scripts.join('\n;\n'), {minify: true, target: 'es2020'}).code;
      const version = createHash('sha256').update(bundle).digest('hex').slice(0, 16);
      const file = 'js/home-' + version + '.js';
      assets.set(file, bundle);
      return '<script src="/' + file + '"></script>';
    }).join('\n') + '\n';
  });
  assets.set('index.html', html);
  return assets;
}

module.exports = {homePageAssets};
