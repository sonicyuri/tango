# tango

A work-in-progress drop-in replacement for [Shimmie](https://github.com/shish/shimmie2). Not yet ready for daily use.

## Motivations

For years, I've run a personal instance of Shimmie for my own use. Instead of taking a bunch of pictures or downloading a bunch of memes and just leaving them in the camera roll on my phone, hardly to be looked at again, I can instead import them into Shimmie, tag them, and find them again when I think "Oh, I know I have an image for that somewhere!"

Tango grew out of a desire to have a mobile frontend to Shimmie. I originally wrote a slapdash React interface using Shimmie's shimmie_api extension, but the API was read-only and so the frontend was too. Tango started as a rewrite of that client. As I needed more features, I edited the API extension to add new endpoints and modify existing ones. Eventually, I began to write my own API server that interacted with the Shimmie database directly - first in Node, then in Rust. The goal is to eventually do away with needing a Shimmie installation entirely, with Tango replacing all its duties.

## Components

- [client](https://github.com/azrogers/tango/tree/master/client) - a React-based SPA frontend for the Tango/Shimmie API.
- [server](https://github.com/azrogers/tango/tree/master/server) - a REST API server written in Rust that interacts with an existing Shimmie database.

## Requirements

The client and server have READMEs in their respective folders on their specific requirements. As a whole, to run the full Tango stack, you'll need:

- A MySQL database
- An installation of Shimmie running somewhere, with the shimmie_api extension enabled and the appropriate `Access-Control-Allow-Origin` headers present.
- The ability to compile and run a Rust application.
- The ability to build a Vite (React) application.
- A Nginx server to forward requests to the Tango server and serve the files for the frontend.

*__Currently, Tango will not work on your version of Shimmie.__* While the only remaining endpoint using the shimmie_api extension is the find_images_v2 endpoint, that's both a fairly difficult endpoint to rewrite (requiring a query engine capable of taking tags and turning them into SQL queries) and also a custom endpoint that I've added to my own installation of Shimmie. Rather than distributing my modification of that extension for others to use, I've started work on replacing that endpoint with Tango. It is, however, a work in progress.