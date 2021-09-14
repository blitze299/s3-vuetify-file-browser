# S3 Vuetify File Browser

Open source file manager component for Vue.js. Requires Vuetify v2.0 or higher.

This version uses S3 [presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/ShareObjectPreSignedURL.html) to list, get, upload data an create folders.

All presigned URLs must be signed by a server with secure access to S3, they are then fetched from the endpoints.

Forked from: [here](https://github.com/semeniuk/vuetify-file-browser)

## Usage

```

npm i s3-vuetify-file-browser

```

```html
<template>
  <file-browser :endpoints="endpoints" />
</template>

<script>
  import FileBrowser from "s3-vuetify-file-browser";

  export default {
    data: () => ({
      endpoints: {
        list: {
          url: "document/url",

          method: "get",
        },

        upload: {
          url: "document/uploadurl",

          method: "put",
        },

        download: {
          url: "document/downloadurl",

          method: "get",
        },

        download: {
          url: "document",

          method: "delete",
        },
      },
    }),

    components: {
      FileBrowser,
    },
  };
</script>
```
