import argparse
from pathlib import Path
import re
import sys

import tankerci
import tankerci.js


class TestFailed(Exception):
    pass


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


def run_linters() -> None:
    tankerci.js.run_yarn("flow")
    tankerci.js.run_yarn("lint:js")


def run_tests_in_node() -> None:
    tankerci.js.run_yarn("coverage")


def check() -> None:
    tankerci.js.yarn_install_deps()
    run_linters()
    run_tests_in_node()


def deploy_sdk(*, env: str, git_tag: str) -> None:
    tankerci.js.yarn_install_deps()
    version = tankerci.bump.version_from_git_tag(git_tag)
    tankerci.bump.bump_files(version)

    tankerci.js.yarn_build(delivery="identity", env=env)
    publish_npm_package("@tanker/identity", version)


def _main() -> None:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(title="subcommands", dest="command")

    subparsers.add_parser("check")

    deploy_parser = subparsers.add_parser("deploy")
    deploy_parser.add_argument("--git-tag", required=True)
    deploy_parser.add_argument("--env", required=True)

    args = parser.parse_args()
    if args.command == "check":
        check()
    elif args.command == "deploy":
        git_tag = args.git_tag
        deploy_sdk(env=args.env, git_tag=git_tag)
    else:
        parser.print_help()
        sys.exit(1)


def main():
    # hide backtrace when tests fail
    try:
        _main()
    except TestFailed:
        sys.exit(1)
    except Exception:
        raise


if __name__ == "__main__":
    main()
