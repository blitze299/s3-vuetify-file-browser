<template>
  <v-card
    flat
    tile
    height="70vh"
    width="100%"
    class="d-flex flex-column scroll-x"
  >
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
        <v-subheader>Dateien</v-subheader>
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
              formatBytes(item.elem.Size._text) +
                " - " +
                formatDateFromString(item.elem.LastModified._text)
            }}</v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <v-row>
              <v-btn icon @click.stop="deleteItem(item)">
                <v-icon color="grey lighten-1">mdi-delete-outline</v-icon>
              </v-btn>
              <v-btn icon @click.stop="downloadItem(item)">
                <v-icon color="grey lighten-1">mdi-download</v-icon>
              </v-btn>
            </v-row>
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
      <!--v-text-field
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
      </v-btn-->
      <v-spacer></v-spacer>
      <v-btn icon @click="load">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </v-toolbar>
  </v-card>
</template>

<script>
import {
  formatBytes,
  getFileEnding,
  formatDateFromString,
  filterData,
  removeFirstElementFromPath,
} from "./util";
import Confirm from "./Confirm.vue";

export default {
  props: {
    filestructure: Array,
    icons: Object,
    path: String,
    endpoints: Object,
    axios: Function,
    refreshPending: Boolean,
  },
  components: {
    Confirm
  },
  data() {
    return {
      items: [],
      filter: "",
      downloadPath: "",
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
        filterData(this.filestructure, "path", this.path).type === "folder"
      );
    },
    isFile() {
      return filterData(this.filestructure, "path", this.path).type === "file";
    },
  },
  async updated() {
    console.warn(this.path.split("/").length > 1);
    console.warn(this.isFile);
    if (this.path.split("/").length > 1 && this.isFile) {
      //load file
      this.downloadPath = await this.getDownloadItemFromPath(this.path);
    }
  },
  methods: {
    formatDateFromString,
    formatBytes,
    getFileEnding,
    changePath(path) {
      this.$emit("path-changed", path);
    },
    load() {
      this.$emit("loadData");
    },
    async deleteItem(item) {
      let confirmed = await this.$refs.confirm.open(
        "Löschen",
        `Soll  ${item.type === "folder" ? "der Ordner" : "die Datei"}<br><em>${
          item.name
        }</em><br>wirklich gelöscht werden?`
      );

      if (confirmed) {
        this.$emit("loading", true);
        //emit delete event
        this.$emit("deleteItem", item);
        this.$emit("file-deleted");
        this.$emit("loading", false);
      }
    },

    getFileEndingUrl(string) {
      const splitStringDot = string.split(".");
      const ndSplit = splitStringDot[splitStringDot.length - 1].split("?");
      return ndSplit[0];
    },

    async downloadItem(item) {
      //open url to download file
      window.open(await this.getDownloadItemLink(item), "_blank");
    },

    async getDownloadItemFromPath(path) {
      const item = filterData(this.filestructure, "path", path);
      const link = await this.getDownloadItemLink(item);
      return link;
    },

    async getDownloadItemLink(item) {
      //upload path
      const formPath = removeFirstElementFromPath(item.path);
      //get download url
      const downloadUrl = await this.axios.request({
        url: this.endpoints.download.url + "?path=" + formPath,
        method: "get",
      });
      return downloadUrl.data.url;
    },

    filterDirsAndFiles(type) {
      if (this.filestructure.length > 0) {
        let filteredDirs = [];
        const data = filterData(this.filestructure, "path", this.path);
        if (data) {
          data.children.forEach((r) => {
            //chef if item is object or directory
            if (r.type === type) {
              filteredDirs.push(r);
            }
          });
        }
        return filteredDirs;
      }
    },
  },
  watch: {
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

.scroll-x {
  overflow-x: auto;
}
</style>
