const fsPromise = require("node:fs/promises"),
    path = require("path");

function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        }
    );
}

function updateLinks(sourceId, targetId, res) {
    fs.readFile('./data.json', 'utf-8', (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: "Internal Server Error" }));
            return;
        }

        const records = JSON.parse(data);

        records.forEach(record => { //проход по каждой записи, чтобы удалить link
            if (record.id === sourceId || record.id === targetId) {
                delete record.link;
            }
        });
        
        //нахождение записей по id
        const sourceRecordIndex = records.findIndex(record => record.id === sourceId);
        const targetRecordIndex = records.findIndex(record => record.id === targetId);


        //если такие есть, то устанавливаем новую связь между ними
        if (sourceRecordIndex !== -1 && targetRecordIndex !== -1) {
            records[sourceRecordIndex].link = targetId;
            records[targetRecordIndex].link = sourceId;

            fs.writeFile('./data.json', JSON.stringify(records, null, 2), 'utf-8', (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end(JSON.stringify({ error: "Internal Server Error" }));
                    return;
                }
                res.writeHead(200);
                res.end( {message: 'The relationship between records has been successfully established.'});
            });
        } else {
            res.writeHead(404);
            res.end({ error: "Internal Server Error" });
        }
    });
}

module.exports = {
    generateUUID,
    updateLinks
};
