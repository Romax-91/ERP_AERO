const fs = require('fs');
const path = require('path');

function download(db) {
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
			const absolutePath = path.isAbsolute(file.path)
				? file.path
				: path.join(process.cwd(), file.path);

			if (!fs.existsSync(absolutePath))
				return res
					.status(410)
					.json({ error: 'Файл отсутствует в хранилище' });

			res.download(absolutePath, file.original_name);
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = download;
