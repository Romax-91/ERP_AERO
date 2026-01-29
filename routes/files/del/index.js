const fs = require('fs');

function del(db) {
	return async function (req, res) {
		const fileId = parseInt(req.params.id, 10);
		if (Number.isNaN(fileId))
			return res.status(400).json({ error: 'Некорректный id файла' });

		try {
			const [rows] = await db.execute(
				'SELECT * FROM files WHERE id = ? AND user_id = ? LIMIT 1',
				[fileId, req.user.id]
			);

			if (rows.length === 0)
				return res.status(404).json({ error: 'Файл не найден' });

			const file = rows[0];

			// Удаляем запись из БД
			await db.execute('DELETE FROM files WHERE id = ?', [fileId]);

			// Удаляем физический файл
			fs.unlink(file.path, (err) => {
				if (err && err.code !== 'ENOENT') {
					console.error('Ошибка при удалении файла:', err);
				}
			});

			return res.json({ success: true });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = del;
