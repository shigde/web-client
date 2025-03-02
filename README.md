# Shig Web Client

The **Shig Web Client** is the official and reliable frontend of the Shig Federative Service, making access simple and efficient.

## Development

```shell
npm install
npm start
```

Navigate to `http://localhost:4200/`.


## Shig Instance as a Dependency

The web client essentially serves as a frontend for a Shig instance; therefore, it requires one. 

Please clone and run the Shig service project. https://github.com/shigde/shig

Now you can lunch the Shig Web Client

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



