const { context } = require("esbuild");
const { resolve } = require("path");
const { existsSync } = require("fs");
const { copy } = require("esbuild-plugin-copy");

const isProd = process.argv.indexOf('--mode=production') >= 0;
const dependencies = [];

async function main() {
    const ctx = await context({
        entryPoints: ['./src/extension.ts'],
        bundle: true,
        outfile: "out/extension.js",
        external: ['vscode', ...dependencies],
        format: 'cjs',
        platform: 'node',
        metafile: true,
        minify: isProd,
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
                        console.log('build start');
                    });
                    build.onEnd(() => {
                        console.log('build success');
                    });
                }
            },
        ],
    });

    if (!isProd) {
        // Enable watch mode
        await ctx.watch();
    } else {
        // Just build once
        await ctx.rebuild();
        setTimeout(() => process.exit(0), 100);
    }
}

main();
