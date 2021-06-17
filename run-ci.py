import argparse
from pathlib import Path
import re
import subprocess
import sys

import tbump
import tbump.config


def version_from_git_tag(git_tag: str) -> str:
    prefix = "v"
    assert git_tag.startswith(prefix), "tag should start with %s" % prefix
    cfg_file = tbump.config.get_config_file(Path.cwd())
    tbump_cfg = cfg_file.get_config()
    regex = tbump_cfg.version_regex
    version = git_tag[len(prefix) :]  # noqa
    match = regex.match(version)
    assert match, "Could not parse %s as a valid tag" % git_tag
    return version


def get_package_path(package_name: str) -> Path:
    m = re.match(r"^@tanker/(.*)$", package_name)
    p = Path("packages")
    assert m
    if m[1]:
        p = p.joinpath(m[1])
    return p.joinpath("dist")


def version_to_npm_tag(version: str) -> str:
    for tag in ["alpha", "beta"]:
        if tag in version:
            return tag
    return "latest"


def publish_npm_package(package_name: str, version: str) -> None:
    package_path = Path("packages/identity/dist")
    npm_tag = version_to_npm_tag(version)
    subprocess.run(
        ["npm", "publish", "--access", "public", "--tag", npm_tag],
        cwd=package_path,
        check=True,
    )


def deploy_sdk(*, git_tag: str) -> None:
    subprocess.run(["yarn", "install"], check=True)
    version = version_from_git_tag(git_tag)
    tbump.bump_files(version)
    subprocess.run(["yarn", "build:identity"], check=True)
    publish_npm_package("@tanker/identity", version)


def main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title="subcommands", dest="command")

    deploy_parser = subparsers.add_parser("deploy")
    deploy_parser.add_argument("--git-tag", required=True)

    args = parser.parse_args()
    if args.command == "deploy":
        deploy_sdk(git_tag=args.git_tag)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
