const { rotateRefreshToken } = require('../../../tool/token');

function refresh(db) {
	return async function (req, res) {
		const { refresh_token } = req.body;

		if (!refresh_token)
			return res.status(400).json({ error: 'Не передан refresh_token' });

		try {
			const rotated = await rotateRefreshToken(db, refresh_token);
			if (!rotated)
				return res
					.status(401)
					.json({ error: 'Неверный или истекший refresh токен' });

			return res.json({
				user_id: rotated.userId,
				access_token: rotated.accessToken,
				refresh_token: rotated.refreshToken,
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = refresh;
