import multer from 'multer';

const storage = multer.memoryStorage();

const AvatarUpload = multer({ storage }).single('avatar');

const ResumeUpload = multer({ storage }).array("resume", 10);

export { AvatarUpload, ResumeUpload }