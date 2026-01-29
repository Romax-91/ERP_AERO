const bcrypt = require('bcryptjs');
const { generateTokenPair } = require('../../../tool/token');

function signin(db) {
	return async function (req, res) {
		const { id, password } = req.body;

		if (!id || !password)
			return res
				.status(400)
				.json({ error: 'Поля id и password обязательны' });

		try {
			const [rows] = await db.execute(
				'SELECT id, password_hash FROM users WHERE login = ? LIMIT 1',
				[id]
			);

			if (rows.length === 0)
				return res
					.status(401)
					.json({ error: 'Неверный id или пароль' });

			const user = rows[0];
			const match = await bcrypt.compare(password, user.password_hash);
			if (!match)
				return res
					.status(401)
					.json({ error: 'Неверный id или пароль' });

			const deviceInfo = req.headers['user-agent'] || null;
			const tokens = await generateTokenPair(db, user.id, deviceInfo);

			return res.json({
				user_id: user.id,
				access_token: tokens.accessToken,
				refresh_token: tokens.refreshToken,
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = signin;
