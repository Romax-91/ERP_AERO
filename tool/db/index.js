const mysql = require('mysql2/promise');

// Функция-инициализатор пула подключений к MySQL.
// Вызывается один раз при старте сервера, возвращает пул (db),
let pool = null;

async function initDb() {
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
	return pool;
}

module.exports = initDb;
