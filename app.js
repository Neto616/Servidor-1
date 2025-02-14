// Importar módulos necesarios
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer')
// Configuración del servidor
app.set('port', 3100);

// Middlewares para Express
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// Configurar el almacenamiento de archivos
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
		cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Nombre único para cada archivo
	}
});


// Configurar el middleware multer
const upload = multer({ storage: storage });
module.exports = { upload }

// Importar y definir rutas REST desde userRoutes
require('./userRoutes.js')(app,upload);

const server = app.listen(app.get('port'), () => {
	console.log('Servidor escuchando en el puerto ', app.get('port'));
});