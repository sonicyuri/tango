<!-- @format -->

# tango-client

A responsive mobile-friendly frontend to the Tango/Shimmie booru using TypeScript, React, Redux, and Material UI.

## Requirements

-   Node.js version 18 or greater
-   Yarn package manager

## Setup

Clone this repository. Enter the `client` directory and run `yarn install`. Next, create a file named `config.json`. This specifies constants that will be built into the generated HTML. It should look something like this:

```
{
	"endpoints": {
		"v1": {
			"development": "https://your.server",
			"production": "https://your.server"
		},
		"v2": {
			"development": "https://tango.your.server/api",
			"production": "https://tango.your.server/api"
		}
	},
	"storage": {
		"type": "s3",
		"base_url": "https://s3.your_provider.com/bucket_name"
	}
}
```

The details of each config option are described below. Once you have your config file, the client can be run with `yarn start` and built with `yarn build`.

### Config Options

Note that URLs shouldn't have trailing slashes.

#### Endpoints

You must specify both a V1 and V2 endpoint. For each, multiple endpoints can be specified based on the value of NODE_ENV when `yarn build` is run. If the value of `NODE_ENV` can't be found in the config, the endpoint for `development` will be used. If no such environment exists in the config, the first environment specified will be used.

##### V1

This is the URL to the root of your Shimmie install. `/api/shimmie` should be able to be appended to your URL and point correctly to the shimmie_api extension. This will be removed in future versions.

##### V2

This is the URL of the root of the Tango REST API. By default, the Tango server's endpoints are mounted on `/api`, so that `/` can be used to serve the built Tango client. Include that `/api` in your endpoint.

#### Storage

This specifies where thumbnails and content files can be accessed.

##### base_url

This is where URLs for thumbnails and content should be relative to. The client will append `/images/<hash>` and `/thumbs/<hash>` to this value to generate content and thumbnail URLs, respectively.

##### type

The type of storage. The intention is that the `base_url` points to a public S3 or S3-compatible bucket, so `s3` is currently the only accepted value for this field. However, as this config is currently only used for generating URLs, the actual files can be stored anywhere.

## License

Tango Client

Copyright ©️ 2023 Ashley Rogers

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
