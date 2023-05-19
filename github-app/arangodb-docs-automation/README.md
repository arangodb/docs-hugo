# arangodb-docs-automation

> A GitHub App built with [Probot](https://github.com/probot/probot) that Probot app to automatically handle all new docs toolchain CI tasks

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t arangodb-docs-automation .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> arangodb-docs-automation
```

## Contributing

If you have suggestions for how arangodb-docs-automation could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2023 arangodb
