<template>
  <v-toolbar flat dense color="blue-grey lighten-5">
    <v-toolbar-items>
      <v-btn text>
        <v-icon class="mr-2">mdi-cloud</v-icon>
      </v-btn>
      <template v-for="(segment, index) in pathSegments">
        <v-icon :key="index + '-icon'">mdi-chevron-right</v-icon>
        <v-btn
          text
          :input-value="index === pathSegments.length - 1"
          :key="index + '-btn'"
          @click="changePath(segment.path)"
          ><div v-if="index != 0">{{ segment.name }}</div>
          <div v-else>Dateien</div></v-btn
        >
      </template>
    </v-toolbar-items>
    <div class="flex-grow-1"></div>

    <template v-if="$vuetify.breakpoint.smAndUp">
      <v-tooltip bottom v-if="pathSegments.length > 0">
        <template v-slot:activator="{ on }">
          <v-btn icon @click="goUp" v-on="on">
            <v-icon>mdi-arrow-up-bold-outline</v-icon>
          </v-btn>
        </template>
        <span v-if="pathSegments.length <= 2">Nach oben</span>
        <span v-else>
          Nach oben "{{ pathSegments[pathSegments.length - 2].name }}"</span
        >
      </v-tooltip>
      <v-menu
        v-if="path && isFolder(path)"
        v-model="newFolderPopper"
        :close-on-content-click="false"
        :nudge-width="200"
        offset-y
      >
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" title="Create Folder">
            <v-icon>mdi-folder-plus-outline</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-text>
            <v-text-field
              label="Name"
              v-model="newFolderName"
              hide-details
            ></v-text-field>
          </v-card-text>
          <v-card-actions>
            <div class="flex-grow-1"></div>
            <v-btn @click="newFolderPopper = false" depressed>zurück</v-btn>
            <v-btn
              color="secondary"
              :disabled="!newFolderName"
              depressed
              @click="mkdir(newFolderName)"
              >Ordner erstellen</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-menu>
      <v-btn
        v-if="path && isFolder(path)"
        icon
        @click="$refs.inputUpload.click()"
        title="Upload Files"
      >
        <v-icon>mdi-plus-circle</v-icon>
        <input
          v-show="false"
          ref="inputUpload"
          type="file"
          multiple
          @change="addFiles"
        />
      </v-btn>
    </template>
  </v-toolbar>
</template>

<script>
import { filterData, removeFirstElementFromPath } from "./util";

export default {
  props: {
    path: String,
    endpoints: Object,
    filestructure: Array,
    axios: Function
  },
  data() {
    return {
      newFolderPopper: false,
      newFolderName: ""
    };
  },
  computed: {
    pathSegments() {
      let path = "/";
      let isFolder = this.path[this.path.length - 1] === "/";
      let segments = this.path.split("/").filter(item => item);

      segments = segments.map((item, index) => {
        path += item + (index < segments.length - 1 || isFolder ? "/" : "");
        return {
          name: item,
          path
        };
      });

      return segments;
    }
  },
  methods: {
    changePath(path) {
      this.$emit("path-changed", path);
    },
    goUp() {
      let segments = this.pathSegments;
      let path =
        segments.length === 1 ? "/" : segments[segments.length - 2].path;
      this.changePath(path);
    },
    async addFiles(event) {
      this.$emit("add-files", event.target.files);
      this.$refs.inputUpload.value = "";
    },
    async mkdir(name) {
      this.$emit("loading", true);
      //create folder placeholder file blob
      const blob = new Blob([], {
        type: "text/plain"
      });
      const formPath = removeFirstElementFromPath(this.path);
      const upPath = formPath + name + "/placeholder";
      //get upload url
      const uploadUrl = await this.axios.request({
        url: this.endpoints.upload.url + "?path=" + upPath,
        method: "get"
      });
      //use upload url to upload files
      let config = {
        url: uploadUrl.data.url,
        method: this.endpoints.upload.method,
        data: blob
      };
      await this.axios.request(config);
      this.$emit("folder-created", this.newFolderName);
      this.newFolderPopper = false;
      this.newFolderName = "";
      this.$emit("loading", false);
    },
    isFolder(path) {
      return filterData(this.filestructure, "path", path).type === "folder";
    }
  }
};
</script>

<style lang="scss" scoped>
/* Storage Menu - alternate appearance
.storage-select-button ::v-deep .v-btn__content {
    flex-wrap: wrap;
    font-size: 11px;

    .v-icon {
        width: 100%;
        font-size: 22px;
    }
}
*/

.storage-select-list .v-list-item--disabled {
  background-color: rgba(0, 0, 0, 0.25);
  color: #fff;

  .v-icon {
    color: #fff;
  }
}
</style>
