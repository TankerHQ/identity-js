[license-badge]: https://img.shields.io/badge/License-Apache%202.0-blue.svg
[license-link]: https://opensource.org/licenses/Apache-2.0

[actions-badge]: https://github.com/TankerHQ/identity-js/actions/workflows/tests.yml/badge.svg
[actions-link]: https://github.com/TankerHQ/identity-js/actions/workflows/tests.yml

[codecov-badge]: https://img.shields.io/codecov/c/github/TankerHQ/identity-js.svg?label=Coverage
[codecov-link]: https://codecov.io/gh/TankerHQ/identity-js

[last-commit-badge]: https://img.shields.io/github/last-commit/TankerHQ/identity-js.svg?label=Last%20commit&logo=github
[last-commit-link]: https://github.com/TankerHQ/identity-js/commits/master

[identity_npm-badge]: https://img.shields.io/npm/v/@tanker/identity.svg
[identity_npm-link]: https://npmjs.com/package/@tanker/identity

<a href="#readme"><img src="https://raw.githubusercontent.com/TankerHQ/spec/master/img/tanker-logotype-blue-nomargin-350.png" alt="Tanker logo" width="175" /></a>

[![License][license-badge]][license-link]
[![Build][actions-badge]][actions-link]
[![Coverage][codecov-badge]][codecov-link]
[![@tanker/identity](identity_npm-badge)](identity_npm-link)

# Encryption SDKs for JavaScript

[Overview](#overview) · [Identity](#identity-management) · [Contributing](#contributing) · [License](#license)

## Overview

Tanker is an open-source solution to protect sensitive data in any application, with a simple end-user experience and good performance. No cryptographic skills are required to implement it.

## Identity management

End-to-end encryption requires that all users have cryptographic identities. The following packages help to handle them:

Tanker **Identity** is a server side package to link Tanker identities with your users in your application backend.
It is available in multiple languages. This repository only contains the Javascript version.

| Package | Version |
|:--------|:--------|
| [@tanker/identity][identity_npm-link]    | [![identity_npm-badge]][identity_npm-link]   |

## Contributing

We welcome feedback, [bug reports](https://github.com/TankerHQ/identity-js/issues), and bug fixes in the form of [pull requests](https://github.com/TankerHQ/identity-js/pulls).

To build the JavaScript SDKs yourself, please follow the steps below.

### Prerequisites

Install [Yarn](https://yarnpkg.com/en/docs/install) version 1.0 or greater.

Use this command to check the Yarn version installed on your system:
```bash
yarn -v
```

### Install dependencies

Clone this repository:
```bash
git clone https://github.com/TankerHQ/identity-js.git
```

Install dependencies:
```bash
cd identity-js && yarn
```

### Test and lint

Our codebase uses the following ES6 features: `async` / `await`, `import` / `export`, and classes with flow for type-checking and with eslint for linting.

To check that the code is correct and to launch the tests in Node.js, use:

```bash
yarn proof
```

### Submit your pull request

Before submitting your pull request, please make sure that your changes pass the linters and that all the tests pass on your local machine.

For non-trivial changes, we highly recommend including extra tests.

When you're ready, submit your [pull request](https://github.com/TankerHQ/identity-js/pulls), targeting the `master` branch of this repository.

## License

The Tanker Identity SDK is licensed under the [Apache License, version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
