export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function formatS3ToPathObj(raw, withPlaceholder) {
  const rawJSON = JSON.parse(convertXmlToJson(raw));
  let data = rawJSON.ListBucketResult.Contents;
  //check if bucket is empty then build first empty object manuak
  if (!rawJSON.ListBucketResult.Contents) {
    return [
      {
        children: [],
        name: removeSlashFromString(rawJSON.ListBucketResult.Prefix._text),
        path: removeSlashFromString(rawJSON.ListBucketResult.Prefix._text),
        type: "folder"
      }
    ];
  }
  //if data is not array (one item) -> make one
  if (!Array.isArray(data)) {
    data = [data];
  }
  const getTree = data =>
    data.reduce((tree, path) => {
      path.Key._text.split("/").reduce((t, name, i, a) => {
        let temp = t.find(q => q.name === name);
        // test if item = is the last one of the last path array items then it is a file
        const nameSplit = path.Key._text.split("/")[
          path.Key._text.split("/").length - 1
        ];
        if (name === nameSplit) {
          //file
          if (!temp)
            if (nameSplit != "placeholder") {
              //check if item is placeholder
              //is not placeholder
              t.push(
                (temp = {
                  name,
                  path: a.slice(0, i + 1).join("/"),
                  elem: path,
                  type: "file"
                })
              );
            } else {
              //do not push placeholder so they are not displayed
              //select on withPlaceholder when option set
              if (withPlaceholder) {
                t.push(
                  (temp = {
                    name,
                    path: a.slice(0, i + 1).join("/"),
                    elem: path,
                    type: "placeholder"
                  })
                );
              } else {
                temp = {
                  name,
                  path: a.slice(0, i + 1).join("/"),
                  elem: path,
                  type: "placeholder"
                };
              }
            }
        } else {
          // no file -> path
          if (!temp)
            t.push(
              (temp = {
                name,
                path: a.slice(0, i + 1).join("/"),
                children: [],
                type: "folder"
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

export function getFileEnding(name) {
  const split = name.split(".");
  if (split.length > 1) {
    return split[split.length - 1];
  } else {
    return "other";
  }
}

export function formatDateFromString(string) {
  return formatDate(new Date(string), true, "FEHLER") + "h";
}

export function formatDate(date, hours, replacement) {
  let formatDateNumber = dateNumber =>
    dateNumber < 10 ? "0" + dateNumber : dateNumber;

  try {
    let d =
      formatDateNumber(date.getDate()) +
      "." +
      formatDateNumber(date.getMonth() + 1) +
      "." +
      date.getFullYear();
    let h =
      formatDateNumber(date.getHours()) +
      ":" +
      formatDateNumber(date.getMinutes());

    return hours ? d + " " + h : d;
  } catch (e) {
    return replacement != null ? replacement : "-";
  }
}

export function filterData(object, key, value) {
  if (Array.isArray(object)) {
    for (const obj of object) {
      const result = filterData(obj, key, value);
      if (result) {
        return result;
      }
    }
  } else {
    if (
      Object.prototype.hasOwnProperty.call(object, key) &&
      object[key] === value
    ) {
      return object;
    }

    for (const k of Object.keys(object)) {
      if (typeof object[k] === "object") {
        const o = filterData(object[k], key, value);
        if (o !== null && typeof o !== "undefined") return o;
      }
    }
    return null;
  }
}

export function removeSlashFromString(string) {
  //remove leading / when there
  let formatString = string;
  if (formatString.charAt(0) === "/") {
    formatString = formatString.substring(1);
  }
  //remove last / when there
  if (formatString.charAt(formatString.length - 1) === "/") {
    formatString = formatString.substring(0, formatString.length - 1);
  }
  return formatString;
}

export function removeFirstElementFromPath(path) {
  const splitString = path.split("/");
  splitString.shift();
  const joinString = splitString.join("/");
  return joinString;
}

export function addUploadHandle(name) {
  if (!checkUploadHandle(name)) {
    return "ONDS_" + name;
  } else {
    return name;
  }
}

export function removeUploadHandle(name) {
  return name.replace(/^ONDS_/, "");
}

export function checkUploadHandle(name) {
  return /^ONDS_/.test(name);
}

export default {
  formatBytes,
  getFileEnding,
  formatDate,
  filterData,
  removeSlashFromString,
  removeFirstElementFromPath,
  addUploadHandle,
  removeUploadHandle,
  checkUploadHandle
};
