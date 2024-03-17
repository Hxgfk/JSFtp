// ftp.js
// Author: Hxgfk
// License: GPL v3.0

const path = require("path");
const fs = require("fs")
const ftp = require("ftp");

/*
* arg 'user' format:
* {
*   host: ""        // sever ip
*   port: ""        // sever port
*   user: "",       // user name
*   password: ""    // user password
*   target: ""      // target path
* }
* */

function uploadFolder(folder, ftp_conf) {
    function isFolder(p) {
        return new Promise((resolve, reject) => {
            fs.stat(p, (err, stats) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stats.isDirectory());
                }
            });
        });
    }

    isFolder(folder).then(b => {
        if (!b) {
            console.error("Path isn't a folder");
        } else {
            async function getAllItemsInFolder(folderPath) {
                return new Promise((resolve, reject) => {
                    fs.readdir(folderPath, { withFileTypes: true }, async (err, items) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        let files2 = [];
                        let folders = [];

                        for (const item of items) {
                            const itemPath = path.join(folderPath, item.name);
                            if (item.isDirectory()) {
                                folders.push({ path: itemPath, name: item.name });
                                const subItems = await getAllItemsInFolder(itemPath);
                                folders = folders.concat(subItems.folders);
                                files2 = files2.concat(subItems.files2);
                            } else {
                                files2.push({ path: itemPath, name: item.name });
                            }
                        }

                        resolve({ files2, folders });
                    });
                });
            }

            getAllItemsInFolder(folder)
                .then(data => {
                    let client = new ftp();
                    client.on('ready', () => {
                        console.log("Connect Success");
                        data.folders.forEach(async o => {
                            await client.mkdir(ftp_conf.target+"/"+(o.path.replace(folder, "").replace(new RegExp("\\\\", "g"), "/")), true, err => {
                                if (err) {
                                    console.error(err);
                                }else {
                                    console.log("Created folder: "+o.name);
                                }
                            });
                        });
                        data.files2.forEach(async o => {
                            await client.put(o.path, ftp_conf.target+"/"+(o.path.replace(folder, "").replace(new RegExp("\\\\", "g"), "/")), err => {
                                if (err) {
                                    console.error(err);
                                }else {
                                    console.log("Uploaded file: "+o.path);
                                }
                            });
                        });
                        client.end();
                    });
                    client.connect(ftp_conf);
                })
                .catch(err => console.error(err));
        }
    });
}

uploadFolder("F:\\HMCL\\.minecraft", {
    host: "192.168.3.30",
    port: 2121,
    user: "hxgfk",
    password: "123456",
    target: "MinecraftLauncherData/.minecraft"
})
/*
let cli = new ftp();
cli.on('ready', () => {
    cli.put("F:\\HMCL\\hmcl.json", "MinecraftLauncherData/hmcl.json", err=>{})
    cli.end();
});
cli.connect( {
    host: "192.168.3.30",
    port: 2121,
    user: "hxgfk",
    password: "123456",
    target: "MinecraftLauncherData\\.minecraft"
});*/