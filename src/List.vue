<template>
  <v-card
    flat
    tile
    height="70vh"
    width="100%"
    class="d-flex flex-column scroll-x"
  >
    <confirm ref="confirm"></confirm>
    <share ref="share"></share>
    <v-snackbar v-model="shareSnackbar.open" :timeout="4000">
      {{ shareSnackbar.text }}

      <template v-slot:action="{ attrs }">
        <v-btn
          color="secondary"
          text
          v-bind="attrs"
          @click="copyToClipboard(shareSnackbar.link)"
        >
          Link kopieren
        </v-btn>
      </template>
    </v-snackbar>
    <v-card-text
      v-if="!path"
      class="grow d-flex justify-center align-center grey--text"
      >Wähle einen Ordner oder eine Datei aus</v-card-text
    >
    <v-card-text
      v-else-if="isFile"
      class="grow d-flex justify-center align-center"
    >
      <h4>Datei: {{ path }}</h4>
      <v-btn class="ml-1" icon @click.stop="getFileFromPath(path)">
        <v-icon color="grey darken-1">mdi-download</v-icon>
      </v-btn>
    </v-card-text>
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
            <v-btn
              icon
              :disabled="item.children.length > 0"
              @click.stop="deleteItem(item)"
            >
              <v-icon color="grey darken-1">mdi-delete-outline</v-icon>
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
                <v-icon color="grey darken-1">mdi-delete-outline</v-icon>
              </v-btn>
              <v-btn icon @click.stop="shareItem(item)">
                <v-icon color="grey darken-1">mdi-share-variant-outline</v-icon>
              </v-btn>
              <v-btn icon @click.stop="downloadItem(item)">
                <v-icon color="grey darken-1">mdi-download</v-icon>
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
import Share from "./Share.vue";

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
    Confirm,
    Share,
  },
  data() {
    return {
      items: [],
      filter: "",
      downloadPath: "",
      shareSnackbar: {
        open: false,
        text: "",
        link: "",
      },
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

    async shareItem(item) {
      let shared = await this.$refs.share.open(
        "Teilen",
        `Die Datei<br><em>${item.name}</em><br>wird geteilt und der Link in die Zwischenablage kopiert.<br>Der Link is <em>24 Stunden</em> gültig`
      );

      if (shared) {
        this.$emit("loading", true);
        //emit delete event
        //const formPath = removeFirstElementFromPath(item.path);
        /*await this.axios.request({
            url: this.endpoints.delete.url + "?path=" + formPath,
            method: this.endpoints.delete.method,
          });*/
        //upload path
        const formPath = removeFirstElementFromPath(item.path);
        //get download url
        const downloadUrl = await this.axios.request({
          url:
            this.endpoints.download.url + "?path=" + formPath + "&lifetime=24",
          method: "get",
        });
        //copy url to clipboard
        this.copyToClipboard(downloadUrl.data.url);
        this.shareSnackbar = {
          open: true,
          text: "Link erfolgreich in die Zwischenablage kopiert",
          link: downloadUrl.data.url,
        };
        this.$emit("loading", false);
      }
    },

    copyToClipboard(text) {
      navigator.clipboard.writeText(text);
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
        const formPath = removeFirstElementFromPath(item.path);
        if (item.type === "file") {
          await this.axios.request({
            url: this.endpoints.delete.url + "?path=" + formPath,
            method: this.endpoints.delete.method,
          });
        } else if (item.type === "folder") {
          await this.axios.request({
            url:
              this.endpoints.delete.url + "?path=" + formPath + "/placeholder",
            method: this.endpoints.delete.method,
          });
        }
        this.$emit("file-deleted");
        this.$emit("loading", false);
      }
    },

    getFileEndingUrl(string) {
      const splitStringDot = string.split(".");
      const ndSplit = splitStringDot[splitStringDot.length - 1].split("?");
      return ndSplit[0];
    },

    getFileFromPath(path) {
      //get item from path
      const item = filterData(this.filestructure, "path", path);
      this.downloadItem(item);
    },

    async downloadItem(item) {
      //open url to download file
      window.open(await this.getDownloadItemLink(item), "_blank");
    },

    async getDownloadItemLink(item) {
      //download path
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
