import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';
import { GitHub } from '@actions/github/lib/utils';
import * as YAML from 'js-yaml';

interface App {
    octokit: InstanceType<typeof GitHub>;
    context: Context;
}

interface Config {
    pattern: RegExp;
    members: string[];
}

interface ConfigGroup {
    groups: { [groupName: string]: Config }
}

async function fetchConfig(app: App, configPath: string): Promise<ConfigGroup> {
    const ctx = app.context;
    const { data: responseBody } = await app.octokit.rest.repos.getContent({
        owner: ctx.repo.owner,
        repo: ctx.repo.repo,
        path: configPath,
        ref: ctx.ref,
    });

    const yamlContent = Buffer.from((responseBody as { content: string }).content, "base64").toString();
    return YAML.load(yamlContent) as ConfigGroup;
}

async function run(): Promise<void> {
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    const context = github.context;

    if (context.payload.pull_request === undefined) {
        throw "Pull request number is null."
    }

    const configPath = core.getInput('config');
    const app = { octokit, context };

    const config = await fetchConfig(app, configPath);

    // await octokit.rest.pulls.requestReviewers({
    //     owner: context.repo.owner,
    //     repo: context.repo.repo,
    //     pull_number: context.payload.pull_request.number,
    //     reviewers: ["herpbot"],
    //     team_reviewers: [],
    // });

    core.info(JSON.stringify(config));
}

module.exports = {
    run,
}

if (process.env.NODE_ENV !== 'automated-testing') {
    run().catch((err) => {
        core.setFailed(err);
    })
}
