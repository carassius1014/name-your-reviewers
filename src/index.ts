import * as core from '@actions/core';

async function run(): Promise<void> {
    core.info('Hello from nominator');
}

module.exports = {
    run,
};
