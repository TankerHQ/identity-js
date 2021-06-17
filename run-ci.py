import argparse
from pathlib import Path
import re
import sys

import tankerci
import tankerci.js


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
    package_path = get_package_path(package_name)
    npm_tag = version_to_npm_tag(version)
    tankerci.run(
        "npm", "publish", "--access", "public", "--tag", npm_tag, cwd=package_path
    )


def deploy_sdk(*, git_tag: str) -> None:
    tankerci.js.yarn_install_deps()
    version = tankerci.bump.version_from_git_tag(git_tag)
    tankerci.bump.bump_files(version)

    tankerci.js.yarn_build(delivery="identity", env="prod")
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
