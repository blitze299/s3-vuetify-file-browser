export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatS3ToPathObj(raw) {
  const rawJSON = JSON.parse(convertXmlToJson(raw));
  const data = rawJSON.ListBucketResult.Contents;
  const getTree = (data) =>
    data.reduce((tree, path) => {
      path.Key._text.split("/").reduce((t, name, i, a) => {
        let temp = t.find((q) => q.name === name);
        // test if item = is the last one of the last path array items then it is a file
        if (
          name ===
          path.Key._text.split("/")[path.Key._text.split("/").length - 1]
        ) {
          //file
          if (!temp)
            t.push(
              (temp = {
                name,
                path: a.slice(0, i + 1).join("/"),
                elem: path,
                type: "file",
              })
            );
        } else {
          // no file -> path
          if (!temp)
            t.push(
              (temp = {
                name,
                path: a.slice(0, i + 1).join("/"),
                children: [],
                type: "folder",
              })
            );
        }
        return temp.children;
      }, tree);
      return tree;
    }, []);

  return getTree(data);
}

function convertXmlToJson(xml) {
  var convert = require("xml-js");
  return convert.xml2json(xml, { compact: true, spaces: 4 });
}

export default {
  formatBytes,
};
