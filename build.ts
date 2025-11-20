const { build } = require("esbuild")
const { resolve } = require("path")
const { existsSync } = require("fs")
const { copy } = require("esbuild-plugin-copy")

const isProd = process.argv.indexOf('--mode=production') >= 0;
const dependencies = ['highlight.js', 'katex', 'mustache']

function main() {
    build({
        entryPoints: ['./src/extension.ts'],
        bundle: true,
        outfile: "out/extension.js",
        external: ['vscode', ...dependencies],
        format: 'cjs',
        platform: 'node',
        // logLevel: 'error',
        metafile: true,
        // sourceRoot: __dirname+"/src",
        minify: isProd,
        watch: !isProd,
        sourcemap: !isProd,
        logOverride: {
            'duplicate-object-key': "silent",
            'suspicious-boolean-not': "silent",
        },
        plugins: [
            {
                name: 'build notice',
                setup(build) {
                    build.onStart(() => {
                        console.log('build start')
                    })
                    build.onEnd(() => {
                        console.log('build success')
                    })
                }
            },
        ],
    })
}

function createLib() {
    const points = dependencies.reduce((point, dependency) => {
        const main = require(`./node_modules/${dependency}/package.json`).main ?? "index.js";
        const mainAbsPath = resolve(`./node_modules/${dependency}`, main);
        if (existsSync(mainAbsPath)) {
            point[dependency] = mainAbsPath;
        }
        return point;
    }, {})
    build({
        entryPoints: points,
        bundle: true,
        outdir: "out/node_modules",
        format: 'cjs',
        platform: 'node',
        minify: true,
        treeShaking: true,
        metafile: true
    })
}

(async () => {
    createLib();
    main();
    if (isProd) {
        setTimeout(() => process.exit(0), 100);
    }
})();