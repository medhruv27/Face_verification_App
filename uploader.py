import os
from flask import Flask , request , jsonify
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'E:/argenmistral/finalcv/static'
ALLOWED_EXTENSIONS = set(['png','jpg','jpeg'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

uploader = Flask(__name__)
uploader.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@uploader.route('/media/upload',methods = ['POST'])
def upload_media():
    if 'file' not in request.files:
        return jsonify({'error': 'media not provided'}),400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error':'no file seleted'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(uploader.config['UPLOAD_FOLDER'],filename))
        return jsonify({'msg' : 'media uploaded successfully'})
    
if __name__ == '__main__':
    uploader.run(debug=True,port=5000)