const { config } = require("@swc/core/spack");

module.exports = config({
    entry: {
        index: __dirname + "/src/ts/index.ts",
        render: __dirname + "/src/ts/render.ts",
    },
    output: {
        path: __dirname + "/dist",
    },

    options: {
        jsc: {
            parser: {
                syntax: "typescript",
                tsx: false,
                topLevelAwait: true,
            },
            minify: {
                compress: {
                    unused: true
                },
                mangle: true
            },
            target: "es2015",
        }
    }
});
