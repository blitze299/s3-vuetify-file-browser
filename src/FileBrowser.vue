<template>
  <v-card :loading="loading > 0">
    <toolbar
      :path="path"
      :filestructure="filestructure"
      :endpoints="endpoints"
      :axios="axiosInstance"
      v-on:path-changed="pathChanged"
      v-on:add-files="addUploadingFiles"
      v-on:folder-created="refreshPending = true"
    ></toolbar>
    <v-row no-gutters>
      <v-col v-if="tree && $vuetify.breakpoint.smAndUp" sm="auto">
        <tree
          :filestructure="filestructure"
          :path="path"
          :icons="icons"
          :endpoints="endpoints"
          :axios="axiosInstance"
          :refreshPending="refreshPending"
          v-on:path-changed="pathChanged"
          v-on:loading="loadingChanged"
          v-on:refreshed="refreshPending = false"
          v-on:loadData="loadData"
        ></tree>
      </v-col>
      <v-divider v-if="tree" vertical></v-divider>
      <v-col>
        <list
          :filestructure="filestructure"
          :path="path"
          :icons="icons"
          :endpoints="endpoints"
          :axios="axiosInstance"
          :refreshPending="refreshPending"
          v-on:path-changed="pathChanged"
          v-on:loading="loadingChanged"
          v-on:refreshed="refreshPending = false"
          v-on:file-deleted="refreshPending = true"
          v-on:deleteItem="deleteItem"
          v-on:loadData="loadData"
        ></list>
      </v-col>
    </v-row>
    <upload
      v-if="uploadingFiles !== false"
      :path="path"
      :files="uploadingFiles"
      :icons="icons"
      :axios="axiosInstance"
      :endpoint="endpoints.upload"
      :maxUploadFilesCount="maxUploadFilesCount"
      :maxUploadFileSize="maxUploadFileSize"
      v-on:add-files="addUploadingFiles"
      v-on:remove-file="removeUploadingFile"
      v-on:clear-files="uploadingFiles = []"
      v-on:cancel="uploadingFiles = false"
      v-on:uploaded="uploaded"
    ></upload>
  </v-card>
</template>

<script>
import axios from "axios";

import Toolbar from "./Toolbar.vue";
import Tree from "./Tree.vue";
import List from "./List.vue";
import Upload from "./Upload.vue";

import { formatS3ToPathObj, removeSlashFromString } from "./util";

const fileIcons = {
  zip: "mdi-folder-zip",
  rar: "mdi-folder-zip",
  htm: "mdi-language-html5",
  html: "mdi-language-html5",
  js: "mdi-nodejs",
  json: "mdi-json",
  md: "mdi-markdown",
  pdf: "mdi-file-pdf",
  png: "mdi-file-image",
  jpg: "mdi-file-image",
  JPG: "mdi-file-image",
  jpeg: "mdi-file-image",
  mp4: "mdi-filmstrip",
  mkv: "mdi-filmstrip",
  avi: "mdi-filmstrip",
  wmv: "mdi-filmstrip",
  mov: "mdi-filmstrip",
  txt: "mdi-file-document",
  xls: "mdi-file-excel",
  xlsx: "mdi-file-excel",
  other: "mdi-file-outline",
};

export default {
  components: {
    Toolbar,
    Tree,
    List,
    Upload,
  },
  model: {
    prop: "path",
    event: "change",
  },
  props: {
    // show tree view
    tree: { type: Boolean, default: true },
    // file icons set
    icons: { type: Object, default: () => fileIcons },
    // custom backend endpoints
    endpoints: { type: Object },
    // custom axios instance
    axios: { type: Function },
    // custom configuration for internal axios instance
    axiosConfig: { type: Object, default: () => {} },
    // max files count to upload at once. Unlimited by default
    maxUploadFilesCount: { type: Number, default: 10 },
    // max file size to upload. Unlimited by default
    maxUploadFileSize: { type: Number, default: 104857600 },
    listUrl: { type: String },
  },
  data() {
    return {
      filestructure: [],
      loading: 0,
      path: "",
      uploadingFiles: false, // or an Array of files
      refreshPending: false,
      axiosInstance: null,
      presetEndpoints: {},
    };
  },
  created() {
    this.axiosInstance = this.axios || axios.create(this.axiosConfig);
  },
  mounted() {
    if (!this.path && !(this.tree && this.$vuetify.breakpoint.smAndUp)) {
      this.pathChanged("/");
    }
    //console.warn(this.endpoints.list.url);
    this.loadData();
  },
  methods: {
    async loadData() {
      this.loadingChanged(true);
      //get s3url from backend
      const s3url = await this.axiosInstance.request({
        url: this.endpoints.list.url,
        method: this.endpoints.list.method,
      });
      //query s3 data with url from backend
      const s3data = await this.axiosInstance.request({
        url: s3url.data.url,
        method: this.endpoints.list.method,
      });
      const result = formatS3ToPathObj(s3data.data);
      this.filestructure = result;
      this.loadingChanged(false);
    },
    loadingChanged(loading) {
      if (loading) {
        this.loading = 1;
      } else if (this.loading > 0) {
        this.loading = 0;
      }
    },
    addUploadingFiles(files) {
      files = Array.from(files);

      if (this.maxUploadFileSize) {
        files = files.filter((file) => file.size <= this.maxUploadFileSize);
      }

      if (this.uploadingFiles === false) {
        this.uploadingFiles = [];
      }

      if (
        this.maxUploadFilesCount &&
        this.uploadingFiles.length + files.length > this.maxUploadFilesCount
      ) {
        files = files.slice(
          0,
          this.maxUploadFilesCount - this.uploadingFiles.length
        );
      }

      this.uploadingFiles.push(...files);
    },
    removeUploadingFile(index) {
      this.uploadingFiles.splice(index, 1);
    },
    uploaded() {
      this.uploadingFiles = false;
      this.refreshPending = true;
    },
    pathChanged(path) {
      this.path = removeSlashFromString(path);
      //reload data
      this.loadData();
      this.$emit("change", path);
    },
    deleteItem(item) {
      this.$emit("deleteItem", item);
    }
  },
};
</script>

<style lang="scss" scoped></style>
