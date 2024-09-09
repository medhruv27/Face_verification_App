# this upload one photo from flask server then proceed
import os
import cv2
import subprocess
from flask import Flask , request , jsonify
from werkzeug.utils import secure_filename
from deepface import DeepFace

UPLOAD_FOLDER = 'E:/office/argenmistral/finalcv/input'
OUTPUT_FOLDER = 'E:/office/argenmistral/finalcv/output'
ALLOWED_EXTENSIONS = set(['png','jpg','jpeg'])

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.',1)[1].lower() in ALLOWED_EXTENSIONS

face_cascade = cv2.CascadeClassifier('haarcascade_frontalface_default.xml')

uploader = Flask(__name__)
uploader.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
uploader.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER

@uploader.route('/media/upload',methods = ['POST'])
def upload_media():
    if 'frame' not in request.files:
        return jsonify({'error': 'frame must be provided'}), 400
    
    frame = request.files['frame']

    if frame.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if frame and allowed_file(frame.filename):
        frame_filename = secure_filename(frame.filename)  
        frame.save(os.path.join(uploader.config['UPLOAD_FOLDER'], 'frame.jpeg'))
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
    uploader.run(debug=True,port=5000)