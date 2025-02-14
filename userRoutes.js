const User = require('./user.js')
const path = require('path');
const fs = require('fs');

module.exports = function(app,upload) {
	app.get('/', async (req, res) => {
		try {
		  console.log("Entro el fetch")
		} catch (error) {
		  console.log(error)
		}
	  })
	app.get('/users1', (req, res)=>{
		User.getUsers( 
			(err, data) => {
				//res.json({"foo" : "bar"}); 
				console.log(data)
				res.json('hola')
				//res.json(data)
			}
		);
	});

	app.get('/users2/x', (req, res)=>{
		User.getUsers( 
			(err, data) => {
				//res.json({"foo" : "bar"}); 
				res.json(data)
			}
		);
	});	


	app.post('/users1', (req, res) => {
		//console.log(req.body);		
		const userData = {
			dato: req.body.dato,
			segundo: req.body.segundo
		};

		User.insertUser(userData, (err, data) => {
			console.log(data)
			if( data && data.affectedRows ){
				res.status(200).json({
					success: true,
					msg: 'dato insertado',
					data: data
				});
			}else{
				res.status(500).json({
					success: false,
					msg: 'Error'
				});
			}
		});
	});

	let tareasPendientes = {
		cliente1: null, // { id: 0 } (promedio) o { id: 1 } (graficaCliente1)
		cliente2: null, // { id: 2 } (varianza) o { id: 3 } (graficaCliente2)
	};

	let graficasClientes = { graficaCliente1: null, graficaCliente2: null };
	let promedio = null, varianza = null;
	let bandera1 = false, bandera2 = false;

	const verificarRutaArchivo = (ruta) => fs.existsSync(ruta) && fs.lstatSync(ruta).isFile();

	// Función para esperar datos y reenviar la respuesta cuando estén disponibles
	const esperarDatos = async (id, res) => {
		if (id === 1 && graficasClientes.graficaCliente1) {
			const ruta = graficasClientes.graficaCliente1.path;
			if (verificarRutaArchivo(ruta)) {
				return res.sendFile(ruta);
			} else {
				console.error('Archivo de gráfica cliente 1 no encontrado.');
				return res.status(500).json({ error: 'Archivo no encontrado' });
			}
		} else if (id === 0 && promedio !== null) {
			return res.status(200).json({ promedio });
		} else if (id === 3 && graficasClientes.graficaCliente2) {
			const ruta = graficasClientes.graficaCliente2.path;
			if (verificarRutaArchivo(ruta)) {
				return res.sendFile(ruta);
			} else {
				console.error('Archivo de gráfica cliente 2 no encontrado.');
				return res.status(500).json({ error: 'Archivo no encontrado' });
			}
		} else if (id === 2 && varianza !== null) {
			return res.status(200).json({ varianza });
		} else {
			// Reintentar después de 500 ms
			setTimeout(() => esperarDatos(id, res), 10000);
		}
	};

	// Rutas para solicitudes de cliente 1
	app.post('/solicitud1', async (req, res) => {
		const { id } = req.body;

		if (id === undefined) {
			return res.status(400).json({ error: "Falta el ID de la solicitud" });
		}

		if (![0, 1].includes(id)) {
			return res.status(400).json({ error: "ID de solicitud inválido para cliente 1" });
		}

		tareasPendientes.cliente1 = id === 1 ? { id: 1 } : { id: 0 };
		bandera1 = true;

		console.log(`Solicitud para cliente 1 registrada con ID: ${id}`);
		// Esperar los datos para enviar respuesta
		await esperarDatos(id, res);
		//graficaCliente1 = null;
	});

	// Rutas para solicitudes de cliente 2
	app.post('/solicitud2', async (req, res) => {
		const { id } = req.body;

		if (id === undefined) {
			return res.status(400).json({ error: "Falta el ID de la solicitud" });
		}

		if (![2, 3].includes(id)) {
			return res.status(400).json({ error: "ID de solicitud inválido para cliente 2" });
		}

		tareasPendientes.cliente2 = id === 3 ? { id: 3 } : { id: 2 };
		bandera2 = true;

		console.log(`Solicitud para cliente 2 registrada con ID: ${id}`);

		// Esperar los datos para enviar respuesta
		await esperarDatos(id, res);
	});

	// Verificar banderas de cliente 1
	app.get('/bandera1', (req, res) => {
		console.log("Bandera 1")
		if( tareasPendientes.cliente1 ){
			val = tareasPendientes.cliente1.id;
		}else{
			val = null;
		}
		res.status(200).json({
			msg: bandera1 ? 'Hay una tarea pendiente' : 'No hay tareas pendientes',
			bandera: bandera1,
			id: val,
			//id: tareasPendientes.cliente1?.id || null,
		});
	});

	// Verificar banderas de cliente 2
	app.get('/bandera2', (req, res) => {
		if( tareasPendientes.cliente2 ){
			val = tareasPendientes.cliente2.id;
		}else{
			val = null;
		}
		res.status(200).json({
			msg: bandera2 ? 'Hay una tarea pendiente' : 'No hay tareas pendientes',
			bandera: bandera2,
			id: val,
			//id: tareasPendientes.cliente1?.id || null,
		});
	});

	// Subir gráfica de cliente 1
	app.post('/grafica1', upload.single('file'), (req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: 'No se recibió ningún archivo' });
		}

		const tarea = tareasPendientes.cliente1;
		if (tarea && tarea.id === 1) {
			const ruta = path.resolve(__dirname, '..', 'uploads', req.file.filename);
			if (verificarRutaArchivo(ruta)) {
				graficasClientes.graficaCliente1 = { path: ruta };
				tareasPendientes.cliente1 = null;
				bandera1 = false;
				console.log('Gráfica cliente 1 procesada y almacenada:', ruta);
				return res.status(200).json({ msg: 'Gráfica del cliente 1 procesada y almacenada' });
			} else {
				return res.status(500).json({ error: 'No se pudo guardar el archivo' });
			}
		} else {
			return res.status(400).json({ error: 'No se esperaba una gráfica para cliente 1' });
		}
	});

	// Subir gráfica de cliente 2
	app.post('/grafica2', upload.single('file'), (req, res) => {
		if (!req.file) {
			return res.status(400).json({ error: 'No se recibió ningún archivo' });
		}

		const tarea = tareasPendientes.cliente2;
		if (tarea && tarea.id === 3) {
			const ruta = path.resolve(__dirname, '..', 'uploads', req.file.filename);
			if (verificarRutaArchivo(ruta)) {
				graficasClientes.graficaCliente2 = { path: ruta };
				tareasPendientes.cliente2 = null;
				bandera2 = false;
				console.log('Gráfica cliente 2 procesada y almacenada:', ruta);
				return res.status(200).json({ msg: 'Gráfica del cliente 2 procesada y almacenada' });
			} else {
				return res.status(500).json({ error: 'No se pudo guardar el archivo' });
			}
		} else {
			return res.status(400).json({ error: 'No se esperaba una gráfica para cliente 2' });
		}
	});

	// Subir promedio
	app.post('/promedio', (req, res) => {
		const { promedio: nuevoPromedio } = req.body;

		if (nuevoPromedio === undefined) {
			return res.status(400).json({ error: 'Falta el valor del promedio' });
		}

		const tarea = tareasPendientes.cliente1;
		if (tarea && tarea.id === 0) {
			promedio = nuevoPromedio;
			tareasPendientes.cliente1 = null;
			bandera1 = false;
			
			return res.status(200).json({ msg: 'Promedio procesado y almacenado' });
		} else {
			return res.status(400).json({ error: 'No se esperaba el cálculo del promedio' });
		}
	});

	// Subir varianza
	app.post('/varianza', (req, res) => {
		const { varianza: nuevaVarianza } = req.body;

		if (nuevaVarianza === undefined) {
			return res.status(400).json({ error: 'Falta el valor de la varianza' });
		}

		const tarea = tareasPendientes.cliente2;
		if (tarea && tarea.id === 2) {
			varianza = nuevaVarianza;
			tareasPendientes.cliente2 = null;
			bandera2 = false;
			console.log(nuevaVarianza)
			return res.status(200).json({ msg: 'Varianza procesada y almacenada' });
		} else {
			return res.status(400).json({ error: 'No se esperaba el cálculo de la varianza' });
		}
	}); 
}