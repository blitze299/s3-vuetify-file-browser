<template>
  <v-card flat tile min-height="380" class="d-flex flex-column">
    <confirm ref="confirm"></confirm>
    <v-card-text
      v-if="!path"
      class="grow d-flex justify-center align-center grey--text"
      >Wähle einen Ordner oder eine Datei aus</v-card-text
    >
    <v-card-text
      v-else-if="isFile"
      class="grow d-flex justify-center align-center"
      >Datei: {{ path }}</v-card-text
    >
    <v-card-text v-else-if="dirs.length || files.length" class="grow">
      <v-list subheader v-if="dirs.length">
        <v-subheader>Ordner</v-subheader>
        <v-list-item
          v-for="item in dirs"
          :key="item.path"
          @click="changePath(item.path)"
          class="pl-0"
        >
          <v-list-item-avatar class="ma-0">
            <v-icon>mdi-folder-outline</v-icon>
          </v-list-item-avatar>
          <v-list-item-content class="py-2">
            <v-list-item-title v-text="item.name"></v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-btn icon @click.stop="deleteItem(item)">
              <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
            </v-btn>
            <v-btn icon v-if="false">
              <v-icon color="grey lighten-1">mdi-information</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
      <v-divider v-if="dirs.length && files.length"></v-divider>
      <v-list subheader v-if="files.length">
        <v-subheader>Files</v-subheader>
        <v-list-item
          v-for="item in files"
          :key="item.path"
          @click="changePath(item.path)"
          class="pl-0"
        >
          <v-list-item-avatar class="ma-0">
            <v-icon>{{ icons[getFileEnding(item.name)] }}</v-icon>
          </v-list-item-avatar>

          <v-list-item-content class="py-2">
            <v-list-item-title v-text="item.name"></v-list-item-title>
            <v-list-item-subtitle>{{
              formatBytes(item.elem.Size._text)
            }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn icon @click.stop="deleteItem(item)">
              <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
            </v-btn>
            <v-btn icon v-if="false">
              <v-icon color="grey lighten-1">mdi-information</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-text
      v-else-if="filter"
      class="grow d-flex justify-center align-center grey--text py-5"
      >Keine Dateien oder Ordner gedunden</v-card-text
    >
    <v-card-text
      v-else
      class="grow d-flex justify-center align-center grey--text py-5"
      >Dieser Ordner ist leer</v-card-text
    >
    <v-divider v-if="path"></v-divider>
    <v-toolbar v-if="false && path && isFile" dense flat class="shrink">
      <v-btn icon>
        <v-icon>mdi-download</v-icon>
      </v-btn>
    </v-toolbar>
    <v-toolbar v-if="path && isDir" dense flat class="shrink">
      <v-text-field
        solo
        flat
        hide-details
        label="Filter"
        v-model="filter"
        prepend-inner-icon="mdi-filter-outline"
        class="ml-n3"
      ></v-text-field>
      <v-btn icon v-if="false">
        <v-icon>mdi-eye-settings-outline</v-icon>
      </v-btn>
      <v-btn icon @click="load">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>
  </v-card>
</template>

<script>
import { formatBytes, getFileEnding } from "./util";
import Confirm from "./Confirm.vue";

export default {
  props: {
    filestructure: Array,
    icons: Object,
    storage: String,
    path: String,
    endpoints: Object,
    axios: Function,
    refreshPending: Boolean,
  },
  components: {
    Confirm,
  },
  data() {
    return {
      items: [],
      filter: "",
    };
  },
  computed: {
    dirs() {
      return this.filterDirsAndFiles("folder");
    },
    files() {
      return this.filterDirsAndFiles("file");
    },
    isDir() {
      return (
        this.filterData(this.filestructure, "path", this.path).type === "folder"
      );
    },
    isFile() {
      return (
        this.filterData(this.filestructure, "path", this.path).type === "file"
      );
    },
  },
  methods: {
    formatBytes,
    getFileEnding,
    changePath(path) {
      this.$emit("path-changed", path);
    },
    load() {
      this.$emit("loading", true);
      if (this.isDir) {
        /*let url = this.endpoints.list.url
          .replace(new RegExp("{storage}", "g"), this.storage)
          .replace(new RegExp("{path}", "g"), this.path);

        let config = {
          url,
          method: this.endpoints.list.method || "get",
        };

        let response = await this.axios.request(config);
        this.items = response.data;*/
        //console.warn(this.path);
      } else {
        // TODO: load file
      }
      this.$emit("loading", false);
    },
    async deleteItem(item) {
      let confirmed = await this.$refs.confirm.open(
        "Delete",
        `Are you sure<br>you want to delete this ${
          item.type === "folder" ? "folder" : "file"
        }?<br><em>${item.basename}</em>`
      );

      if (confirmed) {
        this.$emit("loading", true);
        let url = this.endpoints.delete.url
          .replace(new RegExp("{storage}", "g"), this.storage)
          .replace(new RegExp("{path}", "g"), item.path);

        let config = {
          url,
          method: this.endpoints.delete.method || "post",
        };

        await this.axios.request(config);
        this.$emit("file-deleted");
        this.$emit("loading", false);
      }
    },

    filterData(object, key, value) {
      if (Array.isArray(object)) {
        for (const obj of object) {
          const result = this.filterData(obj, key, value);
          if (result) {
            return result;
          }
        }
      } else {
        if (object.hasOwnProperty(key) && object[key] === value) {
          return object;
        }

        for (const k of Object.keys(object)) {
          if (typeof object[k] === "object") {
            const o = this.filterData(object[k], key, value);
            if (o !== null && typeof o !== "undefined") return o;
          }
        }
        return null;
      }
    },
    filterDirsAndFiles(type) {
      if (this.filestructure.length > 0) {
        let filteredDirs = [];
        //return directorys
        const data = this.filterData(this.filestructure, "path", this.path);
        if (data) {
          data.children.forEach((r) => {
            //chef if item is object or directory
            if (r.type === type) {
              filteredDirs.push(r);
            }
          });
        }
        console.log(filteredDirs);
        return filteredDirs;
      }
    }
  },
  watch: {
    async path() {
      this.items = [];
      await this.load();
    },
    async refreshPending() {
      if (this.refreshPending) {
        await this.load();
        this.$emit("refreshed");
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.v-card {
  height: 100%;
}
</style>
