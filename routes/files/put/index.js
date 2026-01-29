const fs = require('fs');
const path = require('path');

function put(db) {
	return async function (req, res) {
		const fileId = parseInt(req.params.id, 10);
		if (Number.isNaN(fileId))
			return res.status(400).json({ error: 'Некорректный id файла' });

		if (!req.file)
			return res.status(400).json({ error: 'Файл не передан' });

		try {
			const [rows] = await db.execute(
				'SELECT * FROM files WHERE id = ? AND user_id = ? LIMIT 1',
				[fileId, req.user.id]
			);

			if (rows.length === 0) {
				// Удаляем загруженный файл, так как записи нет
				fs.unlink(req.file.path, () => {});
				return res.status(404).json({ error: 'Файл не найден' });
			}

			const oldFile = rows[0];

			// Обновляем запись в БД
			const ext = path.extname(req.file.originalname).replace('.', '');
			await db.execute(
				`UPDATE files SET 
        original_name = ?, 
        stored_name = ?, 
        extension = ?, 
        mime_type = ?, 
        size = ?, 
        upload_date = NOW(), 
        path = ? 
       WHERE id = ?`,
				[
					req.file.originalname,
					req.file.filename,
					ext || null,
					req.file.mimetype,
					req.file.size,
					req.file.path,
					fileId,
				]
			);

			// Удаляем старый физический файл
			fs.unlink(oldFile.path, (err) => {
				if (err && err.code !== 'ENOENT') {
					console.error('Ошибка при удалении файла:', err);
				}
			});

			return res.json({
				id: fileId,
				original_name: req.file.originalname,
				stored_name: req.file.filename,
				mime_type: req.file.mimetype,
				size: req.file.size,
				upload_date: new Date(),
			});
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: 'Ошибка сервера' });
		}
	};
}

module.exports = put;
