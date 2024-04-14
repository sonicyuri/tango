# tango

A Booru-style imageboard intended for self-hosting.

## Components

- [client](https://github.com/sonicyuri/tango/tree/master/client) - a React-based SPA frontend for the Tango API.
- [server](https://github.com/sonicyuri/tango/tree/master/server) - a backend REST API server written in Rust.

## Requirements

The client and server have READMEs in their respective folders on their specific requirements. As a whole, to run the full Tango stack, you'll need:

- A MySQL database
- The ability to compile and run a Rust application.
- The ability to build a Vite (React) application.
- A Nginx server to forward requests to the Tango server and serve the files for the frontend.