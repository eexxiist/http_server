require("dotenv").config();
const winston = require("winston"),
    http = require("http"),
    url = require("url"),
    fs = require("fs"),
    port = process.env.PORT,
    { generateUUID } = require("./utils/user");

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();

        return;
    }

    res.setHeader("Content-Type", "text/plain");

    const parsedUrl = url.parse(req.url, true),
        { query, pathname } = parsedUrl;

    // Method - GET
    // ROUTE: /api
    // @params id - String
    // @params (sort) -> type + direction - String + Boolean (true -> upper; false - lower)
    // @params amount -> Number
    // example: host:port/api?id=1&amount=10&type=Title&direction=true

    if (pathname === "/api" && req.method === "GET") {
        // 2. Получение списка всех записей через get
        fs.readFile(process.env.JSON_FILE, "utf-8", (err, data) => {
            if (err) {
                console.log("Error read Json file", err.message);
                res.writeHead(500);
                res.end(JSON.stringify({ error: "Internal Server Error" }));

                return;
            }

            data = JSON.parse(data);

            try {
                if (query.id) {
                    // Возвращаем определенную запись

                    let index;

                    const object = data.findIndex((el, i) => {
                        if (el.id === query.id) {
                            index = i;
                        }
                    });

                    if (index) {
                        // const object = data[index];

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
    } else if (pathname === "/api" && req.method === "POST") {
        // 1. Создание записи

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
    } else if (pathname === "/api" && req.method === "DELETE") {
        fs.readFile("./data.json", "utf8", (err, data) => {
            if (err) {
                console.log("Error delete note", err);
                res.writeHead(500);
                res.end({ error: "Internal Server Error" });

                return;
            }

            try {
                const updatedData = [];

                if (query.id) {
                    const jsonData = JSON.parse(data).filter(
                        (el) => el.id !== query.id
                    );
                    const updatedJson = JSON.stringify(jsonData, null, 4);

                    JSON.parse(data).forEach((el) => {
                        if (el.id !== query.id) {
                            updatedData.push(el);
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
                        res.end();
                    }
                );
            } catch (err) {
                console.log("Error delete note", err);
                res.writeHead(500);
                res.end({ error: "Internal Server Error" });
            }
        });
    } else if (pathname === "/api" && req.method === "PUT") {
        // 5. Редактирование записи по id

        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const updateData = JSON.parse(body),
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
    } else {
    }
});

server.listen(port, (error) => {
    error ? console.log(error) : console.log("Server create");
});
