// orval.config.cjs

/** @type {import('orval').OrvalConfig} */
const config = {
    api: {
        input: 'https://api.gds42.ai/openapi/gds42.yaml',
        output: {
            target: './src/api/generated/api.ts',
            client: 'react-query',
            mode: 'split',
            prettier: true,
            baseUrl: '/', // твой backend
        },
    },
};

module.exports = config;


