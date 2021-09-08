<template>
  <v-card
    flat
    tile
    width="250"
    min-height="380"
    class="d-flex flex-column folders-tree-card"
  >
    <div class="grow scroll-x">
      <v-treeview
        :open="open"
        :active="active"
        :items="filestructure"
        :search="filter"
        :load-children="readFolder"
        v-on:update:active="activeChanged"
        item-key="path"
        item-text="name"
        dense
        activatable
        transition
        class="folders-tree"
      >
        <template v-slot:prepend="{ item, open }">
          <v-icon v-if="item.type === 'folder'">{{
            open ? "mdi-folder-open-outline" : "mdi-folder-outline"
          }}</v-icon>
          <v-icon v-else>{{ icons[getFileEnding(item.name)] }}</v-icon>
        </template>
        <template v-slot:label="{ item }">
          {{ item.name }}
          <v-btn
            icon
            v-if="item.type === 'folder'"
            @click.stop="readFolder(item)"
            class="ml-1"
          >
            <v-icon class="pa-0 mdi-18px" color="grey lighten-1"
              >mdi-refresh</v-icon
            >
          </v-btn>
        </template>
      </v-treeview>
    </div>
    <v-divider></v-divider>
    <v-toolbar dense flat class="shrink">
      <v-text-field
        solo
        flat
        hide-details
        label="Filter"
        v-model="filter"
        prepend-inner-icon="mdi-filter-outline"
        class="ml-n3"
      ></v-text-field>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn icon @click="init" v-on="on">
            <v-icon>mdi-collapse-all-outline</v-icon>
          </v-btn>
        </template>
        <span>Collapse All</span>
      </v-tooltip>
    </v-toolbar>
  </v-card>
</template>

<script>
import { getFileEnding } from "./util";
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
  data() {
    return {
      open: [],
      active: [],
      filter: "",
    };
  },
  methods: {
    getFileEnding,
    init() {
      this.open = [];
      if (this.path !== "") {
        this.$emit("path-changed", "");
      }
    },
    async readFolder(item) {
      this.$emit("loading", true);
      let url = this.endpoints.list.url
        .replace(new RegExp("{storage}", "g"), this.storage)
        .replace(new RegExp("{path}", "g"), item.path);

      let config = {
        url,
        method: this.endpoints.list.method || "get",
      };

      let response = await this.axios.request(config);

      // eslint-disable-next-line require-atomic-updates
      item.children = response.data.map((item) => {
        if (item.type === "folder") {
          item.children = [];
        }
        return item;
      });

      this.$emit("loading", false);
    },
    activeChanged(active) {
      this.active = active;
      let path = "";
      if (active.length) {
        path = active[0];
      }
      if (this.path != path) {
        this.$emit("path-changed", path);
      }
    },
    findItem(path) {
      let stack = [];
      stack.push(this.filestructure[0]);
      while (stack.length > 0) {
        let node = stack.pop();
        if (node.path == path) {
          return node;
        } else if (node.children && node.children.length) {
          for (let i = 0; i < node.children.length; i++) {
            stack.push(node.children[i]);
          }
        }
      }
      return null;
    },
  },
  watch: {
    storage() {
      this.init();
    },
    path() {
      this.active = [this.path];
      if (!this.open.includes(this.path)) {
        this.open.push(this.path);
      }
    },
    async refreshPending() {
      if (this.refreshPending) {
        let item = this.findItem(this.path);
        await this.readFolder(item);
        this.$emit("refreshed");
      }
    },
  },
  created() {
    this.init();
  },
};
</script>

<style lang="scss" scoped>
.folders-tree-card {
  height: 100%;

  .scroll-x {
    overflow-x: auto;
  }

  ::v-deep .folders-tree {
    width: fit-content;
    min-width: 250px;

    .v-treeview-node {
      cursor: pointer;

      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
    }
  }
}
</style>
