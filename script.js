document.addEventListener('DOMContentLoaded', function() {
    const xsdFileElement = document.getElementById('xsdFile');
    const xmlFileElement = document.getElementById('xmlFile');
    const xmlEditorElement = document.getElementById('xmlEditor');
    const saveXmlButton = document.getElementById('saveXml');
    const checkXmlButton = document.getElementById('checkXml');
    const messagesElement = document.getElementById('messages');
    const xsdSelectElement = document.getElementById('xsdSelect'); 

    let xsdSchemas = {}; 
    let xmlContent = null; 

    function showMessage(message, isError = false) {
        messagesElement.textContent = message;
        messagesElement.style.color = isError ? 'red' : 'green';
    }

    
    function addXsdOption(filename, xsdContent) {
        const option = document.createElement('option');
        option.value = filename;
        option.textContent = filename;
        xsdSelectElement.appendChild(option);
    }

    xsdFileElement.addEventListener('change', function(event) {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            reader.onload = function(e) {
                const filename = file.name;
                xsdSchemas[filename] = e.target.result; 
                addXsdOption(filename, e.target.result);
                showMessage('XSD схема ' + filename + ' загружена успешно.');
            };
            reader.onerror = function(e) {
                showMessage('Ошибка загрузки XSD схемы ' + file.name + ': ' + e.target.error.message, true);
            };
            reader.readAsText(file);
        }
    });

    xmlFileElement.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            xmlContent = e.target.result;
            xmlEditorElement.value = xmlContent; 
            showMessage('XML данные загружены успешно.');
        };
        reader.onerror = function(e) {
            showMessage('Ошибка загрузки XML данных: ' + e.target.error.message, true);
        };
        reader.readAsText(file);
    });

    saveXmlButton.addEventListener('click', function() {
        const xmlString = xmlEditorElement.value;
        const selectedXsd = xsdSelectElement.value;

        if (!selectedXsd) {
            showMessage('Ошибка: Выберите XSD схему.', true);
            return;
        }

        const xsdContent = xsdSchemas[selectedXsd];

        if (!xsdContent) {
            showMessage('Ошибка: XSD схема не загружена.', true);
            return;
        }

        validateXml(xmlString, xsdContent);
        saveXmlFile(xmlString);
    });

    checkXmlButton.addEventListener('click', function() {
        const xmlString = xmlEditorElement.value;
        const selectedXsd = xsdSelectElement.value;

        if (!selectedXsd) {
            showMessage('Ошибка: Выберите XSD схему.', true);
            return;
        }

        const xsdContent = xsdSchemas[selectedXsd];

        if (!xsdContent) {
            showMessage('Ошибка: XSD схема не загружена.', true);
            return;
        }

        validateXml(xmlString, xsdContent);
    });

    function validateXml(xmlString, xsdString) {
        if (!xmlString) {
            showMessage('Ошибка: XML данные пусты.', true);
            return;
        }
        if (!xsdString) {
            showMessage('Ошибка: XSD схема не загружена.', true);
            return;
        }

        
        fetch('http://localhost:3000/validate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: `xml=${encodeURIComponent(xmlString)}&xsd=${encodeURIComponent(xsdString)}`
        })
        .then(response => response.json())
        .then(data => {
            if (data.valid) {
                showMessage('XML валиден по XSD.', false);
            } else if (data.errors) {
                
                let errorString = 'XML не валиден по XSD:\n';
                if (Array.isArray(data.errors)) {
                    data.errors.forEach(error => {
                        errorString += `- ${error}\n`;
                    });
                } else if (typeof data.errors === 'string') { 
                    errorString += data.errors + '\n';
                } else {
                    errorString += "Неизвестный формат ошибок.\n"; 
                }
                showMessage(errorString, true);
            } else {
                showMessage('Ошибка валидации на сервере.', true);
            }
        })
        .catch(error => {
            showMessage('Ошибка при отправке запроса на сервер: ' + error.message, true);
        });
    }

    function saveXmlFile(xmlString) {
        if (!xmlString) {
            showMessage('Нет данных для сохранения.', true);
            return;
        }

        try {
            const blob = new Blob([xmlString], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'output.xml';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage('XML сохранен в файл.', false);

        } catch (error) {
            showMessage('Ошибка сохранения файла: ' + error.message, true);
        }
    }
});