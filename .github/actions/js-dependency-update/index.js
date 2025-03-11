const core = require("@actions/core");
const exec = require("@actions/exec");
const github = require("@actions/github");

const validateBranchName = ({ branchName }) => {
  const regex = /^[a-zA-Z0-9_\-\.\/]+$/;
  return regex.test(branchName);
};

async function run() {
  const baseBranch = core.getInput("base-branch", { required: true });
  const targetBranch = core.getInput("target-branch", { required: true });
  const workingDirectory = core.getInput("working-directory", {
    required: true,
  });
  const ghToken = core.getInput("gh-token", { required: true });

  core.setSecret(ghToken);

  if (!validateBranchName({ branchName: baseBranch })) {
    return core.setFailed("Invalid base branch name.");
  }

  if (!validateBranchName({ branchName: targetBranch })) {
    return core.setFailed("Invalid target branch name.");
  }

  if (!validateBranchName({ branchName: workingDirectory })) {
    return core.setFailed("Invalid working directory name.");
  }

  core.info(`[js-dependency-update]: base-branch: ${baseBranch}`);
  core.info(`[js-dependency-update]: base-branch: ${targetBranch}`);
  core.info(`[js-dependency-update]: working-directory: ${workingDirectory}`);

  await exec.exec("npm update", [], {
    cwd: workingDirectory,
  });

  const gitStatus = await exec.getExecOutput(
    "git status -s package*.json",
    [],
    {
      cwd: workingDirectory,
    }
  );
  let updatesAvailable = false;
  if (gitStatus.stdout.length > 0) {
    updatesAvailable = true;
    core.info("[js-dependency-update]: There are some updates available!");
    await exec.exec('git config --global user.name "PR_BOT"');
    await exec.exec('git config --global user.email "PR_BOT@email.com"');
    await exec.exec(`git checkout -b ${targetBranch}`, [], {
      cwd: workingDirectory,
    });
    await exec.exec(`git add package.json package-lock.json`, [], {
      cwd: workingDirectory,
    });
    await exec.exec(`git commit -m "update dependencies"`, [], {
      cwd: workingDirectory,
    });
    await exec.exec(`git push -u origin ${targetBranch} --force`, [], {
      cwd: workingDirectory,
    });

    const octokit = github.getOctokit(ghToken);

    try {
      await octokit.rest.pulls.create({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        title: "Update NPM dependencies",
        body: "Update Body",
        base: baseBranch,
        head: targetBranch,
      });
    } catch (e) {
      core.error(
        `[js-dependency-update]: Something went wrong while creating PR.`
      );
      core.setFailed(e.message);
      core.error(e);
    }
  } else {
    core.info("[js-dependency-update]: There are no updates available!");
  }
  core.setOutput("updates-available", updatesAvailable);
}

run();
