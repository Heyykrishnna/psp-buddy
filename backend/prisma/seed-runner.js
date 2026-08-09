const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const outputDir = path.join(__dirname, '.seed-build');
fs.mkdirSync(outputDir, { recursive: true });

for (const fileName of ['learning-path.seed.ts', 'seed.ts']) {
  const sourcePath = path.join(__dirname, fileName);
  const outputPath = path.join(outputDir, fileName.replace(/\.ts$/, '.js'));
  const source = fs.readFileSync(sourcePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });
  fs.writeFileSync(outputPath, result.outputText, 'utf8');
}

require(path.join(outputDir, 'seed.js'));
