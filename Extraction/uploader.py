import os
import subprocess
from flask import Flask , request , jsonify
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = 'Input'
OUTPUT_FOLDER = 'output'
ALLOWED_EXTENSIONS = set(['png','jpg','jpeg'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

uploader = Flask(__name__)
uploader.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
uploader.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

@uploader.route('/media/upload',methods = ['POST'])
def upload_media():
    if 'id_card' not in request.files or 'person' not in request.files:
        return jsonify({'error': 'Both id_card and person images must be provided'}), 400
    
    id_card = request.files['id_card']
    person = request.files['person']  

    if id_card.filename == '' or person.filename == '':
        return jsonify({'error': 'No file selected for one or both images'}), 400
    
    if id_card :
   # if id_card and allowed_file(id_card.filename) and person and allowed_file(person.filename):
        id_card_filename = secure_filename(id_card.filename)
        person_filename = secure_filename(person.filename)    
        id_card.save(os.path.join(uploader.config['UPLOAD_FOLDER'], 'id_card.jpeg'))
        person.save(os.path.join(uploader.config['UPLOAD_FOLDER'], 'person.jpeg'))
        try:
            result = subprocess.run(['python', 'extract_faces.py'], check=True, capture_output=True, text=True)
            output = result.stdout
            if "Identity Verified!" in output:
                output = "Identity Verified!"
            else:
                output = "Verification failed or not determined."
            return jsonify({'msg': 'media uploaded and processed successfully', 'output': output})
        except subprocess.CalledProcessError:
            return jsonify({'error': 'error occurred during face extraction and verification'}), 500
        finally:
            for filename in os.listdir(uploader.config['UPLOAD_FOLDER']):
                file_path = os.path.join(uploader.config['UPLOAD_FOLDER'], filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            for filename in os.listdir(uploader.config['OUTPUT_FOLDER']):
                file_path = os.path.join(uploader.config['OUTPUT_FOLDER'], filename)
                if os.path.isfile(file_path):
                    os.remove(file_path)

if __name__ == '__main__':
    uploader.run(debug=True,port=5000, host='0.0.0.0')
