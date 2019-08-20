const AWS = require('aws-sdk');

async function pipeFileToS3(filestream, filename, bucket) {
    return new Promise((resolve, reject) => {
        try {
            const s3 = new AWS.S3({
                params: {
                    Bucket: bucket,
                    Key: filename,
                    Body: filestream,
                    ACL: 'private',
                },
                options: { partSize: 5 * 1024 * 1024, queueSize: 10 }, // 5 MB
            });

            s3.upload()
                .on('httpUploadProgress', e => {
                    console.log('s3 httpUploadProgress', e);
                })
                .send((err, data) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(data);
                });
        } catch (err) {
            console.log('ERROR: ', err);
            reject(err);
        }
    });
}

module.exports = {
    pipeFileToS3,
};
