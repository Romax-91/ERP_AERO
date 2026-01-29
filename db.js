const mysql = require('mysql2/promise');

// Пул подключений к MySQL.
let pool = null;

async function getPool() {
	if (!pool) {
		pool = mysql.createPool({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASSWORD,
			database: process.env.DB_NAME,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
		});
	}
	// Возвращаем один и тот же пул для всех модулей.
	return pool;
}

module.exports = {
	getPool,
};
