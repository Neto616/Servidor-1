const mysql = require('mysql2');

// connection = mysql.createConnection({
// 	host: 'localhost',
// 	user: 'root',
// 	password: 'Neto_616',
// 	database: 'tscu'
// });

connection = mysql.createConnection("mysql://root:biHNJomgAigVIfrqyLepYVBsYJMLdOPc@junction.proxy.rlwy.net:23391/railway");

let userModel = {};

userModel.getUsers = (callback) => {
	if( connection ){
		connection.query(
			'SELECT * FROM sensor',
			(err, rows) => {
				if(err){
					throw err;
				}else{
					callback(null, rows);
				}
			}
		);
	}
};

userModel.insertUser = (userData, callback) => {
	if( connection ){
		console.log(userData);
		connection.query(
			'INSERT INTO Sensor SET ?', userData,
				(err, result) => {

					if( err  ){
						console.log("Error")
						throw err;
					}else{
						console.log(result);
						callback(null, {
							affectedRows: result.affectedRows
						});
					}
				}
		);
	}
};

module.exports = userModel;