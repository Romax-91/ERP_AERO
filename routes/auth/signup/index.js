const bcrypt = require('bcryptjs');
const { generateTokenPair } = require('../../../tool/token');

function signup(db) {
	return async function (req, res) {
		const { id, password } = req.body;

		if (!id || !password) {
			return res
				.status(400)
				.json({ error: 'Поля id и password обязательны' });
		}

		try {
			const [existing] = await db.execute(
				'SELECT id FROM users WHERE login = ? LIMIT 1',
				[id]
			);
			if (existing.length > 0) {
				return res
					.status(409)
					.json({ error: 'Пользователь с таким id уже существует' });
			}

			const passwordHash = await bcrypt.hash(password, 10);
			const [result] = await db.execute(
				'INSERT INTO users (login, password_hash) VALUES (?, ?)',
				[id, passwordHash]
			);

			const deviceInfo = req.headers['user-agent'] || null;
			const tokens = await generateTokenPair(result.insertId, deviceInfo);

			return res.status(201).json({
				user_id: result.insertId,
				access_token: tokens.accessToken,
				refresh_token: tokens.refreshToken,
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = signup;
