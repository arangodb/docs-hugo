#!/usr/bin/env python3
"""Tag the documentation publications of past ArangoDB releases (one-off).

Going forward, the release workflow of ArangoDB releases tags the deployed commit
as v<version> (tag-release job in .circleci/base_config.yml). This script creates
the same tags for the releases before that, which were all published with the
release workflow too: its pull requests have branches named
RELEASE_<version>-<build number>, and their merge commits are tagged, e.g. v3.12.12.
If the workflow ran more than once for a version (e.g. to fix the generated
content), the last pull request is the publication.

Releases without a release workflow run aren't tagged, like hotfix releases
(e.g. 3.12.10-1) that only add release notes, docs releases (plain builds), and
the releases published with the former Jekyll toolchain (up to 3.11.3 and 3.10.10).
Existing tags are left as they are.

Requires the GitHub CLI (gh). Usage (from the repository root):

    python3 toolchain/scripts/tag-past-releases.py           # only list the tags
    python3 toolchain/scripts/tag-past-releases.py --push    # create and push them
"""
import argparse
import json
import os
import re
import subprocess
import sys

REPO = "arangodb/docs-hugo"
RELEASE_BRANCH = re.compile(r"^RELEASE_(\d+\.\d+\.\d+)-\d+$")


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout


def release_prs():
    """{version: (commit, date, number, title)} of the last merged release pull request per version"""
    out = subprocess.run(
        ["gh", "pr", "list", "-R", REPO, "--state", "merged", "--base", "main", "--limit", "5000",
         "--json", "number,title,headRefName,mergedAt,mergeCommit"],
        check=True, capture_output=True, text=True).stdout
    releases = {}
    for pr in sorted(json.loads(out), key=lambda pr: pr["mergedAt"]):
        match = RELEASE_BRANCH.match(pr["headRefName"])
        if not match:
            continue
        version = match.group(1)
        if version in releases:
            print(f"[INFO] {version}: #{pr['number']} replaces #{releases[version][2]} (another run of the release workflow)", file=sys.stderr)
        releases[version] = (pr["mergeCommit"]["oid"], pr["mergedAt"], pr["number"], pr["title"])
    return releases


def has_version(commit, version):
    try:
        return re.search(rf'^\s*version:\s*"{re.escape(version)}"', git("show", f"{commit}:site/data/versions.yaml"), re.M) is not None
    except subprocess.CalledProcessError:
        return False


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--remote", default="origin")
    parser.add_argument("--push", action="store_true", help="create the tags and push them")
    args = parser.parse_args()

    git("fetch", "-q", args.remote, "main")
    main_ref = f"{args.remote}/main"
    # The tags of the remote decide what is done, local tags that aren't pushed
    # yet (e.g. after a failed push) are reused if they are for the same commit
    remote_tags = {line.split("\t")[1][len("refs/tags/"):]
                   for line in git("ls-remote", "--tags", "--refs", args.remote).splitlines()}
    local_tags = set(git("tag", "-l").split())

    todo = []
    releases = release_prs()
    for version in sorted(releases, key=lambda v: tuple(int(x) for x in v.split("."))):
        commit, merged_at, number, title = releases[version]
        tag = f"v{version}"
        if subprocess.run(["git", "merge-base", "--is-ancestor", commit, main_ref]).returncode != 0:
            sys.exit(f"[ERROR] {commit} of #{number} ({version}) is not in {main_ref}")
        note = "" if has_version(commit, version) else "  (versions.yaml doesn't have the version)"
        if tag in remote_tags:
            state = "exists"
        elif tag in local_tags:
            if git("rev-parse", f"{tag}^{{commit}}").strip() != commit:
                sys.exit(f"[ERROR] The local tag {tag} isn't for {commit}, delete it (git tag -d {tag})")
            state = "local"
        else:
            state = "new"
        print(f"{tag:<10} {commit[:9]} {merged_at[:10]} {state:<6} #{number:<5} {title}{note}")
        if state != "exists":
            todo.append((tag, commit, merged_at, f"Pull request #{number}: {title}", state))

    if not args.push:
        print(f"\n{len(todo)} tags to push, run with --push to create and push them")
        return

    failed = []
    for tag, commit, merged_at, pr, state in todo:
        if state == "new":
            # Date the tags like the publications
            env = {**os.environ, "GIT_COMMITTER_DATE": merged_at}
            subprocess.run(["git", "tag", "-a", "--cleanup=whitespace", tag, "-m",
                            f"ArangoDB {tag[1:]} documentation release", "-m", pr, commit],
                           check=True, env=env)
        # One tag per push, GitHub rejects pushes with many tags
        result = subprocess.run(["git", "push", "-q", args.remote, f"refs/tags/{tag}"], capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[ERROR] Pushing {tag} failed:\n{result.stderr}", file=sys.stderr)
            failed.append(tag)
        else:
            print(f"Pushed {tag}")
    if failed:
        sys.exit(f"{len(failed)} tags not pushed: {' '.join(failed)} (run the script again)")
    print(f"Pushed {len(todo)} tags")

if __name__ == "__main__":
    main()
