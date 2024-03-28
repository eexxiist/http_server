const   fs = require('fs'),
        url = require('url'),
        {generateUUID} = require('../utils/user');



function getUserData(req, res){
    fs.readFile(process.env.JSON_FILE, "utf-8", (err, data) => {
        if (err) {
            console.log("Error read Json file", err.message);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Internal Server Error" }));

            return;
        }

        const parsedUrl = url.parse(req.url, true),
            {query} = parsedUrl;

        data = JSON.parse(data);

        try {
            if (query.id) {

                let index;

                const object = data.findIndex((el, i) => {
                    if (el.id === query.id) {
                        index = i;
                    }
                });

                if (index) {

                    res.writeHead(200);
                    res.end(JSON.stringify(data[index]));

                    return;
                }

                res.writeHead(500);
                res.end(JSON.stringify({ error: "Invalid note's id" }));

                return;
            }

            if (query.amount) {
                data = data.slice(data.length - +query.amount);
            }

            if (query.type || query.direction) {
                const direction = query.direction ?? true,
                    type = query.type ?? "title";

                if (direction) {
                    data.sort((a, b) => a[type].localeCompare(b[type]));
                } else {
                    data.sort((a, b) => b[type].localeCompare(a[type]));
                }

                res.writeHead(200);
                res.end(JSON.stringify(data));

                return;
            }

            res.writeHead(200);
            res.end(JSON.stringify(data));

            return;
        } catch (err) {
            console.log("Error sending", err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Internal Server Error" }));

            return;
        }
    });
}

function createUserNote(req, res){

    let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            fs.readFile("./data.json", "utf8", (err, data) => {
                if (err) {
                    console.log("Error reading JSON file: ", err.message);
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });

                    return;
                }

                try {
                    const jsonData = JSON.parse(data);

                    body = JSON.parse(body);

                    jsonData.push({ ...body, id: generateUUID() });

                    const updatedJSON = JSON.stringify(jsonData, null, 4);

                    fs.writeFile("./data.json", updatedJSON, "utf8", (err) => {
                        if (err) {
                            console.log("Error writing: ", err.message);
                            res.writeHead(500);
                            res.end({ error: "Internal Server Error" });
                        } else {
                            res.writeHead(200);
                            res.end(JSON.stringify(body));
                        }
                    });
                } catch (err) {
                    console.log("Error parsing: ", err.message);
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });
                }
            });
        });
}

function deleteUserNote(req, res){

    fs.readFile("./data.json", "utf8", (err, data) => {
        if (err) {
            console.log("Error delete note", err);
            res.writeHead(500);
            res.end({ error: "Internal Server Error" });

            return;
        }

        const parsedUrl = url.parse(req.url, true),
              {query} = parsedUrl;

        try {
            const updatedData = [],
                arrayData = JSON.parse(data)

            if (query.id) {
                arrayData.forEach(user => {
                    if(user.id !== query.id){
                        updatedData.push(user);
                    }
                });
            }

            fs.writeFile(
                "./data.json",
                JSON.stringify(updatedData),
                (err) => {
                    if (err) {
                        console.log("Error write file", err);
                        res.writeHead(500);
                        res.end({ error: "Internal Server Error" });
                    }

                    res.writeHead(200);
                    res.end({});
                }
            );
        } catch (err) {
            console.log("Error delete note", err);
            res.writeHead(500);
            res.end({ error: "Internal Server Error" });
        }
    });
}

function editUserNote(req, res){

    let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const   updateData = JSON.parse(body),
                    { id, title, message } = updateData;

            if (!id || (!title && !message)) {
                res.writeHead(400);
                res.end({ error: "Internal Server Error" });
                return;
            }

            fs.readFile("./data.json", "utf-8", (err, data) => {
                if (err) {
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });
                    return;
                }

                try {
                    let records = JSON.parse(data);
                    const recordIndex = records.findIndex(
                        (record) => record.id === id
                    );

                    if (recordIndex === -1) {
                        res.writeHead(404);
                        res.end({ error: "Internal Server Error" });
                        return;
                    }

                    const   recordToUpdate = records[recordIndex],
                            isTitleChanged = title && title !== recordToUpdate.title,
                            isMessageChanged = message && message !== recordToUpdate.message;

                    if (!isTitleChanged && !isMessageChanged) {
                        res.writeHead(200);
                        res.end();
                        return;
                    }

                    if (isTitleChanged) recordToUpdate.title = title;
                    if (isMessageChanged) recordToUpdate.message = message;

                    fs.writeFile(
                        "./data.json",
                        JSON.stringify(records, null, 4),
                        "utf-8",
                        (err) => {
                            if (err) {
                                res.writeHead(500);
                                res.end({ error: "Internal Server Error" });
                                return;
                            }

                            res.writeHead(200);
                            res.end();
                        }
                    );
                } catch (err) {
                    console.log("Error parsing: ", err.message);
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });
                }
            });
        });
}


module.exports = {
    getUserData,
    createUserNote,
    deleteUserNote,
    editUserNote
}