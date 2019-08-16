# Ujo Scare Release

Limited digital releases coming in hot.

## Getting Started

If you are developing locally you will need to run a local development blockchain, a redis instance (to store the metadata), and both the backend service and the front end application. Each should have their own terminal.

Please also complete the infomation on the `.env.example` for your own purposes.

```
$ docker run -p 6379:6379 redis // (or the like)
$ ganache-cli // (or the like)
...
$ npm start // (runs the backend)
...
$ npm dev // (runs the front end)
```

