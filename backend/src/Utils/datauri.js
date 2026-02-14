import DataURIParser from 'datauri/parser.js';
import path from 'path';

const getdatauri = (file) => {
    if (!file || !file.originalname || !file.buffer) {
        throw new Error('File is required');
    }

    const parser = new DataURIParser();
    const ext = path.extname(file.originalname).toString(); // ✅ fixed

    return parser.format(ext, file.buffer);
};

export default getdatauri;
