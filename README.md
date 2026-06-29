# Shig Web Client

The **Shig Web Client** is the official and reliable frontend of the Shig Federative Service, making access simple and efficient.

## Development

Create a local runtime configuration first:

```shell
cp .env.example .env
```

Adjust `.env` for your local Shig setup:

```env
SHIG_API_PREFIX=/api
SHIG_RELAY_SERVICE=http://relay.example.com
```

Then install dependencies and start the development server:

```shell
npm install
npm start
```

Navigate to `http://localhost:4200/`.

### Runtime Configuration

The web client is a static Angular application and is commonly served by Nginx. Because the browser cannot read server-side environment variables directly, this project generates a runtime config file:

```text
.env -> src/assets/env.js
```

`npm start` and `npm run build` automatically run:

```shell
npm run generate-env
```

This creates `src/assets/env.js`, which is loaded by `src/index.html` before Angular starts.

Open-source users usually only need to change these values:

| Variable | Default                      | Description                                                                                                                        |
|----------|------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `SHIG_API_PREFIX` | `/api`                       | Base path or URL for the Shig REST API. Use `/api` when Nginx proxies API requests to the Shig backend.                            |
| `SHIG_RELAY_SERVICE` | `http://localhost:4443/live` | URL for MoQ relay default service. |

For local development against a local Shig backend, a typical `.env` is:

```env
SHIG_API_PREFIX=/api
SHIG_RELAY_SERVICE=http://localhost:4443/live
```

For a setup where services are exposed on explicit URLs, use:

```env
SHIG_API_PREFIX=https://web.example.org/api
SHIG_RELAY_SERVICE=https://relay.example.org/live
```

Do not commit `.env`; it is intentionally ignored. Commit `.env.example` when the documented defaults change.

### Static Nginx Deployment

For production you can either generate `src/assets/env.js` during the build, or replace `assets/env.js` when the container starts.

The generated file looks like this:

```js
window.__SHIG_CONFIG__ = {
  apiPrefix: "/api",
  relayService: "https://relay.example.org"
};
```

This lets the same static Angular build run in different environments by changing only `assets/env.js`.


## Shig Instance as a Dependency

The web client essentially serves as a frontend for a Shig instance; therefore, it requires one. 

Please clone and run the Shig service project. https://github.com/shigde/shig

Now you can launch the Shig Web Client.

## Develop with shig js sdk

### Setup, Build and Link the shig-js-sdk

```shell
git clone https://github.com/shigde/shig-js-sdk.git
cd shig-js-sdk
npm run watch
cd dist/core
npm link
```

### Setup project with linked shig-js-sdk

The Shig WebClient is a good place to develop the SDK as well.
To set up a develop environment for the SDK fallow the next steps.

```shell
cd web-client
npm i @shigde/core
npm start
```

Have Fun!


