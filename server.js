const express = require('express');
const libxmljs = require("libxmljs");
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(bodyParser.urlencoded({ extended: true }));


// Обработчик необработанных исключений
process.on('uncaughtException', (err) => {
    console.error('Необработанное исключение:', err);
});

app.post('/validate', (req, res) => {
    const { xml, xsd } = req.body;

    if (!xml || !xsd) {
        return res.status(400).send({ error: 'XML и XSD обязательны' });
    }

    try {
        const xmlDoc = libxmljs.parseXml(xml);
        const xsdDoc = libxmljs.parseXml(xsd);

        if (!xmlDoc) {
            return res.status(400).send({ error: 'Ошибка парсинга XML' });
        }

        if (!xsdDoc) {
            return res.status(400).send({ error: 'Ошибка парсинга XSD' });
        }

        xmlDoc.validate(xsdDoc);

        const errors = xmlDoc.validationErrors;

        if (errors && errors.length > 0) {
            const errorMessages = errors.map(error => error.message);
            return res.status(400).send({ errors: errorMessages });
        }

        res.send({ valid: true });

    } catch (error) {
        console.error('Ошибка валидации:', error);
        return res.status(500).send({ error: 'Ошибка валидации на сервере: ' + error.message });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});