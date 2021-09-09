<template>
  <v-card class="mx-auto" :loading="loading > 0">
    <toolbar
      :path="path"
      :filestructure="filestructure"
      :endpoints="endpoints"
      v-on:path-changed="pathChanged"
      v-on:add-files="addUploadingFiles"
      v-on:folder-created="refreshPending = true"
      v-on:createFolder="createFolder"
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

const endpoints = {
  list: {
    url:
      "https://s3.c-dev.io/onds-backend?prefix=612dee2150418b25372981f9&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=s3user853ziugfdsf%2F20210909%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20210909T090556Z&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=6cc6cce086d3b33ec742d36840a106f85d051c0cd514bbd3ee5ea8325b7f61ed",
    method: "get",
  },
  upload: {
    url:
      "https://s3.c-dev.io/onds-backend?prefix=612dee2150418b25372981f9%2F&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=s3user853ziugfdsf%2F20210908%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20210908T163430Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=bc2bf7e2f864aee1020b7521b15c37ce160e52c49b29a50f4a381e6afef4a32a",
    method: "put",
  },
  mkdir: { url: "/storage/{storage}/mkdir?path={path}", method: "post" },
  delete: { url: "/storage/{storage}/delete?path={path}", method: "post" },
};

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
  jpeg: "mdi-file-image",
  mp4: "mdi-filmstrip",
  mkv: "mdi-filmstrip",
  avi: "mdi-filmstrip",
  wmv: "mdi-filmstrip",
  mov: "mdi-filmstrip",
  txt: "mdi-file-document",
  xls: "mdi-file-excel",
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
    endpoints: { type: Object, default: () => endpoints },
    // custom axios instance
    axios: { type: Function },
    // custom configuration for internal axios instance
    axiosConfig: { type: Object, default: () => {} },
    // max files count to upload at once. Unlimited by default
    maxUploadFilesCount: { type: Number, default: 10 },
    // max file size to upload. Unlimited by default
    maxUploadFileSize: { type: Number, default: 104857600 },
  },
  data() {
    return {
      filestructure: [],
      loading: 0,
      path: "",
      uploadingFiles: false, // or an Array of files
      refreshPending: false,
      axiosInstance: null,
    };
  },
  created() {
    this.axiosInstance = this.axios || axios.create(this.axiosConfig);
  },
  mounted() {
    if (!this.path && !(this.tree && this.$vuetify.breakpoint.smAndUp)) {
      this.pathChanged("/");
    }
    this.loadData();
  },
  methods: {
    async loadData() {
      const s3data = await this.axiosInstance.request({
        url: this.endpoints.list.url,
        method: this.endpoints.list.method,
      });
      const result = formatS3ToPathObj(s3data.data);
      this.filestructure = result;
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
    },
    createFolder(item) {
      this.$emit("createFolder", item);
    },
  },
};
</script>

<style lang="scss" scoped></style>
