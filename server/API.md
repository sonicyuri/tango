# Tango API

By default, Tango mounts all of its endpoints on `/api`, so that `/` can serve the Tango client. All of the endpoints in this doc are specified relative to `/api`. Every endpoint returns responses in the following form:
```
{
  "type": "success",
  "result": <api result>
}
// or
{
  "type": "error",
  "message": "<error message>"
}
```

Each endpoint will have its return type specified as the `result` portion of a `success` type response.

### Note on Authorization

Some endpoints require authorization. An access token can be obtained from the `/user/login` endpoint. This can optionally return a refresh token, which has a longer expiration and can be passed to the `/user/refresh` endpoint to obtain a new access token. Access tokens should be included in request headers in the form `Authorization: Bearer <access token>`.

## Favorites

### GET /favorite/list

**Requires authorization.**

Returns an array of each post ID in the currently authorized user's favorites.

#### Response

```[ ... array of post IDs as strings ... ]```

### POST /favorite/set

**Requires authorization.**

Adds or removes a post from the currently authorized user's favorites. Returns the currently authorized user's favorites after the update.

#### Request Body
The body should be a JSON document in the form:
```
{
  "post_id": "<the ID of the post>",
  "action": <"set" to favorite or "unset" to unfavorite>
}
```

#### Response
```[ ... array of post IDs as strings ... ]```

## Import

### POST /import/prepare

**Requires authorization.**

Obtains information on a URL on a supported remote service so that it can be imported as a new post or as new information for a current post. 

#### Request Body
The body should be a JSON document in the form:
```
{
  "url": "<the URL to import>"
}
```

#### Response
```
{
  "image_url": "<the URL of the image that should be imported>",
  "service": "<the ID of the service the URL is importing from>",
  "tags": [ ... array of strings for each tag on the imported post ... ]
}
```

### GET /import/resolve

**Requires authorization.**

Obtains a list of every supported resolver. Resolvers look up existing posts on reverse image search services.

#### Response
```
[
  {
    "id": "<resolver id>",
    "name": "<resolver friendly name>",
    "services": [
      ... array of strings of service IDs ...
    ]
  },
  ...
]
```

### POST /import/resolve

**Requires authorization.**

Uses a resolver to look up an existing post on reverse image-search services. Currently, only image posts are supported.

#### Request Body

The body should be a JSON document in the form:
```
{
  "resolver": "<id of resolver to use>",
  "post_id": "<id of post to resolve>"
}
```

#### Response
```
[
  {
    "score": <normalized float from 0 to 1 representing match>,
    "service": "<id of service the matched image is on>",
    "thumbnail_url": "<url of a thumbnail for the matched image>",
    "url": "<url of the matched image that can be passed to /import/prepare>"
  },
  ...
]
```

## Posts

### POST /post/edit

**Requires authorization.**

Sets the tags on an existing post. Returns the modified post after update.

#### Request Body
The body should be a JSON document in the form:
```
{
  "post_id": "<id of the post to modify>",
  "tags": [
    ...an array of strings of the image's new tags...
  ]
}
```

#### Response
```
{
  ... full post model including tags ...
}
```

## Tags

### GET /tag/list

**Requires authorization.**

Obtains the frequency of all tags currently in use, as well as the currently configured tag categories.

#### Response
```
{
  "tags": {
    "<tag name>": <tag frequency>,
    ...
  },
  "categories": [
    {
      "category": "<category prefix>",
      "color": "<hex code for category color>",
      "display_multiple": "<plural display name for category>",
      "display_singular": "<singular display name for category>"
    },
    ...
  ]
}
```

## User

Some endpoints return User models, which are in the form:
```
{
  "id": <integer user ID>,
  "name": "<username>",
  "joindate": "<ISO datetime string of the account's creation date>",
  "email": <a string of the user's email, or null>
}
```

### GET /user/config

**Requires authorization.**

Obtains the currently authorized user's user-specific config object. This can be used to store per-user frontend settings.

#### Response
```
{ ... the current config object ... }
```

### POST /user/config

**Requires authorization.**

Sets the currently authorized user's config. 

#### Request Parameters

- **replace** - if false, the new config is merged with the existing config. if true, it replaces it. true is default.

#### Request Body
The body should be a JSON document of the current user config object. The entirety of the given values will be stored as user config.

#### Response
```
{ ... the config object after modifications ... }
```

### GET /user/info

**Requires authorization.**

Returns the currently authorized user's model. This is a useful endpoint to hit to check the validity of an access token.

#### Response
```
{ ... the current user's model ... }
```

### POST /user/login

Obtains an access token using a username and password, and optionally a refresh token as well.

#### Request Body
The body should be a JSON document in the form:
```
{
  "username": "<the user's username>",
  "password": "<the user's password in plaintext>",
  "remember_me": <true to obtain a refresh token, false otherwise>
}
```

#### Response
```
{
  "user": { ... the current user's model ... }
  "access": {
    "expires": "<the ISO datetime string representing this token's expiration time>",
    "token": "<a JWT token to use for authorization>"
  },
  // if remember_me is true
  "refresh": {
    "expires": "<the ISO datetime string representing this token's expiration time>",
    "token": "<a JWT token to use for refreshing the access token>"
  }
}
```

### POST /user/refresh

Takes a valid refresh token and returns a new access token.

#### Request Body
The body should be a JSON document in the form:
```
{
  "refresh_token": "<valid refresh token obtained from /user/login>"
}
```

#### Response
```
{
  "access": { ... same form as in /user/login ... },
  "user": { ... the user's model ... }
}
```