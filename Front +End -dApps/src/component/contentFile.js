import { FaFile } from 'react-icons/fa6';
import './contentFile.css';
import { MdFileDownload } from 'react-icons/md';
import { formatFileSize } from '../utils';

const ContentFile = ({ data }) => {

    const downloadFile = async () => {
        try {
            const res = await fetch(data.secure_url);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = data.filename || 'download';
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.log(err);
        }
    };

    return (
        <div className={`contentFile ${data.file_type === 'image' || data.filename.endsWith('jpg') ? 'cf-image' : 'cf-file'}`}>
            {
                data.file_type === 'image' || data.filename.endsWith('jpg') ?
                <img src={data.secure_url} alt={`file ${data._id}`} /> :
                <div className='cf-fileDoc-wrapper cursor'>
                    <div className='cf-fileDoc'>
                        <FaFile className="cf-fd-icon" />
                        <div className="cf-file-desc">
                            <span className='cffd-name'>{data.filename||'File'}</span>
                            <span className='cffd-size'>{formatFileSize(data.filesize - 0)}</span>
                        </div>
                        <div className="cf-file-download">
                            <div className='cffd-btn cursor' onClick={() => downloadFile()}>
                                <MdFileDownload className='cffdb-icon' />
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
};

export default ContentFile;